// ═══════════════════════════════════════════════════════════════════
// /api/legacy-assets-export — CSV manifest of every legacy_asset row
// where type is NOT 'TV' and NOT 'Radio'.
// ═══════════════════════════════════════════════════════════════════
// Built for the user's "other app" hand-off: returns one CSV row per
// non-broadcast asset (logos, OOH, banners, social, b-roll, print,
// docs, other) with filename, type, brand, market, year, Supabase
// public URL, and original Drive path/ID.
//
// Gated by the existing dd_session cookie (middleware enforces it).
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');

const CSV_COLS = [
  'filename',
  'type',
  'brand',
  'market',
  'year',
  'mime_type',
  'file_size',
  'width',
  'height',
  'duration_sec',
  'supabase_url',
  'supabase_path',
  'drive_id',
  'drive_path',
  'classifier_note',
  'created_at',
];

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  try {
    // Page through to avoid the default 1000-row cap.
    const PAGE = 1000;
    let from = 0;
    const rows = [];
    while (true) {
      const { data, error } = await supabase
        .from('legacy_assets')
        .select(CSV_COLS.join(','))
        .not('type', 'in', '(TV,Radio)')
        .order('type', { ascending: true })
        .order('year', { ascending: false })
        .order('filename', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    const header = CSV_COLS.join(',');
    const body = rows.map(r => CSV_COLS.map(c => csvEscape(r[c])).join(',')).join('\n');
    const csv = header + '\n' + body + (body ? '\n' : '');

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="legacy-assets-non-broadcast-${stamp}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (e) {
    console.error('legacy-assets-export error:', e);
    return res.status(500).json({ error: 'Export failed', detail: e.message });
  }
};
