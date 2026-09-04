-- ════════════════════════════════════════════════════════════════════
-- THE BUY ABYSS — Phase 1 data model (Lerner & Rowe media buying)
-- ════════════════════════════════════════════════════════════════════
-- Run in the Supabase SQL Editor AFTER supabase/schema.sql. Safe to
-- re-run: every CREATE uses IF NOT EXISTS / OR REPLACE, triggers are
-- dropped before they are recreated, seeds are ON CONFLICT DO NOTHING.
--
-- Three states, three tables, one direction of travel:
--
--   Working Plan            ba_working_plan      mutable, one per market/year
--        │  ba_approve_plan()  (the ONLY writer of ba_approved_plan)
--        ▼
--   Approved Snapshot       ba_approved_plan     insert-only, immutable JSON,
--                                                one row per version
--        │  station returns a confirmation → ba_order_document
--        │  ba_apply_confirmation()  (the ONLY writer of ba_schedule_of_record)
--        ▼
--   Schedule of Record      ba_schedule_of_record  which confirmation is
--                                                  authoritative per station
--
-- The two invariants live HERE, not in the UI:
--   1. Nothing writes to ba_approved_plan except ba_approve_plan().
--      Rows can never be updated or deleted. Re-approval inserts v(n+1).
--   2. Accepting a confirmation (ba_apply_confirmation) can touch only
--      ba_order_document and ba_schedule_of_record. A trigger on
--      ba_working_plan refuses any write made inside that transaction.
--
-- Every downstream artifact carries approved_plan_id (a real uuid key,
-- not "v1"): order documents, revisions, guidelines envelopes,
-- packages, schedule-of-record rows. "v1" stays as the human label.
--
-- Naming: every object is prefixed ba_ so it can never collide with the
-- traffic-side tables in schema.sql. Brand and market are stored as the
-- full names Doom uses everywhere (CLAUDE.md rule 7); the DMA code is an
-- attribute for joins to the ISCI side.
--
-- Plan shape (the prototype's, unchanged): ba_working_plan.plan is
--   { "<station key>": { "$": [9], "pts": [9], "imp": [9], "imp$": [9] } }
-- one row per station, nine daypart buckets (dpBucket), net dollars in
-- "$". The station key is the prototype's station name ("WBBM",
-- "CHSN - White Sox TV", "Comcast") and matches ba_station.call_sign.
-- The snapshot is built by buy-abyss-core.js snapshotPlan() (plan +
-- flight + budget + demo + goal + estimates + stations) and handed to
-- ba_approve_plan(), which runs the QA gate, assigns the version,
-- fingerprints it and inserts it. The database totals by station from
-- "$" and by medium through ba_station.media.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Market / year ───────────────────────────────────────────────────
create table if not exists ba_market_year (
  id            uuid primary key default uuid_generate_v4(),
  brand         text not null default 'Lerner & Rowe',
  market        text not null,                  -- 'Chicago'
  dma           text not null,                  -- 'CHI'
  year          int  not null,                  -- 2027
  sort_order    int  not null default 0,
  code          text,                          -- prototype doc ref, e.g. 'LR-CHI' (not the DMA)
  status        text not null default 'planning'
                check (status in ('planning','approved','ordering','live','closed')),
  buyer         text,                           -- 'Jessica Flynn' / 'Ken / Lynn'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (brand, market, year)
);

-- ── Budget (grain-agnostic until Finance defines it) ───────────────
-- media NULL  = the market total.
-- media set   = an allocation beneath the total (optional).
-- This supports all three plausible answers (market-only, market ×
-- medium, market total with allocations) without deciding for Finance.
-- Superseding a figure inserts a new row and stamps superseded_at on
-- the old one, so the budget history is never lost.
create table if not exists ba_budget (
  id              uuid primary key default uuid_generate_v4(),
  market_year_id  uuid not null references ba_market_year(id) on delete cascade,
  media           text,                          -- NULL = market total
  amount          numeric(14,2) not null check (amount >= 0),
  set_by          text not null,                 -- Finance (who decided)
  entered_by      text not null,                 -- who typed it (Jessica)
  source          text,                          -- 'Finance email 9/3', file name…
  note            text,
  created_at      timestamptz not null default now(),
  superseded_at   timestamptz
);
create unique index if not exists ba_budget_current_idx
  on ba_budget (market_year_id, coalesce(media, '')) where superseded_at is null;

-- ── Vendor groups (ownership) ───────────────────────────────────────
-- Guidelines / order / confirmation statuses live HERE (one Guidelines
-- envelope per vendor group). Invoices and posts live on the station.
create table if not exists ba_vendor_group (
  id                   uuid primary key default uuid_generate_v4(),
  market_year_id       uuid not null references ba_market_year(id) on delete cascade,
  name                 text not null,             -- 'Nexstar', 'iHeart', 'Paramount'
  rep_name             text,
  rep_email            text,
  rep_phone            text,
  guidelines_status    text not null default 'not_sent'
                       check (guidelines_status in ('not_sent','sent','signed','declined')),
  order_status         text not null default 'not_sent'
                       check (order_status in ('not_sent','sent','revised')),
  confirmation_status  text not null default 'none'
                       check (confirmation_status in ('none','partial','confirmed')),
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (market_year_id, name)
);

