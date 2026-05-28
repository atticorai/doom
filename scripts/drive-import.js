#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
// drive-import.js — walk a Google Drive folder tree, classify every
//                   file, copy bytes into Supabase Storage, write one
//                   row per file into the legacy_assets table.
// ════════════════════════════════════════════════════════════════════
// Designed to run on Google Cloud Shell (shell.cloud.google.com) so
// it inherits your existing Google auth and lives on Google's network
// (fast Drive reads). Resumable via a local state.json — re-running
// picks up where it left off.
//
// USAGE (in Cloud Shell):
//   git clone <this repo>
//   cd doom
//   npm install --no-save googleapis @supabase/supabase-js
//   export SUPABASE_URL=https://<project>.supabase.co
//   export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//   node scripts/drive-import.js <DRIVE_FOLDER_ID>
//
// FLAGS:
//   --dry-run         walk + classify only, no uploads / DB writes
//   --types=TV,Radio  only process these classifications
//   --max=100         stop after N files (smoke test)
//   --max-size=500    skip files over N MB (avoids OOM on small VMs)
//   --reset           ignore state.json and start fresh
//   --state=path.json use a non-default state file
// ════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// ── CLI args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const folderId = args.find(a => !a.startsWith('--'));
if (!folderId) {
  console.error('Usage: node scripts/drive-import.js <DRIVE_FOLDER_ID> [--dry-run] [--types=TV,Radio] [--max=N] [--max-size=MB] [--reset] [--state=path.json]');
  process.exit(1);
}
const flag = name => args.some(a => a === '--' + name);
const flagVal = name => {
  const a = args.find(x => x.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : null;
};
const DRY_RUN = flag('dry-run');
const ONLY_TYPES = flagVal('types') ? flagVal('types').split(',').map(s => s.trim()) : null;
const MAX_FILES = flagVal('max') ? parseInt(flagVal('max'), 10) : Infinity;
const MAX_SIZE_MB = flagVal('max-size') ? parseInt(flagVal('max-size'), 10) : Infinity;
const STATE_PATH = flagVal('state') || path.join(process.cwd(), 'drive-import-state.json');
const RESET = flag('reset');

// ── Env / clients ────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
const BUCKET = 'legacy-vault';

// ── Drive auth ──────────────────────────────────────────────────────
// Google blocked the gcloud default OAuth client from using
// drive.readonly. We bring our own: the user creates an OAuth Client
// ID (Desktop type) in their personal Cloud project, downloads the
// JSON, and points at it via OAUTH_CLIENT_JSON. First run does an
// interactive consent (prints a URL, you paste back the code) and
// caches a refresh token in OAUTH_TOKEN_PATH so re-runs are silent.
//
// Service account auth also still works if you can get a key
// (GOOGLE_APPLICATION_CREDENTIALS pointing to the JSON) — google-auth
// picks that up automatically.
const OAUTH_CLIENT_JSON = process.env.OAUTH_CLIENT_JSON || null;
const OAUTH_TOKEN_PATH = process.env.OAUTH_TOKEN_PATH || path.join(process.cwd(), 'drive-import-token.json');
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

async function makeDriveAuth() {
  // Path 1: OAuth Desktop client (recommended — bypasses the
  // default-client drive scope block).
  if (OAUTH_CLIENT_JSON) {
    if (!fs.existsSync(OAUTH_CLIENT_JSON)) {
      console.error('OAUTH_CLIENT_JSON path does not exist:', OAUTH_CLIENT_JSON);
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(OAUTH_CLIENT_JSON, 'utf8'));
    const block = raw.installed || raw.web;
    if (!block) {
      console.error('OAUTH_CLIENT_JSON is missing an "installed" or "web" block — wrong client type? Need Desktop OAuth client.');
      process.exit(1);
    }
    const client = new google.auth.OAuth2(block.client_id, block.client_secret, 'urn:ietf:wg:oauth:2.0:oob');

    // Try cached refresh token first.
    if (fs.existsSync(OAUTH_TOKEN_PATH)) {
      try {
        const tok = JSON.parse(fs.readFileSync(OAUTH_TOKEN_PATH, 'utf8'));
        client.setCredentials(tok);
        // Force a refresh so we know it still works.
        const fresh = await client.getAccessToken();
        if (fresh && fresh.token) {
          console.log('▸ using cached Drive credentials');
          return client;
        }
      } catch (e) {
        console.warn('Cached token invalid, re-authorizing:', e.message);
      }
    }

    // Interactive consent.
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: DRIVE_SCOPES,
    });
    console.log('\n────────────── DRIVE AUTHORIZATION REQUIRED ──────────────');
    console.log('Open this URL on a machine where you can sign in to Google:');
    console.log('\n' + authUrl + '\n');
    console.log('Sign in with the Google account that has access to your Shared Drive,');
    console.log('approve the consent screen, then copy the code Google gives you.');
    process.stdout.write('Paste the code here: ');
    const code = await new Promise(resolve => {
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', d => resolve(String(d).trim()));
    });
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    fs.writeFileSync(OAUTH_TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    console.log('▸ saved refresh token to ' + OAUTH_TOKEN_PATH);
    return client;
  }

  // Path 2: Application Default Credentials (gcloud / service account).
  // Useful if the user has a service account JSON via
  // GOOGLE_APPLICATION_CREDENTIALS, or if they're running somewhere
  // with workload identity. The default gcloud OAuth client is BLOCKED
  // for drive.readonly so this path mostly works only for service
  // accounts now.
  const gauth = new google.auth.GoogleAuth({ scopes: DRIVE_SCOPES });
  return gauth.getClient();
}

