// ═══════════════════════════════════════════════════════════════════
// /api/ical-pull — pull a partner's calendar INTO Mayhem.
//
// The other half of /api/calendar-feed: a partner (Jordan) shares her
// Google Calendar's "secret address in iCal format" once; Mayhem
// fetches it server-side (no CORS wall) and returns parsed events.
// The client diffs them against the book and Emm approves what enters
// — nothing writes itself.
//
// Guards: requires a valid dd_session cookie (only signed-in users can
// trigger a pull), https only, and the host must be a known calendar
// provider — never an arbitrary URL (no poking at internal services).
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');

const ALLOWED_HOSTS = [
  'calendar.google.com',
  'outlook.office365.com',
  'outlook.live.com',
  'p1-calendarws.icloud.com', 'p2-calendarws.icloud.com',
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

function unescapeIcs(s) {
  return String(s || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
function icsDate(v) {
  const m = String(v || '').match(/(\d{4})(\d{2})(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}
function prevDay(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return iso;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function parseIcs(text) {
  const unfolded = String(text).replace(/\r?\n[ \t]/g, '');
  const out = [];
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);
  for (const raw of blocks) {
    const body = raw.split('END:VEVENT')[0];
    const ev = {};
    for (const line of body.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z-]+)(;[^:]*)?:(.*)$/);
      if (!m) continue;
      const key = m[1].toUpperCase(); const params = m[2] || ''; const val = m[3];
      if (key === 'SUMMARY') ev.summary = unescapeIcs(val).trim();
      else if (key === 'LOCATION') ev.location = unescapeIcs(val).trim();
      else if (key === 'DESCRIPTION') ev.description = unescapeIcs(val).trim().slice(0, 500);
      else if (key === 'UID') ev.uid = val.trim();
      else if (key === 'STATUS') ev.status = val.trim();
      else if (key === 'RRULE') ev.recurring = true;
      else if (key === 'DTSTART') { ev.start = icsDate(val); ev.allDay = /VALUE=DATE(;|$)/.test(params) || /^\d{8}$/.test(val.trim()); }
      else if (key === 'DTEND') { ev.endRaw = icsDate(val); ev.endAllDay = /VALUE=DATE(;|$)/.test(params) || /^\d{8}$/.test(val.trim()); }
    }
    if (!ev.summary || !ev.start) continue;
    if (/cancelled/i.test(ev.status || '')) continue;
    // all-day DTEND is exclusive in ICS
    ev.end = ev.endRaw ? (ev.endAllDay ? prevDay(ev.endRaw) : ev.endRaw) : null;
    if (ev.end === ev.start) ev.end = null;
    delete ev.endRaw; delete ev.endAllDay; delete ev.status;
    out.push(ev);
  }
  return out;
}

const handler = async function (req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!validSession(req.headers.cookie)) return res.status(401).json({ error: 'Sign in to Doom first' });

  const url = String((req.body || {}).url || '').trim();
  let parsed;
  try { parsed = new URL(url); } catch (e) { return res.status(400).json({ error: 'Not a valid URL' }); }
  if (parsed.protocol !== 'https:') return res.status(400).json({ error: 'https links only' });
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(400).json({ error: 'Unsupported calendar host', detail: 'Allowed: ' + ALLOWED_HOSTS.join(', ') + '. Google Calendar links come from Settings → Integrate calendar → “Secret address in iCal format”.' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const r = await fetch(url, { redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'MayhemCalendarPull/1.0' } });
    clearTimeout(timer);
    if (!r.ok) return res.status(502).json({ error: 'Calendar returned ' + r.status, detail: 'If this is a Google secret address, it may have been reset — ask for a fresh link.' });
    const text = (await r.text()).slice(0, 3000000);
    if (!/BEGIN:VCALENDAR/.test(text)) return res.status(502).json({ error: 'That link did not return a calendar' });
    const events = parseIcs(text);
    return res.status(200).json({ fetched: new Date().toISOString(), count: events.length, events: events.slice(0, 500) });
  } catch (e) {
    return res.status(502).json({ error: 'Could not load the calendar', detail: String((e && e.message) || e).slice(0, 140) });
  }
};

module.exports = handler;
module.exports.parseIcs = parseIcs; // exported for tests
