// ═══════════════════════════════════════════════════════════════════
// /api/sharepoint-doc — read a shared SharePoint/OneDrive Excel file
// (the live disclaimer workbook) server-side, so Mayhem can show the
// current sheets instead of a stale snapshot.
//
// The client stores the share link (pasted once by a signed-in user);
// this endpoint downloads the .xlsx and returns its sheets as rows.
// Nothing is applied automatically — the client diffs against the
// library and a human decides.
//
// Guards: valid dd_session cookie required; https only; host must be
// SharePoint/OneDrive — never an arbitrary URL. If the tenant refuses
// an anonymous server download (org-only link), we say exactly that
// instead of pretending.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const zlib = require('zlib');

function hostAllowed(h) {
  h = String(h || '').toLowerCase();
  return h.endsWith('.sharepoint.com') || h === 'sharepoint.com' ||
         h.endsWith('.sharepoint.us') || h === '1drv.ms' ||
         h.endsWith('.sharepoint-df.com');
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const seed = (process.env.SYS_PASSWORD || '') + '|' + (process.env.ADMIN_PASSWORD || '');
  if (!seed || seed === '|') return null;
  return crypto.createHash('sha256').update('dd:session:' + seed).digest('hex');
}
function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function timingSafeEq(a, b) {
  const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
function validSession(cookieHeader) {
  const m = String(cookieHeader || '').match(/dd_session=([^;]+)/);
  if (!m) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  const parts = decodeURIComponent(m[1]).split('.');
  const sign = (msg) => b64url(crypto.createHmac('sha256', secret).update(msg).digest());
  if (parts.length === 4) {
    const [u, id, expiry, sig] = parts;
    return Number(expiry) >= Date.now() && timingSafeEq(sign(u + '.' + id + '.' + expiry), sig);
  }
  if (parts.length === 3) {
    const [id, expiry, sig] = parts;
    return Number(expiry) >= Date.now() && timingSafeEq(sign(id + '.' + expiry), sig);
  }
  return false;
}

// ── minimal .xlsx reader (zip central directory + inflateRaw + sheet XML) ──
function readZipEntries(buf) {
  // find End of Central Directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not_a_zip');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString('utf8');
    entries[name] = { method, csize, lho };
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return {
    read(name) {
      const e = entries[name];
      if (!e) return null;
      const nameLen2 = buf.readUInt16LE(e.lho + 26);
      const extraLen2 = buf.readUInt16LE(e.lho + 28);
      const start = e.lho + 30 + nameLen2 + extraLen2;
      const raw = buf.slice(start, start + e.csize);
      if (e.method === 0) return raw;
      if (e.method === 8) return zlib.inflateRawSync(raw);
      throw new Error('zip_method_' + e.method);
    },
    names: Object.keys(entries),
  };
}

function xmlText(s) {
  return String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
}
function colIndex(ref) {
  const m = String(ref).match(/^([A-Z]+)/);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseXlsx(buf, maxRows) {
  const zip = readZipEntries(buf);
  const wb = zip.read('xl/workbook.xml');
  if (!wb) throw new Error('no_workbook_xml');
  const rels = zip.read('xl/_rels/workbook.xml.rels');
  const relMap = {};
  if (rels) {
    for (const m of String(rels).matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g)) {
      relMap[m[1]] = m[2].replace(/^\//, '').replace(/^(?!xl\/)/, 'xl/');
    }
  }
  const shared = [];
  const ss = zip.read('xl/sharedStrings.xml');
  if (ss) {
    for (const m of String(ss).matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(xmlText(m[1]));
  }
  const sheets = [];
  for (const m of String(wb).matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g)) {
    const target = relMap[m[2]] || ('xl/worksheets/sheet' + (sheets.length + 1) + '.xml');
    const xml = zip.read(target);
    if (!xml) continue;
    const rows = [];
    for (const rm of String(xml).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      if (rows.length >= (maxRows || 300)) break;
      const cells = [];
      for (const cm of rm[1].matchAll(/<c(?:\s+([^>]*?))?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cm[1] || '';
        const inner = cm[2] || '';
        const ref = (attrs.match(/r="([^"]+)"/) || [])[1] || '';
        const type = (attrs.match(/t="([^"]+)"/) || [])[1] || '';
        let val = '';
        const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (type === 's') val = shared[+v] !== undefined ? shared[+v] : '';
        else if (type === 'inlineStr') val = xmlText((inner.match(/<is>([\s\S]*?)<\/is>/) || [, ''])[1]);
        else if (v !== undefined) val = xmlText(v);
        const ci = ref ? colIndex(ref) : cells.length;
        cells[ci] = val;
      }
      for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = '';
      if (cells.some(c => String(c).trim() !== '')) rows.push(cells);
    }
    sheets.push({ name: m[1], rows });
  }
  return sheets;
}

const MAX_BYTES = 15 * 1024 * 1024;

async function fetchXlsx(url) {
  const attempts = [url];
  try {
    const u = new URL(url);
    if (!u.searchParams.has('download')) {
      const d = new URL(url); d.searchParams.set('download', '1');
      attempts.push(d.toString());
    }
  } catch (e) { /* fall through */ }
  let lastNote = '';
  for (const a of attempts) {
    const resp = await fetch(a, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (DoomDeliverables)' } });
    const finalHost = (() => { try { return new URL(resp.url).hostname; } catch (e) { return ''; } })();
    if (/login\.microsoftonline\.com|login\.live\.com/i.test(resp.url)) {
      lastNote = 'auth_wall'; continue;
    }
    const ct = String(resp.headers.get('content-type') || '').toLowerCase();
    const ab = Buffer.from(await resp.arrayBuffer());
    if (ab.length > MAX_BYTES) throw Object.assign(new Error('too_large'), { code: 413 });
    if (!resp.ok) { lastNote = 'http_' + resp.status; continue; }
    // xlsx is a zip: PK\x03\x04
    if (ab.length > 4 && ab.readUInt32LE(0) === 0x04034b50) return { buf: ab, host: finalHost };
    if (ct.includes('text/html')) { lastNote = 'html_page'; continue; }
    lastNote = 'not_xlsx (' + (ct || 'unknown type') + ')';
  }
  const e = new Error(lastNote || 'unreachable');
  e.code = lastNote === 'auth_wall' || lastNote === 'html_page' ? 401 : 502;
  throw e;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  if (!validSession(req.headers && req.headers.cookie)) {
    res.statusCode = 401; res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'not_signed_in' }));
  }
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try { body = JSON.parse(await new Promise((ok) => { let s = ''; req.on('data', c => s += c); req.on('end', () => ok(s)); })); }
    catch (e) { body = {}; }
  }
  const url = String((body && body.url) || '').trim();
  let parsed;
  try { parsed = new URL(url); } catch (e) { parsed = null; }
  if (!parsed || parsed.protocol !== 'https:' || !hostAllowed(parsed.hostname)) {
    res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'bad_url', message: 'Needs an https SharePoint / OneDrive share link.' }));
  }
  try {
    const { buf } = await fetchXlsx(url);
    const sheets = parseXlsx(buf, 300);
    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ fetched: new Date().toISOString(), bytes: buf.length, sheets }));
  } catch (e) {
    const msg = String(e.message || e);
    const authy = e.code === 401 || /auth_wall|html_page/.test(msg);
    res.statusCode = authy ? 401 : (e.code === 413 ? 413 : 502);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: authy ? 'auth_walled' : 'fetch_failed',
      message: authy
        ? 'SharePoint would not hand the file to a server — the link is probably restricted to signed-in people. Change the file share to “Anyone with the link (view)”, or wait for the IT Graph app and we wire it properly.'
        : 'Could not read the file: ' + msg.slice(0, 120),
    }));
  }
};

module.exports.parseXlsx = parseXlsx;
module.exports.readZipEntries = readZipEntries;
