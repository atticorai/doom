// ═══════════════════════════════════════════════════════════════════
// /api/calendar — reads a published .ics calendar feed (Outlook/Google)
// server-side and returns upcoming events as JSON. Avoids browser CORS and
// Microsoft's iframe blocking, and lets the app flag campaign due dates.
// ═══════════════════════════════════════════════════════════════════
// POST { url } where url is the published Outlook "ICS" link (Settings →
// Calendar → Shared calendars → Publish → ICS). Gated by the session cookie
// at the middleware layer. Host allow-list prevents SSRF.
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_HOSTS = new Set([
  'outlook.office365.com', 'outlook.office.com', 'outlook.live.com',
  'calendar.google.com',
]);

// RFC5545 line unfolding: a CRLF (or LF) followed by space/tab continues the
// previous line.
function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

function unescapeText(v) {
  return (v || '').replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

// Parse an ICS date/datetime value to {ms, allDay}. Handles 20260615,
// 20260615T130000, 20260615T130000Z. Timezone nuance is ignored — date-level
// precision is all we need for campaign flags.
function parseICSDate(raw) {
  const m = (raw || '').match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss] = m;
  const allDay = !hh;
  const ms = Date.UTC(+y, +mo - 1, +d, +(hh || 0), +(mm || 0), +(ss || 0));
  return { ms, allDay };
}

function parseICS(text) {
  const unfolded = unfold(text);
  const events = [];
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);
  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0];
    const ev = {};
    body.split(/\r?\n/).forEach(line => {
      const c = line.indexOf(':');
      if (c < 0) return;
      const rawName = line.slice(0, c);
      const value = line.slice(c + 1);
      const name = rawName.split(';')[0].toUpperCase();
      if (name === 'SUMMARY') ev.title = unescapeText(value);
      else if (name === 'DTSTART') { const d = parseICSDate(value); if (d) { ev.start = d.ms; ev.allDay = d.allDay; } }
      else if (name === 'DTEND') { const d = parseICSDate(value); if (d) ev.end = d.ms; }
      else if (name === 'LOCATION') ev.location = unescapeText(value);
      else if (name === 'DESCRIPTION') ev.description = unescapeText(value).slice(0, 300);
    });
    if (ev.title && ev.start) events.push(ev);
  }
  return events;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = (req.body && req.body.url || '').trim();
  if (!url) return res.status(400).json({ error: 'Missing url' });
  let parsed;
  try { parsed = new URL(url); } catch (e) { return res.status(400).json({ error: 'Invalid URL' }); }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(400).json({ error: 'Only published Outlook/Google calendar (.ics) links are allowed' });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(parsed.toString(), { signal: ctrl.signal, headers: { 'User-Agent': 'DoomDeliverables/1.0' } });
    clearTimeout(t);
    if (!r.ok) return res.status(502).json({ error: 'Calendar feed returned ' + r.status });
    const text = await r.text();
    const all = parseICS(text);
    // Keep a useful window: from yesterday to ~120 days out, soonest first.
    const now = Date.now();
    const from = now - 24 * 3600 * 1000;
    const to = now + 120 * 24 * 3600 * 1000;
    const events = all.filter(e => e.start >= from && e.start <= to).sort((a, b) => a.start - b.start).slice(0, 100);
    return res.status(200).json({ ok: true, events, count: events.length });
  } catch (e) {
    console.error('calendar fetch error:', e.message);
    return res.status(502).json({ error: 'Could not read the calendar feed' });
  }
};
