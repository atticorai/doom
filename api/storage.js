// ═══════════════════════════════════════════════════════════════════
// /api/storage — Supabase Storage adapter for client-side file ops.
// ═══════════════════════════════════════════════════════════════════
// The service-role key never leaves the server. The browser either:
//   • POSTs a small base64 payload (<=4MB) and the server uploads it
//     to the configured bucket, OR
//   • Asks for a signed upload URL and PUTs the file directly to
//     Supabase Storage from the browser (no Vercel payload limit,
//     and real XHR progress events).
//
// Auth: protected by the same dd_session cookie at the middleware
// layer that guards /api/db.
//
// Request body shapes (POST, JSON):
//   { action: 'upload', bucket: 'creative', path: 'ABC.mp4',
//     contentType: 'video/mp4', dataB64: '...' }  -> { url, path }
//
//   { action: 'createUploadUrl', bucket: 'creative', path: 'ABC.mp4',
//     contentType: 'video/mp4' }                  -> { uploadUrl, token, publicUrl, path, bucket }
//
//   { action: 'exists', bucket: 'creative', path: 'ABC.mp4' }
//                                                 -> { exists: bool, url? }
//
//   { action: 'list', bucket: 'legacy-wk', prefix: 'creative/orphans/2022/' }
//                                                 -> { files: [...] }
//
//   { action: 'delete', bucket: 'creative', path: '...' }
//                                                 -> { ok: true }
//
//   { action: 'signedUrl', bucket: 'creative', path: '...', expiresIn: 3600 }
//                                                 -> { url }
//
//   { action: 'move', bucket: 'creative',
//     fromPath: 'orphans/x.mp4', toPath: 'ABC.mp4' }  -> { url, path }
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');

const ALLOWED_BUCKETS = new Set(['legacy-wk', 'creative', 'ooh']);

// 4 MB ceiling for base64-via-JSON uploads (Vercel function payload limit
// is ~4.5MB). Anything larger MUST use createUploadUrl + direct PUT.
const MAX_INLINE_BYTES = 4 * 1024 * 1024;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured', detail: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.' });
  }

  const { action, bucket, path, prefix, contentType, dataB64, expiresIn, fromPath, toPath } = req.body || {};

  if (!action || !['upload', 'createUploadUrl', 'exists', 'list', 'delete', 'signedUrl', 'move'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
    return res.status(400).json({ error: 'Invalid or missing bucket' });
  }

  const safePath = (p) => typeof p === 'string' && !p.includes('..') && !p.startsWith('/');

  try {
    // ── UPLOAD (small, inline) ────────────────────────────────────
    if (action === 'upload') {
      if (!safePath(path)) return res.status(400).json({ error: 'Invalid or missing path' });
      if (!dataB64) return res.status(400).json({ error: 'Missing dataB64' });

      const buf = Buffer.from(dataB64, 'base64');
      if (buf.length > MAX_INLINE_BYTES) {
        return res.status(413).json({
          error: 'File too large for inline upload',
          detail: `Use action:'createUploadUrl' for files >${MAX_INLINE_BYTES} bytes`,
        });
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

    // ── CREATE SIGNED UPLOAD URL (large files, direct PUT) ────────
    if (action === 'createUploadUrl') {
      if (!safePath(path)) return res.status(400).json({ error: 'Invalid or missing path' });

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path);
      if (error) throw error;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      return res.status(200).json({
        uploadUrl: data.signedUrl,
        token: data.token,
        publicUrl: pub.publicUrl,
        path,
        bucket,
      });
    }

    // ── EXISTS (verify a file is in the bucket, used for getDownloadURL) ──
    if (action === 'exists') {
      if (!safePath(path)) return res.status(400).json({ error: 'Invalid or missing path' });

      // Supabase list takes a folder prefix and optional search term. We
      // split the path so the search is scoped to the right folder.
      const lastSlash = path.lastIndexOf('/');
      const folder = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
      const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;

      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list(folder, { limit: 1, search: fileName });
      if (error) throw error;

      const exists = (files || []).some(f => f.name === fileName);
      if (!exists) return res.status(200).json({ exists: false });

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      return res.status(200).json({ exists: true, url: pub.publicUrl });
    }

    // ── LIST ──────────────────────────────────────────────────────
    if (action === 'list') {
      const { data: files, error: lErr } = await supabase.storage
        .from(bucket)
        .list(prefix || '', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
      if (lErr) throw lErr;
      const withUrls = (files || []).map(f => {
        const fullPath = prefix ? (prefix.endsWith('/') ? prefix + f.name : prefix + '/' + f.name) : f.name;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath);
        return { ...f, path: fullPath, url: pub.publicUrl };
      });
      return res.status(200).json({ files: withUrls });
    }

    // ── DELETE ────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!safePath(path)) return res.status(400).json({ error: 'Invalid or missing path' });
      const { error: dErr } = await supabase.storage.from(bucket).remove([path]);
      if (dErr) throw dErr;
      return res.status(200).json({ ok: true });
    }

    // ── SIGNED URL (for private buckets) ──────────────────────────
    if (action === 'signedUrl') {
      if (!safePath(path)) return res.status(400).json({ error: 'Invalid or missing path' });
      const exp = Math.min(Math.max(parseInt(expiresIn, 10) || 3600, 60), 60 * 60 * 24 * 7);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, exp);
      if (error) throw error;
      return res.status(200).json({ url: data.signedUrl });
    }

    // ── MOVE (used when linking an orphan to an ISCI code) ────────
    if (action === 'move') {
      if (!safePath(fromPath) || !safePath(toPath)) {
        return res.status(400).json({ error: 'Invalid fromPath/toPath' });
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

// Bump body size to accommodate inline uploads up to ~4MB (base64 inflates
// binary by ~33%, so 4.5MB JSON envelope holds ~3.3MB of file payload).
// Anything larger uses createUploadUrl + direct PUT.
module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '6mb' },
  },
};
