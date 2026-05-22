// ═══════════════════════════════════════════════════════════════════
// /api/migrate-snapshot — Firestore→Supabase migration via uploaded JSON.
// ═══════════════════════════════════════════════════════════════════
// POST a raw Firestore snapshot JSON (the one the in-app "Download
// Snapshot" admin button exports). The endpoint:
//   1. Verifies admin password.
//   2. Runs the shared cleanup pass from api/_clean-snapshot.js
//      (placeholder removal, WK 4-digit purge, market normalization
//      to full names, dedupe).
//   3. Writes the cleaned blobs into the legacy_docs table — same
//      shape Firestore was using, so app.js needs zero changes to read
//      them back via /api/db.
//   4. Returns a detailed report so you can see what landed where.
//
// Companion: /api/firestore-pull does the same work but reads
// Firestore directly via firebase-admin (no JSON upload required).
// Use that one once USE_SUPABASE=1 has already flipped and the
// in-browser export can't reach Firestore anymore.
//
// Safe to run multiple times (upsert).
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
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

  const { cleaned, report } = cleanSnapshot(snapshot);

  try {
    const writeResult = await writeSnapshotToSupabase(supabase, cleaned);
    return res.status(200).json({ ok: true, ...writeResult, cleanup: report });
  } catch (e) {
    return res.status(500).json({ error: 'Supabase write failed', detail: e.message, cleanup: report });
  }
};

module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
    responseLimit: '8mb',
  },
};
