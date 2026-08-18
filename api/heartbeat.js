// The daily heartbeat — Doom's alerts, delivered even when nobody opens Doom.
//
// The app computes its alert feed in the browser (OOH creative dues, flight
// ends, rotation pressure — the Command Center list) and writes it to
// appData/alertFeed on every session (see the ALERT HEARTBEAT FEED effect in
// app.js). This endpoint, run by a Vercel cron each morning, re-ages that
// feed against today's calendar and emails the digest through the same n8n
// pipe the traffic sends use. If the feed says "due in 6 days" and it was
// written 4 days ago, the email says "due in 2".
//
// Safety: self-throttled to one send per 20 hours via appData/heartbeatLog,
// so a stray extra invocation (or an abusive one) can't turn into spam. If
// CRON_SECRET is set in the environment, the Authorization header must match.
// Response bodies carry counts only — never the alert contents.

const { getSupabase } = require('./_supabase');

const ALERT_TO = process.env.ALERT_EMAIL || 'emm.caban@atticor.ai';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://doomndeliverables.app.n8n.cloud/webhook/9661ec80-6bd8-4cf5-acca-90f2547a75eb';

async function readDoc(supabase, docId) {
  const { data, error } = await supabase
    .from('legacy_docs').select('data')
    .eq('collection', 'appData').eq('doc_id', docId).maybeSingle();
  if (error) throw error;
  if (!data || data.data == null) return null;
  return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
}

async function writeDoc(supabase, docId, obj) {
  const { error } = await supabase.from('legacy_docs').upsert(
    { collection: 'appData', doc_id: docId, data: JSON.stringify(obj), ts: Date.now(), updated_at: new Date().toISOString() },
    { onConflict: 'collection,doc_id' }
  );
  if (error) throw error;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function line(color, label, msg) {
  return `<tr><td style="padding:6px 10px;border-left:3px solid ${color};font-family:Arial,sans-serif;font-size:13px;color:#333"><b style="color:${color}">${label}</b> — ${esc(msg)}</td></tr>`;
}

module.exports = async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    if ((req.headers['authorization'] || '') !== 'Bearer ' + process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  let supabase;
  try { supabase = getSupabase(); }
  catch (e) { return res.status(503).json({ error: 'Storage unavailable' }); }

  let feed, log;
  try {
    feed = await readDoc(supabase, 'alertFeed');
    log = (await readDoc(supabase, 'heartbeatLog')) || {};
  } catch (e) { return res.status(500).json({ error: 'Read failed' }); }

  const now = Date.now();
  if (log.lastSentAt && now - new Date(log.lastSentAt).getTime() < 20 * 3600 * 1000) {
    return res.status(200).json({ skipped: 'throttled' });
  }
  if (!feed || !Array.isArray(feed.items)) {
    try { await writeDoc(supabase, 'heartbeatLog', { ...log, lastRunAt: new Date().toISOString(), note: 'no feed' }); } catch (e) {}
    return res.status(200).json({ skipped: 'no feed' });
  }

  // Re-age the feed: "in 6d" written 4 days ago is "in 2d" today.
  const ageDays = Math.floor((now - new Date(feed.computedAt || 0).getTime()) / 864e5);
  const items = feed.items.map(a => ({ ...a, days: (typeof a.days === 'number' ? a.days - ageDays : null) }));

  const overdue = items.filter(a => a.overdue || (a.days != null && a.days < 0));
  const today = items.filter(a => !overdue.includes(a) && a.days === 0);
  const soon = items.filter(a => a.days != null && a.days >= 1 && a.days <= 3);
  const week = items.filter(a => a.days != null && a.days >= 4 && a.days <= 7);

  if (!overdue.length && !today.length && !soon.length) {
    try { await writeDoc(supabase, 'heartbeatLog', { ...log, lastRunAt: new Date().toISOString(), note: 'quiet' }); } catch (e) {}
    return res.status(200).json({ skipped: 'nothing pressing', week: week.length });
  }

  const n = overdue.length + today.length + soon.length;
  const subject = `Doom — ${n} thing${n !== 1 ? 's' : ''} need${n === 1 ? 's' : ''} you${overdue.length ? ' (' + overdue.length + ' overdue)' : ''}`;
  const rows = [
    ...overdue.map(a => line('#E85A7A', 'OVERDUE', a.msg)),
    ...today.map(a => line('#E85A7A', 'TODAY', a.msg)),
    ...soon.map(a => line('#D4A040', 'in ' + a.days + 'd', a.msg)),
    ...week.map(a => line('#9B8EAD', 'in ' + a.days + 'd', a.msg)),
  ].join('');
  const stale = ageDays >= 5
    ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#E85A7A">This is working from a feed last computed ${ageDays} days ago — open Doom to refresh it; new items since then aren't in this list.</p>`
    : '';
  const message = `
<div style="max-width:640px">
  <p style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:#6B5E80">You weren't going to check, so I checked for you. — Doom</p>
  <table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">${rows}</table>
  ${stale}
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Dismissing an alert in Doom removes it from tomorrow's email. This digest sends at most once a day, and only when something is due within 3 days or overdue.</p>
</div>`;

  try {
    const r = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: ALERT_TO, cc: '', subject, message })
    });
    if (!r.ok) return res.status(502).json({ error: 'Send failed' });
  } catch (e) { return res.status(502).json({ error: 'Send failed' }); }

  try { await writeDoc(supabase, 'heartbeatLog', { lastRunAt: new Date().toISOString(), lastSentAt: new Date().toISOString(), lastCount: n }); } catch (e) {}
  return res.status(200).json({ sent: true, count: n });
};
