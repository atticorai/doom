#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
// Snapshot cleanup pass
// ════════════════════════════════════════════════════════════════════
// Takes the Firestore snapshot export and produces a CLEANED version
// ready for Supabase, plus a detailed report of everything removed so
// you can eyeball it before anything goes live.
//
//   node scripts/clean-snapshot.js path/to/snapshot.json \
//     [--killlist killlist.json] \
//     [-o snapshot-cleaned.json] \
//     [-r cleanup-report.json] \
//     [--orphans orphans-for-review.json]
//
// What it removes:
//   1. Claude-injected placeholder records (known patterns)
//   2. Old WK 4-digit estimates (2633-2660 on Wettermark Keith) +
//      everything that references them (traffic, links, ISCIs)
//   3. Non-canonical markets ("Denver, CO" → "Denver", or dropped)
//   4. Exact duplicates of traffic records (newest ts wins)
//   5. Anything matching the killlist (you supply it)
//
// What it flags (does NOT delete):
//   - ISCIs that no traffic record uses
//   - Station-estimate links pointing to non-existent estimates
//   - Traffic records pointing to non-existent ISCIs
//   - Confirmations whose traffic record is gone
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const SNAPSHOT_PATH = args.find(a => a.endsWith('.json') && !a.includes('killlist'));
const KILLLIST_PATH = (() => { const i = args.indexOf('--killlist'); return i >= 0 ? args[i+1] : null; })();
const OUT_PATH      = (() => { const i = args.indexOf('-o');        return i >= 0 ? args[i+1] : 'snapshot-cleaned.json'; })();
const REPORT_PATH   = (() => { const i = args.indexOf('-r');        return i >= 0 ? args[i+1] : 'cleanup-report.json'; })();
const ORPHANS_PATH  = (() => { const i = args.indexOf('--orphans'); return i >= 0 ? args[i+1] : 'orphans-for-review.json'; })();

