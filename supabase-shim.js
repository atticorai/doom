// ═══════════════════════════════════════════════════════════════════
// supabase-shim.js — pretends to be Firestore, talks to /api/db
// ═══════════════════════════════════════════════════════════════════
// The app uses `db.collection("appData").doc("iscis").get()/.set()`
// in dozens of places. Rewriting all of them on day-1 is risky. This
// shim wears the same API hat — every method the app uses returns
// the same thing the Firestore client did, but the data comes from
// the Supabase legacy_docs table via /api/db.
//
// Activated by index.html when /api/config returns useSupabase=true.
// If anything goes wrong, flip USE_SUPABASE back to 0 in Vercel and
// the app falls back to Firestore (which is still alive).
// ═══════════════════════════════════════════════════════════════════

(function () {
  async function call(action, collection, doc, payload) {
    const body = { action, collection };
    if (doc) body.doc = doc;
    if (payload !== undefined) body.data = payload;
    const r = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('db ' + action + ' failed (' + r.status + '): ' + t.slice(0, 200));
    }
    return r.json();
  }

  function docRef(collection, docId) {
    return {
      async get() {
        const r = await call('get', collection, docId);
        // Mimic Firestore's doc snapshot shape so app code stays unchanged.
        return {
          exists: !!r.exists,
          id: docId,
          data: () => r.exists ? { data: r.data, ts: r.ts } : undefined,
        };
      },
      async set(payload) {
        return call('set', collection, docId, payload);
      },
      async update(payload) {
        // legacy_docs is a single blob per doc, so update == set.
        return call('set', collection, docId, payload);
      },
      async delete() {
        return call('delete', collection, docId);
      },
    };
  }

  function collectionRef(collection) {
    return {
      doc(docId) { return docRef(collection, docId); },
      async get() {
        const r = await call('list', collection);
        const docs = (r.docs || []).map(row => ({
          exists: true,
          id: row.doc_id,
          data: () => ({ data: row.data, ts: row.ts }),
        }));
        return {
          empty: docs.length === 0,
          size: docs.length,
          docs,
          forEach(cb) { docs.forEach(cb); },
        };
      },
    };
  }

  window.__supabaseDb = {
    collection(name) { return collectionRef(name); },
  };
})();