-- ── Stations ────────────────────────────────────────────────────────
-- One row per line on the buy, keyed by the prototype's station name
-- (call_sign holds "WBBM", "WLS-FM", "CHSN - White Sox TV", "Comcast").
-- aff / own / medium / pkg / vendor / cable / booked26 / actual26 are
-- exactly stationsFrom()'s fields; `added` marks a station research
-- put on the buy.
create table if not exists ba_station (
  id               uuid primary key default uuid_generate_v4(),
  market_year_id   uuid not null references ba_market_year(id) on delete cascade,
  vendor_group_id  uuid references ba_vendor_group(id) on delete set null,
  call_sign        text not null,                -- prototype station key
  media            text not null
                   check (media in ('TV','Cable','Radio','Streaming Audio','Digital Video')),
  aff              text,                         -- 'TV', 'sports / event package', …
  owner            text,                         -- selling group; '' = unassigned
  owner_source     text
                   check (owner_source is null or owner_source in ('OWN','OWN_RADIO','web','manual')),
  pkg              boolean not null default false,
  vendor           boolean not null default false,
  cable            boolean not null default false,
  booked26         numeric[] ,                   -- 12 months, from the 2026 sheet
  actual26         numeric[] ,
  added            boolean not null default false,-- added from Research (not on the 2026 buy)
  on_buy           boolean not null default true,
  on_avail_request boolean not null default false,
  added_from       text not null default 'history'
                   check (added_from in ('history','research','manual')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (market_year_id, call_sign)
);
create index if not exists ba_station_vendor_idx on ba_station (vendor_group_id);

-- ── Import batches (raw source preserved) ───────────────────────────
-- One row per file imported. `raw` is the source exactly as received
-- (the parsed workbook / lr2026.json), never the normalized form, so the
-- import can be re-run and re-reconciled from what was actually loaded.
-- `reconciliation` is the footing report: normalized totals by market,
-- medium, station/vendor, month, annual, booked vs actual — each
-- compared to the source's own totals. `reconciled` is true only when
-- every dimension foots.
create table if not exists ba_import_batch (
  id               uuid primary key default uuid_generate_v4(),
  purpose          text not null default 'history_2026'
                   check (purpose in ('history_2026','rate_history','other')),
  source_agency    text,                         -- 'OTM'
  source_workbook  text,                         -- workbook title
  source_file      text not null,                -- file name as received
  source_sha256    text,
  imported_by      text not null,
  imported_at      timestamptz not null default now(),
  raw              jsonb not null,               -- the source, untouched
  row_count        int,
  reconciliation   jsonb,
  reconciled       boolean not null default false,
  note             text
);

-- ── 2026 history (OTM) — labeled history, never a target ───────────
create table if not exists ba_history_2026 (
  id               uuid primary key default uuid_generate_v4(),
  import_batch_id  uuid not null references ba_import_batch(id) on delete cascade,
  brand            text not null default 'Lerner & Rowe',
  market           text not null,
  section          text not null,                -- the sheet's section: 'Television', 'Radio', 'Outdoor Media', 'OTHER', 'Phoenix Radio'…
  media            text,                         -- mediumOf(station, section); null for Outdoor / OTHER
  station          text not null,                -- station or vendor name as written in the sheet
  vendor           text,
  year             int  not null default 2026,
  month            int  not null check (month between 1 and 12),
  booked           numeric(14,2),                -- agency's booked figure
  actual           numeric(14,2),                -- billed/actual where available
  spots            int,
  source_ref       text,                         -- 'Chicago!B14' — where in the source
  raw              jsonb,                        -- the source row
  created_at       timestamptz not null default now()
);
create index if not exists ba_history_2026_mkt_idx on ba_history_2026 (market, media, month);
create index if not exists ba_history_2026_batch_idx on ba_history_2026 (import_batch_id);

-- ── Rate history (from parsed orders; Chicago WBBM 2026 to start) ──
create table if not exists ba_rate_history (
  id                  uuid primary key default uuid_generate_v4(),
  brand               text not null default 'Lerner & Rowe',
  market              text not null,
  station             text not null,
  media               text not null,
  year                int  not null,
  daypart             text,
  spot_len            text,                      -- '30', '15', 'BE15', '60'
  program             text,
  rate                numeric(12,2),
  spots               int,
  gross               numeric(14,2),
  net                 numeric(14,2),
  period_start        date,
  period_end          date,
  order_document_id   uuid,                      -- set below once ba_order_document exists
  import_batch_id     uuid references ba_import_batch(id) on delete set null,
  source              text,                      -- 'WideOrbit confirmation 2026-03-02'
  created_at          timestamptz not null default now()
);
create index if not exists ba_rate_history_station_idx on ba_rate_history (market, station, year);

-- ── Working plan (mutable) ──────────────────────────────────────────
-- Plan starts at zero. One working plan per market/year holding the
-- prototype's editable market fields; edits log was/now. Once v1
-- exists, base_approved_plan_id says which version this departs from.
create table if not exists ba_working_plan (
  id                    uuid primary key default uuid_generate_v4(),
  market_year_id        uuid not null unique references ba_market_year(id) on delete cascade,
  plan                  jsonb not null default '{}'::jsonb,   -- { station: {$,pts,imp,imp$} }
  demo                  text not null default 'A25-54',
  goal                  jsonb not null default '{"cpm":5,"pts":0}'::jsonb,
  cac                   jsonb not null default '{"leads":"","cases":""}'::jsonb,
  gl                    jsonb,                                -- Guidelines terms; null = GL_DEFAULT
  reps                  jsonb not null default '{}'::jsonb,
  approver              text,
  approve_inc           jsonb not null default '{}'::jsonb,   -- stations held out of approval (false)
  over_budget_ok        boolean not null default false,       -- Finance override
  base_approved_plan_id uuid,                                  -- FK added below
  updated_by            text,
  updated_at            timestamptz not null default now()
);

-- Everything else the prototype keeps on the market that is neither
-- the plan nor an authoritative record: schedule edits (ovr, ovrRate,
-- hiatus), line notes, added value, station meta, the revision log and
-- makegoods as the screens show them, sponsorship names, and the
-- Guidelines/DocuSign status per vendor group (ds) until Phase 2 moves
-- that onto ba_guidelines_envelope.
create table if not exists ba_market_state (
  market_year_id   uuid primary key references ba_market_year(id) on delete cascade,
  state            jsonb not null default '{"ovr":{},"ovrRate":{},"hiatus":{},"notes":{},"av":{},"meta":{},"rev":[],"mg":[],"spons":[],"ds":{},"proposals":[]}'::jsonb,
  updated_by       text,
  updated_at       timestamptz not null default now()
);

-- Sequence continues across markets (prototype EST_SEQ, starts at 2700).
create table if not exists ba_counter (
  name    text primary key,
  value   int  not null
);
insert into ba_counter (name, value) values ('est_seq', 2700) on conflict (name) do nothing;

create table if not exists ba_working_plan_edit (
  id               bigserial primary key,
  working_plan_id  uuid not null references ba_working_plan(id) on delete cascade,
  edited_by        text,
  edited_at        timestamptz not null default now(),
  was              jsonb,
  now              jsonb
);

-- ── Approved snapshot (insert-only) ────────────────────────────────
create table if not exists ba_approved_plan (
  id               uuid primary key default uuid_generate_v4(),   -- approved_plan_id
  market_year_id   uuid not null references ba_market_year(id) on delete restrict,
  version          int  not null,
  snapshot         jsonb not null,   -- plan, flighting, budget, demo, goals, estimates, stations, totals, version, approver, date
  snapshot_sha256  text not null,    -- fingerprint of the snapshot: proves later reads are unchanged
  approver         text not null,
  approved_by      text not null,    -- who performed the approval in the app
  approved_at      timestamptz not null default now(),
  plan_total_net   numeric(14,2),
  budget_total     numeric(14,2),
  finance_override boolean not null default false,
  qa               jsonb,            -- the QA gate results at approval time
  note             text,
  unique (market_year_id, version)
);

alter table ba_working_plan
  drop constraint if exists ba_working_plan_base_fk,
  add constraint ba_working_plan_base_fk
    foreign key (base_approved_plan_id) references ba_approved_plan(id) on delete restrict;

-- ── Estimates (per market, per medium, five types) ─────────────────
-- Base buy · Sports · Sponsorships · No-cash · Heavy-up, as ESTS()
-- creates them. `no` is blank until assigned (on Approve or typed).
create table if not exists ba_estimate (
  id               uuid primary key default uuid_generate_v4(),
  market_year_id   uuid not null references ba_market_year(id) on delete cascade,
  media            text not null
                   check (media in ('TV','Cable','Radio','Streaming Audio','Digital Video')),
  type             text not null
                   check (type in ('Base buy','Sports','Sponsorships','No-cash','Heavy-up')),
  covers           text,
  no               text not null default '',
  active           boolean not null default false,
  assigned_by      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (market_year_id, media, type)
);
create unique index if not exists ba_estimate_no_idx on ba_estimate (market_year_id, no) where no <> '';

-- ── Order documents ────────────────────────────────────────────────
-- kind: draft (our order out), confirmation (station's back),
--       change_order (our Rev n out), invoice, post.
-- A confirmation belongs to a market/year AND states which approved
-- version it was confirming — that is what makes a re-approval legible.
create table if not exists ba_order_document (
  id                  uuid primary key default uuid_generate_v4(),
  market_year_id      uuid not null references ba_market_year(id) on delete restrict,
  approved_plan_id    uuid references ba_approved_plan(id) on delete restrict,
  station_id          uuid references ba_station(id) on delete restrict,
  station_key         text not null,               -- prototype station name ("WBBM")
  vendor_group_id     uuid references ba_vendor_group(id) on delete set null,
  kind                text not null
                      check (kind in ('draft','confirmation','change_order','invoice','post')),
  order_no            text,                        -- station order number ("739795", "DRAFT-739795")
  description         text,                        -- "Legal - Q1"
  flight              text,                        -- "12/29/25 - 03/29/26"
  metric              text check (metric is null or metric in ('Rtg','Imp')),
  demo                text,
  ae                  text,
  rev                 text,                        -- the station's revision stamp as printed ("12/23/25 / 12/23/25")
  status              text not null default 'received'
                      check (status in ('generated','sent','received','parsed','foot_failed','footed','applied','superseded','rejected')),
  reader              text,                      -- 'wideorbit-v1' — which reader parsed it
  file_name           text,
  file_url            text,                      -- Storage / SharePoint URL
  file_sha256         text,
  printed_gross       numeric(14,2),
  printed_net         numeric(14,2),
  parsed_lines        jsonb,                     -- reader output, one element per line
  foot_checks         jsonb,                     -- per-line + order footing results
  foot_ok             boolean,
  parsed_at           timestamptz,
  applied_at          timestamptz,               -- provenance: who accepted it as record, when
  applied_by          text,
  superseded_by_id    uuid references ba_order_document(id) on delete set null,
  revision_id         uuid,                      -- the Rev this re-confirmation answers (FK below)
  created_by          text,
  created_at          timestamptz not null default now(),
  constraint ba_order_document_applied_chk check (
    status <> 'applied'
    or (kind = 'confirmation' and applied_at is not null and applied_by is not null and approved_plan_id is not null)
  ),
  constraint ba_order_document_draft_chk check (kind <> 'draft' or status in ('generated','received','parsed','superseded')),
  constraint ba_order_document_plan_chk check (
    kind in ('draft','invoice','post') or approved_plan_id is not null   -- drafts arrive before approval
  )
);
create index if not exists ba_order_document_my_idx on ba_order_document (market_year_id, kind, status);
create index if not exists ba_order_document_station_idx on ba_order_document (station_id);
create index if not exists ba_order_document_plan_idx on ba_order_document (approved_plan_id);

-- (re-runs on a database created before drafts were exempted)
alter table ba_order_document
  drop constraint if exists ba_order_document_plan_chk,
  add constraint ba_order_document_plan_chk check (kind in ('draft','invoice','post') or approved_plan_id is not null);

alter table ba_rate_history
  drop constraint if exists ba_rate_history_order_fk,
  add constraint ba_rate_history_order_fk
    foreign key (order_document_id) references ba_order_document(id) on delete set null;

-- ── Schedule of record (explicit relation, with provenance) ────────
-- One current row per station per market/year. Accepting a later
-- confirmation supersedes the previous row rather than editing it.
create table if not exists ba_schedule_of_record (
  id                  uuid primary key default uuid_generate_v4(),
  market_year_id      uuid not null references ba_market_year(id) on delete restrict,
  station_id          uuid not null references ba_station(id) on delete restrict,
  order_document_id   uuid not null unique references ba_order_document(id) on delete restrict,
  approved_plan_id    uuid not null references ba_approved_plan(id) on delete restrict,
  applied_at          timestamptz not null default now(),
  applied_by          text not null,
  superseded_at       timestamptz,
  superseded_by_id    uuid references ba_schedule_of_record(id) on delete set null
);
create unique index if not exists ba_sor_current_idx
  on ba_schedule_of_record (market_year_id, station_id) where superseded_at is null;

-- ── Revisions ──────────────────────────────────────────────────────
-- Reconstructs: approved vN → station confirmation → Rev n → re-confirmation.
create table if not exists ba_revision (
  id                          uuid primary key default uuid_generate_v4(),
  market_year_id              uuid not null references ba_market_year(id) on delete restrict,
  approved_plan_id            uuid not null references ba_approved_plan(id) on delete restrict,   -- departs from
  station_id                  uuid not null references ba_station(id) on delete restrict,
  order_document_id           uuid not null references ba_order_document(id) on delete restrict,  -- the confirmation it modifies
  rev_number                  int  not null,
  kind                        text not null check (kind in ('spot','rate','hiatus','cancel','makegood','change_order')),
  changes                     jsonb not null,    -- [{field, was, now, delta, line}]
  status                      text not null default 'logged'
                              check (status in ('logged','issued','reconfirmed')),
  change_order_document_id    uuid references ba_order_document(id) on delete set null,   -- issued Rev
  reconfirmation_document_id  uuid references ba_order_document(id) on delete set null,   -- station's answer
  logged_by                   text,
  issued_at                   timestamptz,
  issued_by                   text,
  created_at                  timestamptz not null default now(),
  unique (order_document_id, rev_number)
);

alter table ba_order_document
  drop constraint if exists ba_order_document_revision_fk,
  add constraint ba_order_document_revision_fk
    foreign key (revision_id) references ba_revision(id) on delete set null;

-- ── Makegoods ──────────────────────────────────────────────────────
create table if not exists ba_makegood (
  id                 uuid primary key default uuid_generate_v4(),
  market_year_id     uuid not null references ba_market_year(id) on delete restrict,
  station_id         uuid not null references ba_station(id) on delete restrict,
  revision_id        uuid references ba_revision(id) on delete set null,
  missed             jsonb not null,             -- the spots that did not run
  offered            jsonb,                      -- what the station proposed
  value              numeric(14,2),
  accepted           boolean,
  accepted_by        text,
  accepted_at        timestamptz,
  created_at         timestamptz not null default now()
);

-- ── Packages / sponsorships ────────────────────────────────────────
-- installments[] and elements[] stay as arrays for Phase 1. They are
-- meaningful child records; if Finance reporting or fulfilment needs
-- them queryable, promote them to their own tables then — not now.
create table if not exists ba_package (
  id                 uuid primary key default uuid_generate_v4(),
  market_year_id     uuid not null references ba_market_year(id) on delete restrict,
  approved_plan_id   uuid references ba_approved_plan(id) on delete restrict,
  station_id         uuid references ba_station(id) on delete restrict,
  vendor_group_id    uuid references ba_vendor_group(id) on delete set null,
  estimate_id        uuid references ba_estimate(id) on delete set null,
  name               text not null,
  total              numeric(14,2),
  installments       jsonb not null default '[]'::jsonb,  -- [{due, amount, invoiced}]
  elements           jsonb not null default '[]'::jsonb,  -- [{name, paid|av, value, runs}]
  cac_rule           text,                       -- how CAC spreads it across the flight
  cancellation       text,
  agreement_url      text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Guidelines envelopes (DocuSign, one per vendor group) ──────────
create table if not exists ba_guidelines_envelope (
  id                   uuid primary key default uuid_generate_v4(),
  market_year_id       uuid not null references ba_market_year(id) on delete restrict,
  vendor_group_id      uuid not null references ba_vendor_group(id) on delete restrict,
  approved_plan_id     uuid not null references ba_approved_plan(id) on delete restrict,
  docusign_envelope_id text,
  status               text not null default 'generated'
                       check (status in ('generated','sent','delivered','signed','declined','voided')),
  signed_post_pct      numeric(5,2),
  pdf_url              text,
  sent_at              timestamptz,
  signed_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (vendor_group_id, approved_plan_id)
);

-- ── Invoices / posts / credits (Phase 3 fills these) ───────────────
create table if not exists ba_invoice (
  id                     uuid primary key default uuid_generate_v4(),
  market_year_id         uuid not null references ba_market_year(id) on delete restrict,
  station_id             uuid not null references ba_station(id) on delete restrict,
  order_document_id      uuid references ba_order_document(id) on delete set null,   -- kind = invoice
  schedule_of_record_id  uuid references ba_schedule_of_record(id) on delete set null, -- footed against
  period                 text,                   -- 'Broadcast October 2027'
  gross                  numeric(14,2),
  net                    numeric(14,2),
  variance               jsonb,
  status                 text not null default 'received'
                         check (status in ('received','footed','disputed','approved','paid')),
  created_at             timestamptz not null default now()
);

create table if not exists ba_post (
  id                     uuid primary key default uuid_generate_v4(),
  market_year_id         uuid not null references ba_market_year(id) on delete restrict,
  station_id             uuid not null references ba_station(id) on delete restrict,
  order_document_id      uuid references ba_order_document(id) on delete set null,   -- kind = post
  schedule_of_record_id  uuid references ba_schedule_of_record(id) on delete set null,
  period                 text,
  delivered              jsonb,
  index_pct              numeric(6,2),
  ud_owed                numeric(14,2),
  status                 text not null default 'received'
                         check (status in ('received','footed','ud_open','settled')),
  created_at             timestamptz not null default now()
);

create table if not exists ba_credit (
  id                 uuid primary key default uuid_generate_v4(),
  market_year_id     uuid not null references ba_market_year(id) on delete restrict,
  station_id         uuid not null references ba_station(id) on delete restrict,
  invoice_id         uuid references ba_invoice(id) on delete set null,
  amount             numeric(14,2) not null,
  reason             text,
  memo_url           text,                       -- vendor-signed credit memo
  memo_signed        boolean not null default false,
  status             text not null default 'requested'
                     check (status in ('requested','memo_received','applied')),
  created_at         timestamptz not null default now()
);

-- ── Notes (typed entity reference) ─────────────────────────────────
create table if not exists ba_note (
  id            uuid primary key default uuid_generate_v4(),
  entity_type   text not null check (entity_type in (
                  'market_year','vendor_group','station','working_plan','approved_plan',
                  'order_document','revision','package','invoice','post','credit','line')),
  entity_id     text not null,   -- uuid for rows; the lineKey for a plan line
  text          text not null,
  author        text not null,
  created_at    timestamptz not null default now()
);
create index if not exists ba_note_entity_idx on ba_note (entity_type, entity_id, created_at desc);

-- ── Event log (provenance of the authoritative acts) ───────────────
create table if not exists ba_event (
  id            bigserial primary key,
  ts            timestamptz not null default now(),
  action        text not null,                 -- 'approve', 'apply_confirmation', 'import', …
  entity_type   text not null,
  entity_id     uuid,
  actor         text,
  detail        jsonb
);
create index if not exists ba_event_ts_idx on ba_event (ts desc);

-- ════════════════════════════════════════════════════════════════════
-- Guards (the invariants)
-- ════════════════════════════════════════════════════════════════════

-- updated_at upkeep (reuses set_updated_at() from schema.sql if present)
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
do $$
declare t text;
begin
  foreach t in array array['ba_market_year','ba_vendor_group','ba_station','ba_working_plan','ba_market_state','ba_estimate','ba_package','ba_guidelines_envelope']
  loop
    execute format('drop trigger if exists %I_updated_at on %I', t, t);
    execute format('create trigger %I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- Invariant 1a: ba_approved_plan is insert-only.
create or replace function ba_approved_plan_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'ba_approved_plan is insert-only: approved v% of market_year % cannot be % — re-approve to create a new version',
    coalesce(old.version, 0), old.market_year_id, lower(tg_op);
end;
$$;
drop trigger if exists ba_approved_plan_no_update on ba_approved_plan;
create trigger ba_approved_plan_no_update
  before update or delete on ba_approved_plan
  for each row execute function ba_approved_plan_immutable();

-- Invariant 1b: only ba_approve_plan() may insert. It sets the
-- transaction-local flag ba.context = 'approve'; a bare INSERT is refused.
create or replace function ba_approved_plan_only_via_approve()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('ba.context', true), '') <> 'approve' then
    raise exception 'ba_approved_plan accepts rows only from ba_approve_plan()';
  end if;
  return new;
end;
$$;
drop trigger if exists ba_approved_plan_insert_guard on ba_approved_plan;
create trigger ba_approved_plan_insert_guard
  before insert on ba_approved_plan
  for each row execute function ba_approved_plan_only_via_approve();

-- Invariant 2: nothing done while applying a confirmation may touch the
-- working plan.
create or replace function ba_working_plan_not_during_apply()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('ba.context', true), '') = 'apply_confirmation' then
    raise exception 'a confirmation is the schedule of record; it never writes to ba_working_plan';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists ba_working_plan_apply_guard on ba_working_plan;
create trigger ba_working_plan_apply_guard
  before insert or update or delete on ba_working_plan
  for each row execute function ba_working_plan_not_during_apply();

-- Schedule of record rows come only from ba_apply_confirmation().
create or replace function ba_sor_only_via_apply()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('ba.context', true), '') <> 'apply_confirmation' then
    raise exception 'ba_schedule_of_record is written only by ba_apply_confirmation()';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'ba_schedule_of_record rows are superseded, never deleted';
  end if;
  return new;
end;
$$;
drop trigger if exists ba_sor_guard on ba_schedule_of_record;
create trigger ba_sor_guard
  before insert or update or delete on ba_schedule_of_record
  for each row execute function ba_sor_only_via_apply();

-- Working-plan edit log (was/now)
create or replace function ba_working_plan_log_edit()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (old.plan is distinct from new.plan or old.demo is distinct from new.demo
      or old.goal is distinct from new.goal or old.gl is distinct from new.gl or old.approver is distinct from new.approver
      or old.approve_inc is distinct from new.approve_inc or old.over_budget_ok is distinct from new.over_budget_ok) then
    insert into ba_working_plan_edit (working_plan_id, edited_by, was, now)
    values (new.id, new.updated_by,
      jsonb_build_object('plan', old.plan, 'demo', old.demo, 'goal', old.goal, 'gl', old.gl, 'approver', old.approver, 'approve_inc', old.approve_inc, 'over_budget_ok', old.over_budget_ok),
      jsonb_build_object('plan', new.plan, 'demo', new.demo, 'goal', new.goal, 'gl', new.gl, 'approver', new.approver, 'approve_inc', new.approve_inc, 'over_budget_ok', new.over_budget_ok));
  end if;
  return new;
end;
$$;
drop trigger if exists ba_working_plan_edit_log on ba_working_plan;
create trigger ba_working_plan_edit_log
  after update on ba_working_plan
  for each row execute function ba_working_plan_log_edit();

-- ════════════════════════════════════════════════════════════════════
-- The two authoritative acts
-- ════════════════════════════════════════════════════════════════════

-- Totals the database derives from the prototype's plan shape:
-- net per station = sum of its nine "$" buckets; gross = net / (1 - 15%).
create or replace function ba_plan_totals(p_plan jsonb, p_market_year_id uuid)
returns jsonb language sql stable as $$
  with l as (
    select p.key as station,
           coalesce((select sum(x::numeric) from jsonb_array_elements_text(p.value->'$') x), 0) as net,
           s.media
    from jsonb_each(coalesce(p_plan, '{}'::jsonb)) p
    left join ba_station s on s.market_year_id = p_market_year_id and s.call_sign = p.key
  )
  select jsonb_build_object(
    'net',   coalesce((select sum(net) from l), 0),
    'gross', coalesce((select sum(net) from l), 0) / 0.85,
    'by_station', coalesce((select jsonb_object_agg(station, jsonb_build_object('net', net, 'gross', net / 0.85)) from l where net <> 0), '{}'::jsonb),
    'by_media',   coalesce((select jsonb_object_agg(media, jsonb_build_object('net', n, 'gross', n / 0.85))
                            from (select media, sum(net) n from l where media is not null group by media) m), '{}'::jsonb)
  );
$$;

-- Approve: freeze the snapshot the app built with snapshotPlan() as
-- version n+1. QA gate — the prototype's qaChecks() blocking set:
--   · an active estimate without a number
--   · Guidelines posting % or demo blank
--   · no approver
--   · over budget without the Finance override
-- Downstream documents read the snapshot only.
create or replace function ba_approve_plan(
  p_market_year_id   uuid,
  p_snapshot         jsonb,
  p_approver         text,
  p_approved_by      text,
  p_finance_override boolean default false,
  p_note             text default null
) returns uuid language plpgsql as $$
declare
  wp        ba_working_plan%rowtype;
  my        ba_market_year%rowtype;
  v_version int;
  v_totals  jsonb;
  v_budget  numeric(14,2);
  v_missing text[];
  v_gl      jsonb;
  v_snap    jsonb;
  v_id      uuid;
  v_qa      jsonb;
begin
  select * into my from ba_market_year where id = p_market_year_id for update;
  if not found then raise exception 'market_year % not found', p_market_year_id; end if;
  select * into wp from ba_working_plan where market_year_id = p_market_year_id;
  if not found then raise exception 'no working plan for %/%', my.market, my.year; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot->'plan') <> 'object' then raise exception 'snapshot must carry plan'; end if;

  select array_agg(type order by type) into v_missing from ba_estimate
    where market_year_id = p_market_year_id and active and no = '';
  if v_missing is not null then raise exception 'QA: Estimates — % unassigned', array_to_string(v_missing, ', '); end if;
  v_gl := coalesce(wp.gl, jsonb_build_object('post', 100, 'demo', wp.demo));
  if coalesce(v_gl->>'post', '') in ('', '0') or coalesce(v_gl->>'demo', '') = '' then
    raise exception 'QA: Terms — posting %% or demo blank — Guidelines can''t be generated';
  end if;
  if coalesce(trim(p_approver), '') = '' then raise exception 'QA: Approver — no approver named'; end if;

  v_totals := ba_plan_totals(p_snapshot->'plan', p_market_year_id);
  select amount into v_budget from ba_budget
    where market_year_id = p_market_year_id and media is null and superseded_at is null;
  if v_budget is not null and (v_totals->>'net')::numeric > v_budget and not (p_finance_override or wp.over_budget_ok) then
    raise exception 'QA: Budget — % over budget — Finance override required', to_char((v_totals->>'net')::numeric - v_budget, 'FM999,999,990.00');
  end if;

  select coalesce(max(version), 0) + 1 into v_version from ba_approved_plan where market_year_id = p_market_year_id;
  v_qa := jsonb_build_object('estimates', true, 'terms', true, 'approver', true,
                             'within_budget', v_budget is null or (v_totals->>'net')::numeric <= v_budget,
                             'budget_set', v_budget is not null,
                             'finance_override', p_finance_override or wp.over_budget_ok);
  v_snap := p_snapshot || jsonb_build_object('v', v_version, 'by', p_approver, 'budget', coalesce(v_budget, 0),
                                             'totals', v_totals, 'market', my.market, 'year', my.year,
                                             'approved_plan_id', null);

  perform set_config('ba.context', 'approve', true);
  insert into ba_approved_plan (market_year_id, version, snapshot, snapshot_sha256, approver, approved_by,
                                plan_total_net, budget_total, finance_override, qa, note)
  values (p_market_year_id, v_version, v_snap, encode(digest(v_snap::text, 'sha256'), 'hex'), p_approver, p_approved_by,
          (v_totals->>'net')::numeric, v_budget, p_finance_override or wp.over_budget_ok, v_qa, p_note)
  returning id into v_id;
  perform set_config('ba.context', '', true);

  update ba_working_plan set base_approved_plan_id = v_id, updated_by = p_approved_by where id = wp.id;
  update ba_market_year set status = 'approved' where id = p_market_year_id and status = 'planning';

  insert into ba_event (action, entity_type, entity_id, actor, detail)
  values ('approve', 'approved_plan', v_id, p_approved_by,
          jsonb_build_object('market_year_id', p_market_year_id, 'version', v_version, 'approver', p_approver,
                             'plan_total_net', v_totals->>'net', 'budget', v_budget, 'finance_override', p_finance_override or wp.over_budget_ok));
  return v_id;