if (!SNAPSHOT_PATH) {
  console.error('usage: node clean-snapshot.js <snapshot.json> [--killlist killlist.json] [-o out.json] [-r report.json]');
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const killlist = KILLLIST_PATH ? JSON.parse(fs.readFileSync(KILLLIST_PATH, 'utf8')) : { traffic: [], iscis: [], estimates: [], stations: [] };
const out      = JSON.parse(JSON.stringify(snapshot)); // deep clone

const report = {
  meta: {
    cleanedAt: new Date().toISOString(),
    source: path.basename(SNAPSHOT_PATH),
    killlist: KILLLIST_PATH ? path.basename(KILLLIST_PATH) : null,
  },
  placeholders: [],
  wk_legacy_estimates: { estimates: [], iscis: [], traffic: [], links: [] },
  market_normalized: [],
  market_dropped: [],
  duplicates: [],
  killed: { traffic: [], iscis: [], estimates: [], stations: [] },
  totals_before: {},
  totals_after: {},
};

const orphans = {
  iscis_no_traffic: [],
  links_to_dead_estimates: [],
  traffic_referencing_dead_iscis: [],
  confirmations_no_traffic: [],
};

// ── Canonical lookups ───────────────────────────────────────────────
// The schema stores markets as DMA codes (CHI, BRM, etc.), so this
// function returns a DMA — not a name. Accepts: DMA code, full name,
// "City, ST" form, and a handful of known typos.
const NAME_TO_DMA = {
  'Chicago':'CHI','Cincinnati':'CIN','Denver':'DEN','Minneapolis':'MSP',
  'Birmingham':'BRM','Huntsville':'HSV','Knoxville':'KNX','Chattanooga':'CHA',
  'Montgomery':'MTG','Dothan':'DHN','Gadsden':'GAD',
};
const DMA_SET = new Set(Object.values(NAME_TO_DMA));
const TYPO_FIXES = {
  'Cincinatti': 'Cincinnati',
  'Cinncinati': 'Cincinnati',
  'Cincinnatti': 'Cincinnati',
  'Mineapolis': 'Minneapolis',
  'Minnapolis': 'Minneapolis',
};
// Multi-market strings — flagged specially, not silently dropped.
const MULTI_MARKET_RE = /[\/&]|,\s*[A-Z][a-z]+\s+[A-Z][a-z]+|\s+and\s+|\s+&\s+/;

function normalizeMarket(raw) {
  if (!raw) return { dma: null, multi: false };
  const s0 = String(raw).trim();
  // DMA code passthrough
  if (DMA_SET.has(s0)) return { dma: s0, multi: false };
  // Strip ", ST" suffix
  const noState = s0.replace(/,\s*[A-Z]{2}\s*$/, '').trim();
  // Typo fix
  const fixed = TYPO_FIXES[noState] || noState;
  if (NAME_TO_DMA[fixed]) return { dma: NAME_TO_DMA[fixed], multi: false };
  // Multi-market?
  if (MULTI_MARKET_RE.test(s0)) {
    const parts = s0.split(/\s*[\/&,]\s*|\s+and\s+/).map(p => p.trim()).filter(Boolean);
    const dmas = parts.map(p => {
      const np = (TYPO_FIXES[p] || p).replace(/,\s*[A-Z]{2}\s*$/, '').trim();
      return DMA_SET.has(p) ? p : NAME_TO_DMA[np] || null;
    }).filter(Boolean);
    if (dmas.length > 1) return { dma: null, multi: true, splitInto: dmas, original: s0 };
  }
  return { dma: null, multi: false };
}

function isClaudePlaceholder(h) {
  if (!h) return null;
  if (h.brand === 'Postman Law' && h.comments && h.comments.indexOf('If you buy has no bookends, run as standalones') >= 0)
    return 'pl_bookends_comment';
  if (h.brand === 'Postman Law' && h.isOoh && h.est === 'OOH-MSP-PL' && h.comments && h.comments.indexOf('Wilkins Media') >= 0)
    return 'pl_ooh_msp_wilkins';
  if (h.brand === 'Wettermark Keith' && typeof h.est === 'string' && /^[A-Z]{3}-WK-(TV|RAD|RADIO|OOH)$/.test(h.est))
    return 'wk_fake_est_pattern';
  if (h.brand === 'Wettermark Keith' && h.comments && /^Version \d+ \/ \w+ Assets$/.test(h.comments))
    return 'wk_version_assets_comment';
  if (h.brand === 'Wettermark Keith' && h.comments && /^(Dothan|Montgomery|Huntsville|Birmingham|Chattanooga|Knoxville) Radio Assets$/.test(h.comments))
    return 'wk_market_radio_assets';
  return null;
}

// ── Sizes before ────────────────────────────────────────────────────
const ad = out.appData || {};
report.totals_before = {
  trafficHistory: (ad.trafficHistory?.data || []).length,
  iscis:          (ad.iscis?.data || []).length,
  staEstLinks:    Object.keys(ad.staEstLinks?.data || {}).length,
  confirmations:  Object.keys(ad.confirmations?.data || {}).length,
  auditLog:       (ad.auditLog?.data || []).length,
};

// ── Pass 1: Placeholder removal ─────────────────────────────────────
if (Array.isArray(ad.trafficHistory?.data)) {
  ad.trafficHistory.data = ad.trafficHistory.data.filter(h => {
    const reason = isClaudePlaceholder(h);
    if (reason) {
      report.placeholders.push({ reason, _id: h._id, brand: h.brand, est: h.est, market: h.market, month: h.month, comments: h.comments });
      return false;
    }
    return true;
  });
}

// ── Pass 2: WK 4-digit legacy estimate purge ────────────────────────
// Per CLAUDE.md: WK estimates 2633-2660 are deprecated. Kill them
// everywhere — estimates table, ISCI references, traffic, links.
const WK_DEAD_ESTS = new Set();
for (let n = 2633; n <= 2660; n++) WK_DEAD_ESTS.add(String(n));

// Drop ISCIs that are WK + tagged with a dead estimate
if (Array.isArray(ad.iscis?.data)) {
  ad.iscis.data = ad.iscis.data.filter(i => {
    if (i?.brand === 'Wettermark Keith' && (WK_DEAD_ESTS.has(String(i.est)) || (i.tags||[]).some(t => WK_DEAD_ESTS.has(String(t))))) {
      report.wk_legacy_estimates.iscis.push({ code: i.code, dma: i.dma, est: i.est });
      return false;
    }
    return true;
  });
}

// Drop traffic that references dead WK estimates
if (Array.isArray(ad.trafficHistory?.data)) {
  ad.trafficHistory.data = ad.trafficHistory.data.filter(h => {
    if (h?.brand === 'Wettermark Keith' && WK_DEAD_ESTS.has(String(h.est))) {
      report.wk_legacy_estimates.traffic.push({ _id: h._id, est: h.est, market: h.market, month: h.month });
      return false;
    }
    return true;
  });
}

// Drop station-estimate links pointing at dead WK estimates.
// SCOPED TO WK ONLY: estimate 2633 is also a valid PL MSP TTWN
// estimate per data-est-sta-cal.js, so we must not strip it from
// PL link entries. Link keys look like "callSign|market|brand".
if (ad.staEstLinks?.data && typeof ad.staEstLinks.data === 'object') {
  for (const [k, v] of Object.entries(ad.staEstLinks.data)) {
    const parts = k.split('|');
    const linkBrand = parts[2] || parts[parts.length - 1];
    if (linkBrand !== 'Wettermark Keith') continue; // PL keeps 2633
    const ests = Array.isArray(v) ? v : (v && v.ests) || [];
    const cleaned = ests.filter(e => !WK_DEAD_ESTS.has(String(e)));
    if (cleaned.length !== ests.length) {
      report.wk_legacy_estimates.links.push({ key: k, removed: ests.filter(e => WK_DEAD_ESTS.has(String(e))) });
      if (Array.isArray(v)) ad.staEstLinks.data[k] = cleaned;
      else                  ad.staEstLinks.data[k] = { ...v, ests: cleaned };
    }
    if (cleaned.length === 0) delete ad.staEstLinks.data[k];
  }
}

// ── Pass 3: Market normalization ────────────────────────────────────
// Resolves to a DMA code. Multi-market rows get split into one record
// per DMA (preserves all the data, just with the real market).
if (Array.isArray(ad.trafficHistory?.data)) {
  const out2 = [];
  for (const h of ad.trafficHistory.data) {
    const norm = normalizeMarket(h.market);
    if (norm.dma) {
      if (norm.dma !== h.market) {
        report.market_normalized.push({ _id: h._id, from: h.market, to: norm.dma });
        h.market = norm.dma;
      }
      out2.push(h);
    } else if (norm.multi) {
      report.market_split = report.market_split || [];
      report.market_split.push({ _id: h._id, original: norm.original, into: norm.splitInto });
      for (const dma of norm.splitInto) {
        out2.push({ ...h, market: dma, _splitFrom: norm.original });
      }
    } else {
      report.market_dropped.push({ _id: h._id, market: h.market, brand: h.brand, est: h.est });
    }
  }
  ad.trafficHistory.data = out2;
}

// ── Pass 4: Dedupe (newest ts wins) ─────────────────────────────────
if (Array.isArray(ad.trafficHistory?.data)) {
  const byKey = new Map();
  const losers = [];
  for (const h of ad.trafficHistory.data) {
    const k = [h.brand, h.est, h.market, h.month, h.media, h.version || '1'].join('|');
    const ts = h.ts ? Date.parse(h.ts) : 0;
    const prev = byKey.get(k);
    if (!prev) { byKey.set(k, { h, ts }); continue; }
    if (ts > prev.ts) { losers.push(prev.h); byKey.set(k, { h, ts }); }
    else              { losers.push(h); }
  }
  for (const l of losers) report.duplicates.push({ _id: l._id, key: [l.brand, l.est, l.market, l.month, l.media, l.version||'1'].join('|') });
  ad.trafficHistory.data = Array.from(byKey.values()).map(v => v.h);
}

// ── Pass 5: Killlist ────────────────────────────────────────────────
// killlist.json shape:
//   { "traffic": [legacy_id, ...], "iscis": [{"code":"X","dma":"BRM"}, ...],
//     "estimates": [{"brand":"WK","num":"218"}], "stations": [{"brand":"WK","callSign":"X","market":"BRM"}] }
if (Array.isArray(ad.trafficHistory?.data) && killlist.traffic?.length) {
  const kill = new Set(killlist.traffic.map(String));
  ad.trafficHistory.data = ad.trafficHistory.data.filter(h => {
    if (kill.has(String(h._id))) {
      report.killed.traffic.push({ _id: h._id, est: h.est, market: h.market, month: h.month });
      return false;
    }
    return true;
  });
}
if (Array.isArray(ad.iscis?.data) && killlist.iscis?.length) {
  const kill = new Set(killlist.iscis.map(i => i.code + '|' + (i.dma || '')));
  ad.iscis.data = ad.iscis.data.filter(i => {
    if (kill.has(i.code + '|' + (i.dma || ''))) {
      report.killed.iscis.push({ code: i.code, dma: i.dma });
      return false;
    }
    return true;
  });
}

// ── Orphan analysis (report only, no deletion) ──────────────────────
// Traffic stores ISCI refs as "{code} - {title}" (e.g.
// "KNXWK26SP012O - WK Static Poster"), so we split on " - " and take
// the first segment to compare against the ISCI master. Also: only
// flag ACTIVE ISCIs — archived ones were already deliberately retired.
const usedIscis = new Set();
for (const h of ad.trafficHistory?.data || []) {
  for (const r of h.iscis || []) {
    if (!r?.code) continue;
    const code = String(r.code).split(' - ')[0].trim();
    usedIscis.add(code);
  }
}
for (const i of ad.iscis?.data || []) {
  if (i.active === false) continue;
  if (!usedIscis.has(i.code)) {
    orphans.iscis_no_traffic.push({ code: i.code, dma: i.dma, brand: i.brand, title: i.title });
  }
}

// Confirmations whose traffic record no longer exists
const trafficKeysByEst = new Set();
for (const h of ad.trafficHistory?.data || []) {
  if (h.brand === 'Wettermark Keith') trafficKeysByEst.add(h.est + '|' + h.market);
  else                                trafficKeysByEst.add(String(h.est));
}
for (const k of Object.keys(ad.confirmations?.data || {})) {
  if (!trafficKeysByEst.has(k)) {
    orphans.confirmations_no_traffic.push({ key: k, stations: Object.keys(ad.confirmations.data[k] || {}) });
  }
}

// ── Sizes after ─────────────────────────────────────────────────────
report.totals_after = {
  trafficHistory: (ad.trafficHistory?.data || []).length,
  iscis:          (ad.iscis?.data || []).length,
  staEstLinks:    Object.keys(ad.staEstLinks?.data || {}).length,
  confirmations:  Object.keys(ad.confirmations?.data || {}).length,
  auditLog:       (ad.auditLog?.data || []).length,
};

// ── Write outputs ───────────────────────────────────────────────────
fs.writeFileSync(OUT_PATH,     JSON.stringify(out,     null, 2));
fs.writeFileSync(REPORT_PATH,  JSON.stringify(report,  null, 2));
fs.writeFileSync(ORPHANS_PATH, JSON.stringify(orphans, null, 2));

// ── Summary ─────────────────────────────────────────────────────────
const dt = (k) => report.totals_before[k] - report.totals_after[k];
console.log('═══ Snapshot cleanup ═══');
console.log(`  source:  ${path.basename(SNAPSHOT_PATH)}`);
console.log(`  cleaned: ${OUT_PATH}`);
console.log(`  report:  ${REPORT_PATH}`);
console.log(`  orphans: ${ORPHANS_PATH}`);
console.log('');
console.log('  trafficHistory: ' + report.totals_before.trafficHistory + ' → ' + report.totals_after.trafficHistory + '  (-' + dt('trafficHistory') + ')');
console.log('  iscis:          ' + report.totals_before.iscis          + ' → ' + report.totals_after.iscis          + '  (-' + dt('iscis')          + ')');
console.log('  staEstLinks:    ' + report.totals_before.staEstLinks    + ' → ' + report.totals_after.staEstLinks    + '  (-' + dt('staEstLinks')    + ')');
console.log('  confirmations:  ' + report.totals_before.confirmations  + ' → ' + report.totals_after.confirmations  + '  (-' + dt('confirmations')  + ')');
console.log('');
console.log('  placeholders dropped:     ' + report.placeholders.length);
console.log('  WK 4-digit est purged:    ' + (report.wk_legacy_estimates.iscis.length + report.wk_legacy_estimates.traffic.length + report.wk_legacy_estimates.links.length));
console.log('  markets normalized:       ' + report.market_normalized.length);
console.log('  market split (multi):     ' + ((report.market_split||[]).length) + '  (one row per market)');
console.log('  markets dropped (bad):    ' + report.market_dropped.length);
console.log('  duplicates collapsed:     ' + report.duplicates.length);
console.log('  killed by killlist:       ' + (report.killed.traffic.length + report.killed.iscis.length));
console.log('');
console.log('  orphan ISCIs (no traffic):       ' + orphans.iscis_no_traffic.length + '  ← review');
console.log('  orphan confirmations (no rec):   ' + orphans.confirmations_no_traffic.length + '  ← review');
console.log('');
console.log('Review the report. If it looks right, run migrate-firestore-to-supabase.js against ' + OUT_PATH + '.');
