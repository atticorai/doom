// ═══════════════════════════════════════════════════════════════════
// /api/firestore-pull — server-side Firestore → Supabase migration.
// ═══════════════════════════════════════════════════════════════════
// Solves the chicken-and-egg: once USE_SUPABASE=1, the in-app
// "Download Snapshot" button can't reach Firestore anymore (db is the
// Supabase shim). This endpoint reads Firestore directly via the
// service-account credentials in FIREBASE_ADMIN_KEY, applies the same
// cleanup the upload-snapshot path uses, and writes to legacy_docs.
//
// One-shot: run once per environment to pull all data over. Safe to
// re-run (upserts).
//
// POST { password: ADMIN_PASSWORD } → returns the same report shape
// as /api/migrate-snapshot, plus counts of docs read from Firestore.
//
// Requires env vars:
//   FIREBASE_ADMIN_KEY        — service-account JSON
//   SUPABASE_URL              — target
//   SUPABASE_SERVICE_ROLE_KEY — bypasses RLS
//   ADMIN_PASSWORD            — gate this endpoint
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getDb } = require('./_admin');
const { getSupabase } = require('./_supabase');
const { cleanSnapshot, writeSnapshotToSupabase } = require('./_clean-snapshot');

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a); const B = Buffer.from(b);
  if (A.length !== B.length) { crypto.timingSafeEqual(A, A); return false; }
  return crypto.timingSafeEqual(A, B);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const ADMIN = (process.env.ADMIN_PASSWORD || '').trim();
  if (!ADMIN) return res.status(503).json({ error: 'ADMIN_PASSWORD not set' });
  const submitted = typeof password === 'string' ? password.trim() : '';
  if (!submitted || !timingSafeEqual(submitted, ADMIN)) {
    return res.status(401).json({
      error: 'Wrong admin password',
      detail: `submitted length: ${submitted.length}, expected length: ${ADMIN.length}`,
    });
  }

  const fs = getDb();
  if (!fs) {
    return res.status(503).json({
      error: 'Firestore Admin not configured',
      detail: 'Set FIREBASE_ADMIN_KEY env var with the service-account JSON',
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase not configured',
      detail: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars',
    });
  }

  try {
    // Build the same snapshot shape the in-app "Download Snapshot"
    // button produces: { meta, appData: { docId: { ts, data } }, trafficSheets: { docId: <html doc> } }
    const snapshot = {
      meta: { exportedAt: new Date().toISOString(), source: 'firestore-pull' },
      appData: {},
      trafficSheets: {},
    };

    const appDataSnap = await fs.collection('appData').get();
    appDataSnap.forEach(doc => {
      const d = doc.data() || {};
      let parsed = d.data;
      // Firestore stores `data` as a JSON-stringified blob (the app's
      // legacy save shape). Parse so cleanSnapshot can operate on
      // arrays/objects, not strings.
      if (typeof d.data === 'string') {
        try { parsed = JSON.parse(d.data); } catch (e) { parsed = d.data; }
      }
      snapshot.appData[doc.id] = { ts: d.ts || null, data: parsed };
    });

    const sheetsSnap = await fs.collection('trafficSheets').get();
    sheetsSnap.forEach(doc => {
      snapshot.trafficSheets[doc.id] = doc.data();
    });

    const firestoreRead = {
      appData_docs: appDataSnap.size,
      trafficSheets_docs: sheetsSnap.size,
    };

    const { cleaned, report } = cleanSnapshot(snapshot);
    const writeResult = await writeSnapshotToSupabase(supabase, cleaned, 'firestore-pull');

    return res.status(200).json({
      ok: true,
      firestore_read: firestoreRead,
      ...writeResult,
      cleanup: report,
    });
  } catch (e) {
    console.error('firestore-pull failed:', e);
    return res.status(500).json({ error: 'Migration failed', detail: e.message });
  }
};

// Snapshot can be hefty (trafficHistory blob alone often exceeds 1MB).
module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
    responseLimit: '8mb',
  },
};
