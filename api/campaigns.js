// ═══════════════════════════════════════════════════════════════════
// /api/campaigns — pulls 2026 campaign data from Notion server-side and
// returns it as JSON. Notion is the source of truth for campaign planning;
// Doom only READS it (never writes) so the marketing team keeps working
// where they already work. Gated by the session cookie at the middleware
// layer, same as /api/calendar.
// ═══════════════════════════════════════════════════════════════════
// Requires NOTION_API_KEY (an internal Notion integration token) in the
// Vercel environment, and both databases shared with that integration.
// ═══════════════════════════════════════════════════════════════════

// Data source IDs (stable Notion collection IDs):
// - 2026 Partnerships, Campaigns & Events — flights, traffic due dates,
//   spot lengths, stations. Includes events/community rows we just park.
// - Campaign Management — the paid social / digital campaign records.
const SOURCES = [
  { id: '2c5991a2-b603-8199-b582-000b2b6e7fa1', src: 'events' },
  { id: '23a991a2-b603-8040-a004-000bc84cdca8', src: 'mgmt' },
];

const NOTION_VERSION = '2025-09-03';

// Flatten one Notion property value to a plain JS value by its type.
function propVal(p) {
  if (!p) return null;
  switch (p.type) {
    case 'title': return (p.title || []).map(t => t.plain_text).join('').trim() || null;
    case 'rich_text': return (p.rich_text || []).map(t => t.plain_text).join('').trim() || null;
    case 'select': return p.select ? p.select.name : null;
    case 'status': return p.status ? p.status.name : null;
    case 'multi_select': return (p.multi_select || []).map(o => o.name);
    case 'date': return p.date ? { start: p.date.start || null, end: p.date.end || null } : null;
    case 'number': return p.number;
    case 'checkbox': return !!p.checkbox;
    case 'url': return p.url || null;
    default: return null;
  }
}

const dateStart = (d) => (d && d.start ? String(d.start).slice(0, 10) : null);
const dateEnd = (d) => (d && d.end ? String(d.end).slice(0, 10) : null);

// Normalize a row from either database into one shared shape the app renders.
function normalize(page, src) {
  const P = page.properties || {};
  const g = (name) => propVal(P[name]);
  const base = {
    id: page.id,
    src,
    url: page.url || null,
    edited: page.last_edited_time || null,
  };
  if (src === 'events') {
    const flight = g('Campaign Flight');
    return {
      ...base,
      name: g('Event/Campaign Name'),
      brand: g('Brand'),
      status: g('Status'),
      dmas: g('DMA') || [],
      category: g('Category'),
      eventDate: dateStart(g('Event date')),
      flightStart: dateStart(flight),
      flightEnd: dateEnd(flight),
      trafficDue: dateStart(g('Traffic Due Date')),
      assets: g('Asset Types Needed') || [],
      spots: g('Spot Length(s)') || [],
      stations: g('Stations / Outlets'),
      partners: (g('Partner') || []).filter(x => x !== 'Yes' && x !== 'No'),
      notes: g('Notes'),
      cost: g('Cost'),
    };
  }
  // mgmt — Campaign Management (paid social / digital)
  return {
    ...base,
    name: g('Campaign Name'),
    brand: g('Brand'),
    status: g('Status'),
    channels: g('Channels') || [],
    markets: g('Target Markets') || [],
    types: g('Campaign Type') || [],
    launch: dateStart(g('Launch Date')),
    targetLaunch: dateStart(g('Target Launch Date')),
    completed: dateStart(g('Completion Date')),
    rush: g('Rush Launch') === true,
    description: g('Campaign Description'),
  };
}

async function queryAll(dsId, token) {
  const rows = [];
  let cursor = undefined;
  // Paginate; each database here is small (dozens of rows), cap defensively.
  for (let i = 0; i < 10; i++) {
    const resp = await fetch('https://api.notion.com/v1/data_sources/' + dsId + '/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error('Notion ' + resp.status + ': ' + body.slice(0, 300));
    }
    const data = await resp.json();
    rows.push(...(data.results || []));
    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
  return rows;
}

// 5-minute in-memory cache — Notion planning data doesn't change minute to
// minute, and this keeps a busy day of page opens well under rate limits.
let CACHE = { ts: 0, data: null };
const CACHE_MS = 5 * 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = (process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '').trim();
  if (!token) {
    return res.status(500).json({ error: 'not_configured', message: 'NOTION_API_KEY is not set in the Vercel environment.' });
  }

  const force = (req.query && req.query.refresh) || (req.body && req.body.refresh);
  if (!force && CACHE.data && Date.now() - CACHE.ts < CACHE_MS) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  try {
    const results = await Promise.all(SOURCES.map(async (s) => {
      try {
        const rows = await queryAll(s.id, token);
        return { src: s.src, rows: rows.map(p => normalize(p, s.src)), error: null };
      } catch (e) {
        // One database failing (e.g. not shared with the integration yet)
        // shouldn't blank the other — return per-source errors instead.
        return { src: s.src, rows: [], error: String(e.message || e) };
      }
    }));
    const out = {
      fetched: new Date().toISOString(),
      campaigns: results.flatMap(r => r.rows),
      errors: results.filter(r => r.error).map(r => ({ src: r.src, error: r.error })),
    };
    if (out.campaigns.length > 0) CACHE = { ts: Date.now(), data: out };
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: 'notion_failed', message: String(e.message || e) });
  }
};
