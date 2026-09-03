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
-- Plan line contract (what the JSON snapshot expects per line, so the
-- database can compute station/media totals without knowing the
-- prototype's arithmetic): every element of plan.lines[] carries
--   station  text     call sign, matches ba_station.call_sign
--   media    text     TV | Cable | Radio | Streaming Audio | Digital Video
--   gross    numeric  line total over its flight, before agency net
--   net      numeric  line total over its flight, net
-- The prototype's own functions (planTotals, dpStats, mult/BE15, …)
-- remain the source of those numbers; the app writes them onto the
-- line when it saves the working plan. If the prototype's field names
-- differ when it is ported, rename HERE — do not rename the prototype.
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
  status        text not null default 'planning'
                check (status in ('planning','approved','ordering','live','closed')),
  buyer         text,                           -- 'Lynn Cortelezzi' / 'Ken Lazar'
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
create table if not exists ba_station (
  id               uuid primary key default uuid_generate_v4(),
  market_year_id   uuid not null references ba_market_year(id) on delete cascade,
  vendor_group_id  uuid references ba_vendor_group(id) on delete set null,
  call_sign        text not null,                -- 'WBBM-TV', 'WLS-FM'
  media            text not null
                   check (media in ('TV','Cable','Radio','Streaming Audio','Digital Video')),
  owner            text,                         -- resolved owner name
  owner_source     text                          -- 'OWN' | 'OWN_RADIO' | 'web' | 'manual'
                   check (owner_source is null or owner_source in ('OWN','OWN_RADIO','web','manual')),
  on_buy           boolean not null default false,-- research finds stations NOT on the buy
  on_avail_request boolean not null default false,-- adding one puts it on the avail request
  added_from       text not null default 'history'
                   check (added_from in ('history','research','manual')),
  format           text,                         -- radio format / network affiliation
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (market_year_id, call_sign, media)
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
  media            text not null,
  station          text,                         -- call sign or vendor name
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
-- Plan starts at zero. One working plan per market/year; edits log
-- was/now so the road to approval is auditable. Once v1 exists,
-- base_approved_plan_id says which approved version this working copy
-- departs from.
create table if not exists ba_working_plan (
  id                    uuid primary key default uuid_generate_v4(),
  market_year_id        uuid not null unique references ba_market_year(id) on delete cascade,
  plan                  jsonb not null default '{"lines":[]}'::jsonb,
  flighting             jsonb not null default '{}'::jsonb,
  demo                  text,
  goals                 jsonb not null default '{}'::jsonb,
  posting               text,                    -- requested posting %, e.g. '100%'
  approver              text,
  base_approved_plan_id uuid,                    -- FK added below
  updated_by            text,
  updated_at            timestamptz not null default now()
);

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

-- ── Estimates (per market per media type) ──────────────────────────
create table if not exists ba_estimate (
  id               uuid primary key default uuid_generate_v4(),
  market_year_id   uuid not null references ba_market_year(id) on delete cascade,
  media            text not null
                   check (media in ('TV','Cable','Radio','Streaming Audio','Digital Video')),
  number           text not null,
  label            text,
  assigned_by      text,
  created_at       timestamptz not null default now(),
  unique (market_year_id, media),
  unique (market_year_id, number)
);

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
  vendor_group_id     uuid references ba_vendor_group(id) on delete set null,
  kind                text not null
                      check (kind in ('draft','confirmation','change_order','invoice','post')),
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
  constraint ba_order_document_plan_chk check (
    kind in ('invoice','post') or approved_plan_id is not null
  )
);
create index if not exists ba_order_document_my_idx on ba_order_document (market_year_id, kind, status);
create index if not exists ba_order_document_station_idx on ba_order_document (station_id);
create index if not exists ba_order_document_plan_idx on ba_order_document (approved_plan_id);

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
  kind                        text not null check (kind in ('spot','rate','hiatus','cancel','makegood')),
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
  foreach t in array array['ba_market_year','ba_vendor_group','ba_station','ba_working_plan','ba_package','ba_guidelines_envelope']
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
  if tg_op = 'UPDATE' and (old.plan is distinct from new.plan or old.flighting is distinct from new.flighting
      or old.demo is distinct from new.demo or old.goals is distinct from new.goals
      or old.posting is distinct from new.posting or old.approver is distinct from new.approver) then
    insert into ba_working_plan_edit (working_plan_id, edited_by, was, now)
    values (new.id, new.updated_by,
      jsonb_build_object('plan', old.plan, 'flighting', old.flighting, 'demo', old.demo, 'goals', old.goals, 'posting', old.posting, 'approver', old.approver),
      jsonb_build_object('plan', new.plan, 'flighting', new.flighting, 'demo', new.demo, 'goals', new.goals, 'posting', new.posting, 'approver', new.approver));
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

-- Totals the database can derive from the plan-line contract above.
create or replace function ba_plan_totals(p_plan jsonb)
returns jsonb language sql immutable as $$
  with l as (
    select x->>'station' as station, x->>'media' as media,
           coalesce((x->>'gross')::numeric, 0) as gross,
           coalesce((x->>'net')::numeric, 0)   as net
    from jsonb_array_elements(coalesce(p_plan->'lines', '[]'::jsonb)) x
  )
  select jsonb_build_object(
    'gross', coalesce((select sum(gross) from l), 0),
    'net',   coalesce((select sum(net)   from l), 0),
    'by_station', coalesce((select jsonb_object_agg(station, jsonb_build_object('gross', g, 'net', n))
                            from (select station, sum(gross) g, sum(net) n from l where station is not null group by station) s), '{}'::jsonb),
    'by_media',   coalesce((select jsonb_object_agg(media, jsonb_build_object('gross', g, 'net', n))
                            from (select media, sum(gross) g, sum(net) n from l where media is not null group by media) m), '{}'::jsonb)
  );
$$;

-- Approve: freeze the working plan + flighting as version n+1.
-- QA gate (blocks): no approver · blank demo · blank posting · any media in
-- the plan without an estimate · over budget without a Finance override.
-- Downstream documents read the snapshot only.
create or replace function ba_approve_plan(
  p_market_year_id   uuid,
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
  v_snap    jsonb;
  v_id      uuid;
  v_qa      jsonb;
begin
  select * into my from ba_market_year where id = p_market_year_id for update;
  if not found then raise exception 'market_year % not found', p_market_year_id; end if;
  select * into wp from ba_working_plan where market_year_id = p_market_year_id;
  if not found then raise exception 'no working plan for %/%', my.market, my.year; end if;

  if coalesce(trim(p_approver), '') = '' then raise exception 'QA: no approver'; end if;
  if coalesce(trim(wp.demo), '') = '' then raise exception 'QA: blank demo'; end if;
  if coalesce(trim(wp.posting), '') = '' then raise exception 'QA: blank posting'; end if;

  select array_agg(distinct m) into v_missing
  from (select x->>'media' m from jsonb_array_elements(coalesce(wp.plan->'lines','[]'::jsonb)) x) q
  where m is not null and not exists (select 1 from ba_estimate e where e.market_year_id = p_market_year_id and e.media = m);
  if v_missing is not null then
    raise exception 'QA: unassigned estimates for %', array_to_string(v_missing, ', ');
  end if;

  v_totals := ba_plan_totals(wp.plan);
  select amount into v_budget from ba_budget
    where market_year_id = p_market_year_id and media is null and superseded_at is null;
  if v_budget is null then raise exception 'QA: no budget set for %/%', my.market, my.year; end if;
  if (v_totals->>'net')::numeric > v_budget and not p_finance_override then
    raise exception 'QA: plan net % exceeds budget % — needs a Finance override', v_totals->>'net', v_budget;
  end if;

  select coalesce(max(version), 0) + 1 into v_version from ba_approved_plan where market_year_id = p_market_year_id;

  v_qa := jsonb_build_object('approver', true, 'demo', true, 'posting', true, 'estimates', true,
                             'within_budget', (v_totals->>'net')::numeric <= v_budget,
                             'finance_override', p_finance_override);

  v_snap := jsonb_build_object(
    'plan',       wp.plan,
    'flighting',  wp.flighting,
    'budget',     (select jsonb_agg(jsonb_build_object('media', media, 'amount', amount, 'set_by', set_by))
                     from ba_budget where market_year_id = p_market_year_id and superseded_at is null),
    'demo',       wp.demo,
    'goals',      wp.goals,
    'posting',    wp.posting,
    'estimates',  (select jsonb_agg(jsonb_build_object('media', media, 'number', number, 'label', label) order by media)
                     from ba_estimate where market_year_id = p_market_year_id),
    'stations',   (select jsonb_agg(jsonb_build_object('id', s.id, 'call_sign', s.call_sign, 'media', s.media,
                                    'owner', s.owner, 'vendor_group', vg.name, 'on_buy', s.on_buy) order by s.call_sign)
                     from ba_station s left join ba_vendor_group vg on vg.id = s.vendor_group_id
                     where s.market_year_id = p_market_year_id and s.on_buy),
    'totals',     v_totals,
    'market',     my.market,
    'year',       my.year,
    'version',    v_version,
    'approver',   p_approver,
    'date',       now()
  );

  perform set_config('ba.context', 'approve', true);
  insert into ba_approved_plan (market_year_id, version, snapshot, snapshot_sha256, approver, approved_by,
                                plan_total_net, budget_total, finance_override, qa, note)
  values (p_market_year_id, v_version, v_snap, encode(digest(v_snap::text, 'sha256'), 'hex'), p_approver, p_approved_by,
          (v_totals->>'net')::numeric, v_budget, p_finance_override, v_qa, p_note)
  returning id into v_id;
  perform set_config('ba.context', '', true);

  update ba_working_plan set base_approved_plan_id = v_id, updated_by = p_approved_by where id = wp.id;
  update ba_market_year set status = 'approved' where id = p_market_year_id and status = 'planning';

  insert into ba_event (action, entity_type, entity_id, actor, detail)
  values ('approve', 'approved_plan', v_id, p_approved_by,
          jsonb_build_object('market_year_id', p_market_year_id, 'version', v_version, 'approver', p_approver,
                             'plan_total_net', v_totals->>'net', 'budget', v_budget, 'finance_override', p_finance_override));
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
  if od.station_id is null then raise exception 'confirmation must belong to a station'; end if;
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
insert into ba_market_year (brand, market, dma, year) values
  ('Lerner & Rowe', 'Albuquerque', 'ABQ', 2027),
  ('Lerner & Rowe', 'Bullhead',    'BHD', 2027),
  ('Lerner & Rowe', 'Chicago',     'CHI', 2027),
  ('Lerner & Rowe', 'Flagstaff',   'FLG', 2027),
  ('Lerner & Rowe', 'King/Bull',   'KBH', 2027),
  ('Lerner & Rowe', 'Las Vegas',   'LVS', 2027),
  ('Lerner & Rowe', 'Phoenix',     'PHX', 2027),
  ('Lerner & Rowe', 'Reno',        'RNO', 2027),
  ('Lerner & Rowe', 'Seattle',     'SEA', 2027),
  ('Lerner & Rowe', 'Tucson',      'TUC', 2027),
  ('Lerner & Rowe', 'Yuma',        'YMA', 2027)
on conflict (brand, market, year) do nothing;

-- Every market/year gets an empty working plan: the plan starts at zero.
insert into ba_working_plan (market_year_id)
select id from ba_market_year my
where not exists (select 1 from ba_working_plan w where w.market_year_id = my.id);

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
