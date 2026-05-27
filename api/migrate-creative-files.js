// ═══════════════════════════════════════════════════════════════════
// /api/migrate-creative-files — move creative bytes off Firebase Storage.
// ═══════════════════════════════════════════════════════════════════
// One call processes EVERYTHING in the iscis blob. Errors are
// collected and the loop continues. Progress is saved every 10
// migrated files so a function timeout never throws away work.
//
// Concurrency: 4 files at a time (parallel downloads + uploads).
// maxDuration: 300s (5 minutes) — Pro tier ceiling.
//
// POST { password }
//   → { total, migrated, skipped, errors, remaining, timedOut }
//
// Idempotent: re-running just continues from where it left off.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');
const { archiveDoc } = require('./_archive');

const ADMIN_PASSWORD_ENV = 'ADMIN_PASSWORD';
const ISCIS_DOC = 'iscis';
const BUCKET = 'creative';
const CONCURRENCY = 2;             // streaming keeps memory flat, so 2 is safe
const SAVE_EVERY = 2;              // checkpoint iscis blob this often
// Sanity ceiling only. Streaming means we don't buffer the file, so memory is
// no longer the constraint — this just refuses absurdly large objects by their
// Content-Length before starting.
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
// Hard per-file deadline. A single slow/huge file must never run long enough
// to let Vercel kill the whole function (which returns a non-JSON 500 page and
// breaks the client loop). If a file exceeds this it's skipped as an error and
// the batch keeps going.
const PER_FILE_MS = 150_000;
// We stop starting new files at 120s; with the 150s per-file cap that's a 270s
// worst case — safely under the 300s maxDuration so the function always returns
// JSON before the platform kills it. (Big files take real time to move.)
const WALL_CLOCK_BUDGET_MS = 120_000;

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a); const B = Buffer.from(b);
  if (A.length !== B.length) { crypto.timingSafeEqual(A, A); return false; }
  return crypto.timingSafeEqual(A, B);
}

function isFirebaseUrl(u) {
  return typeof u === 'string' && u.indexOf('firebasestorage.googleapis.com') >= 0;
}

function extFromUrl(url, fileName) {
  if (fileName) {
    const m = String(fileName).match(/\.([a-z0-9]{2,5})(\?|$)/i);
    if (m) return m[1].toLowerCase();
  }
  try {
    const parsed = new URL(url);
    const m = parsed.pathname.match(/\/o\/(.+)$/);
    if (m) {
      const decoded = decodeURIComponent(m[1]);
      const em = decoded.match(/\.([a-z0-9]{2,5})$/i);
      if (em) return em[1].toLowerCase();
    }
  } catch (e) {}
  return 'bin';
}

function contentTypeFromExt(ext) {
  const map = {
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    pdf: 'application/pdf',
    psd: 'image/vnd.adobe.photoshop', ai: 'application/postscript', eps: 'application/postscript',
  };
  return map[ext] || 'application/octet-stream';
}

