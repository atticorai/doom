// ═══════════════════════════════════════════════════════════════════
// /api/migrate-snapshot — one-click Firestore→Supabase migration.
// ═══════════════════════════════════════════════════════════════════
// POST a raw Firestore snapshot JSON (the one the Audit Log button
// exports). The endpoint:
//   1. Verifies admin password.
//   2. Runs the same cleanup pass scripts/clean-snapshot.js does:
//      placeholder removal, WK 4-digit purge, market normalization to
//      full names, dedupe.
//   3. Writes the cleaned blobs into the legacy_docs table — same
//      shape Firestore was using, so app.js needs zero changes to read
//      them back via /api/db.
//   4. Returns a detailed report so you can see what landed where.
//
// Safe to run multiple times (upsert). Re-running with a newer snapshot
// just overwrites the rows.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');

// ── Canonical lookups (same as scripts/clean-snapshot.js) ──────────
const DMA_TO_NAME = {
  'CHI':'Chicago','CIN':'Cincinnati','DEN':'Denver','MSP':'Minneapolis',
  'BRM':'Birmingham','HSV':'Huntsville','KNX':'Knoxville','CHA':'Chattanooga',
  'MTG':'Montgomery','DHN':'Dothan','GAD':'Gadsden',
};
const NAME_SET = new Set(Object.values(DMA_TO_NAME));
const TYPO_FIXES = {
  'Cincinatti':'Cincinnati','Cinncinati':'Cincinnati','Cincinnatti':'Cincinnati',
  'Mineapolis':'Minneapolis','Minnapolis':'Minneapolis',
};
const MULTI_RE = /[\/&]|,\s*[A-Z][a-z]+\s+[A-Z][a-z]+|\s+and\s+|\s+&\s+/;

function normalizeMarket(raw) {
  if (!raw) return { name: null, multi: false };
  const s0 = String(raw).trim();
  if (NAME_SET.has(s0)) return { name: s0, multi: false };
  if (DMA_TO_NAME[s0]) return { name: DMA_TO_NAME[s0], multi: false };
  const noState = s0.replace(/,\s*[A-Z]{2}\s*$/, '').trim();
  const fixed = TYPO_FIXES[noState] || noState;
  if (NAME_SET.has(fixed)) return { name: fixed, multi: false };
  if (MULTI_RE.test(s0)) {
    const parts = s0.split(/\s*[\/&,]\s*|\s+and\s+/).map(p => p.trim()).filter(Boolean);
    const names = parts.map(p => {
      if (NAME_SET.has(p)) return p;
      if (DMA_TO_NAME[p]) return DMA_TO_NAME[p];
      const np = (TYPO_FIXES[p] || p).replace(/,\s*[A-Z]{2}\s*$/, '').trim();
      return NAME_SET.has(np) ? np : null;
    }).filter(Boolean);
    if (names.length > 1) return { name: null, multi: true, splitInto: names, original: s0 };
  }
  return { name: null, multi: false };
}

function isClaudePlaceholder(h) {
  if (!h) return null;
  if (h.brand === 'Postman Law' && h.comments && h.comments.indexOf('If you buy has no bookends, run as standalones') >= 0) return 'pl_bookends_comment';
  if (h.brand === 'Postman Law' && h.isOoh && h.est === 'OOH-MSP-PL' && h.comments && h.comments.indexOf('Wilkins Media') >= 0) return 'pl_ooh_msp_wilkins';
  if (h.brand === 'Wettermark Keith' && typeof h.est === 'string' && /^[A-Z]{3}-WK-(TV|RAD|RADIO|OOH)$/.test(h.est)) return 'wk_fake_est_pattern';
  if (h.brand === 'Wettermark Keith' && h.comments && /^Version \d+ \/ \w+ Assets$/.test(h.comments)) return 'wk_version_assets_comment';
  if (h.brand === 'Wettermark Keith' && h.comments && /^(Dothan|Montgomery|Huntsville|Birmingham|Chattanooga|Knoxville) Radio Assets$/.test(h.comments)) return 'wk_market_radio_assets';
  return null;
}

const WK_DEAD_ESTS = new Set();
for (let n = 2633; n <= 2660; n++) WK_DEAD_ESTS.add(String(n));

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a); const B = Buffer.from(b);
  if (A.length !== B.length) { crypto.timingSafeEqual(A, A); return false; }
  return crypto.timingSafeEqual(A, B);
}

