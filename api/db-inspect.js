// ═══════════════════════════════════════════════════════════════════
// /api/db-inspect — quick read-only peek at legacy_docs.
// ═══════════════════════════════════════════════════════════════════
// Returns a list of {collection, doc_id, bytes} for everything in
// the legacy_docs table — the lightweight verification step after
// running the Firestore→Supabase pull.
//
// GET /api/db-inspect  → { rows: [...] }
//
// Gated by the dd_session cookie via middleware.js (same as /api/db).
// No admin password needed; this is a read-only sanity check.
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  try {
    const { data: rows, error } = await supabase
      .from('legacy_docs')
      .select('collection, doc_id, data, ts, updated_at')
      .order('collection', { ascending: true })
      .order('doc_id', { ascending: true });
    if (error) throw error;

    const summary = (rows || []).map(r => ({
      collection: r.collection,
      doc_id: r.doc_id,
      bytes: r.data ? (typeof r.data === 'string' ? r.data.length : JSON.stringify(r.data).length) : 0,
      updated_at: r.updated_at,
    }));

    return res.status(200).json({
      total: summary.length,
      rows: summary,
    });
  } catch (e) {
    console.error('db-inspect error:', e);
    return res.status(500).json({ error: 'Inspect failed', detail: e.message });
  }
};
