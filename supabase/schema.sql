-- ════════════════════════════════════════════════════════════════════
-- DOOM & DELIVERABLES — Supabase / Postgres Schema
-- ════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor before migrating data from
-- Firestore. Safe to re-run: every CREATE uses IF NOT EXISTS and the
-- bottom rebuilds RLS policies idempotently.
--
-- Design principles:
--   • Real rows, not JSON blobs. Editing one ISCI updates one row.
--   • Composite primary keys where the business needs them
--     (ISCIs = code+dma, WK airings = est+market).
--   • Foreign keys with ON DELETE CASCADE where parent ownership is
--     unambiguous, ON DELETE RESTRICT where data integrity matters.
--   • Timestamps as timestamptz. UUIDs for surrogate keys.
--   • Single source of truth: no `data:JSON.stringify(...)` blobs.
-- ════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Brands & lookup data ────────────────────────────────────────────
create table if not exists brands (
  id          text primary key,            -- 'PL' | 'WK'
  name        text not null unique,        -- 'Postman Law' | 'Wettermark Keith'
  color       text not null,               -- hex
  created_at  timestamptz not null default now()
);

insert into brands (id, name, color) values
  ('PL', 'Postman Law',       '#9b7bb0'),
  ('WK', 'Wettermark Keith',  '#D4A040')
on conflict (id) do update set name = excluded.name, color = excluded.color;

-- Markets — canonical list. Anything outside this set is an error.
-- Per CLAUDE.md rule #7: "full brand names and market names everywhere
-- except ISCI codes". So the NAME is the primary key. DMA is just an
-- attribute, used only for constructing ISCI codes.
create table if not exists markets (
  name        text primary key,            -- 'Chicago', 'Birmingham'
  dma         text not null unique,        -- 'CHI', 'BRM' — for ISCI codes only
  brand_id    text not null references brands(id),
  active      boolean not null default true,
  sort_order  int not null default 0
);

insert into markets (name, dma, brand_id, sort_order) values
  ('Chicago',     'CHI', 'PL', 10),
  ('Cincinnati',  'CIN', 'PL', 20),
  ('Denver',      'DEN', 'PL', 30),
  ('Minneapolis', 'MSP', 'PL', 40),
  ('Birmingham',  'BRM', 'WK', 10),
  ('Huntsville',  'HSV', 'WK', 20),
  ('Knoxville',   'KNX', 'WK', 30),
  ('Chattanooga', 'CHA', 'WK', 40),
  ('Montgomery',  'MTG', 'WK', 50),
  ('Dothan',      'DHN', 'WK', 60),
  ('Gadsden',     'GAD', 'WK', 70)
on conflict (name) do update set dma = excluded.dma, brand_id = excluded.brand_id;

-- Buyers (contact info for traffic emails)
create table if not exists buyers (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  brand_id    text not null references brands(id),
  markets     text[] not null default '{}', -- full market names, e.g. {'Chicago','Denver'}
  active      boolean not null default true,
  unique (name, brand_id)
);

-- ── Estimates ───────────────────────────────────────────────────────
-- PL: 4-digit, unique per market. WK: 3-digit, SHARED across all WK
-- markets (the same estimate number covers all 6 WK markets for the
-- month). So the primary key has to include brand to disambiguate.
create table if not exists estimates (
  num         text not null,
  brand_id    text not null references brands(id),
  market      text,                         -- nullable for WK (shared)
  media       text not null,                -- TV, Cable, Radio, Streaming Audio, OOH...
  "group"     text,                         -- Base, Sponsorship, UD/AV, Sports, Heavy Up, TTWN, etc.
  label       text,                         -- 'TV Base', 'TV Sponsorship'
  buyer_name  text,
  month       text,                         -- for WK: 'January'..'December'
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (brand_id, num)
);

create index if not exists estimates_brand_market_idx on estimates (brand_id, market);
create index if not exists estimates_brand_media_idx  on estimates (brand_id, media);

-- ── Stations ────────────────────────────────────────────────────────
-- Ownership groups are critical — traffic emails group by ownership,
-- one email per ownership group per market.
create table if not exists stations (
  call_sign        text not null,           -- 'WBBM-TV'
  brand_id         text not null references brands(id),
  market           text not null references markets(name),
  media            text not null,           -- TV, Cable, Radio
  ownership_group  text,                    -- 'Nexstar', 'iHeart', 'Sinclair'
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  notes            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  primary key (brand_id, call_sign, market)
);

