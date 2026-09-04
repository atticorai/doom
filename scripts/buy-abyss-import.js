#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// The Buy Abyss — one-time import + reconciliation of inherited data
// ═══════════════════════════════════════════════════════════════════
// Phase 1 acceptance requirement: the system must not start life on
// subtly wrong inherited numbers. So every import is
//
//   source file  →  normalized rows  →  totals footed back to the source
//
// by market, medium, station/vendor, month, annual total, and booked vs
// actual. The raw source is preserved next to the normalized rows
// (ba_import_batch.raw) so the import can be re-run and re-checked from
// what was actually loaded, not from the transformed JSON.
//
// Usage:
//   node scripts/buy-abyss-import.js --self-test
//   node scripts/buy-abyss-import.js --file lr2026.json --adapter ./scripts/buy-abyss-adapters/lr2026.js \
//        --agency OTM --workbook "L&R 2026 Media Sheet" --by "Emm Caban" [--dry-run]
//
// Env for a real write: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same as
// scripts/migrate-firestore-to-supabase.js).
//
// An adapter is a module that knows ONE source's shape:
//   module.exports = {
//     describe: 'L&R 2026 media sheet (OTM) — lr2026.json',
//     normalize(raw) → [{ market, media, station, vendor, year, month, booked, actual, spots, source_ref, raw }]
//     expected(raw)  → { by_market:{}, by_media:{}, by_station:{}, by_month:{}, annual:number, actual_annual?:number,
//                        actual_by_market?:{}, … }   // the source's OWN totals, read (not computed) from it
//   }
// See scripts/buy-abyss-adapters/README.md. The lr2026 adapter is written
// against the file itself once it is in the repo — its shape is not
// guessed here.
// ═══════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOL = 0.005;   // half a cent — anything more is a real difference
const MEDIA = ['TV', 'Cable', 'Radio', 'Streaming Audio', 'Digital Video'];

// ── normalized-row validation ───────────────────────────────────────
function validateRows(rows) {
  const problems = [];
  rows.forEach((r, i) => {
    const where = `row ${i}${r.source_ref ? ' (' + r.source_ref + ')' : ''}`;
    if (!r.market) problems.push(where + ': missing market');
    if (!MEDIA.includes(r.media)) problems.push(where + ': media "' + r.media + '" not one of ' + MEDIA.join(', '));
    if (!(r.month >= 1 && r.month <= 12)) problems.push(where + ': month ' + r.month + ' out of range');
    if (!(r.year >= 2000)) problems.push(where + ': year ' + r.year);
    if (r.booked != null && !Number.isFinite(Number(r.booked))) problems.push(where + ': booked not numeric');
    if (r.actual != null && !Number.isFinite(Number(r.actual))) problems.push(where + ': actual not numeric');
    if (!r.station && !r.vendor) problems.push(where + ': neither station nor vendor');
  });
  return problems;
}

// ── reconciliation core ─────────────────────────────────────────────
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
function sumBy(rows, keyFn, field) {
  const out = {};
  rows.forEach(r => { const k = keyFn(r); if (k == null) return; out[k] = round2((out[k] || 0) + Number(r[field] || 0)); });
  return out;
}
function diffMap(name, computed, expected) {
  const keys = new Set([...Object.keys(computed || {}), ...Object.keys(expected || {})]);
  const rows = [...keys].sort().map(k => {
    const c = computed[k], e = expected[k];
    const delta = round2((c || 0) - (e || 0));
    const ok = e !== undefined && c !== undefined && Math.abs(delta) <= TOL;
    return { key: k, computed: c ?? null, expected: e ?? null, delta, ok };
  });
  return { dimension: name, ok: rows.every(r => r.ok), rows };
}
function diffScalar(name, computed, expected) {
  const delta = round2((computed || 0) - (expected || 0));
  const ok = expected != null && Math.abs(delta) <= TOL;
  return { dimension: name, ok, rows: [{ key: 'total', computed: round2(computed), expected: expected ?? null, delta, ok }] };
}

