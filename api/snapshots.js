// ═══════════════════════════════════════════════════════════════════
// /api/snapshots — list / take / restore legacy_docs snapshots.
// ═══════════════════════════════════════════════════════════════════
// Backed by the legacy_docs_history table. Every set/delete on
// legacy_docs writes the prior version here automatically via the
// _archive helper. This endpoint exposes:
//
//   POST { password, action: 'list' }
//      → { snapshots: [{group_label, archived_at, archived_op, doc_count}, ...] }
//
//   POST { password, action: 'take' }
//      → snapshots EVERY current legacy_docs row right now (manual
//        backup button). Returns { archived: N }.
//
//   POST { password, action: 'restore', archived_at: ISOstring }
//      → restores legacy_docs to the state it was in at that
//        archived_at timestamp. For each (collection, doc_id) that
//        has a history row at-or-before archived_at, write the latest
//        of those back into legacy_docs. The current state is
//        archived first (so restore is itself reversible).
//
// Admin password required for all actions.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');
const { archiveAll } = require('./_archive');

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a); const B = Buffer.from(b);
  if (A.length !== B.length) { crypto.timingSafeEqual(A, A); return false; }
  return crypto.timingSafeEqual(A, B);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, action, archived_at } = req.body || {};
  const ADMIN = (process.env.ADMIN_PASSWORD || '').trim();
  if (!ADMIN) return res.status(503).json({ error: 'ADMIN_PASSWORD not set' });
  const submitted = typeof password === 'string' ? password.trim() : '';
  if (!submitted || !timingSafeEqual(submitted, ADMIN)) {
    return res.status(401).json({ error: 'Wrong admin password' });
  }

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  if (!action || !['list', 'take', 'restore'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    // ── LIST: snapshots grouped by archive operation + timestamp ──
    if (action === 'list') {
      const { data: rows, error } = await supabase
        .from('legacy_docs_history')
        .select('archived_at, archived_op, archived_by, collection, doc_id')
        .order('archived_at', { ascending: false })
        .limit(2000);
      if (error) throw error;

      // Group adjacent rows that share archived_op + archived_at down
      // to the second — those came from one bulk operation.
      const groups = new Map();
      for (const r of rows || []) {
        const sec = r.archived_at.replace(/\.\d+Z?$/, '');
        const key = sec + '|' + r.archived_op + '|' + (r.archived_by || '');
        if (!groups.has(key)) {
          groups.set(key, {
            archived_at: r.archived_at,
            archived_op: r.archived_op,
            archived_by: r.archived_by,
            doc_count: 0,
            samples: [],
          });
        }
        const g = groups.get(key);
        g.doc_count++;
        if (g.samples.length < 3) g.samples.push(r.collection + '/' + r.doc_id);
      }
      const snapshots = Array.from(groups.values()).sort((a, b) => b.archived_at.localeCompare(a.archived_at));
      return res.status(200).json({ snapshots, raw_rows: rows.length });
    }

    // ── TAKE: manual backup of EVERYTHING right now ───────────────
    if (action === 'take') {
      const result = await archiveAll(supabase, 'manual', 'snapshots-button');
      return res.status(200).json({ ok: true, ...result });
    }

    // ── RESTORE: rewind legacy_docs to a point in time ────────────
    if (action === 'restore') {
      if (!archived_at) return res.status(400).json({ error: 'Missing archived_at' });

      // 1. Snapshot CURRENT state so the restore itself is reversible.
      await archiveAll(supabase, 'pre-restore', 'snapshots-button');

      // 2. For each (collection, doc_id) that has history, find the
      //    most recent history row at-or-before archived_at and
      //    write it into legacy_docs.
      const { data: hist, error: hErr } = await supabase
        .from('legacy_docs_history')
        .select('collection, doc_id, data, ts, archived_at')
        .lte('archived_at', archived_at)
        .order('archived_at', { ascending: false });
      if (hErr) throw hErr;

      const seen = new Set();
      const toRestore = [];
      for (const r of hist || []) {
        const k = r.collection + '|' + r.doc_id;
        if (seen.has(k)) continue;
        seen.add(k);
        toRestore.push({
          collection: r.collection,
          doc_id: r.doc_id,
          data: r.data,
          ts: r.ts,
          updated_at: new Date().toISOString(),
        });
      }

      if (toRestore.length === 0) {
        return res.status(200).json({ ok: true, restored: 0, note: 'No history at or before that timestamp' });
      }

      const CHUNK = 50;
      let written = 0;
      for (let i = 0; i < toRestore.length; i += CHUNK) {
        const { error } = await supabase
          .from('legacy_docs')
          .upsert(toRestore.slice(i, i + CHUNK), { onConflict: 'collection,doc_id' });
        if (error) throw error;
        written += toRestore.slice(i, i + CHUNK).length;
      }
      return res.status(200).json({ ok: true, restored: written });
    }
  } catch (e) {
    console.error('snapshots error:', e);
    return res.status(500).json({ error: 'Snapshot op failed', detail: e.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: '8mb',
  },
};
