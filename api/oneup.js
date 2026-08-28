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

// Read-only endpoint names, taken from OneUp's own documentation index.
// `listcategory` is confirmed verbatim in their auth example; the rest follow
// the same convention (lowercase, no separators), with a couple of plausible
// spellings each where the docs only gave a human label.
//
// NOTHING THAT WRITES IS LISTED. No schedule*, create*, upload*, edit*,
// delete*, reply*, or refresh-comment endpoints — this connector cannot post
// to a client's social account even if asked to.
const CONNECTION_ENDPOINTS = [
  'listcategory', 'listcategories',
  'listcategoryaccounts', 'listcategoryaccount',
  'listsocialaccounts', 'listsocialaccount',
];
const POST_ENDPOINTS = [
  'listpublishedposts', 'listscheduledposts', 'listfailedposts', 'listdraftposts',
];
// Analytics — per OneUp's docs these require Intermediate, Growth or Business
// (not available on Basic). Probing them tells us the plan as a side effect.
const ANALYTICS_ENDPOINTS = [
  'facebookanalytics', 'instagramanalytics', 'linkedinanalytics',
  'tiktokanalytics', 'youtubeanalytics', 'pinterestanalytics',
  'threadsanalytics', 'snapchatanalytics', 'blueskyanalytics',
  'googlebusinessprofileanalytics', 'gbpanalytics', 'metaadsanalytics',
  'analyticsoverview',
];
const READ_ENDPOINTS = [].concat(CONNECTION_ENDPOINTS, POST_ENDPOINTS, ANALYTICS_ENDPOINTS);

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
      // Run in small parallel batches so a 30-endpoint sweep stays quick.
      async function sweep(list) {
        const out = [];
        for (let i = 0; i < list.length; i += 6) {
          const batch = list.slice(i, i + 6);
          const done = await Promise.all(batch.map(async (name) => {
            try {
              const r = await callOneUp(name, {}, key, 8000);
              return {
                endpoint: name, status: r.status, answered: r.ok && r.json !== null,
                shape: r.ok ? describe(r.json) : null,
                note: r.ok ? null : scrub(r.text, key).slice(0, 140),
              };
            } catch (e) {
              return { endpoint: name, status: 0, answered: false, shape: null, note: scrub(e.message, key).slice(0, 120) };
            }
          }));
          out.push(...done);
        }
        return out;
      }
      const conn = await sweep(CONNECTION_ENDPOINTS);
      const posts = await sweep(POST_ENDPOINTS);
      const analytics = await sweep(ANALYTICS_ENDPOINTS);
      const all = [].concat(conn, posts, analytics);
      const liveConn = conn.filter(r => r.answered);
      const livePosts = posts.filter(r => r.answered);
      const liveAnalytics = analytics.filter(r => r.answered);

      // A plan verdict falls out of the results, and it is stated plainly.
      let verdict, detail;
      if (!liveConn.length && !livePosts.length && !liveAnalytics.length) {
        verdict = 'no_endpoints';
        detail = 'The key reached OneUp but no read endpoint answered. Worth confirming the key is active on the account.';
      } else if (liveAnalytics.length) {
        verdict = 'analytics_available';
        detail = 'Analytics are available on this plan — social numbers can flow into records automatically.';
      } else {
        verdict = 'publishing_only';
        detail = 'The connection works, but no analytics endpoint answered. Per OneUp\u2019s docs, analytics require the Intermediate, Growth or Business plan — Basic does not include them. Until the plan changes, use the dashboard\u2019s Custom Report export instead.';
      }
      return res.end(JSON.stringify({
        checked: new Date().toISOString(),
        base: BASE,
        auth: 'apiKey query parameter',
        verdict, detail,
        connection: liveConn.map(r => ({ endpoint: r.endpoint, shape: r.shape })),
        posts: livePosts.map(r => ({ endpoint: r.endpoint, shape: r.shape })),
        analytics: liveAnalytics.map(r => ({ endpoint: r.endpoint, shape: r.shape })),
        working: [].concat(liveConn, livePosts, liveAnalytics).map(r => ({ endpoint: r.endpoint, shape: r.shape })),
        tried: all.length,
        all,
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
module.exports.CONNECTION_ENDPOINTS = CONNECTION_ENDPOINTS;
module.exports.ANALYTICS_ENDPOINTS = ANALYTICS_ENDPOINTS;
module.exports.describe = describe;
module.exports.scrub = scrub;