// rows: normalized; expected: the source's own totals (from the adapter).
// Every dimension the source can vouch for is checked; a dimension the
// source has no total for is reported as "unverifiable", never as ok.
function reconcile(rows, expected) {
  expected = expected || {};
  const dims = [];
  const push = (d) => dims.push(d);
  const has = (k) => expected[k] !== undefined;

  push(has('by_market')  ? diffMap('booked by market',  sumBy(rows, r => r.market, 'booked'), expected.by_market)  : { dimension: 'booked by market',  ok: false, unverifiable: true });
  push(has('by_media')   ? diffMap('booked by medium',  sumBy(rows, r => r.media, 'booked'),  expected.by_media)   : { dimension: 'booked by medium',  ok: false, unverifiable: true });
  push(has('by_station') ? diffMap('booked by station/vendor', sumBy(rows, r => r.station || r.vendor, 'booked'), expected.by_station) : { dimension: 'booked by station/vendor', ok: false, unverifiable: true });
  push(has('by_month')   ? diffMap('booked by month',   sumBy(rows, r => String(r.month), 'booked'), expected.by_month) : { dimension: 'booked by month', ok: false, unverifiable: true });
  push(has('annual')     ? diffScalar('booked annual total', rows.reduce((s, r) => s + Number(r.booked || 0), 0), expected.annual) : { dimension: 'booked annual total', ok: false, unverifiable: true });

  const hasActual = rows.some(r => r.actual != null);
  if (hasActual || has('actual_annual') || has('actual_by_market')) {
    push(has('actual_annual')    ? diffScalar('actual annual total', rows.reduce((s, r) => s + Number(r.actual || 0), 0), expected.actual_annual) : { dimension: 'actual annual total', ok: false, unverifiable: true });
    push(has('actual_by_market') ? diffMap('actual by market', sumBy(rows, r => r.market, 'actual'), expected.actual_by_market) : { dimension: 'actual by market', ok: false, unverifiable: true });
    // booked vs actual: not a footing check, a variance the buyer must see
    const bm = sumBy(rows, r => r.market, 'booked'), am = sumBy(rows, r => r.market, 'actual');
    dims.push({ dimension: 'booked vs actual by market (informational)', ok: true, informational: true,
      rows: Object.keys(bm).sort().map(k => ({ key: k, booked: bm[k], actual: am[k] ?? null, delta: am[k] == null ? null : round2(am[k] - bm[k]) })) });
  }

  const failing = dims.filter(d => !d.ok && !d.informational);
  return {
    reconciled: failing.length === 0,
    checked_at: new Date().toISOString(),
    row_count: rows.length,
    tolerance: TOL,
    dimensions: dims,
    summary: dims.map(d => `${d.ok ? 'OK  ' : d.unverifiable ? 'N/A ' : 'FAIL'} ${d.dimension}${d.unverifiable ? ' — source has no total to foot against' : ''}${(!d.ok && !d.unverifiable && d.rows) ? ' — ' + d.rows.filter(r => !r.ok).slice(0, 5).map(r => `${r.key}: ${r.computed} vs ${r.expected} (${r.delta > 0 ? '+' : ''}${r.delta})`).join('; ') : ''}`),
  };
}

// ── write path (Supabase, service role) ─────────────────────────────
async function writeBatch({ raw, rows, report, meta }) {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or use --dry-run)');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: batch, error } = await sb.from('ba_import_batch').insert({
    purpose: 'history_2026', source_agency: meta.agency || null, source_workbook: meta.workbook || null,
    source_file: meta.file, source_sha256: meta.sha256, imported_by: meta.by, raw,
    row_count: rows.length, reconciliation: report, reconciled: report.reconciled, note: meta.note || null,
  }).select().single();
  if (error) throw error;
  const chunk = 500;
  for (let i = 0; i < rows.length; i += chunk) {
    const { error: e2 } = await sb.from('ba_history_2026').insert(rows.slice(i, i + chunk).map(r => ({
      import_batch_id: batch.id, market: r.market, media: r.media, station: r.station || null, vendor: r.vendor || null,
      year: r.year, month: r.month, booked: r.booked ?? null, actual: r.actual ?? null, spots: r.spots ?? null,
      source_ref: r.source_ref || null, raw: r.raw ?? null,
    })));
    if (e2) throw e2;
  }
  return batch.id;
}

