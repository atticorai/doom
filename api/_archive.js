// ═══════════════════════════════════════════════════════════════════
// _archive — universal "snapshot before overwrite" helper.
// ═══════════════════════════════════════════════════════════════════
// Every code path that modifies legacy_docs MUST call archiveDoc()
// BEFORE writing the new value. If archiveDoc fails, the modifying
// op must abort. No exceptions. This is the only thing standing
// between "oops" and "data gone forever."
//
// Usage:
//   await archiveDoc(supabase, 'appData', 'iscis', 'set', 'firestore-pull');
//   // then do the upsert
//
// archiveDoc reads the CURRENT row from legacy_docs (if any) and
// inserts a copy into legacy_docs_history with the op label. If the
// row doesn't exist yet (first-write), it's a no-op — nothing to
// archive.
//
// archiveAll() snapshots EVERY row in legacy_docs in one shot — used
// before bulk operations like the Firestore pull.
// ═══════════════════════════════════════════════════════════════════

async function archiveDoc(supabase, collection, doc_id, op, by) {
  if (!supabase) throw new Error('archiveDoc: no Supabase client');
  if (!collection || !doc_id) throw new Error('archiveDoc: missing collection/doc_id');

  const { data: current, error: readErr } = await supabase
    .from('legacy_docs')
    .select('collection, doc_id, data, ts')
    .eq('collection', collection)
    .eq('doc_id', doc_id)
    .maybeSingle();
  if (readErr) throw new Error('archiveDoc read failed: ' + readErr.message);
  if (!current) return { archived: false, reason: 'no prior version' };

  const { error: insErr } = await supabase
    .from('legacy_docs_history')
    .insert({
      collection: current.collection,
      doc_id: current.doc_id,
      data: current.data,
      ts: current.ts,
      archived_op: op || 'set',
      archived_by: by || null,
    });
  if (insErr) throw new Error('archiveDoc insert failed: ' + insErr.message);
  return { archived: true };
}

async function archiveAll(supabase, op, by) {
  if (!supabase) throw new Error('archiveAll: no Supabase client');

  const { data: rows, error: readErr } = await supabase
    .from('legacy_docs')
    .select('collection, doc_id, data, ts');
  if (readErr) throw new Error('archiveAll read failed: ' + readErr.message);
  if (!rows || rows.length === 0) return { archived: 0 };

  const payload = rows.map(r => ({
    collection: r.collection,
    doc_id: r.doc_id,
    data: r.data,
    ts: r.ts,
    archived_op: op || 'bulk',
    archived_by: by || null,
  }));

  // Insert in chunks — history rows can be large (the iscis blob alone
  // is 290 KB).
  const CHUNK = 50;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const { error: insErr } = await supabase
      .from('legacy_docs_history')
      .insert(payload.slice(i, i + CHUNK));
    if (insErr) throw new Error('archiveAll insert failed: ' + insErr.message);
  }
  return { archived: payload.length };
}

module.exports = { archiveDoc, archiveAll };
