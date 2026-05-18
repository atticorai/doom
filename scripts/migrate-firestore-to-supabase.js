#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
// Firestore → Supabase migration
// ════════════════════════════════════════════════════════════════════
// Reads the JSON snapshot downloaded from the in-app "Export Firestore
// Snapshot" button and inserts everything into the Supabase tables
// defined in supabase/schema.sql.
//
// Run after the schema has been applied:
//
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... \
//   node scripts/migrate-firestore-to-supabase.js path/to/snapshot.json
//
// Add --dry-run to see what would happen without inserting anything.
//
// Normalizations applied:
//   • Market names: 'Denver, CO' → 'Denver' (strip state suffix)
//     and any non-canonical market is logged + skipped.
//   • Claude-injected placeholder records are dropped.
//   • Duplicates (same brand+est+market+month+media+version) collapsed
//     to one row, newest timestamp wins.
//   • Legacy `_id` preserved in traffic_history.legacy_id for cross-ref.
// ════════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const SNAPSHOT_PATH = process.argv.find(a => a.endsWith('.json'));

if (!SNAPSHOT_PATH) {
  console.error('usage: node migrate-firestore-to-supabase.js <snapshot.json> [--dry-run]');
  process.exit(1);
}
if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

let supabase = null;
if (!DRY_RUN) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const appData  = snapshot.appData || {};
const log = (...a) => console.log('[migrate]', ...a);
const stats = {};
const bump = (k, n=1) => { stats[k] = (stats[k]||0) + n; };

// ── Canonical lookups ───────────────────────────────────────────────
const PL_MARKETS = ['Chicago','Cincinnati','Denver','Minneapolis'];
const WK_MARKETS = ['Birmingham','Huntsville','Knoxville','Chattanooga','Montgomery','Dothan','Gadsden'];
const MARKET_TO_DMA = {
  'Chicago':'CHI','Cincinnati':'CIN','Denver':'DEN','Minneapolis':'MSP',
  'Birmingham':'BRM','Huntsville':'HSV','Knoxville':'KNX','Chattanooga':'CHA',
  'Montgomery':'MTG','Dothan':'DHN','Gadsden':'GAD',
};
const CANONICAL_NAMES = new Set(Object.keys(MARKET_TO_DMA));

function normalizeMarket(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // 'Denver, CO' → 'Denver'
  const stripped = s.replace(/,\s*[A-Z]{2}\s*$/,'').trim();
  if (CANONICAL_NAMES.has(stripped)) return stripped;
  // Try DMA → name
  for (const [name, dma] of Object.entries(MARKET_TO_DMA)) {
    if (s === dma || stripped === dma) return name;
  }
  return null; // non-canonical
}

function brandFromMarket(market) {
  if (PL_MARKETS.includes(market)) return 'PL';
  if (WK_MARKETS.includes(market)) return 'WK';
  return null;
}

// Claude placeholder detector (matches existing `cleanPlaceholders` admin
// action in app.js).
function isClaudePlaceholder(h) {
  if (!h) return false;
  if (h.brand === 'Postman Law' && h.comments && h.comments.indexOf('If you buy has no bookends, run as standalones') >= 0) return true;
  if (h.brand === 'Postman Law' && h.isOoh && h.est === 'OOH-MSP-PL' && h.comments && h.comments.indexOf('Wilkins Media') >= 0) return true;
  if (h.brand === 'Wettermark Keith' && typeof h.est === 'string' && /^[A-Z]{3}-WK-(TV|RAD|RADIO|OOH)$/.test(h.est)) return true;
  if (h.brand === 'Wettermark Keith' && h.comments && /^Version \d+ \/ \w+ Assets$/.test(h.comments)) return true;
  if (h.brand === 'Wettermark Keith' && h.comments && /^(Dothan|Montgomery|Huntsville|Birmingham|Chattanooga|Knoxville) Radio Assets$/.test(h.comments)) return true;
  return false;
}

function brandIdFromName(name) {
  if (name === 'Postman Law') return 'PL';
  if (name === 'Wettermark Keith') return 'WK';
  return null;
}

// ── Batch upsert helper ─────────────────────────────────────────────
async function upsert(table, rows, onConflict) {
  if (DRY_RUN) {
    log(`DRY: would upsert ${rows.length} rows into ${table}`);
    return;
  }
  if (!rows.length) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const q = supabase.from(table).upsert(chunk, onConflict ? { onConflict } : {});
    const { error } = await q;
    if (error) {
      console.error(`upsert failed on ${table} (chunk ${i}):`, error);
      throw error;
    }
  }
  log(`upserted ${rows.length} → ${table}`);
}

