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
  'pinterest', 'bluesky', 'youtube', 'tiktok', 'googlebusinessprofile', 'metaads', 'x'];
const REPORTS = ['overview', 'posts', 'reels', 'stories', 'demographics'];

// Which metric key means "impressions" on each platform's overview.
// Facebook is documented (page_media_view); others are checked against a
// candidate list at read time and reported honestly when none match, rather
// than silently picking a number that means something else.
// Each platform names its metrics differently. Facebook's are documented;
// the rest are collected here as they are confirmed. Anything unmatched is
// reported with the keys that WERE present, so the gap is visible.
const IMPRESSION_KEYS = ['page_media_view', 'impressions', 'media_views', 'post_impressions',
  'page_story_impressions_by_story_id', 'views', 'video_views', 'total_impressions',
  'ig_impressions', 'li_impressions', 'profile_views', 'plays', 'total_plays'];
const REACH_KEYS = ['page_total_media_view_unique', 'reach', 'unique_views',
  'accounts_reached', 'total_media_view_unique', 'unique_impressions'];
const ENGAGEMENT_KEYS = ['page_post_engagements', 'engagements', 'interactions',
  'total_interactions', 'engagement', 'reactions', 'post_interactions'];

// OneUp labels each account with a short network code (observed: "GBP").
// Map every plausible code/name onto the analytics path segment.
const NETWORK_TYPE = {
  FB: 'facebook', FACEBOOK: 'facebook', PAGE: 'facebook',
  IG: 'instagram', INSTAGRAM: 'instagram',
  LI: 'linkedin', LINKEDIN: 'linkedin',
  TW: 'x', X: 'x', TWITTER: 'x',
  TT: 'tiktok', TIKTOK: 'tiktok',
  YT: 'youtube', YOUTUBE: 'youtube',
  PIN: 'pinterest', PINTEREST: 'pinterest',
  TH: 'threads', THREADS: 'threads',
  SC: 'snapchat', SNAPCHAT: 'snapchat',
  BS: 'bluesky', BSKY: 'bluesky', BLUESKY: 'bluesky',
  GBP: 'googlebusinessprofile', GMB: 'googlebusinessprofile',
  GOOGLEBUSINESSPROFILE: 'googlebusinessprofile',
  METAADS: 'metaads', META_ADS: 'metaads', ADS: 'metaads',
};
function platformFor(code) {
  const k = String(code || '').toUpperCase().replace(/[^A-Z_]/g, '');
  return NETWORK_TYPE[k] || NETWORK_TYPE[k.replace(/_/g, '')] || null;
}

// Live probing showed two path segments are wrong: api/googlebusinessprofile
// and api/x both 404. Rather than guess again, each platform carries a list of
// candidate segments and the first one that answers is remembered.
const PATH_ALIASES = {
  googlebusinessprofile: ['gbp', 'google', 'googlebusiness', 'google_business_profile', 'googlebusinessprofile'],
  x: ['twitter', 'x'],
  metaads: ['metaads', 'meta_ads', 'ads'],
};
const ALIAS_MEMO = {};
function aliasesFor(platform) {
  if (ALIAS_MEMO[platform]) return [ALIAS_MEMO[platform]];
  return PATH_ALIASES[platform] || [platform];
}