async function processOne(supabase, iscis, idx) {
  const isci = iscis[idx];
  const code = isci && isci.code;
  const fileUrl = isci && isci.fileUrl;
  if (!code) return { idx, result: 'skip', code: code || '?' };
  if (!isFirebaseUrl(fileUrl)) return { idx, result: 'skip', code };

  // Bound the whole download+upload to PER_FILE_MS. The AbortController stops a
  // slow download; the race rejects if download+upload together overrun, so a
  // single oversized file is skipped (reported as a timeout error) instead of
  // running long enough for Vercel to kill the function with a non-JSON 500.
  const ctrl = new AbortController();
  let timer;
  const deadline = new Promise((_, rej) => {
    timer = setTimeout(() => { try { ctrl.abort(); } catch (e) {} rej(new Error('per-file deadline')); }, PER_FILE_MS);
  });

  const work = (async () => {
    const resp = await fetch(fileUrl, { signal: ctrl.signal });
    if (!resp.ok) {
      return { idx, result: 'error', code, stage: 'download', detail: resp.status + ' ' + resp.statusText };
    }
    const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
    if (contentLength && contentLength > MAX_FILE_BYTES) {
      return { idx, result: 'error', code, stage: 'size', detail: contentLength + ' bytes too large' };
    }

    const ext = extFromUrl(fileUrl, isci.fileName);
    const path = code + '.' + ext;
    const contentType = resp.headers.get('content-type') || contentTypeFromExt(ext);

    // STREAM the bytes straight from Firebase into Supabase via a signed upload
    // URL. We never hold the whole file in memory (which OOM-crashed the
    // function on big videos) — the download stream is piped directly to the
    // upload request body.
    const { data: signed, error: suErr } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (suErr) {
      return { idx, result: 'error', code, stage: 'sign', detail: suErr.message };
    }
    const putHeaders = { 'content-type': contentType, 'x-upsert': 'true' };
    if (contentLength) putHeaders['content-length'] = String(contentLength);
    const putResp = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: putHeaders,
      body: resp.body,
      duplex: 'half',
      signal: ctrl.signal,
    });
    if (!putResp.ok) {
      const t = await putResp.text().catch(() => '');
      return { idx, result: 'error', code, stage: 'upload', detail: putResp.status + ' ' + t.slice(0, 140) };
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { idx, result: 'migrated', code, path, bytes: contentLength || 0, newUrl: pub.publicUrl };
  })();

  try {
    return await Promise.race([work, deadline]);
  } catch (e) {
    const stage = (e && (e.name === 'AbortError' || /deadline/.test(e.message || ''))) ? 'timeout' : 'exception';
    return { idx, result: 'error', code, stage, detail: e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function saveBlob(supabase, iscis) {
  await archiveDoc(supabase, 'appData', ISCIS_DOC, 'creative-migrate', 'migrate-creative-files');
  const { error } = await supabase
    .from('legacy_docs')
    .upsert({
      collection: 'appData',
      doc_id: ISCIS_DOC,
      data: JSON.stringify(iscis),
      ts: Date.now(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'collection,doc_id' });
  if (error) throw error;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const ADMIN = (process.env[ADMIN_PASSWORD_ENV] || '').trim();
  if (!ADMIN) return res.status(503).json({ error: 'ADMIN_PASSWORD not set' });
  const submitted = typeof password === 'string' ? password.trim() : '';
  if (!submitted || !timingSafeEqual(submitted, ADMIN)) {
    return res.status(401).json({ error: 'Wrong admin password' });
  }

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const startedAt = Date.now();

  try {
    const { data: row, error: rErr } = await supabase
      .from('legacy_docs')
      .select('data')
      .eq('collection', 'appData')
      .eq('doc_id', ISCIS_DOC)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!row) return res.status(404).json({ error: 'iscis doc not in legacy_docs — run Firestore pull first' });

    let iscis;
    try { iscis = typeof row.data === 'string' ? JSON.parse(row.data) : row.data; }
    catch (e) { return res.status(500).json({ error: 'iscis blob is not parseable JSON' }); }
    if (!Array.isArray(iscis)) return res.status(500).json({ error: 'iscis blob is not an array' });

    // retryFailed: clear the skip-flags once (client sends it on the first round
    // only) so previously-skipped files get another attempt — e.g. after the
    // size cap / memory were raised. Persist the clear so every round of this
    // session sees it.
    if (req.body && req.body.retryFailed) {
      let cleared = 0;
      for (const x of iscis) { if (x && x.cmFail) { delete x.cmFail; cleared++; } }
      if (cleared) { try { await saveBlob(supabase, iscis); } catch (e) {} }
    }

    const total = iscis.length;
    const queue = [];
    for (let i = 0; i < iscis.length; i++) {
      // Skip files already flagged as un-migratable (too big / 404 / dead) so
      // every round advances to fresh files instead of re-hitting the same
      // blocker forever.
      if (iscis[i] && iscis[i].cmFail) continue;
      if (isFirebaseUrl(iscis[i] && iscis[i].fileUrl)) queue.push(i);
    }
    const startingRemaining = queue.length;

    let migrated = 0;
    let skipped = 0;
    let unsaved = 0;
    const errors = [];
    const moved = [];
    let timedOut = false;

    // Pump CONCURRENCY workers off the shared queue.
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        if (Date.now() - startedAt > WALL_CLOCK_BUDGET_MS) { timedOut = true; return; }
        const my = cursor++;
        const idx = queue[my];
        const out = await processOne(supabase, iscis, idx);
        if (out.result === 'migrated') {
          iscis[idx] = { ...iscis[idx], fileUrl: out.newUrl };
          moved.push({ code: out.code, path: out.path, bytes: out.bytes });
          migrated++;
          unsaved++;
          if (unsaved >= SAVE_EVERY) {
            try { await saveBlob(supabase, iscis); unsaved = 0; }
            catch (e) { errors.push({ stage: 'checkpoint-save', detail: e.message }); }
          }
        } else if (out.result === 'error') {
          errors.push({ code: out.code, stage: out.stage, detail: out.detail });
          // Flag it so it's excluded from future rounds — guarantees the queue
          // shrinks every round and the loop can't get stuck on one bad file.
          iscis[idx] = { ...iscis[idx], cmFail: out.stage || 'error' };
          unsaved++;
          if (unsaved >= SAVE_EVERY) {
            try { await saveBlob(supabase, iscis); unsaved = 0; }
            catch (e) { errors.push({ stage: 'checkpoint-save', detail: e.message }); }
          }
        } else {
          skipped++;
        }
      }
    }

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) workers.push(worker());
    await Promise.all(workers);

    // Final save if anything still unwritten
    if (unsaved > 0) {
      try { await saveBlob(supabase, iscis); unsaved = 0; }
      catch (e) { errors.push({ stage: 'final-save', detail: e.message }); }
    }

    const remainingAfter = startingRemaining - migrated;
    // HONEST accounting computed from the full blob (not the queue, which
    // excludes flagged files). stillOnFirebase = every record whose fileUrl is
    // still a Firebase URL, INCLUDING the oversized ones we flagged and skipped.
    // skippedTooBig = those flagged un-migratable but still physically on
    // Firebase — they need a different move method, so Firebase is NOT safe to
    // delete while this is > 0.
    const stillOnFirebase = iscis.filter(x => isFirebaseUrl(x && x.fileUrl)).length;
    const skippedTooBig = iscis.filter(x => x && x.cmFail && isFirebaseUrl(x.fileUrl)).length;
    const onSupabase = iscis.filter(x => x && x.fileUrl && !isFirebaseUrl(x.fileUrl)).length;
    return res.status(200).json({
      ok: true,
      total,
      attemptable: startingRemaining,
      migrated,
      skipped,
      errors,
      moved: moved.slice(0, 50),
      // queueRemaining = unflagged files left to try (drives the client loop);
      // stillOnFirebase = the real number physically left on Firebase.
      queueRemaining: Math.max(0, remainingAfter),
      remaining: Math.max(0, remainingAfter),
      stillOnFirebase,
      skippedTooBig,
      onSupabase,
      timedOut,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (e) {
    console.error('migrate-creative-files error:', e);
    return res.status(500).json({ error: 'Migration failed', detail: e.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: '8mb',
  },
  // 60s works on every plan tier (avoids deploys being rejected on non-Pro).
  // The creative migration is already complete, so this endpoint is dormant.
  maxDuration: 60,
};
