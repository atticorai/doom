// ═══════════════════════════════════════════════════════════════════
// /api/buy-abyss — The Buy Abyss (Lerner & Rowe media buying) on real
// Postgres rows, not the legacy_docs blob.
// ═══════════════════════════════════════════════════════════════════
// Tables + the two authoritative acts live in supabase/buy_abyss.sql.
// This endpoint is a thin, whitelisted door to them: it never inserts
// into ba_approved_plan or ba_schedule_of_record itself — it calls
// ba_approve_plan() / ba_apply_confirmation(), and the database refuses
// any other writer. Identity comes from the signed dd_session cookie
// (same as /api/users); the client is never trusted for who did what.
//
// Gated by middleware.js (listed in its protected set).
//
// Actions (POST { action, ... }):
//   overview                              every market/year with current version + budget
//   load {market_year_id}                 everything for one market/year (screens read this)
//   history {market}                      2026 history rows (reference only, never a target)
//   saveWorkingPlan {market_year_id, plan, flighting, demo, goals, posting, approver}
//   setBudget {market_year_id, media?, amount, set_by, source?, note?}
//   upsertVendorGroup {market_year_id, id?, name, rep_name?, rep_email?, rep_phone?, notes?, guidelines_status?, order_status?, confirmation_status?}
//   upsertStation {market_year_id, id?, call_sign, media, vendor_group_id?, owner?, owner_source?, on_buy?, on_avail_request?, added_from?, format?, notes?}
//   assignEstimate {market_year_id, media, number, label?}
//   approve {market_year_id, approver, finance_override?, note?}     → ba_approve_plan()
//   approvedSnapshot {approved_plan_id}   the frozen JSON of one version
//   addOrderDocument {market_year_id, approved_plan_id?, station_id?, vendor_group_id?, kind, file_name?, file_url?, file_sha256?, reader?, printed_gross?, printed_net?, parsed_lines?, foot_checks?, foot_ok?}
//   applyConfirmation {order_document_id}                            → ba_apply_confirmation()
//   logRevision {market_year_id, approved_plan_id, station_id, order_document_id, kind, changes}
//   addNote {entity_type, entity_id, text}
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');
const { validateSessionToken, userFromToken, getSessionSecret } = require('./auth');

const MEDIA = ['TV', 'Cable', 'Radio', 'Streaming Audio', 'Digital Video'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function callerName(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/dd_session=([^;]+)/);
  const tok = m ? decodeURIComponent(m[1]) : '';
  const secret = getSessionSecret();
  if (!tok || !secret || !validateSessionToken(tok, secret)) return null;
  return userFromToken(tok) || 'Staff';
}

class Bad extends Error { constructor(msg, status) { super(msg); this.status = status || 400; } }
const need = (v, what) => { if (v === undefined || v === null || v === '') throw new Bad('Missing ' + what); return v; };
const uuid = (v, what) => { need(v, what); if (!UUID_RE.test(String(v))) throw new Bad(what + ' is not a uuid'); return String(v); };
const num = (v, what) => { if (v === undefined || v === null || v === '') return null; const n = Number(v); if (!Number.isFinite(n)) throw new Bad(what + ' is not a number'); return n; };
const media = (v) => { need(v, 'media'); if (!MEDIA.includes(v)) throw new Bad('media must be one of ' + MEDIA.join(', ')); return v; };
const str = (v, max) => (v === undefined || v === null) ? null : String(v).slice(0, max || 4000);
const bool = (v) => v === true || v === 'true' || v === 1;
const json = (v, what) => { if (v === undefined || v === null) return null; if (typeof v === 'string') { try { return JSON.parse(v); } catch (e) { throw new Bad(what + ' is not JSON'); } } return v; };

async function q(p) { const { data, error } = await p; if (error) throw error; return data; }

// Postgres raises the QA gate and the invariants as exceptions; surface
// the message as-is (they are written for the person, not the log).
function sqlStatus(e) {
  const m = String(e && e.message || '');
  if (/^QA:|insert-only|only from ba_approve_plan|never writes to ba_working_plan|only by ba_apply_confirmation|has not footed|already applied|must state which approved|must belong to a station/.test(m)) return 409;
  return 500;
}