let drive; // populated in main()

// ── State (resumable) ────────────────────────────────────────────────
let state = { processed: {}, errors: [], startedAt: new Date().toISOString() };
if (!RESET && fs.existsSync(STATE_PATH)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    console.log(`▸ resuming from state file (${Object.keys(state.processed).length} files already done)`);
  } catch (e) {
    console.error('Could not parse state file:', e.message);
  }
}
function saveState() {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// ── Classifier ───────────────────────────────────────────────────────
// One file, one type. Rules below are precedence-ordered: first match
// wins. Tunable — edit here, re-run, idempotent.
const MARKETS_WK = ['Birmingham','Huntsville','Knoxville','Chattanooga','Montgomery','Dothan','Gadsden','Mobile'];
const MARKETS_PL = ['Chicago','Cincinnati','Denver','Minneapolis'];
const ALL_MARKETS = [...MARKETS_WK, ...MARKETS_PL];

// Web-banner standard dimensions (within a few px).
const BANNER_DIMS = [
  [300, 250], [728, 90], [160, 600], [320, 50], [320, 100],
  [336, 280], [468, 60], [970, 90], [970, 250], [300, 600],
  [250, 250], [200, 200], [240, 400], [180, 150],
];

function classifyV(meta) {
  const ext = (meta.ext || '').toLowerCase();
  const name = (meta.filename || '').toLowerCase();
  const fullPath = (meta.path || '').toLowerCase();
  const mime = (meta.mimeType || '').toLowerCase();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const dur = meta.duration_sec || 0;
  const notes = [];

  // Brand from folder path
  let brand = null;
  if (/\/wk\/|wettermark|\bwk[-_\s]/i.test(meta.path || '')) brand = 'WK';
  else if (/\/pl\/|postman|postman.law/i.test(meta.path || '')) brand = 'PL';

  // Market from folder path
  let market = null;
  for (const m of ALL_MARKETS) {
    if ((meta.path || '').toLowerCase().includes(m.toLowerCase())) { market = m; break; }
  }

  // Junk / clearly skippable
  if (/\.ds_store$|^thumbs\.db$/.test(name)) return { type: 'Other', brand, market, note: 'system file' };
  if (ext === 'lnk' || ext === 'url') return { type: 'Other', brand, market, note: 'shortcut' };

  // Documents
  if (['doc','docx','txt','rtf','xlsx','xls','csv','key','ppt','pptx'].includes(ext)) return { type: 'Document', brand, market, note: 'office doc' };

  // PDFs — could be print, OOH layout, contract. Treat as Print/Document.
  if (ext === 'pdf') {
    if (/billboard|poster|ooh|outdoor|spectacular/i.test(name) || /billboard|poster|ooh|outdoor/i.test(fullPath)) return { type: 'OOH', brand, market, note: 'pdf ooh' };
    return { type: 'Print', brand, market, note: 'pdf' };
  }

  // Source design files
  if (['psd','ai','eps','indd','sketch','fig','xd'].includes(ext)) return { type: 'Other', brand, market, note: 'source design file' };

  // Audio → Radio
  if (['mp3','wav','m4a','aac','aiff','flac','ogg','wma'].includes(ext) || /^audio\//.test(mime)) return { type: 'Radio', brand, market, note: 'audio' };

  // Video — split by duration / aspect / filename
  if (['mp4','mov','avi','m4v','wmv','mkv','webm','mpg','mpeg'].includes(ext) || /^video\//.test(mime)) {
    if (/broll|b-roll|brol|raw|rough|unedited|outtake|rejected/i.test(name) || /\/broll\/|\/raw\/|\/unedited\//i.test(fullPath)) return { type: 'B-roll', brand, market, note: 'broll cue in name/path' };
    // Vertical short → Social
    if (w && h && h > w * 1.5 && dur && dur < 90) return { type: 'Social', brand, market, note: 'vertical short' };
    if (/\/social\/|\binstagram\b|\btiktok\b|\breel\b|\bshort\b|\bstory\b/i.test(fullPath + ' ' + name)) return { type: 'Social', brand, market, note: 'social cue' };
    // Standard spot durations (5-90s, horizontal/square) → TV
    if (dur >= 4 && dur <= 90) return { type: 'TV', brand, market, note: 'video ' + Math.round(dur) + 's' };
    // Longer videos that aren't B-roll → Other (could be event recording, etc.)
    if (dur > 90) return { type: 'Other', brand, market, note: 'long video ' + Math.round(dur) + 's' };
    return { type: 'TV', brand, market, note: 'video, no duration' };
  }

  // Images
  if (['jpg','jpeg','png','gif','webp','heic','tif','tiff','bmp'].includes(ext) || /^image\//.test(mime)) {
    // Logo cues
    if (/logo|wordmark|mark|brandmark|favicon|icon/i.test(name) || /\/logos?\//i.test(fullPath)) return { type: 'Logo', brand, market, note: 'logo cue' };
    if (ext === 'svg') return { type: 'Logo', brand, market, note: 'svg' };
    // Transparent PNG small → Logo
    if (ext === 'png' && w && h && w <= 1500 && h <= 1500 && meta.hasAlpha) return { type: 'Logo', brand, market, note: 'small transparent png' };
    // Banner dimensions
    if (w && h) {
      const isBanner = BANNER_DIMS.some(([bw, bh]) => Math.abs(w - bw) <= 5 && Math.abs(h - bh) <= 5);
      if (isBanner) return { type: 'Banner', brand, market, note: w + 'x' + h + ' web banner' };
    }
    if (/\/banner|\/web.?ad|\/display/i.test(fullPath)) return { type: 'Banner', brand, market, note: 'banner path' };
    // Large image — billboard / print
    if (w && h && (w >= 3000 || h >= 3000)) {
      if (/billboard|poster|ooh|outdoor|spectacular|bulletin/i.test(name + ' ' + fullPath)) return { type: 'OOH', brand, market, note: w + 'x' + h + ' ooh-sized' };
      return { type: 'Print', brand, market, note: w + 'x' + h + ' high-res' };
    }
    if (/billboard|poster|ooh|outdoor|spectacular|bulletin/i.test(name + ' ' + fullPath)) return { type: 'OOH', brand, market, note: 'ooh cue' };
    return { type: 'Other', brand, market, note: 'image ' + (w && h ? w + 'x' + h : 'unknown size') };
  }

  // SVG (caught above for logo but fall-through guard)
  if (ext === 'svg') return { type: 'Logo', brand, market, note: 'svg' };

  // Archives (zip/rar/etc.) — leave for manual handling.
  if (['zip','rar','7z','tar','gz'].includes(ext)) return { type: 'Other', brand, market, note: 'archive — needs manual extract' };

  return { type: 'Other', brand, market, note: 'unrecognized ext ' + ext };
}

// ── Drive walker ─────────────────────────────────────────────────────
async function listFolderContents(parentId) {
  // Drive returns up to pageSize per call; loop.
  let pageToken = null;
  const out = [];
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, parents, createdTime, modifiedTime, imageMediaMetadata(width,height), videoMediaMetadata(width,height,durationMillis), md5Checksum)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
    });
    out.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

async function* walk(folderId, parentPath = '') {
  const items = await listFolderContents(folderId);
  for (const it of items) {
    if (it.mimeType === 'application/vnd.google-apps.folder') {
      const sub = parentPath + '/' + it.name;
      yield* walk(it.id, sub);
    } else if (it.mimeType === 'application/vnd.google-apps.shortcut') {
      // skip shortcuts; the target is presumably visited via its own path
      continue;
    } else {
      yield { ...it, _parentPath: parentPath || '/' };
    }
  }
}

// ── Per-file processing ──────────────────────────────────────────────
function extOf(name) {
  const m = (name || '').match(/\.([a-z0-9]{1,6})$/i);
  return m ? m[1].toLowerCase() : '';
}

function sanitizeForKey(s) {
  return String(s || '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);
}

async function streamDownload(fileId) {
  // Returns a Readable stream of the file bytes. Streaming so a 2 GB
  // master doesn't have to sit in RAM. Supabase Storage's upload()
  // accepts a ReadableStream directly via the underlying fetch
  // (we pass it as a Blob-like through Buffer concat only for files
  // smaller than CHUNK_BUFFER_THRESHOLD where the simpler path is
  // faster).
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );
  return res.data; // Node.js Readable
}

function readStreamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function processFile(f, runTotals) {
  if (state.processed[f.id]) {
    runTotals.skipped++;
    return;
  }

  const ext = extOf(f.name);
  const sizeBytes = parseInt(f.size || '0', 10);
  const videoMeta = f.videoMediaMetadata || {};
  const imageMeta = f.imageMediaMetadata || {};
  const meta = {
    filename: f.name,
    path: f._parentPath,
    ext,
    mimeType: f.mimeType,
    file_size: sizeBytes,
    width: videoMeta.width || imageMeta.width || null,
    height: videoMeta.height || imageMeta.height || null,
    duration_sec: videoMeta.durationMillis ? Math.round(parseInt(videoMeta.durationMillis, 10) / 1000) : null,
  };

  const cls = classifyV(meta);

  if (ONLY_TYPES && !ONLY_TYPES.includes(cls.type)) {
    runTotals.filtered++;
    return;
  }

  // Year from Drive timestamps
  const created = f.createdTime ? new Date(f.createdTime) : null;
  const modified = f.modifiedTime ? new Date(f.modifiedTime) : null;
  const year = created ? created.getUTCFullYear() : null;

  // Build storage key
  const folder = cls.type.toLowerCase().replace(/[^a-z]/g, '');
  const yearFolder = year || 'unknown';
  const safeName = sanitizeForKey(f.name);
  const storageKey = `${folder}/${yearFolder}/${f.id}_${safeName}`;

  console.log(`▸ ${cls.type.padEnd(8)} ${(meta.path || '').padEnd(40)} ${f.name}  (${(sizeBytes / 1024 / 1024).toFixed(1)} MB) — ${cls.note}`);

  if (sizeBytes > MAX_SIZE_MB * 1024 * 1024) {
    console.log(`  ⊘ skipped (${(sizeBytes / 1024 / 1024).toFixed(0)} MB > --max-size=${MAX_SIZE_MB} MB)`);
    state.skippedBig = state.skippedBig || [];
    state.skippedBig.push({ id: f.id, name: f.name, path: meta.path, size: sizeBytes, type: cls.type });
    runTotals.skippedBig = (runTotals.skippedBig || 0) + 1;
    saveState();
    return;
  }

  if (DRY_RUN) {
    runTotals.byType[cls.type] = (runTotals.byType[cls.type] || 0) + 1;
    runTotals.uploaded++;
    return;
  }

  try {
    // Download from Drive (streamed). For small/mid files we collect
    // the buffer (fast path). For files > 50 MB we still buffer here
    // — Supabase Storage's REST upload wants a Blob/Buffer/etc. (its
    // resumable upload API would be the true streaming path but it
    // requires extra session setup). 4 GB VM RAM is fine for typical
    // ad creative (<1 GB per file).
    const stream = await streamDownload(f.id);
    const buf = await readStreamToBuffer(stream);

    // Dedupe hash. Prefer Drive's md5Checksum (already computed by
    // Google) when present; fall back to sha256 of what we just got.
    const hash = f.md5Checksum || crypto.createHash('sha256').update(buf).digest('hex');

    // Upload to Supabase Storage
    const upRes = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, buf, {
        contentType: f.mimeType || 'application/octet-stream',
        upsert: true,
      });
    if (upRes.error) throw new Error('upload: ' + upRes.error.message);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);

    // Insert/update legacy_assets row (drive_id unique → upsert)
    const insRes = await supabase
      .from('legacy_assets')
      .upsert({
        drive_id: f.id,
        drive_path: meta.path,
        filename: f.name,
        type: cls.type,
        brand: cls.brand,
        market: cls.market,
        year,
        mime_type: f.mimeType,
        file_size: sizeBytes,
        duration_sec: meta.duration_sec,
        width: meta.width,
        height: meta.height,
        hash,
        supabase_path: storageKey,
        supabase_url: pub.publicUrl,
        drive_created: created ? created.toISOString() : null,
        drive_modified: modified ? modified.toISOString() : null,
        classifier_note: cls.note,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'drive_id' });
    if (insRes.error) throw new Error('insert: ' + insRes.error.message);

    state.processed[f.id] = { type: cls.type, at: new Date().toISOString() };
    runTotals.byType[cls.type] = (runTotals.byType[cls.type] || 0) + 1;
    runTotals.uploaded++;

    // Checkpoint state every 20 files
    if (runTotals.uploaded % 20 === 0) saveState();
  } catch (e) {
    console.error(`  ✗ ${f.name} — ${e.message}`);
    state.errors.push({ id: f.id, name: f.name, path: meta.path, error: e.message, at: new Date().toISOString() });
    runTotals.errors++;
    saveState();
  }
}

