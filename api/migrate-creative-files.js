// ═══════════════════════════════════════════════════════════════════
// /api/migrate-creative-files — move creative bytes off Firebase Storage.
// ═══════════════════════════════════════════════════════════════════
// Reads the iscis blob in legacy_docs, finds every record whose
// fileUrl still points at firebasestorage.googleapis.com, downloads
// the file, re-uploads to Supabase Storage (bucket = 'creative'),
// and rewrites fileUrl to the new public URL.
//
// Batched because each file is potentially tens of MB and Vercel
// functions have a hard wall-clock limit. The client calls this in a
// loop, processing BATCH_SIZE files per call, until { remaining: 0 }.
//
// POST { password, batchSize? }
//   -> { processed, migrated, skipped, errors, remaining, total }
//
// Idempotent: re-running just skips already-migrated records.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');

const ADMIN_PASSWORD_ENV = 'ADMIN_PASSWORD';
const ISCIS_DOC = 'iscis';
const BUCKET = 'creative';
const DEFAULT_BATCH = 4;
const MAX_BATCH = 10;
const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB cap — same as bucket limit

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const A = Buffer.from(a); const B = Buffer.from(b);
  if (A.length !== B.length) { crypto.timingSafeEqual(A, A); return false; }
  return crypto.timingSafeEqual(A, B);
}

function isFirebaseUrl(u) {
  return typeof u === 'string' && u.indexOf('firebasestorage.googleapis.com') >= 0;
}

function isSupabaseUrl(u) {
  return typeof u === 'string' && /supabase\.(co|in)\/storage\/v1\//.test(u);
}

// Best-effort: derive a sane extension from the Firebase URL or fileName.
// Falls back to 'bin' if nothing is reliable.
function extFromUrl(url, fileName) {
  if (fileName) {
    const m = String(fileName).match(/\.([a-z0-9]{2,5})(\?|$)/i);
    if (m) return m[1].toLowerCase();
  }
  try {
    const parsed = new URL(url);
    // Firebase URL pattern: /v0/b/<bucket>/o/<encoded-path>?alt=media&token=...
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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, batchSize } = req.body || {};
  const ADMIN = (process.env[ADMIN_PASSWORD_ENV] || '').trim();
  if (!ADMIN) return res.status(503).json({ error: 'ADMIN_PASSWORD not set' });
  const submitted = typeof password === 'string' ? password.trim() : '';
  if (!submitted || !timingSafeEqual(submitted, ADMIN)) {
    return res.status(401).json({ error: 'Wrong admin password' });
  }

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const N = Math.min(Math.max(parseInt(batchSize, 10) || DEFAULT_BATCH, 1), MAX_BATCH);

  try {
    // Pull the iscis blob from legacy_docs
    const { data: row, error: rErr } = await supabase
      .from('legacy_docs')
      .select('data, ts')
      .eq('collection', 'appData')
      .eq('doc_id', ISCIS_DOC)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!row) return res.status(404).json({ error: 'iscis doc not in legacy_docs — run Firestore pull first' });

    let iscis;
    try { iscis = typeof row.data === 'string' ? JSON.parse(row.data) : row.data; }
    catch (e) { return res.status(500).json({ error: 'iscis blob is not parseable JSON' }); }
    if (!Array.isArray(iscis)) return res.status(500).json({ error: 'iscis blob is not an array' });

    const total = iscis.length;
    const remainingIndices = [];
    for (let i = 0; i < iscis.length; i++) {
      if (isFirebaseUrl(iscis[i] && iscis[i].fileUrl)) remainingIndices.push(i);
    }

    const batch = remainingIndices.slice(0, N);
    let migrated = 0;
    let skipped = 0;
    const errors = [];
    const moved = [];

    for (const idx of batch) {
      const isci = iscis[idx];
      const code = isci.code;
      const fileUrl = isci.fileUrl;
      if (!code) { skipped++; continue; }
      if (!isFirebaseUrl(fileUrl)) { skipped++; continue; }

      try {
        // Download the file. Firebase Storage public URLs include the
        // token inline — no auth header needed.
        const resp = await fetch(fileUrl);
        if (!resp.ok) {
          errors.push({ code, stage: 'download', status: resp.status, detail: resp.statusText });
          continue;
        }
        const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
        if (contentLength && contentLength > MAX_FILE_BYTES) {
          errors.push({ code, stage: 'size', detail: `${contentLength} bytes > ${MAX_FILE_BYTES}` });
          continue;
        }
        const arr = await resp.arrayBuffer();
        const buf = Buffer.from(arr);
        if (buf.length > MAX_FILE_BYTES) {
          errors.push({ code, stage: 'size', detail: `${buf.length} bytes > ${MAX_FILE_BYTES}` });
          continue;
        }

        const ext = extFromUrl(fileUrl, isci.fileName);
        const path = `${code}.${ext}`;
        const contentType = resp.headers.get('content-type') || contentTypeFromExt(ext);

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, buf, { contentType, upsert: true });
        if (upErr) {
          errors.push({ code, stage: 'upload', detail: upErr.message });
          continue;
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        iscis[idx] = { ...isci, fileUrl: pub.publicUrl };
        moved.push({ code, path, bytes: buf.length });
        migrated++;
      } catch (e) {
        errors.push({ code, stage: 'exception', detail: e.message });
      }
    }

    // Write updated iscis blob back ONLY if anything actually changed
    if (migrated > 0) {
      const { error: wErr } = await supabase
        .from('legacy_docs')
        .upsert({
          collection: 'appData',
          doc_id: ISCIS_DOC,
          data: JSON.stringify(iscis),
          ts: Date.now(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'collection,doc_id' });
      if (wErr) throw wErr;
    }

    const remainingAfter = Math.max(0, remainingIndices.length - batch.length);
    return res.status(200).json({
      ok: true,
      total,
      considered: remainingIndices.length + (total - remainingIndices.length),
      processed: batch.length,
      migrated,
      skipped,
      remaining: remainingAfter,
      errors,
      moved,
    });
  } catch (e) {
    console.error('migrate-creative-files error:', e);
    return res.status(500).json({ error: 'Migration failed', detail: e.message });
  }
};

// Large response payloads (lists of moved files) — bump the limit.
module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: '8mb',
  },
};
