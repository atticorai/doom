// ═══════════════════════════════════════════════════════════════════
// /api/oneup — OneUp (1UP), read-only.
//
// OneUp runs TWO hosts, and that distinction matters:
//   https://www.oneupapp.io/api/      — accounts, categories, posts
//   https://analyze.oneupapp.io/api/  — ANALYTICS (per platform)
// Both authenticate with the key as an `apiKey` query parameter.
//
// The key lives ONLY in ONEUP_API_KEY. It is never accepted from the
// client and never echoed back — responses are scrubbed.
//
// SAFETY: OneUp is a publishing tool. Every request here is a GET
// against an explicit allowlist of read-only paths. Nothing that
// creates, schedules, uploads, edits, deletes, or replies is callable,
// so this can never post to a client's social account.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');

const BASE_APP = 'https://www.oneupapp.io/api/';
const BASE_ANALYTICS = 'https://analyze.oneupapp.io/api/';

// Read-only endpoints on the app host (confirmed live in probing).
const APP_ENDPOINTS = ['listcategory', 'listcategoryaccount', 'listsocialaccounts'];

// Analytics platforms and the reports each exposes (per OneUp's docs).
const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'threads', 'snapchat',
  'pinterest', 'bluesky', 'youtube', 'tiktok', 'googlebusinessprofile', 'metaads'];
const REPORTS = ['overview', 'posts', 'reels', 'stories', 'demographics'];

// Which metric key means "impressions" on each platform's overview.
// Facebook is documented (page_media_view); others are checked against a
// candidate list at read time and reported honestly when none match, rather
// than silently picking a number that means something else.
const IMPRESSION_KEYS = ['page_media_view', 'impressions', 'media_views',
  'page_story_impressions_by_story_id', 'post_impressions'];
const REACH_KEYS = ['page_total_media_view_unique', 'reach', 'unique_views'];
const ENGAGEMENT_KEYS = ['page_post_engagements', 'engagements', 'interactions'];