end;
$$;

-- Apply: accept a footed station confirmation as the schedule of record.
-- Touches ba_order_document and ba_schedule_of_record only; the working
-- plan trigger above makes anything else in this transaction fail.
create or replace function ba_apply_confirmation(
  p_order_document_id uuid,
  p_applied_by        text
) returns uuid language plpgsql as $$
declare
  od       ba_order_document%rowtype;
  v_prev   ba_schedule_of_record%rowtype;
  v_sor    uuid;
begin
  if coalesce(trim(p_applied_by), '') = '' then raise exception 'applied_by is required'; end if;
  select * into od from ba_order_document where id = p_order_document_id for update;
  if not found then raise exception 'order document % not found', p_order_document_id; end if;
  if od.kind <> 'confirmation' then raise exception 'only a confirmation can become the schedule of record (this is a %)', od.kind; end if;
  if od.status = 'applied' then raise exception 'confirmation % is already applied', od.id; end if;
  if od.approved_plan_id is null then raise exception 'confirmation must state which approved version it confirms'; end if;
  if od.station_id is null then
    select id into od.station_id from ba_station where market_year_id = od.market_year_id and call_sign = od.station_key;
    if od.station_id is null then raise exception 'confirmation must belong to a station on the buy (%)', od.station_key; end if;
    update ba_order_document set station_id = od.station_id where id = od.id;
  end if;
  if od.foot_ok is distinct from true then raise exception 'confirmation has not footed (foot_ok=%)', od.foot_ok; end if;

  perform set_config('ba.context', 'apply_confirmation', true);

  update ba_order_document
     set status = 'applied', applied_at = now(), applied_by = p_applied_by
   where id = od.id;

  -- supersede the previous record for this station first (one current row per station)
  select * into v_prev from ba_schedule_of_record
   where market_year_id = od.market_year_id and station_id = od.station_id and superseded_at is null;
  if found then
    update ba_schedule_of_record set superseded_at = now() where id = v_prev.id;
    update ba_order_document set status = 'superseded', superseded_by_id = od.id where id = v_prev.order_document_id;
  end if;

  insert into ba_schedule_of_record (market_year_id, station_id, order_document_id, approved_plan_id, applied_by)
  values (od.market_year_id, od.station_id, od.id, od.approved_plan_id, p_applied_by)
  returning id into v_sor;

  if v_prev.id is not null then
    update ba_schedule_of_record set superseded_by_id = v_sor where id = v_prev.id;
  end if;

  perform set_config('ba.context', '', true);

  insert into ba_event (action, entity_type, entity_id, actor, detail)
  values ('apply_confirmation', 'schedule_of_record', v_sor, p_applied_by,
          jsonb_build_object('order_document_id', od.id, 'station_id', od.station_id,
                             'approved_plan_id', od.approved_plan_id, 'superseded', v_prev.id));
  return v_sor;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- Read models
