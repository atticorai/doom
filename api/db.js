// ═══════════════════════════════════════════════════════════════════
// /api/db — Supabase-backed adapter for the existing Firestore-shape
// .collection().doc().get()/.set() pattern in app.js.
// ═══════════════════════════════════════════════════════════════════
// Day-1 cutover: the app keeps storing each "collection" as one JSON
// blob (iscis, trafficHistory, etc.) — same shape it used in Firestore.
// Those blobs land in the `legacy_docs` table. Proper column-by-column
// queries come incrementally after the cutover is stable.
//
// Auth: protected by the existing dd_session HMAC cookie at the
// middleware layer. Vendor portals (?confirm=) never reach this
// endpoint because they don't have a session cookie.
//
// Request body shapes:
//   { collection: 'appData', doc: 'iscis', action: 'get' }
//   { collection: 'appData', doc: 'iscis', action: 'set', data: {data: '...', ts: 12345} }
//   { collection: 'trafficSheets', doc: '2609_WBBM-TV', action: 'get' }
//   { collection: 'trafficSheets', action: 'list' }
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');
const { archiveDoc } = require('./_archive');

const ALLOWED_COLLECTIONS = new Set(['appData', 'trafficSheets']);

const handler = async function(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured', detail: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.' });
  }

  const { collection, doc, action, data } = req.body || {};

  if (!collection || !ALLOWED_COLLECTIONS.has(collection)) {
    return res.status(400).json({ error: 'Invalid or missing collection' });
  }
  if (!action || !['get', 'set', 'delete', 'list', 'ts'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    if (action === 'ts') {
      // Cheap change-detection probe: return only doc_id -> ts (no blobs) so
      // clients can poll for edits made by another session without pulling
      // every collection. Used by the "updated in another session" banner.
      const { data: rows, error } = await supabase
        .from('legacy_docs')
        .select('doc_id, ts')
        .eq('collection', collection);
      if (error) throw error;
      const map = {};
      (rows || []).forEach(r => { map[r.doc_id] = r.ts; });
      return res.status(200).json({ ts: map });
    }

    if (action === 'list') {
      const { data: rows, error } = await supabase
        .from('legacy_docs')
        .select('doc_id, data, ts, updated_at')
        .eq('collection', collection)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ docs: rows || [] });
    }

    if (!doc) return res.status(400).json({ error: 'Missing doc' });

    if (action === 'get') {
      const { data: row, error } = await supabase
        .from('legacy_docs')
        .select('data, ts, updated_at')
        .eq('collection', collection)
        .eq('doc_id', doc)
        .maybeSingle();
      if (error) throw error;
      if (!row) return res.status(200).json({ exists: false });
      return res.status(200).json({ exists: true, data: row.data, ts: row.ts });
    }

    if (action === 'set') {
      if (data === undefined) return res.status(400).json({ error: 'Missing data' });
      // SAFETY: archive the prior version into legacy_docs_history
      // BEFORE we overwrite it. If this fails the write is aborted.
      await archiveDoc(supabase, collection, doc, 'set', 'api/db');
      const blob = (data && typeof data === 'object' && 'data' in data) ? data.data : data;
      const ts = (data && typeof data === 'object' && 'ts' in data) ? data.ts : Date.now();
      const { error } = await supabase
        .from('legacy_docs')
        .upsert({ collection, doc_id: doc, data: blob, ts, updated_at: new Date().toISOString() });
      if (error) throw error;
      // Return the ts we wrote so the client can track its own writes and
      // distinguish them from edits made by another session.
      return res.status(200).json({ ok: true, ts });
    }

    if (action === 'delete') {
      // SAFETY: archive before delete. The row is gone after this
      // returns, but it's recoverable from legacy_docs_history.
      await archiveDoc(supabase, collection, doc, 'delete', 'api/db');
      const { error } = await supabase
        .from('legacy_docs')
        .delete()
        .eq('collection', collection)
        .eq('doc_id', doc);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    console.error('db endpoint error:', e);
    return res.status(500).json({ error: 'Supabase error', detail: e.message });
  }
};

module.exports = handler;
// Bump body size limit — trafficHistory JSON blob can exceed 1MB default once
// enough records accumulate. Vercel allows up to 4.5MB.
module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '4.5mb' },
    responseLimit: '8mb',
  },
};
