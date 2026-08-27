// ═══════════════════════════════════════════════════════════════════
// /api/calendar-feed — live ICS calendar feeds from the Mayhem book.
//
// Outlook and Google Calendar both subscribe to a URL and refresh on
// their own, so the book stays the single source of truth and everyone
// keeps their own calendar app. Two scopes:
//   internal — everything: campaigns, ticket due-backs, payment dues,
//              all brands (for Emm / Hazel's own Outlook).
//   brand    — ONE brand's campaigns/events only: name, dates, location,
//              owner. No money, no tickets, no internal notes. Safe to
//              hand a partner (Jordan's L&R master calendar).
//
// Auth: this path is not session-gated by middleware (a calendar app
// can't log in), so the endpoint gates itself:
//   ?token=...     → serves ICS when the token matches MAYHEM_CAL_FEEDS.
//   ?info=1        → lists the configured subscribe URLs; requires a
//                    valid dd_session cookie (same HMAC as middleware).
// MAYHEM_CAL_FEEDS (Vercel env) is JSON: {"<token>": {"scope":"internal"},
// "<token2>": {"scope":"brand","brand":"Lerner & Rowe"}}. Unknown token →
// 404. Env unset → 503 with honest guidance, never a fake feed.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');

function feedsConfig() {
  try {
    const raw = (process.env.MAYHEM_CAL_FEEDS || '').trim();
    if (!raw) return null;
    const j = JSON.parse(raw);
    return j && typeof j === 'object' ? j : null;
  } catch (e) { return null; }
}

function timingSafeEq(a, b) {
  const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Same session validation the middleware performs (node flavor).
function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const seed = (process.env.SYS_PASSWORD || '') + '|' + (process.env.ADMIN_PASSWORD || '');
  if (!seed || seed === '|') return null;
  return crypto.createHash('sha256').update('dd:session:' + seed).digest('hex');
}
function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function validSession(cookieHeader) {
  const m = String(cookieHeader || '').match(/dd_session=([^;]+)/);
  if (!m) return false;
  const token = decodeURIComponent(m[1]);
  const parts = token.split('.');
  const secret = sessionSecret();
  if (!secret) return false;
  const sign = (msg) => b64url(crypto.createHmac('sha256', secret).update(msg).digest());
  if (parts.length === 4) {
    const [u, id, expiry, sig] = parts;
    if (Number(expiry) < Date.now()) return false;
    return timingSafeEq(sign(u + '.' + id + '.' + expiry), sig);
  }
  if (parts.length === 3) {
    const [id, expiry, sig] = parts;
    if (Number(expiry) < Date.now()) return false;
    return timingSafeEq(sign(id + '.' + expiry), sig);
  }
  return false;
}