-- ════════════════════════════════════════════════════════════════════

-- Latest approved version per market/year.
create or replace view ba_approved_current as
select distinct on (market_year_id) *
from ba_approved_plan
order by market_year_id, version desc;

-- Variance: approved (latest version) vs schedule of record, per station.
-- Changes ONLY when a confirmation is applied or a plan is re-approved.
create or replace view ba_variance as
select
  my.id                                   as market_year_id,
  my.market, my.year,
  s.id                                    as station_id,
  s.call_sign, s.media,
  ap.id                                   as approved_plan_id,
  ap.version                              as approved_version,
  (ap.snapshot->'totals'->'by_station'->s.call_sign->>'gross')::numeric as approved_gross,
  (ap.snapshot->'totals'->'by_station'->s.call_sign->>'net')::numeric   as approved_net,
  sor.id                                  as schedule_of_record_id,
  od.id                                   as confirmation_id,
  od.printed_gross                        as confirmed_gross,
  od.printed_net                          as confirmed_net,
  od.printed_gross - (ap.snapshot->'totals'->'by_station'->s.call_sign->>'gross')::numeric as variance_gross,
  od.printed_net   - (ap.snapshot->'totals'->'by_station'->s.call_sign->>'net')::numeric   as variance_net,
  sor.applied_at, sor.applied_by