// ── Main ─────────────────────────────────────────────────────────────
(async () => {
  const totals = { uploaded: 0, skipped: 0, filtered: 0, errors: 0, byType: {} };
  console.log(`▸ drive-import starting (folder=${folderId}, dry-run=${DRY_RUN}, types=${ONLY_TYPES || 'all'}, max=${MAX_FILES})`);

  // Authorize Drive (interactive OAuth on first run, cached after).
  const authClient = await makeDriveAuth();
  drive = google.drive({ version: 'v3', auth: authClient });

  let count = 0;
  for await (const f of walk(folderId)) {
    if (count >= MAX_FILES) break;
    await processFile(f, totals);
    count++;
  }

  saveState();

  console.log('\n────────────── SUMMARY ──────────────');
  console.log(`Walked:    ${count} file(s)`);
  console.log(`Uploaded:  ${totals.uploaded}`);
  console.log(`Skipped:   ${totals.skipped} (already in state)`);
  if (totals.skippedBig) console.log(`Too big:   ${totals.skippedBig} (> --max-size, see state.skippedBig)`);
  if (ONLY_TYPES) console.log(`Filtered:  ${totals.filtered} (type filter)`);
  console.log(`Errors:    ${totals.errors}`);
  console.log('By type:');
  Object.entries(totals.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`  ${t.padEnd(10)} ${n}`));
  console.log(`\nState saved to ${STATE_PATH}`);
  if (totals.errors) console.log(`See state file for error details.`);
})();