function analyticsPathAllowed(p) {
  const m = String(p || '').match(/^([a-z_]+)\/([a-z]+)$/);
  if (!m || !REPORTS.includes(m[2])) return false;
  if (PLATFORMS.includes(m[1])) return true;
  // alias segments (e.g. gbp, twitter) are equally read-only
  return Object.values(PATH_ALIASES).some(list => list.includes(m[1]));
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

// Walk a payload and describe its structure, so an unrecognised response can
// be read at a glance instead of guessed at.
function outline(v, depth, path) {
  depth = depth || 0; path = path || '$';
  if (depth > 3) return [];
  if (Array.isArray(v)) {
    const first = v.find(x => x && typeof x === 'object');
    return [path + ' = array(' + v.length + ')' + (first ? ' of objects with: ' + Object.keys(first).slice(0, 14).join(', ') : '')];
  }
  if (v && typeof v === 'object') {
    const out = [path + ' = object{' + Object.keys(v).slice(0, 14).join(', ') + '}'];
    Object.keys(v).slice(0, 8).forEach(k => { out.push(...outline(v[k], depth + 1, path + '.' + k)); });
    return out;
  }
  return [path + ' = ' + (typeof v) + (typeof v === 'string' ? ' "' + String(v).slice(0, 40) + '"' : '')];
}

// Find the account list wherever OneUp nests it: a bare array, an array under
// any key, or platform-keyed buckets ({facebook:[...], instagram:[...]}).
function findAccountArrays(v, depth) {
  depth = depth || 0;
  if (depth > 4 || !v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.some(x => x && typeof x === 'object') ? [{ key: null, rows: v }] : [];
  let out = [];
  Object.keys(v).forEach(k => {
    const child = v[k];
    if (Array.isArray(child) && child.some(x => x && typeof x === 'object')) out.push({ key: k, rows: child });
    else out = out.concat(findAccountArrays(child, depth + 1));
  });
  return out;
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
      // Buckets can be platform-keyed; remember the key so it can supply the
      // platform when the row itself does not name one.
      const buckets = findAccountArrays(raw, 0);
      const list = [];
      buckets.forEach(b => b.rows.forEach(r => list.push(Object.assign({ __bucket: b.key }, r))));
      if (!list.length) {
        return res.end(JSON.stringify({ fetched: new Date().toISOString(), accounts: 0, rows: [],
          note: 'OneUp answered, but no list of accounts was found inside the response.',
          shape: describe(raw), outline: outline(raw, 0, 'data'),
          sample: JSON.stringify(raw).slice(0, 1200) }));
      }
      // Field names are not documented, so detect them rather than assume.
      // Field names confirmed against a live account list (Aug 28).
      const idOf = (a) => a.social_account_id || a.social_network_id || a.id || a.network_id || a.account_id || null;
      const nameOf = (a) => a.full_name || a.username || a.name || a.account_name || a.page_name || a.title || '';
      const platOf = (a) => platformFor(a.social_network_type || a.platform || a.social_network || a.network || a.type || a.channel || a.__bucket) || '';
      const period = {};
      ['preset', 'start_date', 'end_date', 'timezone'].forEach(k => { if (body && body[k]) period[k] = String(body[k]); });
      if (!period.preset && !period.start_date) period.preset = 'last_30_days';

      const mapped = list.map(a => ({
        id: idOf(a), name: nameOf(a), platform: platOf(a),
        // OneUp tells us itself which connections are broken — no inference needed.
        needRefresh: a.need_refresh === true || a.need_refresh === 1,
        expired: a.is_expired === true || a.is_expired === 1,
        networkType: a.social_network_type || null,
      }));
      const targets = mapped.filter(t => t.id && PLATFORMS.includes(t.platform));
      const skipped = list.length - targets.length;
      if (!targets.length) {
        return res.end(JSON.stringify({ fetched: new Date().toISOString(), accounts: list.length, rows: [],
          note: 'Found ' + list.length + ' account rows, but could not read an id and a known platform from them.',
          outline: outline(raw, 0, 'data'),
          sampleRow: JSON.stringify(list[0]).slice(0, 800),
          mappedSample: mapped.slice(0, 5) }));
      }
      const cap = Math.min(targets.length, Number(body && body.limit) || 80);
      const rows = [];
      const started = Date.now();
      for (let i = 0; i < cap; i += 5) {
        if (Date.now() - started > 55000) break; // stay inside the function budget
        const batch = targets.slice(i, i + 5);
        const done = await Promise.all(batch.map(async (t) => {
          // Do not spend a call on a connection OneUp already says is broken —
          // it would return zeros and look like a bad month.
          if (t.needRefresh || t.expired) {
            return { ...t, ok: false, status: 0, error: 'needs_refresh',
              note: t.expired ? 'OneUp reports this connection expired' : 'OneUp reports this connection needs refreshing' };
          }
          try {
            // The docs name the parameter social_network_id; the account list
            // calls the value social_account_id. Send both rather than bet on one.
            let r = null, usedPath = null;
            for (const seg of aliasesFor(t.platform)) {
              r = await get(BASE_ANALYTICS, seg + '/overview',
                { social_network_id: t.id, social_account_id: t.id, ...period }, key, 12000);
              usedPath = seg;
              // 404 means "no such route" — try the next spelling. Anything
              // else (success, permission, bad param) is a real answer.
              if (r.status !== 404) { if (r.ok) ALIAS_MEMO[t.platform] = seg; break; }
            }
            if (!r.ok) {
              const gate = (r.status === 401 || r.status === 402 || r.status === 403);
              return { ...t, ok: false, status: r.status, error: gate ? 'plan' : 'error', triedPath: usedPath, note: scrub(r.text, key).slice(0, 120) };
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
              metricKeys: sum.metricKeys.slice(0, 16),
              usedPath,
            };
          } catch (e) {
            return { ...t, ok: false, status: 0, error: 'unreachable', note: scrub(e.message, key).slice(0, 100) };
          }
        }));
        rows.push(...done);
      }
      const gated = rows.filter(r => r.error === 'plan').length;
      const broken = mapped.filter(r => r.needRefresh || r.expired).map(r => ({ name: r.name, platform: r.platform, expired: r.expired }));
      return res.end(JSON.stringify({
        fetched: new Date().toISOString(), period,
        accounts: list.length, attempted: rows.length, skipped,
        planGated: gated,
        stale: rows.filter(r => r.ok && r.suspectStale).map(r => r.name),
        broken,
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
module.exports.outline = outline;
module.exports.platformFor = platformFor;
module.exports.findAccountArrays = findAccountArrays;
module.exports.scrub = scrub;