// ── Per-collection migrators ────────────────────────────────────────
async function migrateIscis() {
  const raw = appData.iscis?.data || [];
  if (!Array.isArray(raw)) { log('iscis: no array data'); return; }
  const seen = new Set();
  const rows = [];
  for (const i of raw) {
    if (!i || !i.code) { bump('isci_skipped_no_code'); continue; }
    const code = String(i.code).trim();
    const dma  = String(i.dma || '').trim();
    const key  = code + '|' + dma;
    if (seen.has(key)) { bump('isci_dup'); continue; }
    seen.add(key);
    const brandId = brandIdFromName(i.brand) || (PL_MARKETS.find(m => MARKET_TO_DMA[m] === dma) ? 'PL' : WK_MARKETS.find(m => MARKET_TO_DMA[m] === dma) ? 'WK' : null);
    if (!brandId) { bump('isci_unknown_brand'); continue; }
    rows.push({
      code, dma,
      brand_id: brandId,
      title: i.title || null,
      file_url: i.fileUrl || null,
      file_name: i.fileName || null,
      duration_s: i.dur ? parseInt(i.dur, 10) || null : null,
      suffix: i.suffix || null,
      category: i.category || i.caseType || null,
      value_prop: i.valueProp || null,
      vo: i.vo || null,
      tags: Array.isArray(i.tags) ? i.tags : [],
      active: i.active !== false,
    });
  }
  bump('iscis_migrated', rows.length);
  await upsert('iscis', rows, 'code,dma');
}

async function migrateEstimates() {
  // Estimates live in a seed file (data-est-sta-cal.js) but also get
  // edited in Firestore via the iscis/staEstLinks merge. The current
  // app keeps estimates entirely in seed data + station_estimate_links
  // (which IS in Firestore). So we re-derive estimates from the seed
  // tuples baked into the running app at snapshot time. Simpler path:
  // skip here and seed estimates from the data-*.js files via a
  // separate one-time SQL insert. The schema accepts that.
  log('estimates: re-seed from data-est-sta-cal.js separately (skipping)');
}

async function migrateStations() {
  log('stations: re-seed from data-est-sta-cal.js separately (skipping)');
}

async function migrateStationEstimates() {
  const links = appData.staEstLinks?.data || {};
  if (!links || typeof links !== 'object') { log('staEstLinks: empty'); return; }
  const rows = [];
  for (const [key, value] of Object.entries(links)) {
    // key looks like 'callSign|market' or 'brand|callSign|market' depending on era
    // value is array of estimate numbers OR object with .ests
    const ests = Array.isArray(value) ? value : (value && value.ests) || [];
    const parts = key.split('|');
    let callSign, market, brandHint;
    if (parts.length === 3) { [brandHint, callSign, market] = parts; }
    else if (parts.length === 2) { [callSign, market] = parts; }
    else { bump('staEstLinks_unparsable'); continue; }
    const normMkt = normalizeMarket(market);
    if (!normMkt) { bump('staEstLinks_bad_market'); continue; }
    const dma = MARKET_TO_DMA[normMkt];
    const brandId = brandFromMarket(normMkt);
    for (const est of ests) {
      rows.push({
        brand_id: brandId,
        call_sign: callSign,
        market: dma,
        est_num: String(est),
      });
    }
  }
  bump('station_estimates_migrated', rows.length);
  await upsert('station_estimates', rows, 'brand_id,call_sign,market,est_num');
}

async function migrateTrafficHistory() {
  const raw = appData.trafficHistory?.data || [];
  if (!Array.isArray(raw)) { log('trafficHistory: no array data'); return; }

  // First pass: filter placeholders and bad markets
  const cleaned = [];
  const marketWarnings = {};
  for (const h of raw) {
    if (!h) continue;
    if (isClaudePlaceholder(h)) { bump('th_placeholder_dropped'); continue; }
    const mkt = normalizeMarket(h.market);
    if (!mkt) {
      marketWarnings[h.market || '(empty)'] = (marketWarnings[h.market || '(empty)'] || 0) + 1;
      bump('th_bad_market_dropped');
      continue;
    }
    const brandId = brandIdFromName(h.brand) || brandFromMarket(mkt);
    if (!brandId) { bump('th_no_brand_dropped'); continue; }
    cleaned.push({ ...h, _mkt: mkt, _brandId: brandId });
  }
  if (Object.keys(marketWarnings).length) {
    log('⚠ traffic history: skipped non-canonical markets:', marketWarnings);
  }

  // Second pass: dedupe by (brand,est,market,month,media,version) — newest ts wins
  const byKey = new Map();
  for (const h of cleaned) {
    const k = [h._brandId, h.est, h._mkt, h.month, h.media, h.version || '1'].join('|');
    const prev = byKey.get(k);
    const ts = h.ts ? Date.parse(h.ts) : 0;
    if (!prev || (prev._ts || 0) < ts) byKey.set(k, { ...h, _ts: ts });
    else bump('th_dedup_collapsed');
  }

  const trafficRows = [];
  const iscisRows = [];
  for (const h of byKey.values()) {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : require('crypto').randomUUID();
    trafficRows.push({
      id,
      brand_id: h._brandId,
      market: MARKET_TO_DMA[h._mkt],
      media: h.media || 'TV',
      month: h.month || null,
      flight: h.flight || null,
      est: String(h.est || ''),
      combined: !!(h.combined || (typeof h.est === 'string' && h.est.includes('+'))),
      version: String(h.version || '1'),
      status: h.status || 'built',
      status_note: h.statusNote || null,
      is_revision: !!h.isRevision,
      prev_version: h.prevVersion ? String(h.prevVersion) : null,
      is_ooh: !!h.isOoh,
      comments: h.comments || null,
      sent_to: Array.isArray(h.sentTo) ? h.sentTo : (h.sentTo ? [h.sentTo] : []),
      sent_at: h.sentAt || (h.status === 'sent' && h.ts ? h.ts : null),
      created_by: h.createdBy || null,
      created_at: h.ts || new Date().toISOString(),
      legacy_id: typeof h._id === 'number' ? h._id : null,
    });
    const iscis = Array.isArray(h.iscis) ? h.iscis : [];
    iscis.forEach((r, pos) => {
      if (!r || !r.code) return;
      iscisRows.push({
        traffic_id: id,
        isci_code: String(r.code),
        isci_dma: String(r.dma || ''),
        rotation_pct: r.pct != null ? Number(r.pct) : null,
        position: pos,
      });
    });
  }
  bump('traffic_history_migrated', trafficRows.length);
  bump('traffic_history_iscis_migrated', iscisRows.length);
  await upsert('traffic_history', trafficRows);
  await upsert('traffic_history_iscis', iscisRows);
}