function cleanSnapshot(snapshot) {
  const out = JSON.parse(JSON.stringify(snapshot));
  const ad = out.appData || {};
  const report = {
    placeholders: 0, wk_legacy_links: 0, market_normalized: 0,
    market_split: 0, market_dropped: 0, duplicates: 0,
    totals_before: {}, totals_after: {},
  };

  report.totals_before.trafficHistory = (ad.trafficHistory?.data || []).length;
  report.totals_before.iscis = (ad.iscis?.data || []).length;
  report.totals_before.staEstLinks = Object.keys(ad.staEstLinks?.data || {}).length;

  // Placeholders
  if (Array.isArray(ad.trafficHistory?.data)) {
    const kept = [];
    for (const h of ad.trafficHistory.data) {
      if (isClaudePlaceholder(h)) { report.placeholders++; continue; }
      kept.push(h);
    }
    ad.trafficHistory.data = kept;
  }

  // WK 4-digit purge (scoped to WK only)
  if (ad.staEstLinks?.data) {
    for (const [k, v] of Object.entries(ad.staEstLinks.data)) {
      const parts = k.split('|');
      const brand = parts[2] || parts[parts.length - 1];
      if (brand !== 'Wettermark Keith') continue;
      const ests = Array.isArray(v) ? v : (v && v.ests) || [];
      const cleaned = ests.filter(e => !WK_DEAD_ESTS.has(String(e)));
      if (cleaned.length !== ests.length) report.wk_legacy_links++;
      if (cleaned.length === 0) delete ad.staEstLinks.data[k];
      else ad.staEstLinks.data[k] = Array.isArray(v) ? cleaned : { ...v, ests: cleaned };
    }
  }

  // Market normalize + split
  if (Array.isArray(ad.trafficHistory?.data)) {
    const out2 = [];
    for (const h of ad.trafficHistory.data) {
      const n = normalizeMarket(h.market);
      if (n.name) {
        if (n.name !== h.market) { report.market_normalized++; h.market = n.name; }
        out2.push(h);
      } else if (n.multi) {
        report.market_split++;
        for (const name of n.splitInto) out2.push({ ...h, market: name, _splitFrom: n.original });
      } else {
        report.market_dropped++;
      }
    }
    ad.trafficHistory.data = out2;
  }

  // Dedupe (newest ts wins)
  if (Array.isArray(ad.trafficHistory?.data)) {
    const byKey = new Map();
    for (const h of ad.trafficHistory.data) {
      const k = [h.brand, h.est, h.market, h.month, h.media, h.version || '1'].join('|');
      const ts = h.ts ? Date.parse(h.ts) : 0;
      const prev = byKey.get(k);
      if (!prev) { byKey.set(k, { h, ts }); continue; }
      if (ts > prev.ts) { report.duplicates++; byKey.set(k, { h, ts }); }
      else report.duplicates++;
    }
    ad.trafficHistory.data = Array.from(byKey.values()).map(v => v.h);
  }

  report.totals_after.trafficHistory = (ad.trafficHistory?.data || []).length;
  report.totals_after.iscis = (ad.iscis?.data || []).length;
  report.totals_after.staEstLinks = Object.keys(ad.staEstLinks?.data || {}).length;
  return { cleaned: out, report };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, snapshot } = req.body || {};
  const ADMIN = process.env.ADMIN_PASSWORD;
  if (!ADMIN) return res.status(503).json({ error: 'ADMIN_PASSWORD not set' });
  if (!password || !timingSafeEqual(String(password), ADMIN)) {
    return res.status(401).json({ error: 'Wrong admin password' });
  }
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.appData) {
    return res.status(400).json({ error: 'Missing or malformed snapshot — expected { appData: {...} }' });
  }

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' });

  // Clean
  const { cleaned, report } = cleanSnapshot(snapshot);

  // Write each appData doc into legacy_docs. Each doc gets stored as
  // a JSON-stringified blob to match the exact shape app.js reads.
  const rows = [];
  const ts = Date.now();
  for (const [docId, payload] of Object.entries(cleaned.appData || {})) {
    rows.push({
      collection: 'appData',
      doc_id: docId,
      data: JSON.stringify(payload.data === undefined ? payload : payload.data),
      ts: payload.ts || ts,
      updated_at: new Date().toISOString(),
    });
  }
  for (const [docId, payload] of Object.entries(cleaned.trafficSheets || {})) {
    rows.push({
      collection: 'trafficSheets',
      doc_id: docId,
      data: payload,
      ts,
      updated_at: new Date().toISOString(),
    });
  }

  const CHUNK = 50;
  let written = 0;
  try {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase
        .from('legacy_docs')
        .upsert(rows.slice(i, i + CHUNK), { onConflict: 'collection,doc_id' });
      if (error) throw error;
      written += rows.slice(i, i + CHUNK).length;
    }
  } catch (e) {
    return res.status(500).json({ error: 'Supabase write failed', detail: e.message, written, report });
  }

  return res.status(200).json({
    ok: true,
    written,
    appData_docs: Object.keys(cleaned.appData || {}).length,
    trafficSheets_docs: Object.keys(cleaned.trafficSheets || {}).length,
    cleanup: report,
  });
};