function analyticsPathAllowed(p) {
  const m = String(p || '').match(/^([a-z]+)\/([a-z]+)$/);
  return !!(m && PLATFORMS.includes(m[1]) && REPORTS.includes(m[2]));
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

function scrub(s, key) {
  let out = String(s || '');
  if (key) out = out.split(key).join('[key]');
  return out.replace(/apiKey=[^&\s'"]+/gi, 'apiKey=[key]');
}

async function get(base, path, params, key, timeoutMs) {
  const qs = new URLSearchParams();
  qs.set('apiKey', key);
  Object.keys(params || {}).forEach(k => {
    const v = params[k];
    if (v !== undefined && v !== null && String(v) !== '') qs.set(k, String(v));
  });
  const url = base + path + '?' + qs.toString();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs || 12000);
  try {
    const resp = await fetch(url, { method: 'GET', signal: ctl.signal, headers: { 'Accept': 'application/json' } });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    return { status: resp.status, ok: resp.ok, json, text: text.slice(0, 400) };
  } finally { clearTimeout(timer); }
}

function describe(json) {
  if (json === null || json === undefined) return 'not JSON';
  if (Array.isArray(json)) {
    const keys = json.length && typeof json[0] === 'object' && json[0] ? Object.keys(json[0]).slice(0, 12) : [];
    return 'list of ' + json.length + (keys.length ? ' · fields: ' + keys.join(', ') : '');
  }
  if (typeof json === 'object') return 'object · fields: ' + Object.keys(json).slice(0, 12).join(', ');
  return typeof json;
}

// Pull the headline numbers out of an overview payload, naming which metric
// key each came from so nothing is a mystery later.
function readOverview(json) {
  const data = (json && json.data) || {};
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  const pick = (cands) => {
    for (const c of cands) {
      const hit = metrics.find(m => m && m.key === c);
      if (hit) return { key: c, name: hit.name || c, value: Number(hit.value_current_period) || 0, change: hit.percentage_change || null };
    }
    return null;
  };
  return {
    impressions: pick(IMPRESSION_KEYS),
    reach: pick(REACH_KEYS),
    engagements: pick(ENGAGEMENT_KEYS),
    followers: typeof data.total_followers === 'number' ? data.total_followers : null,
    metricKeys: metrics.map(m => m && m.key).filter(Boolean),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  if (!validSession(req.headers && req.headers.cookie)) {
    res.statusCode = 401; return res.end(JSON.stringify({ error: 'not_signed_in' }));
  }
  const key = process.env.ONEUP_API_KEY || '';
  if (!key) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'not_configured', message: 'OneUp is not connected yet. Add ONEUP_API_KEY in Vercel → Settings → Environment Variables, redeploy, then try again.' }));
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try { body = JSON.parse(await new Promise((ok) => { let s = ''; req.on('data', c => s += c); req.on('end', () => ok(s)); })); }
    catch (e) { body = {}; }
  }
  const action = String((body && body.action) || 'probe');

  try {
    // ── accounts: the social_network_id list every analytics call needs ──
    if (action === 'accounts') {
      const r = await get(BASE_APP, 'listsocialaccounts', {}, key, 15000);
      if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'oneup_error', status: r.status, message: scrub(r.text, key).slice(0, 240) })); }
      return res.end(JSON.stringify({ fetched: new Date().toISOString(), shape: describe(r.json), data: (r.json && r.json.data) !== undefined ? r.json.data : r.json }));
    }

    // ── probe: does the analytics host answer, and is it a plan gate? ──
    if (action === 'probe') {
      const app = [];
      for (const name of APP_ENDPOINTS) {
        const r = await get(BASE_APP, name, {}, key, 9000).catch(e => ({ status: 0, ok: false, text: String(e.message) }));
        app.push({ endpoint: name, status: r.status, answered: !!(r.ok && r.json), shape: r.ok ? describe(r.json) : null });
      }
      // One representative analytics call per host check — without a
      // social_network_id it may complain about the parameter, which still
      // proves the endpoint exists and the plan allows it.
      const probeNet = String((body && body.social_network_id) || '');
      const an = [];
      for (const p of ['facebook', 'instagram']) {
        const r = await get(BASE_ANALYTICS, p + '/overview', { social_network_id: probeNet, preset: 'last_30_days' }, key, 12000)
          .catch(e => ({ status: 0, ok: false, text: String(e.message) }));
        an.push({ endpoint: p + '/overview', status: r.status, answered: !!(r.ok && r.json), note: r.ok ? null : scrub(r.text, key).slice(0, 160) });
      }
      const codes = an.map(x => x.status);
      let verdict, detail;
      if (an.some(x => x.answered)) {
        verdict = 'analytics_available';
        detail = 'The analytics host answered — impressions, reach and engagement can flow onto records.';
      } else if (codes.some(c => c === 401 || c === 402 || c === 403)) {
        verdict = 'plan_gated';
        detail = 'The analytics endpoints exist but this plan cannot read them. Per OneUp’s docs, analytics need Intermediate, Growth or Business — Basic does not include them.';
      } else if (codes.every(c => c === 404)) {
        verdict = 'analytics_names_unknown';
        detail = 'The analytics host returned 404 for the documented paths — worth re-checking the platform names.';
      } else if (!app.some(x => x.answered)) {
        verdict = 'no_endpoints';
        detail = 'Nothing answered on either host. Worth confirming the key is active.';
      } else {
        verdict = 'analytics_unclear';
        detail = 'The account host works; the analytics host did not answer cleanly. Codes are below — a missing social_network_id can cause this, so try again from an account.';
      }
      return res.end(JSON.stringify({
        checked: new Date().toISOString(), appBase: BASE_APP, analyticsBase: BASE_ANALYTICS,
        verdict, detail, app, analytics: an,
        platforms: PLATFORMS, reports: REPORTS,
      }));
    }

    // ── analytics: one platform report for one connected account ──
    if (action === 'analytics') {
      const path = String((body && body.path) || '');
      if (!analyticsPathAllowed(path)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'path_not_allowed', message: 'Only read-only platform reports can be called (e.g. facebook/overview).' }));
      }
      const params = {};
      ['social_network_id', 'preset', 'start_date', 'end_date', 'timezone'].forEach(k => {
        if (body && body[k]) params[k] = String(body[k]);
      });
      if (!params.social_network_id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'missing_account', message: 'A social_network_id is required — get one from the accounts action.' }));
      }
      if (!params.preset && !params.start_date) params.preset = 'last_30_days';
      const r = await get(BASE_ANALYTICS, path, params, key, 20000);
      if (!r.ok) {
        res.statusCode = (r.status === 401 || r.status === 402 || r.status === 403) ? 402 : 502;
        return res.end(JSON.stringify({
          error: res.statusCode === 402 ? 'plan_gated' : 'oneup_error',
          status: r.status,
          message: res.statusCode === 402
            ? 'OneUp refused this analytics call for the current plan (Intermediate or above is required).'
            : scrub(r.text, key).slice(0, 240),
        }));
      }
      const summary = /\/overview$/.test(path) ? readOverview(r.json) : null;
      return res.end(JSON.stringify({
        fetched: new Date().toISOString(), path, params: { ...params, apiKey: undefined },
        summary, shape: describe(r.json && r.json.data !== undefined ? r.json.data : r.json),
        data: r.json && r.json.data !== undefined ? r.json.data : r.json,
      }));
    }

    // ── rollup: every connected account, every platform, one sweep ──
    // The point of the integration: ~60 accounts across 11 platforms, each
    // belonging to a brand. Walk them all, read each overview, and hand back
    // per-account numbers for the app to group by brand.
    if (action === 'rollup') {
      const acctResp = await get(BASE_APP, 'listsocialaccounts', {}, key, 15000);
      if (!acctResp.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'accounts_failed', status: acctResp.status, message: scrub(acctResp.text, key).slice(0, 240) })); }
      const raw = (acctResp.json && acctResp.json.data !== undefined) ? acctResp.json.data : acctResp.json;
      const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? (Object.values(raw).find(Array.isArray) || []) : []);
      if (!list.length) {
        return res.end(JSON.stringify({ fetched: new Date().toISOString(), accounts: 0, rows: [],
          note: 'No account list came back in a shape we recognised.', shape: describe(raw), sample: raw }));
      }
      // Field names are not documented, so detect them rather than assume.
      const idOf = (a) => a.social_network_id || a.id || a.network_id || a.account_id || null;
      const nameOf = (a) => a.name || a.account_name || a.page_name || a.username || a.title || '';
      const platOf = (a) => String(a.platform || a.social_network || a.network || a.type || a.channel || '')
        .toLowerCase().replace(/[^a-z]/g, '')
        .replace('googlebusiness', 'googlebusinessprofile').replace('gbp', 'googlebusinessprofile')
        .replace('twitter', 'x').replace('metaads', 'metaads');
      const period = {};
      ['preset', 'start_date', 'end_date', 'timezone'].forEach(k => { if (body && body[k]) period[k] = String(body[k]); });
      if (!period.preset && !period.start_date) period.preset = 'last_30_days';

      const targets = list.map(a => ({ id: idOf(a), name: nameOf(a), platform: platOf(a) }))
        .filter(t => t.id && PLATFORMS.includes(t.platform));
      const skipped = list.length - targets.length;
      const cap = Math.min(targets.length, Number(body && body.limit) || 80);
      const rows = [];
      const started = Date.now();
      for (let i = 0; i < cap; i += 5) {
        if (Date.now() - started > 55000) break; // stay inside the function budget
        const batch = targets.slice(i, i + 5);
        const done = await Promise.all(batch.map(async (t) => {
          try {
            const r = await get(BASE_ANALYTICS, t.platform + '/overview', { social_network_id: t.id, ...period }, key, 12000);
            if (!r.ok) {
              const gate = (r.status === 401 || r.status === 402 || r.status === 403);
              return { ...t, ok: false, status: r.status, error: gate ? 'plan' : 'error', note: scrub(r.text, key).slice(0, 120) };
            }
            const sum = readOverview(r.json);
            return {
              ...t, ok: true, status: r.status,
              impressions: sum.impressions ? sum.impressions.value : null,
              impressionsFrom: sum.impressions ? sum.impressions.key : null,
              reach: sum.reach ? sum.reach.value : null,
              engagements: sum.engagements ? sum.engagements.value : null,
              followers: sum.followers,
              // A stale OneUp connection reports zeros; say so rather than
              // letting a zero pass as a real month.
              suspectStale: (sum.impressions ? sum.impressions.value : 0) === 0 && (sum.followers || 0) === 0,
              metricKeys: sum.impressions ? undefined : sum.metricKeys.slice(0, 12),
            };
          } catch (e) {
            return { ...t, ok: false, status: 0, error: 'unreachable', note: scrub(e.message, key).slice(0, 100) };
          }
        }));
        rows.push(...done);
      }
      const gated = rows.filter(r => r.error === 'plan').length;
      return res.end(JSON.stringify({
        fetched: new Date().toISOString(), period,
        accounts: list.length, attempted: rows.length, skipped,
        planGated: gated,
        stale: rows.filter(r => r.ok && r.suspectStale).map(r => r.name),
        rows,
      }));
    }

    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'unknown_action' }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'unreachable', message: scrub(e.message, key).slice(0, 200) }));
  }
};

module.exports.PLATFORMS = PLATFORMS;
module.exports.REPORTS = REPORTS;
module.exports.analyticsPathAllowed = analyticsPathAllowed;
module.exports.readOverview = readOverview;
module.exports.describe = describe;
module.exports.scrub = scrub;
