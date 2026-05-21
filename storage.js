// ═══════════════════════════════════════════════════════════════════
// /api/storage — Supabase Storage adapter for client-side uploads.
// ═══════════════════════════════════════════════════════════════════
// The service-role key never leaves the server. The browser POSTs the
// file (base64-encoded for binary safety in JSON), this endpoint puts
// it into the configured bucket and returns the public URL.
//
// Auth: protected by the same dd_session cookie at the middleware
// layer that guards /api/db.
//
// Request body shapes (POST, JSON):
//   { action: 'upload', bucket: 'legacy-wk',
//     path: 'instructions/2022/aug_birmingham.pdf',
//     contentType: 'application/pdf',
//     dataB64: '...' }                              -> { url, path }
//
//   { action: 'list', bucket: 'legacy-wk', prefix: 'creative/orphans/2022/' }
//                                                   -> { files: [...] }
//
//   { action: 'delete', bucket: 'legacy-wk', path: 'creative/orphans/...' }
//                                                   -> { ok: true }
//
//   { action: 'signedUrl', bucket: 'legacy-wk', path: '...', expiresIn: 3600 }
//                                                   -> { url }
//
//   { action: 'move', bucket: 'legacy-wk',
//     fromPath: 'creative/orphans/...',
//     toPath:   'creative/BRMWK2230001T.mp4' }      -> { url, path }
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');

// Whitelist of buckets the app is allowed to touch via this endpoint.
// Buckets must be created in the Supabase dashboard first (or via the
// migration in supabase/schema.sql). Public read is configured per-bucket
// in Supabase — the app stores public URLs in records.
const ALLOWED_BUCKETS = new Set(['legacy-wk', 'creative', 'ooh']);

// 50 MB per file. Bumps via Vercel function payload limit — large video
// files should go through a direct upload using a signed upload URL
// (a future enhancement). 50 MB covers PDFs, Excel, Word, audio, and
// most :15/:30 video creative.
const MAX_BYTES = 50 * 1024 * 1024;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured', detail: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.' });
  }

  const { action, bucket, path, prefix, contentType, dataB64, expiresIn, fromPath, toPath } = req.body || {};

  if (!action || !['upload', 'list', 'delete', 'signedUrl', 'move'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
    return res.status(400).json({ error: 'Invalid or missing bucket' });
  }

  try {
    // ── UPLOAD ────────────────────────────────────────────────────
    if (action === 'upload') {
      if (!path || typeof path !== 'string') return res.status(400).json({ error: 'Missing path' });
      if (!dataB64 || typeof dataB64 !== 'string') return res.status(400).json({ error: 'Missing dataB64' });

      // Reject path traversal and absolute paths defensively.
      if (path.includes('..') || path.startsWith('/')) {
        return res.status(400).json({ error: 'Invalid path' });
      }

      const buf = Buffer.from(dataB64, 'base64');
      if (buf.length > MAX_BYTES) {
        return res.status(413).json({ error: 'File too large', detail: `Max ${MAX_BYTES} bytes, got ${buf.length}` });
      }

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, buf, {
          contentType: contentType || 'application/octet-stream',
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      return res.status(200).json({ ok: true, url: pub.publicUrl, path });
    }

    // ── LIST ──────────────────────────────────────────────────────
    if (action === 'list') {
      const { data: files, error: lErr } = await supabase.storage
        .from(bucket)
        .list(prefix || '', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
      if (lErr) throw lErr;
      // Add public URLs for convenience.
      const withUrls = (files || []).map(f => {
        const fullPath = prefix ? (prefix.endsWith('/') ? prefix + f.name : prefix + '/' + f.name) : f.name;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath);
        return { ...f, path: fullPath, url: pub.publicUrl };
      });
      return res.status(200).json({ files: withUrls });
    }

    // ── DELETE ────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!path) return res.status(400).json({ error: 'Missing path' });
      const { error: dErr } = await supabase.storage.from(bucket).remove([path]);
      if (dErr) throw dErr;
      return res.status(200).json({ ok: true });
    }

    // ── SIGNED URL (for private buckets) ──────────────────────────
    if (action === 'signedUrl') {
      if (!path) return res.status(400).json({ error: 'Missing path' });
      const exp = Math.min(Math.max(parseInt(expiresIn, 10) || 3600, 60), 60 * 60 * 24 * 7);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, exp);
      if (error) throw error;
      return res.status(200).json({ url: data.signedUrl });
    }

    // ── MOVE (used when linking an orphan to an ISCI code) ────────
    if (action === 'move') {
      if (!fromPath || !toPath) return res.status(400).json({ error: 'Missing fromPath/toPath' });
      if (fromPath.includes('..') || toPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' });
      }
      const { error: mErr } = await supabase.storage.from(bucket).move(fromPath, toPath);
      if (mErr) throw mErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(toPath);
      return res.status(200).json({ ok: true, url: pub.publicUrl, path: toPath });
    }
  } catch (e) {
    console.error('storage endpoint error:', e);
    return res.status(500).json({ error: 'Supabase storage error', detail: e.message });
  }
};