const handlers = {
  async overview(sb) {
    const years = await q(sb.from('ba_market_year').select('*').order('market'));
    const current = await q(sb.from('ba_approved_current').select('id, market_year_id, version, approver, approved_at, plan_total_net, budget_total, finance_override'));
    const budgets = await q(sb.from('ba_budget').select('market_year_id, media, amount').is('superseded_at', null));
    const stations = await q(sb.from('ba_station').select('market_year_id, on_buy'));
    const sor = await q(sb.from('ba_schedule_of_record').select('market_year_id').is('superseded_at', null));
    const by = (rows, k) => rows.reduce((m, r) => { (m[r[k]] = m[r[k]] || []).push(r); return m; }, {});
    const cur = by(current, 'market_year_id'), bud = by(budgets, 'market_year_id'), sta = by(stations, 'market_year_id'), rec = by(sor, 'market_year_id');
    return { market_years: years.map(y => ({
      ...y,
      approved: (cur[y.id] || [])[0] || null,
      budget_total: ((bud[y.id] || []).find(b => b.media === null) || {}).amount ?? null,
      budget_allocations: (bud[y.id] || []).filter(b => b.media !== null),
      stations_on_buy: (sta[y.id] || []).filter(s => s.on_buy).length,
      stations_total: (sta[y.id] || []).length,
      confirmed_stations: (rec[y.id] || []).length,
    })) };
  },

  async load(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const [market_year, budgets, vendor_groups, stations, estimates, working_plan, versions, current, order_documents, schedule_of_record, revisions, packages, variance] = await Promise.all([
      q(sb.from('ba_market_year').select('*').eq('id', id).maybeSingle()),
      q(sb.from('ba_budget').select('*').eq('market_year_id', id).order('created_at')),
      q(sb.from('ba_vendor_group').select('*').eq('market_year_id', id).order('name')),
      q(sb.from('ba_station').select('*').eq('market_year_id', id).order('call_sign')),
      q(sb.from('ba_estimate').select('*').eq('market_year_id', id).order('media')),
      q(sb.from('ba_working_plan').select('*').eq('market_year_id', id).maybeSingle()),
      q(sb.from('ba_approved_plan').select('id, version, approver, approved_by, approved_at, plan_total_net, budget_total, finance_override, qa, note, snapshot_sha256').eq('market_year_id', id).order('version', { ascending: false })),
      q(sb.from('ba_approved_current').select('*').eq('market_year_id', id).maybeSingle()),
      q(sb.from('ba_order_document').select('id, approved_plan_id, station_id, vendor_group_id, kind, status, reader, file_name, file_url, printed_gross, printed_net, foot_ok, foot_checks, parsed_at, applied_at, applied_by, superseded_by_id, revision_id, created_by, created_at').eq('market_year_id', id).order('created_at', { ascending: false })),
      q(sb.from('ba_schedule_of_record').select('*').eq('market_year_id', id).order('applied_at', { ascending: false })),
      q(sb.from('ba_revision').select('*').eq('market_year_id', id).order('created_at', { ascending: false })),
      q(sb.from('ba_package').select('*').eq('market_year_id', id).order('name')),
      q(sb.from('ba_variance').select('*').eq('market_year_id', id).order('call_sign')),
    ]);
    if (!market_year) throw new Bad('market_year not found', 404);
    const ids = new Set([id, ...stations.map(s => s.id), ...vendor_groups.map(v => v.id), ...order_documents.map(o => o.id), ...revisions.map(r => r.id), ...packages.map(p => p.id)]);
    if (working_plan) ids.add(working_plan.id);
    versions.forEach(v => ids.add(v.id));
    const notes = await q(sb.from('ba_note').select('*').in('entity_id', [...ids]).order('created_at', { ascending: false }));
    const lineNotes = await q(sb.from('ba_note').select('*').eq('entity_type', 'line').order('created_at', { ascending: false }));
    return { market_year, budgets, vendor_groups, stations, estimates, working_plan, versions, current, order_documents, schedule_of_record, revisions, packages, variance, notes: notes.concat(lineNotes) };
  },

  async history(sb, b) {
    const market = need(str(b.market, 80), 'market');
    const rows = await q(sb.from('ba_history_2026').select('*').eq('market', market).order('media').order('station').order('month'));
    const batches = await q(sb.from('ba_import_batch').select('id, purpose, source_agency, source_workbook, source_file, imported_by, imported_at, row_count, reconciled, note').order('imported_at', { ascending: false }));
    return { label: '2026 history (OTM) — reference only, never a target', rows, batches };
  },

  async saveWorkingPlan(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const plan = json(b.plan, 'plan');
    if (plan && !Array.isArray(plan.lines)) throw new Bad('plan.lines must be an array');
    const patch = { updated_by: who };
    if (plan !== null) patch.plan = plan;
    if (b.flighting !== undefined) patch.flighting = json(b.flighting, 'flighting') || {};
    if (b.goals !== undefined) patch.goals = json(b.goals, 'goals') || {};
    if (b.demo !== undefined) patch.demo = str(b.demo, 200);
    if (b.posting !== undefined) patch.posting = str(b.posting, 40);
    if (b.approver !== undefined) patch.approver = str(b.approver, 120);
    const row = await q(sb.from('ba_working_plan').update(patch).eq('market_year_id', id).select().single());
    return { working_plan: row };
  },

  async setBudget(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const m = b.media ? media(b.media) : null;
    const amount = num(b.amount, 'amount'); if (amount === null || amount < 0) throw new Bad('amount must be a non-negative number');
    let old = sb.from('ba_budget').update({ superseded_at: new Date().toISOString() }).eq('market_year_id', id).is('superseded_at', null);
    old = m === null ? old.is('media', null) : old.eq('media', m);
    await q(old);
    const row = await q(sb.from('ba_budget').insert({ market_year_id: id, media: m, amount, set_by: need(str(b.set_by, 120), 'set_by'), entered_by: who, source: str(b.source, 400), note: str(b.note, 2000) }).select().single());
    return { budget: row };
  },

  async upsertVendorGroup(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const row = { market_year_id: id, name: need(str(b.name, 120), 'name'), rep_name: str(b.rep_name, 120), rep_email: str(b.rep_email, 200), rep_phone: str(b.rep_phone, 60), notes: str(b.notes, 4000) };
    ['guidelines_status', 'order_status', 'confirmation_status'].forEach(k => { if (b[k] !== undefined) row[k] = str(b[k], 20); });
    if (b.id) row.id = uuid(b.id, 'id');
    const saved = await q(sb.from('ba_vendor_group').upsert(row, { onConflict: b.id ? 'id' : 'market_year_id,name' }).select().single());
    return { vendor_group: saved };
  },

  async upsertStation(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const row = { market_year_id: id, call_sign: need(str(b.call_sign, 40), 'call_sign'), media: media(b.media) };
    if (b.vendor_group_id !== undefined) row.vendor_group_id = b.vendor_group_id ? uuid(b.vendor_group_id, 'vendor_group_id') : null;
    if (b.owner !== undefined) row.owner = str(b.owner, 200);
    if (b.owner_source !== undefined) row.owner_source = str(b.owner_source, 20);
    if (b.on_buy !== undefined) row.on_buy = bool(b.on_buy);
    if (b.on_avail_request !== undefined) row.on_avail_request = bool(b.on_avail_request);
    if (b.added_from !== undefined) row.added_from = str(b.added_from, 20);
    if (b.format !== undefined) row.format = str(b.format, 200);
    if (b.notes !== undefined) row.notes = str(b.notes, 4000);
    if (b.id) row.id = uuid(b.id, 'id');
    const saved = await q(sb.from('ba_station').upsert(row, { onConflict: b.id ? 'id' : 'market_year_id,call_sign,media' }).select().single());
    return { station: saved };
  },

  async assignEstimate(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const row = { market_year_id: id, media: media(b.media), number: need(str(b.number, 40), 'number'), label: str(b.label, 120), assigned_by: who };
    const saved = await q(sb.from('ba_estimate').upsert(row, { onConflict: 'market_year_id,media' }).select().single());
    return { estimate: saved };
  },

  async approve(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const approved_plan_id = await q(sb.rpc('ba_approve_plan', {
      p_market_year_id: id, p_approver: need(str(b.approver, 120), 'approver'), p_approved_by: who,
      p_finance_override: bool(b.finance_override), p_note: str(b.note, 2000),
    }));
    const row = await q(sb.from('ba_approved_plan').select('id, version, approver, approved_by, approved_at, plan_total_net, budget_total, finance_override, qa, snapshot_sha256').eq('id', approved_plan_id).single());
    return { approved: row };
  },

  async approvedSnapshot(sb, b) {
    const id = uuid(b.approved_plan_id, 'approved_plan_id');
    const row = await q(sb.from('ba_approved_plan').select('*').eq('id', id).maybeSingle());
    if (!row) throw new Bad('approved plan not found', 404);
    return { approved: row };
  },

  async addOrderDocument(sb, b, who) {
    const kind = need(str(b.kind, 20), 'kind');
    if (!['draft', 'confirmation', 'change_order', 'invoice', 'post'].includes(kind)) throw new Bad('kind must be draft | confirmation | change_order | invoice | post');
    const foot_ok = (b.foot_ok === undefined || b.foot_ok === null) ? null : bool(b.foot_ok);
    const row = {
      market_year_id: uuid(b.market_year_id, 'market_year_id'),
      approved_plan_id: b.approved_plan_id ? uuid(b.approved_plan_id, 'approved_plan_id') : null,
      station_id: b.station_id ? uuid(b.station_id, 'station_id') : null,
      vendor_group_id: b.vendor_group_id ? uuid(b.vendor_group_id, 'vendor_group_id') : null,
      kind,
      status: b.status ? str(b.status, 20) : (foot_ok === true ? 'footed' : foot_ok === false ? 'foot_failed' : (kind === 'draft' || kind === 'change_order') ? 'generated' : 'received'),
      reader: str(b.reader, 40), file_name: str(b.file_name, 300), file_url: str(b.file_url, 2000), file_sha256: str(b.file_sha256, 64),
      printed_gross: num(b.printed_gross, 'printed_gross'), printed_net: num(b.printed_net, 'printed_net'),
      parsed_lines: json(b.parsed_lines, 'parsed_lines'), foot_checks: json(b.foot_checks, 'foot_checks'), foot_ok,
      parsed_at: b.parsed_lines ? new Date().toISOString() : null,
      revision_id: b.revision_id ? uuid(b.revision_id, 'revision_id') : null,
      created_by: who,
    };
    const saved = await q(sb.from('ba_order_document').insert(row).select().single());
    return { order_document: saved };
  },

  async applyConfirmation(sb, b, who) {
    const id = uuid(b.order_document_id, 'order_document_id');
    const sor_id = await q(sb.rpc('ba_apply_confirmation', { p_order_document_id: id, p_applied_by: who }));
    const sor = await q(sb.from('ba_schedule_of_record').select('*').eq('id', sor_id).single());
    return { schedule_of_record: sor };
  },

  async logRevision(sb, b, who) {
    const order_document_id = uuid(b.order_document_id, 'order_document_id');
    const kind = need(str(b.kind, 20), 'kind');
    if (!['spot', 'rate', 'hiatus', 'cancel', 'makegood'].includes(kind)) throw new Bad('kind must be spot | rate | hiatus | cancel | makegood');
    const changes = json(b.changes, 'changes');
    if (!Array.isArray(changes) || !changes.length) throw new Bad('changes must be a non-empty array of {line, field, was, now, delta}');
    const prev = await q(sb.from('ba_revision').select('rev_number').eq('order_document_id', order_document_id).order('rev_number', { ascending: false }).limit(1));
    const row = {
      market_year_id: uuid(b.market_year_id, 'market_year_id'), approved_plan_id: uuid(b.approved_plan_id, 'approved_plan_id'),
      station_id: uuid(b.station_id, 'station_id'), order_document_id, rev_number: (prev[0] ? prev[0].rev_number : 0) + 1,
      kind, changes, logged_by: who,
    };
    const saved = await q(sb.from('ba_revision').insert(row).select().single());
    return { revision: saved };
  },

  async addNote(sb, b, who) {
    const row = { entity_type: need(str(b.entity_type, 40), 'entity_type'), entity_id: need(str(b.entity_id, 200), 'entity_id'), text: need(str(b.text, 8000), 'text'), author: who };
    const saved = await q(sb.from('ba_note').insert(row).select().single());
    return { note: saved };
  },
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const who = callerName(req);
  if (!who) return res.status(401).json({ error: 'Not signed in' });

  const sb = getSupabase();
  if (!sb) return res.status(503).json({ error: 'Supabase not configured' });

  const body = req.body || {};
  const fn = handlers[body.action];
  if (!fn) return res.status(400).json({ error: 'Unknown action' });

  try {
    const out = await fn(sb, body, who);
    return res.status(200).json({ ok: true, ...out });
  } catch (e) {
    if (e instanceof Bad) return res.status(e.status).json({ error: e.message });
    const status = sqlStatus(e);
    if (status === 500) console.error('buy-abyss ' + body.action + ':', e);
    return res.status(status).json({ error: status === 409 ? e.message : 'Database error', detail: status === 500 ? e.message : undefined });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '4.5mb' }, responseLimit: '8mb' } };
