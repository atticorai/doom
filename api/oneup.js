// ═══════════════════════════════════════════════════════════════════
// /api/oneup — OneUp (1UP) social publishing platform, read-only.
//
// OneUp authenticates with an API key passed as the `apiKey` query
// parameter against https://www.oneupapp.io/api/<endpoint>. The key
// lives ONLY in the ONEUP_API_KEY environment variable — it is never
// accepted from the client and never returned in a response.
//
// SAFETY: OneUp is a PUBLISHING tool. This endpoint issues GET
// requests only, against an explicit allowlist of read-only endpoint
// names. It can never schedule, publish, or delete a post, even if
// something upstream asks it to.
//
// Actions:
//   probe   — ask OneUp which read endpoints actually answer, and
//             report exactly what came back. This is how we learn the
//             account's real shape instead of trusting documentation.
//   fetch   — call one allowlisted read endpoint with safe params.
//
// Guards: valid dd_session cookie; no key, no call; honest errors.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');

const BASE = 'https://www.oneupapp.io/api/';

// Read-only endpoint names we are willing to call. Naming follows the
// documented convention (lowercase, no separators, e.g. scheduletextpost).
// Nothing that writes is listed, and nothing outside this list is callable.
const READ_ENDPOINTS = [
  'getcategories', 'categories',
  'getsocialnetworks', 'getsocialaccounts', 'socialnetworks', 'accounts',
  'getposts', 'listposts', 'posts',
  'getanalytics', 'analytics', 'getpostanalytics', 'getinsights', 'insights',
  'getreports', 'reports',
];

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

// Strip anything that looks like the key out of text we hand back.
function scrub(s, key) {
  let out = String(s || '');
  if (key) out = out.split(key).join('[key]');
  return out.replace(/apiKey=[^&\s'"]+/gi, 'apiKey=[key]');
}

async function callOneUp(name, params, key, timeoutMs) {
  const qs = new URLSearchParams();
  qs.set('apiKey', key);
  Object.keys(params || {}).forEach(k => {
    const v = params[k];
    if (v !== undefined && v !== null && String(v) !== '') qs.set(k, String(v));
  });
  const url = BASE + name + '?' + qs.toString();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs || 12000);
  try {
    const resp = await fetch(url, { method: 'GET', signal: ctl.signal, headers: { 'Accept': 'application/json' } });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* not json */ }
    return { status: resp.status, ok: resp.ok, json, text: text.slice(0, 400) };
  } finally { clearTimeout(timer); }
}

// A short, human-readable description of what an endpoint returned —
// enough to tell whether it is useful, without dumping the payload.
function describe(json) {
  if (json === null || json === undefined) return 'not JSON';
  if (Array.isArray(json)) {
    const keys = json.length && typeof json[0] === 'object' && json[0] ? Object.keys(json[0]).slice(0, 12) : [];
    return 'list of ' + json.length + (keys.length ? ' · fields: ' + keys.join(', ') : '');
  }
  if (typeof json === 'object') {
    const keys = Object.keys(json).slice(0, 12);
    return 'object · fields: ' + keys.join(', ');
  }
  return typeof json;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  if (!validSession(req.headers && req.headers.cookie)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'not_signed_in' }));
  }
  const key = process.env.ONEUP_API_KEY || '';
  if (!key) {
    res.statusCode = 503;
    return res.end(JSON.stringify({
      error: 'not_configured',
      message: 'OneUp is not connected yet. Add ONEUP_API_KEY in Vercel → Settings → Environment Variables, redeploy, then try again.',
    }));
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try { body = JSON.parse(await new Promise((ok) => { let s = ''; req.on('data', c => s += c); req.on('end', () => ok(s)); })); }
    catch (e) { body = {}; }
  }
  const action = String((body && body.action) || 'probe');

  try {
    if (action === 'probe') {
      const results = [];
      for (const name of READ_ENDPOINTS) {
        try {
          const r = await callOneUp(name, {}, key, 9000);
          results.push({
            endpoint: name,
            status: r.status,
            answered: r.ok && r.json !== null,
            shape: r.ok ? describe(r.json) : null,
            note: r.ok ? null : scrub(r.text, key).slice(0, 140),
          });
        } catch (e) {
          results.push({ endpoint: name, status: 0, answered: false, shape: null, note: scrub(e.message, key).slice(0, 120) });
        }
      }
      const live = results.filter(r => r.answered);
      return res.end(JSON.stringify({
        checked: new Date().toISOString(),
        base: BASE,
        auth: 'apiKey query parameter',
        working: live.map(r => ({ endpoint: r.endpoint, shape: r.shape })),
        tried: results.length,
        all: results,
      }));
    }

    if (action === 'fetch') {
      const name = String((body && body.endpoint) || '');
      if (!READ_ENDPOINTS.includes(name)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'endpoint_not_allowed', message: 'Only read-only OneUp endpoints can be called from here.' }));
      }
      const params = (body && typeof body.params === 'object' && body.params) || {};
      // Never let a caller smuggle in a different key or a method override.
      delete params.apiKey; delete params.method;
      const r = await callOneUp(name, params, key, 15000);
      if (!r.ok) {
        res.statusCode = 502;
        return res.end(JSON.stringify({ error: 'oneup_error', status: r.status, message: scrub(r.text, key).slice(0, 300) }));
      }
      return res.end(JSON.stringify({ fetched: new Date().toISOString(), endpoint: name, shape: describe(r.json), data: r.json }));
    }

    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'unknown_action' }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'unreachable', message: scrub(e.message, key).slice(0, 200) }));
  }
};

module.exports.READ_ENDPOINTS = READ_ENDPOINTS;
module.exports.describe = describe;
module.exports.scrub = scrub;
