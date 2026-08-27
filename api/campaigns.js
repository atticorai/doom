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


// ── CREATE (POST with a name) ──────────────────────────────────────
// The Hub's intake form keeps the record in Doom AND files it in Notion so
// the marketing team sees it where they already work. Targets the Campaign
// Management data source; DMA market names are folded to the states that
// database tracks.
const MGMT_DS = '23a991a2-b603-8040-a004-000bc84cdca8';
const NOTION_BRAND = { 'Lerner & Rowe': 'Lerner and Rowe', 'Keches Law Group': 'Keches Law' };
const NOTION_CHANNELS = ['Paid Search', 'Paid Social', 'Organic Social', 'TV', 'Radio', 'OOH', 'CTV/OTT', 'SEO', 'Email/SMS', 'Lead Gen', 'Media', 'Website'];
const CHANNEL_MAP = { 'Streaming Audio': 'Media' };
const DMA_STATE = { 'Chicago': 'Illinois', 'Cincinnati': 'Ohio', 'Denver': 'Colorado', 'Minneapolis': 'Minnesota', 'Birmingham': 'Alabama', 'Huntsville': 'Alabama', 'Montgomery': 'Alabama', 'Dothan': 'Alabama', 'Gadsden': 'Alabama', 'Knoxville': 'Tennessee', 'Chattanooga': 'Tennessee', 'Nashville': 'Tennessee', 'Oklahoma City': 'Oklahoma', 'Tulsa': 'Oklahoma', 'Boston': 'Massachusetts', 'Phoenix': 'Arizona', 'Tucson': 'Arizona', 'Flagstaff': 'Arizona', 'Yuma': 'Arizona', 'Bullhead': 'Arizona', 'Las Vegas': 'Nevada', 'Reno': 'Nevada', 'Albuquerque': 'New Mexico', 'Seattle': 'Washington', 'Panama City': 'Florida' };

async function createInNotion(body, token) {
  const name = String(body.name || '').trim().slice(0, 200);
  if (!name) { const e = new Error('missing_name'); e.code = 400; throw e; }
  const brand = NOTION_BRAND[body.brand] || body.brand || null;
  const channels = (Array.isArray(body.channels) ? body.channels : [])
    .map(c => CHANNEL_MAP[c] || c).filter(c => NOTION_CHANNELS.includes(c));
  const states = [...new Set(String(body.markets || '').split(',').map(s => s.trim()).filter(Boolean)
    .map(m => DMA_STATE[m] || null).filter(Boolean))];
  const descBits = [String(body.description || '').trim()];
  if (body.markets) descBits.push('Markets: ' + String(body.markets).trim());
  if (body.trafficDue) descBits.push('Traffic due: ' + String(body.trafficDue).slice(0, 10));
  descBits.push('Filed from Doom & Deliverables Campaign Hub.');
  const properties = {
    'Campaign Name': { title: [{ text: { content: name } }] },
    'Status': { status: { name: 'Planning' } },
    'Campaign Description': { rich_text: [{ text: { content: descBits.filter(Boolean).join(' | ').slice(0, 1900) } }] },
  };
  if (brand) properties['Brand'] = { select: { name: brand } };
  if (channels.length) properties['Channels'] = { multi_select: channels.map(c => ({ name: c })) };
  if (states.length) properties['Target Markets'] = { multi_select: states.map(s => ({ name: s })) };
  if (body.launch) properties['Target Launch Date'] = { date: { start: String(body.launch).slice(0, 10) } };
  // With a pageId this becomes an in-place update of the page Mayhem already
  // created — Status is left alone so Notion-side workflow moves aren't
  // stomped. If the page was deleted/archived over there, fall through to a
  // fresh create so the push still lands.
  const pageId = String(body.pageId || '').trim();
  if (pageId) {
    const upd = { ...properties };
    delete upd['Status'];
    const uresp = await fetch('https://api.notion.com/v1/pages/' + pageId, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: upd }),
    });
    const udata = await uresp.json().catch(() => ({}));
    if (uresp.ok) return { id: udata.id || pageId, url: udata.url || null, updated: true };
    if (uresp.status !== 404 && !/archiv/i.test(String(udata.message || ''))) {
      const e = new Error('Notion ' + uresp.status + ': ' + String(udata.message || '').slice(0, 300)); e.code = 502; throw e;
    }
  }
  const resp = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { type: 'data_source_id', data_source_id: MGMT_DS }, properties }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) { const e = new Error('Notion ' + resp.status + ': ' + String(data.message || '').slice(0, 300)); e.code = 502; throw e; }
  return { id: data.id, url: data.url || null };
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

  if (req.method === 'POST' && req.body && req.body.name) {
    try {
      const created = await createInNotion(req.body, token);
      CACHE = { ts: 0, data: null }; // the next pull should see the new row
      return res.status(200).json(created);
    } catch (e) {
      return res.status(e.code === 400 ? 400 : 502).json({ error: 'create_failed', message: String(e.message || e) });
    }
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