async function migrateConfirmations() {
  // Old shape: { [estKey]: { [callSign]: { confirmed, token, ts, by, notes } } }
  // estKey is either 'EST' (PL) or 'EST|MARKET' (WK). We can't restore
  // these without traffic_history.id — they get reattached in the app
  // by matching brand/est/market on read. For migration we drop them
  // into a temporary holding table OR skip and recreate via the app's
  // confirmation flow. Skipping is safer; tokens will rotate naturally.
  const confs = appData.confirmations?.data || {};
  const keys = Object.keys(confs);
  log(`confirmations: ${keys.length} legacy entries. NOT migrating — tokens regenerate on next traffic send. (If you need them: confirmations_legacy table.)`);
  bump('confirmations_skipped', keys.length);

  // Stash in a legacy table for forensic reference
  const legacyRows = [];
  for (const [key, calls] of Object.entries(confs)) {
    for (const [callSign, v] of Object.entries(calls || {})) {
      legacyRows.push({
        legacy_key: key,
        call_sign: callSign,
        confirmed: !!v.confirmed,
        token: v.token || null,
        confirmed_by: v.by || null,
        confirmed_at: v.ts || null,
        notes: v.notes || null,
      });
    }
  }
  // We didn't define confirmations_legacy in the schema; just dump to JSON file.
  fs.writeFileSync('confirmations-legacy.json', JSON.stringify(legacyRows, null, 2));
  log(`confirmations: wrote ${legacyRows.length} legacy rows to confirmations-legacy.json`);
}

async function migrateAuditLog() {
  const raw = appData.auditLog?.data || [];
  if (!Array.isArray(raw)) { log('auditLog: no array data'); return; }
  const rows = raw.map(l => ({
    ts: l.ts || new Date().toISOString(),
    action: String(l.a || 'Unknown'),
    detail: l.d != null ? String(l.d) : null,
    brand_id: brandIdFromName(l.brand) || null,
    user_label: l.user || null,
  }));
  bump('audit_log_migrated', rows.length);
  await upsert('audit_log', rows);
}

async function migrateCustomTags() {
  const cf = appData.customTags?.data || {};
  const rows = [];
  for (const [brand, kinds] of Object.entries(cf)) {
    const brandId = brandIdFromName(brand);
    if (!brandId) continue;
    for (const [kind, values] of Object.entries(kinds || {})) {
      const k = kind === 'categories' ? 'category' : kind === 'valueProps' ? 'valueProp' : kind === 'vos' ? 'vo' : kind;
      for (const v of values || []) {
        rows.push({ brand_id: brandId, kind: k, value: v });
      }
    }
  }
  bump('custom_tags_migrated', rows.length);
  await upsert('custom_tags', rows, 'brand_id,kind,value');
}

async function migrateAppState() {
  const wm = appData.workMonth?.data;
  if (wm) await upsert('app_state', [{ key: 'workMonth', value: wm }], 'key');
}

// ── Run ─────────────────────────────────────────────────────────────
(async () => {
  log('snapshot:', path.basename(SNAPSHOT_PATH));
  log('exported at:', snapshot.meta?.exportedAt);
  log('mode:', DRY_RUN ? 'DRY RUN' : 'WRITE');

  await migrateIscis();
  await migrateEstimates();
  await migrateStations();
  await migrateStationEstimates();
  await migrateTrafficHistory();
  await migrateConfirmations();
  await migrateAuditLog();
  await migrateCustomTags();
  await migrateAppState();

  log('═══ summary ═══');
  for (const [k, v] of Object.entries(stats)) log(`  ${k}: ${v}`);
  log('done.');
})().catch(e => {
  console.error('migration failed:', e);
  process.exit(1);
});