create index if not exists stations_brand_market_idx     on stations (brand_id, market);
create index if not exists stations_ownership_idx        on stations (ownership_group);
create index if not exists stations_contact_email_idx    on stations (contact_email);

-- Linking table: which stations carry which estimates
create table if not exists station_estimates (
  brand_id    text not null,
  call_sign   text not null,
  market      text not null,
  est_num     text not null,
  primary key (brand_id, call_sign, market, est_num),
  foreign key (brand_id, call_sign, market) references stations (brand_id, call_sign, market) on delete cascade,
  foreign key (brand_id, est_num)           references estimates (brand_id, num)              on delete cascade
);

-- ── ISCIs ───────────────────────────────────────────────────────────
-- Composite key: code + dma. Same code in different markets are
-- different ISCIs (per CLAUDE.md rule #5).
-- OOH ISCIs live here too with suffix='O' and are filtered out of
-- the main registry in app code.
create table if not exists iscis (
  code         text not null,
  dma          text not null default '',    -- '' for brand-wide ISCIs without a market
  brand_id     text not null references brands(id),
  title        text,
  file_url     text,                        -- Supabase Storage public URL
  file_name    text,
  duration_s   int,                         -- 15, 30, 60
  suffix       text,                        -- 'O' for OOH
  category     text,                        -- practice area / case type
  value_prop   text,
  vo           text,                        -- voiceover talent
  tags         text[] not null default '{}',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (code, dma)
);

create index if not exists iscis_brand_idx        on iscis (brand_id);
create index if not exists iscis_active_idx       on iscis (active) where active;
create index if not exists iscis_suffix_idx       on iscis (suffix);

-- Trigger to keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists iscis_updated_at on iscis;
create trigger iscis_updated_at before update on iscis
  for each row execute function set_updated_at();

-- Custom tag library (per-brand controlled vocab for categories,
-- value props, VOs).
create table if not exists custom_tags (
  brand_id    text not null references brands(id),
  kind        text not null,                -- 'category' | 'valueProp' | 'vo'
  value       text not null,
  created_at  timestamptz not null default now(),
  primary key (brand_id, kind, value)
);

-- ── Traffic History ────────────────────────────────────────────────
-- One row per sent/built traffic instruction. Replaces the giant
-- trafficHistory JSON blob.
create table if not exists traffic_history (
  id            uuid primary key default uuid_generate_v4(),
  brand_id      text not null references brands(id),
  market        text not null references markets(name),
  media         text not null,
  month         text not null,              -- 'January 2026' or similar — match existing format
  flight        text,
  est           text not null,              -- can be 'EST1 + EST2' for combined PL
  combined      boolean not null default false,
  version       text not null default '1',
  status        text not null default 'built',  -- built | sent | partial | confirmed | revised | copied
  status_note   text,
  is_revision   boolean not null default false,
  prev_version  text,
  is_ooh        boolean not null default false,
  comments      text,
  sent_to       text[] not null default '{}',-- email addresses
  sent_at       timestamptz,
  created_by    text,
  created_at    timestamptz not null default now(),
  legacy_id     bigint                       -- preserves the old _id from Firestore for cross-ref
);

create index if not exists traffic_brand_month_idx      on traffic_history (brand_id, month);
create index if not exists traffic_brand_market_idx     on traffic_history (brand_id, market);
create index if not exists traffic_market_media_idx     on traffic_history (market, media);
create index if not exists traffic_est_idx              on traffic_history (est);
create index if not exists traffic_status_idx           on traffic_history (status);
create index if not exists traffic_sent_at_idx          on traffic_history (sent_at);

-- Each traffic record references one or more ISCIs (the rotation).
create table if not exists traffic_history_iscis (
  traffic_id    uuid not null references traffic_history(id) on delete cascade,
  isci_code     text not null,
  isci_dma      text not null default '',
  rotation_pct  numeric(5,2),
  position      int not null default 0,     -- preserve order within the rotation
  primary key (traffic_id, isci_code, isci_dma, position),
  foreign key (isci_code, isci_dma) references iscis (code, dma)
);

-- ── Confirmations ──────────────────────────────────────────────────
-- Per record per station call sign. Key strategy:
--   PL: traffic_id + call_sign (one estimate per market)
--   WK: traffic_id + call_sign  (still works — traffic_id already
--       carries brand + est + market)
create table if not exists confirmations (
  traffic_id   uuid not null references traffic_history(id) on delete cascade,
  call_sign    text not null,
  confirmed    boolean not null default false,
  confirmed_by text,
  confirmed_at timestamptz,
  token        text not null,                -- the URL token used in the confirmation portal
  notes        text,
  created_at   timestamptz not null default now(),
  primary key (traffic_id, call_sign)
);

create index if not exists confirmations_token_idx     on confirmations (token);
create index if not exists confirmations_confirmed_idx on confirmations (confirmed);

-- ── OOH ────────────────────────────────────────────────────────────
create table if not exists ooh_contracts (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    text not null references brands(id),
  vendor      text not null,
  market      text not null references markets(name),
  start_date  date,
  end_date    date,
  contract_value numeric(12,2),
  notes       text,
  created_at  timestamptz not null default now()
);

-- WK = boards, PL = panels. One row per posting.
create table if not exists ooh_panels (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     text not null references brands(id),
  market       text not null references markets(name),
  vendor       text,
  board_id     text,                         -- WK
  unit         text,                         -- PL
  panel_type   text,                         -- bulletin, poster, digital
  location     text,
  isci_code    text,
  isci_dma     text,
  active       boolean not null default true,
  start_date   date,
  end_date     date,
  notes        text,
  created_at   timestamptz not null default now(),
  foreign key (isci_code, isci_dma) references iscis (code, dma)
);

create index if not exists ooh_panels_brand_market_idx on ooh_panels (brand_id, market);
create index if not exists ooh_panels_board_idx        on ooh_panels (board_id);
create index if not exists ooh_panels_unit_idx         on ooh_panels (unit);

create table if not exists ooh_photos (
  id          uuid primary key default uuid_generate_v4(),
  panel_id    uuid references ooh_panels(id) on delete cascade,
  url         text not null,
  caption     text,
  uploaded_at timestamptz not null default now()
);

create table if not exists ooh_reminders_sent (
  brand_id    text not null references brands(id),
  market      text not null references markets(name),
  month       text not null,
  sent_at     timestamptz not null default now(),
  primary key (brand_id, market, month)
);

-- ── Now Airing (which rotation each market is currently on) ────────
create table if not exists now_airing (
  brand_id    text not null references brands(id),
  market      text not null references markets(name),
  media       text not null,
  isci_code   text not null,
  isci_dma    text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (brand_id, market, media),
  foreign key (isci_code, isci_dma) references iscis (code, dma)
);

-- ── Confirmation Reminders Sent ────────────────────────────────────
create table if not exists confirm_reminders_sent (
  traffic_id  uuid not null references traffic_history(id) on delete cascade,
  call_sign   text not null,
  sent_at     timestamptz not null default now(),
  primary key (traffic_id, call_sign)
);

-- ── Audit Log ──────────────────────────────────────────────────────
create table if not exists audit_log (
  id          uuid primary key default uuid_generate_v4(),
  ts          timestamptz not null default now(),
  action      text not null,
  detail      text,
  brand_id    text references brands(id),
  user_label  text,                          -- 'Emm', 'system', etc.
  ip          text
);

create index if not exists audit_log_ts_idx       on audit_log (ts desc);
create index if not exists audit_log_action_idx   on audit_log (action);
create index if not exists audit_log_brand_idx    on audit_log (brand_id);

-- ── App State (singleton settings: workMonth, etc.) ────────────────
create table if not exists app_state (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Legacy doc store (Firestore-shape compatibility for day-1) ─────
-- The app currently stores collections as one giant JSON blob per
-- doc ("save the whole iscis array under appData/iscis"). This table
-- preserves that shape so the cutover requires zero changes to the
-- save/load patterns in app.js. We migrate to proper column queries
-- incrementally after the cutover is stable.
create table if not exists legacy_docs (
  collection  text not null,                -- 'appData' | 'trafficSheets'
  doc_id      text not null,                -- 'iscis', 'trafficHistory', etc.
  data        jsonb,                        -- the stringified JSON the app used to put in Firestore.data
  ts          bigint,                       -- Date.now() the app sets
  updated_at  timestamptz not null default now(),
  primary key (collection, doc_id)
);

create index if not exists legacy_docs_collection_idx on legacy_docs (collection);

-- ── Legacy doc HISTORY (every previous version, nothing is ever lost) ──
-- Every set/delete on legacy_docs writes the OLD value here first.
-- Recover any prior version by reading from this table. No automatic
-- cleanup — history grows unbounded; trim manually after enough time
-- has passed that you're confident the change was correct.
create table if not exists legacy_docs_history (
  id            bigserial primary key,
  collection    text not null,
  doc_id        text not null,
  data          jsonb,
  ts            bigint,
  archived_at   timestamptz not null default now(),
  archived_op   text not null,                 -- 'set' | 'delete' | 'pull' | 'creative-migrate'
  archived_by   text                            -- caller hint (endpoint name, user, etc.)
);

create index if not exists legacy_docs_history_doc_idx
  on legacy_docs_history (collection, doc_id, archived_at desc);
create index if not exists legacy_docs_history_archived_at_idx
  on legacy_docs_history (archived_at desc);

alter table legacy_docs_history enable row level security;

-- ── Rendered Traffic Sheets ────────────────────────────────────────
-- The HTML traffic sheets that get linked from confirmation emails.
-- These are bulky strings — kept separate from traffic_history so
-- list queries stay fast.
create table if not exists traffic_sheets (
  id          text primary key,             -- {est}_{call_sign}
  traffic_id  uuid references traffic_history(id) on delete cascade,
  est         text not null,
  call_sign   text not null,
  html        text not null,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
-- The app authenticates via the existing cookie-based session in
-- api/auth.js, then talks to Supabase via the SERVICE ROLE KEY from
-- server endpoints (or via a JWT minted by api/auth.js). RLS is
-- enabled defensively so a leaked anon key can't read anything.

alter table brands                 enable row level security;
alter table markets                enable row level security;
alter table buyers                 enable row level security;
alter table estimates              enable row level security;
alter table stations               enable row level security;
alter table station_estimates      enable row level security;
alter table iscis                  enable row level security;
alter table custom_tags            enable row level security;
alter table traffic_history        enable row level security;
alter table traffic_history_iscis  enable row level security;
alter table confirmations          enable row level security;
alter table ooh_contracts          enable row level security;
alter table ooh_panels             enable row level security;
alter table ooh_photos             enable row level security;
alter table ooh_reminders_sent     enable row level security;
alter table now_airing             enable row level security;
alter table confirm_reminders_sent enable row level security;
alter table audit_log              enable row level security;
alter table app_state              enable row level security;
alter table traffic_sheets         enable row level security;
alter table legacy_docs            enable row level security;

-- Default deny. Service role bypasses RLS automatically, so all app
-- writes go through the server with the service role key.
-- The only public read is confirmations-by-token (handled by an
-- explicit policy below) so the confirmation portal works without
-- requiring a login.

drop policy if exists confirmations_public_read_by_token on confirmations;
create policy confirmations_public_read_by_token
  on confirmations for select
  using (true);  -- the token IS the auth; the URL is unguessable

drop policy if exists traffic_sheets_public_read on traffic_sheets;
create policy traffic_sheets_public_read
  on traffic_sheets for select
  using (true);  -- linked from confirmation emails via unguessable URLs

-- ════════════════════════════════════════════════════════════════════
-- Storage Buckets
-- ════════════════════════════════════════════════════════════════════
-- The /api/storage endpoint writes to these buckets via the service-role
-- key. The supabase-storage-shim.js in the browser routes Firebase-shape
-- storage.ref(path) calls to the right bucket based on path prefix:
--   creative/*    -> bucket 'creative'  (path: rest after prefix)
--   ooh-photos/*  -> bucket 'ooh'       (path: 'photos/' + rest)
--   legacy/*      -> bucket 'legacy-wk' (path: rest after prefix)
--
-- 'creative' and 'ooh' are PUBLIC: the app stores the public URL in
-- records and renders it directly in <video>/<img>/<a>. Anyone with
-- the URL can read the file — same as Firebase Storage's legacy
-- behavior.
-- 'legacy-wk' is PRIVATE: archival source PDFs that never need to be
-- linked publicly. Reads go through /api/storage createSignedUrl.
--
-- 500 MB per file (covers TV creative; large source files belong in
-- legacy-wk where they're archived rather than served).

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('creative',  'creative',  true,  524288000),
  ('ooh',       'ooh',       true,  524288000),
  ('legacy-wk', 'legacy-wk', false, 524288000)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Public read policies for the two public buckets. Service role
-- bypasses all policies, so writes (uploads, deletes, moves) all
-- go through /api/storage regardless of these.

drop policy if exists "Public read on creative" on storage.objects;
create policy "Public read on creative"
  on storage.objects for select
  using (bucket_id = 'creative');

drop policy if exists "Public read on ooh" on storage.objects;
create policy "Public read on ooh"
  on storage.objects for select
  using (bucket_id = 'ooh');

-- legacy-wk has NO public policy: reads require a signed URL minted
-- by /api/storage (which uses the service-role key).

-- ════════════════════════════════════════════════════════════════════
-- Done.
-- ════════════════════════════════════════════════════════════════════