// ── self-test: the reconciliation must catch a wrong number ─────────
function selfTest() {
  const rows = [
    { market: 'Chicago', media: 'TV', station: 'WBBM-TV', year: 2026, month: 1, booked: 10000, actual: 9800, source_ref: 'Chicago!B4' },
    { market: 'Chicago', media: 'TV', station: 'WBBM-TV', year: 2026, month: 2, booked: 12000, actual: 12000, source_ref: 'Chicago!C4' },
    { market: 'Chicago', media: 'Radio', station: 'WLS-FM', year: 2026, month: 1, booked: 3000, actual: 3000, source_ref: 'Chicago!B9' },
    { market: 'Phoenix', media: 'TV', station: 'KPHO-TV', year: 2026, month: 1, booked: 5000, actual: null, source_ref: 'Phoenix!B4' },
  ];
  const good = { by_market: { Chicago: 25000, Phoenix: 5000 }, by_media: { TV: 27000, Radio: 3000 },
    by_station: { 'WBBM-TV': 22000, 'WLS-FM': 3000, 'KPHO-TV': 5000 }, by_month: { '1': 18000, '2': 12000 }, annual: 30000,
    actual_annual: 24800, actual_by_market: { Chicago: 24800, Phoenix: 0 } };
  const r1 = reconcile(rows, good);
  if (!r1.reconciled) { console.error(r1.summary.join('\n')); throw new Error('self-test: a correct import was reported as failing'); }

  const bad = { ...good, by_station: { ...good.by_station, 'WBBM-TV': 22100 } };   // source says 100 more
  const r2 = reconcile(rows, bad);
  const dim = r2.dimensions.find(d => d.dimension === 'booked by station/vendor');
  if (r2.reconciled || dim.ok || dim.rows.find(x => x.key === 'WBBM-TV').delta !== -100) throw new Error('self-test: a 100.00 station difference was not caught');

  const r3 = reconcile(rows, { annual: 30000 });   // source only vouches for the annual figure
  if (r3.reconciled || r3.dimensions.filter(d => d.unverifiable).length !== 6) throw new Error('self-test: unverifiable dimensions must not count as reconciled');

  const problems = validateRows([{ market: '', media: 'Print', month: 13, year: 2026 }]);
  if (problems.length !== 4) throw new Error('self-test: row validation missed problems: ' + problems.join(' | '));

  console.log('self-test PASS — reconciliation catches a $100 station difference, refuses to call unverifiable dimensions reconciled, and validates rows');
  console.log(r1.summary.join('\n'));
}

// ── CLI ─────────────────────────────────────────────────────────────
function arg(name, dflt) { const i = process.argv.indexOf('--' + name); return i > -1 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true) : dflt; }

async function main() {
  if (arg('self-test')) return selfTest();
  const file = arg('file'), adapterPath = arg('adapter'), by = arg('by');
  if (!file || !adapterPath || !by) {
    console.error('usage: --file <source> --adapter <module> --by "<name>" [--agency OTM] [--workbook "<title>"] [--note "…"] [--dry-run]');
    process.exit(2);
  }
  const bytes = fs.readFileSync(file);
  const raw = JSON.parse(bytes.toString('utf8'));
  const adapter = require(path.resolve(adapterPath));
  const rows = adapter.normalize(raw);
  const problems = validateRows(rows);
  if (problems.length) { console.error('normalized rows have problems — nothing written:\n  ' + problems.slice(0, 40).join('\n  ')); process.exit(1); }
  const report = reconcile(rows, adapter.expected(raw));
  console.log(`${adapter.describe || adapterPath}\n${rows.length} normalized rows\n` + report.summary.join('\n'));
  console.log(report.reconciled ? '\nRECONCILED — every dimension foots to the source' : '\nNOT RECONCILED — the batch will be stored with reconciled=false; fix the adapter or the source before this data is used');
  if (arg('dry-run')) return;
  const id = await writeBatch({ raw, rows, report, meta: { file: path.basename(file), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), by, agency: arg('agency'), workbook: arg('workbook'), note: arg('note') } });
  console.log('ba_import_batch ' + id + ' written (' + rows.length + ' rows, reconciled=' + report.reconciled + ')');
}

module.exports = { reconcile, validateRows, sumBy };
if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