async function loadBook() {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase not configured' };
  const { data: row, error } = await supabase
    .from('legacy_docs').select('data')
    .eq('collection', 'appData').eq('doc_id', 'mayhemB7').maybeSingle();
  if (error) return { error: String(error.message || error) };
  if (!row || row.data == null) return { error: 'No saved Mayhem book yet — open Mayhem once so it saves.' };
  let doc = row.data;
  if (typeof doc === 'string') { try { doc = JSON.parse(doc); } catch (e) { return { error: 'Book unreadable' }; } }
  const state = doc && doc.data ? doc.data : doc;
  if (!state || !state.brands) return { error: 'Book has no brand data yet.' };
  return { state };
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const dt = (iso) => String(iso || '').replace(/-/g, '');
function addDay(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return iso;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildIcs(state, scope, brandFilter, calName) {
  const ev = [];
  const push = (uid, start, end, summary, description, location, category) => {
    if (!DATE_RE.test(start)) return;
    const until = DATE_RE.test(String(end || '')) ? addDay(end) : addDay(start);
    ev.push(['BEGIN:VEVENT', 'UID:' + esc(uid) + '@mayhem.doom',
      'DTSTAMP:' + dt(start) + 'T000000Z',
      'DTSTART;VALUE=DATE:' + dt(start), 'DTEND;VALUE=DATE:' + dt(until),
      'SUMMARY:' + esc(summary),
      description ? 'DESCRIPTION:' + esc(description) : null,
      location ? 'LOCATION:' + esc(location) : null,
      category ? 'CATEGORIES:' + esc(category) : null,
      'END:VEVENT'].filter(Boolean).join('\r\n'));
  };
  for (const b in state.brands) {
    if (brandFilter && b !== brandFilter) continue;
    const mkts = state.brands[b].markets || {};
    for (const d in mkts) {
      for (const c of (mkts[d].commitments || [])) {
        if (!c.anchor) continue;
        if (/denied/i.test(String(c.state || ''))) continue;
        const desc = scope === 'internal'
          ? [c.kind, c.partner && ('Partner: ' + c.partner), c.owner && ('Owner: ' + c.owner), (c.money && typeof c.money.final === 'number' && c.money.final > 0) ? ('Final: $' + c.money.final.toLocaleString()) : null].filter(Boolean).join(' · ')
          : [c.kind, c.partner && ('Partner: ' + c.partner), c.owner && ('Owner: ' + c.owner)].filter(Boolean).join(' · ');
        push(c.id || (b + '-' + d + '-' + c.name), c.anchor, c.endDate, c.name + ' — ' + b + ' · ' + d, desc, c.location || d, b);
      }
    }
  }
  if (scope === 'internal') {
    for (const t of (state.tickets || [])) {
      if (!t.due || t.status === 'Closed') continue;
      push('tk-' + t.id, t.due, null, 'DUE BACK: ' + (t.ask || t.type) + ' — ' + (t.owner || t.ownerRole || ''), (t.brand || '') + (t.dma ? ' · ' + t.dma : '') + ' · ' + (t.status || ''), '', t.brand || '');
    }
    for (const p of (state.payments || [])) {
      if (!p.due || p.status === 'Paid') continue;
      push('pay-' + p.id, p.due, null, 'PAYMENT DUE: ' + (p.vendor || '') + ' $' + Number(p.amount || 0).toLocaleString(), (p.brand || '') + ' · ' + (p.dma || '') + ' · ' + (p.status || ''), '', p.brand || '');
    }
  }
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mayhem & Marketing Ops//Calendar Feed//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + esc(calName),
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
    ev.join('\r\n'), 'END:VCALENDAR'].join('\r\n');
}

const handler = async function (req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const feeds = feedsConfig();
  const q = req.query || {};

  if (q.info) {
    if (!validSession(req.headers.cookie)) return res.status(401).json({ error: 'Sign in to Doom first' });
    if (!feeds) {
      // Honest setup guidance with ready-to-paste tokens — nothing fake.
      const suggest = {};
      suggest[crypto.randomBytes(24).toString('hex')] = { scope: 'internal' };
      suggest[crypto.randomBytes(24).toString('hex')] = { scope: 'brand', brand: 'Lerner & Rowe' };
      return res.status(200).json({ configured: false, message: 'Feeds are not configured yet. Add MAYHEM_CAL_FEEDS to the Vercel environment (JSON below is a ready-to-paste example with fresh random tokens), redeploy, and this panel will show the subscribe URLs.', example: JSON.stringify(suggest) });
    }
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const base = 'https://' + host + '/api/calendar-feed?token=';
    return res.status(200).json({ configured: true, feeds: Object.entries(feeds).map(([tok, cfg]) => ({ url: base + tok, scope: cfg.scope, brand: cfg.brand || null })) });
  }

  const token = String(q.token || '');
  if (!token) return res.status(400).json({ error: 'token required' });
  if (!feeds) return res.status(503).json({ error: 'Feeds not configured', detail: 'Set MAYHEM_CAL_FEEDS in the Vercel environment.' });
  const matchKey = Object.keys(feeds).find((k) => timingSafeEq(k, token));
  if (!matchKey) return res.status(404).json({ error: 'Not found' });
  const cfg = feeds[matchKey] || {};

  const book = await loadBook();
  if (book.error) return res.status(503).json({ error: 'Book unavailable', detail: book.error });

  const scope = cfg.scope === 'brand' ? 'brand' : 'internal';
  const brand = scope === 'brand' ? String(cfg.brand || '') : null;
  if (scope === 'brand' && !book.state.brands[brand]) return res.status(503).json({ error: 'Configured brand not in the book', detail: brand });

  const name = scope === 'brand' ? brand + ' — Events (Mayhem)' : 'Mayhem & Marketing Ops — Full Book';
  const ics = buildIcs(book.state, scope, brand, name);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="mayhem-calendar.ics"');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(ics);
};

module.exports = handler;
module.exports.buildIcs = buildIcs; // exported for tests