from ba_market_year my
join ba_station s on s.market_year_id = my.id and s.on_buy
left join ba_approved_current ap on ap.market_year_id = my.id
left join ba_schedule_of_record sor on sor.market_year_id = my.id and sor.station_id = s.id and sor.superseded_at is null
left join ba_order_document od on od.id = sor.order_document_id;

-- ════════════════════════════════════════════════════════════════════
-- Seed: Lerner & Rowe 2027, every market (names from Doom's brand config)
-- ════════════════════════════════════════════════════════════════════
-- The prototype's ten markets in its order, with its document codes
-- (the DMA stays Doom's). King/Bull is not in the 2026 sheet and so has
-- nothing to buy; it is not seeded here.
insert into ba_market_year (brand, market, dma, code, year, buyer, sort_order) values
  ('Lerner & Rowe', 'Phoenix', 'PHX', 'LR-PHX', 2027, 'Ken / Lynn', 10),
  ('Lerner & Rowe', 'Flagstaff', 'FLG', 'LR-FLG', 2027, 'Ken / Lynn', 20),
  ('Lerner & Rowe', 'Bullhead', 'BHD', 'LR-BHC', 2027, 'Ken / Lynn', 30),
  ('Lerner & Rowe', 'Chicago', 'CHI', 'LR-CHI', 2027, 'Jessica Flynn', 40),
  ('Lerner & Rowe', 'Tucson', 'TUC', 'LR-TUS', 2027, 'Ken / Lynn', 50),
  ('Lerner & Rowe', 'Las Vegas', 'LVS', 'LR-LAS', 2027, 'Ken / Lynn', 60),
  ('Lerner & Rowe', 'Albuquerque', 'ABQ', 'LR-ABQ', 2027, 'Ken / Lynn', 70),
  ('Lerner & Rowe', 'Reno', 'RNO', 'LR-RNO', 2027, 'Ken / Lynn', 80),
  ('Lerner & Rowe', 'Yuma', 'YMA', 'LR-YUM', 2027, 'Ken / Lynn', 90),
  ('Lerner & Rowe', 'Seattle', 'SEA', 'LR-SEA', 2027, 'Ken / Lynn', 100)
on conflict (brand, market, year) do update set code = excluded.code, sort_order = excluded.sort_order;

-- Every market/year gets an empty working plan: the plan starts at zero.
insert into ba_working_plan (market_year_id)
select id from ba_market_year my
where not exists (select 1 from ba_working_plan w where w.market_year_id = my.id);
insert into ba_market_state (market_year_id)
select id from ba_market_year my
where not exists (select 1 from ba_market_state w where w.market_year_id = my.id);

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security — default deny; all access via the service role
-- from server endpoints (api/buy-abyss.js), same as the rest of Doom.
-- ════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'ba\_%' escape '\'
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- Estimate numbers: "Assign next numbers" — sequence continues across
-- markets (prototype EST_SEQ). Atomic on ba_counter.
-- ════════════════════════════════════════════════════════════════════
create or replace function ba_assign_estimates(p_market_year_id uuid, p_media text, p_by text)
returns int language plpgsql as $$
declare e record; v int; n int := 0;
begin
  for e in select id from ba_estimate where market_year_id = p_market_year_id and media = p_media and active and no = '' order by type loop
    update ba_counter set value = value + 1 where name = 'est_seq' returning value into v;
    update ba_estimate set no = v::text, assigned_by = p_by where id = e.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;
