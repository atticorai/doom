// ═══════════════════════════════════════════════════════════════════
// /api/buy-abyss — The Buy Abyss (Lerner & Rowe media buying) on real
// Postgres rows, not the legacy_docs blob.
// ═══════════════════════════════════════════════════════════════════
// Tables + the two authoritative acts live in supabase/buy_abyss.sql;
// the arithmetic lives in buy-abyss-core.js (shared with abyss.html).
// This endpoint is a thin, whitelisted door: it never inserts into
// ba_approved_plan or ba_schedule_of_record itself — it calls
// ba_approve_plan() / ba_apply_confirmation(), and the database refuses
// any other writer. Identity comes from the signed dd_session cookie
// (same as /api/users); the client is never trusted for who did what.
//
// Gated by middleware.js (listed in its protected set).
//
// Actions (POST { action, ... }):
//   overview                                   every market/year, current version, budget, stage inputs
//   load {market_year_id}                      everything one market's screens need
//   history {market}                           the 2026 sheet rows (prototype rows26 shape) + rate-history orders
//   saveWorkingPlan {market_year_id, plan?, demo?, goal?, cac?, gl?, reps?, approver?, approve_inc?, over_budget_ok?}
//   saveState {market_year_id, state}          ovr / ovrRate / hiatus / notes / av / meta / rev / mg / spons / ds
//   setBudget {market_year_id, media?, amount, set_by, source?, note?}
//   upsertStation {market_year_id, call_sign, media, aff?, owner?, owner_source?, pkg?, vendor?, cable?, added?, on_buy?, notes?}
//   ensureEstimates {market_year_id, media}    the five ESTS() rows for a medium
//   saveEstimate {market_year_id, media, type, no?, active?}
//   assignEstimates {market_year_id, media}    "Assign next numbers" → ba_assign_estimates()
//   approve {market_year_id, media, approver, note?}   builds the snapshot with core.snapshotPlan → ba_approve_plan()
//   addOrderDocument {market_year_id, station_key, kind: draft|confirmation, order, desc, flight, file, metric, gross, net, lines, demo?, ae?, rev?, approved_plan_id?}
//   confirmFromDraft {order_document_id}       station confirmed the draft as proposed → confirmation doc, footed, applied
//   applyConfirmation {order_document_id}      → ba_apply_confirmation()
//   issueChangeOrder {market_year_id, station_key, order_document_id, rev_number, changes}
//   addNote {entity_type, entity_id, text}
// ═══════════════════════════════════════════════════════════════════

const { getSupabase } = require('./_supabase');
const { validateSessionToken, userFromToken, getSessionSecret } = require('./auth');
const core = require('../buy-abyss-core.js');

const MEDIA = core.MEDIA;
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
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

async function q(p) { const { data, error } = await p; if (error) throw error; return data; }

// Postgres raises the QA gate and the invariants as exceptions; surface
// the message as-is (they are written for the person, not the log).
function sqlStatus(e) {
  const m = String(e && e.message || '');
  if (/^QA:|insert-only|only from ba_approve_plan|never writes to ba_working_plan|only by ba_apply_confirmation|has not footed|already applied|must state which approved|must belong to a station|only a confirmation can become/.test(m)) return 409;
  return 500;
}

// ── row ↔ prototype shape ──────────────────────────────────────────
// ba_order_document row → the prototype's order object (M.orders[i])
function orderOf(r) {
  return { id: r.id, order: r.order_no, station: r.station_key, desc: r.description, flight: r.flight, file: r.file_name, metric: r.metric || 'Rtg',
    gross: Number(r.printed_gross || 0), net: Number(r.printed_net || 0), lines: r.parsed_lines || [], demo: r.demo || undefined, ae: r.ae || undefined, rev: r.rev || undefined,
    status: r.kind === 'draft' ? 'draft' : (r.status === 'applied' ? 'applied' : r.status === 'superseded' ? 'superseded' : 'new'),
    kind: r.kind, doc_status: r.status, foot_ok: r.foot_ok, approved_plan_id: r.approved_plan_id, applied_at: r.applied_at, applied_by: r.applied_by, revision_id: r.revision_id };
}
// ba_station rows → M.stations
function stationsOf(rows) { const st = {}; rows.forEach(s => { st[s.call_sign] = { aff: s.aff || s.media, own: s.owner || '', medium: s.media, pkg: !!s.pkg, vendor: !!s.vendor, cable: !!s.cable, booked26: s.booked26 ? s.booked26.map(Number) : undefined, actual26: s.actual26 ? s.actual26.map(Number) : undefined, added: !!s.added, id: s.id, on_buy: s.on_buy }; }); return st; }
// ba_estimate rows → M.estimates (per medium, in EST_TYPES order)
function estimatesOf(rows) { const out = {}; rows.forEach(e => { (out[e.media] = out[e.media] || []).push({ type: e.type, covers: e.covers, no: e.no || '', active: !!e.active, medium: e.media, id: e.id }); }); Object.keys(out).forEach(k => out[k].sort((a, b) => core.EST_TYPES.findIndex(t => t[0] === a.type) - core.EST_TYPES.findIndex(t => t[0] === b.type))); return out; }

// Footing — what read_lines.py proves on upload: every line to its
// printed amount, the order to its printed gross and net (15%).
function footOrder(o) {
  const lines = (o.lines || []).map((l, i) => { const g = Object.values(l.weeks || {}).reduce((a, w) => a + Number(w.spots || 0) * Number(w.rate || 0), 0); const okG = Math.abs(g - Number(l.gross || 0)) <= 0.005; const okN = Math.abs(Number(l.gross || 0) * (1 - core.COMM) - Number(l.net || 0)) <= 0.01; return { ln: l.ln ?? i + 1, weeks_gross: Math.round(g * 100) / 100, printed_gross: Number(l.gross || 0), printed_net: Number(l.net || 0), ok: okG && okN }; });
  const lg = lines.reduce((a, l) => a + l.printed_gross, 0);
  const order_ok = Math.abs(lg - Number(o.gross || 0)) <= 0.005 && Math.abs(Number(o.gross || 0) * (1 - core.COMM) - Number(o.net || 0)) <= 0.01;
  return { lines_ok: lines.every(l => l.ok), order_ok, lines_gross: Math.round(lg * 100) / 100, printed_gross: Number(o.gross || 0), printed_net: Number(o.net || 0), commission: core.COMM, lines: lines.filter(l => !l.ok) };
}

async function loadMarket(sb, id) {
  const [market_year, budgets, stations, estimates, working_plan, state, versions, current, order_documents, schedule_of_record, revisions, packages, variance] = await Promise.all([
    q(sb.from('ba_market_year').select('*').eq('id', id).maybeSingle()),
    q(sb.from('ba_budget').select('*').eq('market_year_id', id).order('created_at')),
    q(sb.from('ba_station').select('*').eq('market_year_id', id).order('call_sign')),
    q(sb.from('ba_estimate').select('*').eq('market_year_id', id)),
    q(sb.from('ba_working_plan').select('*').eq('market_year_id', id).maybeSingle()),
    q(sb.from('ba_market_state').select('*').eq('market_year_id', id).maybeSingle()),
    q(sb.from('ba_approved_plan').select('id, version, approver, approved_by, approved_at, plan_total_net, budget_total, finance_override, qa, note, snapshot_sha256').eq('market_year_id', id).order('version', { ascending: false })),
    q(sb.from('ba_approved_current').select('*').eq('market_year_id', id).maybeSingle()),
    q(sb.from('ba_order_document').select('*').eq('market_year_id', id).order('created_at')),
    q(sb.from('ba_schedule_of_record').select('*').eq('market_year_id', id).order('applied_at', { ascending: false })),
    q(sb.from('ba_revision').select('*').eq('market_year_id', id).order('created_at', { ascending: false })),
    q(sb.from('ba_package').select('*').eq('market_year_id', id).order('name')),
    q(sb.from('ba_variance').select('*').eq('market_year_id', id).order('call_sign')),
  ]);
  if (!market_year) throw new Bad('market_year not found', 404);
  return { market_year, budgets, stations, estimates, working_plan, state, versions, current, order_documents, schedule_of_record, revisions, packages, variance };
}

// Assemble the prototype's M for a market from rows (the server-side twin
// of what abyss.html does), for snapshotPlan at approval time.
function marketOf(L) {
  const my = L.market_year, wp = L.working_plan || {}, st = L.state ? L.state.state : {};
  const budget = ((L.budgets || []).find(b => b.media === null && !b.superseded_at) || {}).amount;
  return { id: my.id, market: my.market, code: my.code, buyer: my.buyer, stations: stationsOf(L.stations), plan: wp.plan || {}, budget: budget ? Number(budget) : 0, demo: wp.demo || 'A25-54',
    goal: wp.goal || { cpm: 5, pts: 0 }, cac: wp.cac || { leads: '', cases: '' }, gl: wp.gl || null, reps: wp.reps || {}, approver: wp.approver || null, approveInc: wp.approve_inc || {}, overBudgetOk: !!wp.over_budget_ok,
    estimates: estimatesOf(L.estimates || []), orders: (L.order_documents || []).map(orderOf), approvals: (L.versions || []).slice().reverse().map(v => ({ v: v.version, by: v.approver, date: v.approved_at, net: Number(v.plan_total_net || 0) })),
    approved: !!L.current, approvedPlan: L.current ? L.current.snapshot : null, rev: st.rev || [], mg: st.mg || [], spons: st.spons || [], ovr: st.ovr || {}, ovrRate: st.ovrRate || {}, hiatus: st.hiatus || {}, notes: st.notes || {}, meta: st.meta || {}, av: st.av || {}, ds: st.ds || {}, proposals: st.proposals || [], pkgs: {} };
}

const handlers = {
  async overview(sb) {
    const years = await q(sb.from('ba_market_year').select('*').order('sort_order').order('market'));
    const current = await q(sb.from('ba_approved_current').select('id, market_year_id, version, approver, approved_at, plan_total_net, budget_total, finance_override, snapshot'));
    const budgets = await q(sb.from('ba_budget').select('market_year_id, media, amount').is('superseded_at', null));
    const stations = await q(sb.from('ba_station').select('market_year_id, call_sign, media, owner, pkg, vendor, cable, aff, booked26, actual26, added, on_buy'));
    const wps = await q(sb.from('ba_working_plan').select('market_year_id, plan, demo, approver'));
    const states = await q(sb.from('ba_market_state').select('market_year_id, state'));
    const docs = await q(sb.from('ba_order_document').select('market_year_id, kind, status'));
    const by = (rows, k) => rows.reduce((m, r) => { (m[r[k]] = m[r[k]] || []).push(r); return m; }, {});
    const cur = by(current, 'market_year_id'), bud = by(budgets, 'market_year_id'), sta = by(stations, 'market_year_id'), wp = by(wps, 'market_year_id'), stt = by(states, 'market_year_id'), dc = by(docs, 'market_year_id');
    return { counter: (await q(sb.from('ba_counter').select('value').eq('name', 'est_seq').single())).value, market_years: years.map(y => {
      const c = (cur[y.id] || [])[0] || null, w = (wp[y.id] || [])[0] || {}, s = ((stt[y.id] || [])[0] || {}).state || {};
      return { ...y, approved: c ? { id: c.id, version: c.version, approver: c.approver, approved_at: c.approved_at, plan_total_net: c.plan_total_net } : null, approvedPlan: c ? c.snapshot : null,
        budget: Number((((bud[y.id] || []).find(b => b.media === null) || {}).amount) || 0), budget_allocations: (bud[y.id] || []).filter(b => b.media !== null),
        stations: stationsOf(sta[y.id] || []), plan: w.plan || {}, demo: w.demo, ds: s.ds || {}, rev: s.rev || [],
        orders: (dc[y.id] || []).map(d => ({ status: d.kind === 'draft' ? 'draft' : d.status === 'applied' ? 'applied' : 'new' })) };
    }) };
  },

  async load(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const L = await loadMarket(sb, id);
    const ids = new Set([id, ...L.stations.map(s => s.id), ...L.order_documents.map(o => o.id), ...L.revisions.map(r => r.id), ...L.packages.map(p => p.id), ...L.versions.map(v => v.id)]);
    if (L.working_plan) ids.add(L.working_plan.id);
    const notes = await q(sb.from('ba_note').select('*').in('entity_id', [...ids]).order('created_at', { ascending: false }));
    const counter = await q(sb.from('ba_counter').select('value').eq('name', 'est_seq').single());
    return { ...L, order_documents: L.order_documents.map(orderOf), notes, counter: counter.value };
  },

  async history(sb, b) {
    const market = need(str(b.market, 80), 'market');
    const rows = await q(sb.from('ba_history_2026').select('station, section, month, booked, actual, media').eq('market', market).order('station').order('section').order('month'));
    const byKey = {}; const rows26 = [];
    rows.forEach(r => { const k = r.station + '|' + r.section; if (!byKey[k]) { byKey[k] = { station: r.station, section: r.section, booked: Array(12).fill(0), actual: Array(12).fill(0) }; rows26.push(byKey[k]); } byKey[k].booked[r.month - 1] = Number(r.booked || 0); byKey[k].actual[r.month - 1] = Number(r.actual || 0); });
    const batches = await q(sb.from('ba_import_batch').select('id, purpose, source_agency, source_workbook, source_file, imported_by, imported_at, row_count, reconciled, note, raw').eq('purpose', 'rate_history').order('imported_at', { ascending: false }));
    const hist = batches.find(bt => bt.raw && bt.raw.market === market);
    return { label: '2026 history (OTM) — reference only, never a target', rows26, hist: hist ? { market, label: hist.raw.label || 'Atticor 2026 rate history', orders: hist.raw.orders || [] } : null };
  },

  async saveWorkingPlan(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const patch = { updated_by: who };
    if (b.plan !== undefined) { const plan = json(b.plan, 'plan'); if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new Bad('plan must be an object keyed by station'); Object.entries(plan).forEach(([k, v]) => { ['$', 'pts', 'imp', 'imp$'].forEach(f => { if (!Array.isArray(v[f]) || v[f].length !== 9) throw new Bad(`plan.${k}.${f} must be 9 daypart buckets`); }); }); patch.plan = plan; }
    if (b.demo !== undefined) patch.demo = need(str(b.demo, 200), 'demo');
    if (b.goal !== undefined) patch.goal = json(b.goal, 'goal') || { cpm: 5, pts: 0 };
    if (b.cac !== undefined) patch.cac = json(b.cac, 'cac') || { leads: '', cases: '' };
    if (b.gl !== undefined) patch.gl = json(b.gl, 'gl');
    if (b.reps !== undefined) patch.reps = json(b.reps, 'reps') || {};
    if (b.approver !== undefined) patch.approver = str(b.approver, 120);
    if (b.approve_inc !== undefined) patch.approve_inc = json(b.approve_inc, 'approve_inc') || {};
    if (b.over_budget_ok !== undefined) patch.over_budget_ok = bool(b.over_budget_ok);
    const row = await q(sb.from('ba_working_plan').update(patch).eq('market_year_id', id).select().single());
    return { working_plan: row };
  },

  async saveState(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const state = json(b.state, 'state'); if (!state || typeof state !== 'object') throw new Bad('state must be an object');
    const row = await q(sb.from('ba_market_state').upsert({ market_year_id: id, state, updated_by: who }, { onConflict: 'market_year_id' }).select().single());
    return { state: row };
  },

  async setBudget(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const m = b.media ? media(b.media) : null;
    const amount = num(b.amount, 'amount'); if (amount === null || amount < 0) throw new Bad('amount must be a non-negative number');
    let old = sb.from('ba_budget').update({ superseded_at: new Date().toISOString() }).eq('market_year_id', id).is('superseded_at', null);
    old = m === null ? old.is('media', null) : old.eq('media', m);
    await q(old);
    const row = await q(sb.from('ba_budget').insert({ market_year_id: id, media: m, amount, set_by: str(b.set_by, 120) || 'Finance', entered_by: who, source: str(b.source, 400), note: str(b.note, 2000) }).select().single());
    return { budget: row };
  },

  async upsertStation(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const row = { market_year_id: id, call_sign: need(str(b.call_sign, 80), 'call_sign'), media: media(b.media) };
    if (b.aff !== undefined) row.aff = str(b.aff, 120);
    if (b.owner !== undefined) row.owner = str(b.owner, 200);
    if (b.owner_source !== undefined) row.owner_source = str(b.owner_source, 20);
    ['pkg', 'vendor', 'cable', 'added', 'on_buy', 'on_avail_request'].forEach(k => { if (b[k] !== undefined) row[k] = bool(b[k]); });
    if (b.added_from !== undefined) row.added_from = str(b.added_from, 20);
    if (b.notes !== undefined) row.notes = str(b.notes, 4000);
    const saved = await q(sb.from('ba_station').upsert(row, { onConflict: 'market_year_id,call_sign' }).select().single());
    return { station: saved };
  },

  async ensureEstimates(sb, b) {
    const id = uuid(b.market_year_id, 'market_year_id'); const m = media(b.media);
    const have = await q(sb.from('ba_estimate').select('*').eq('market_year_id', id).eq('media', m));
    if (!have.length) await q(sb.from('ba_estimate').insert(core.EST_TYPES.map(([type, covers], i) => ({ market_year_id: id, media: m, type, covers, active: i === 0 || i === 3 }))));
    const rows = await q(sb.from('ba_estimate').select('*').eq('market_year_id', id));
    return { estimates: estimatesOf(rows) };
  },

  async saveEstimate(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id'); const m = media(b.media); const type = need(str(b.type, 40), 'type');
    if (!core.EST_TYPES.some(t => t[0] === type)) throw new Bad('type must be one of ' + core.EST_TYPES.map(t => t[0]).join(', '));
    const patch = {}; if (b.no !== undefined) { patch.no = str(b.no, 40) || ''; patch.assigned_by = who; } if (b.active !== undefined) patch.active = bool(b.active);
    const row = await q(sb.from('ba_estimate').update(patch).eq('market_year_id', id).eq('media', m).eq('type', type).select().single());
    return { estimate: row };
  },

  async assignEstimates(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id'); const m = media(b.media);
    const n = await q(sb.rpc('ba_assign_estimates', { p_market_year_id: id, p_media: m, p_by: who }));
    const rows = await q(sb.from('ba_estimate').select('*').eq('market_year_id', id));
    const counter = await q(sb.from('ba_counter').select('value').eq('name', 'est_seq').single());
    return { assigned: n, estimates: estimatesOf(rows), counter: counter.value };
  },

  // Approve: assign numbers to the active estimates still unnumbered (as
  // the prototype's flow does), hold out unticked stations, build the
  // snapshot with the shared arithmetic, hand it to the database.
  async approve(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const m = b.media && b.media !== 'all' ? media(b.media) : 'TV';
    const approver = need(str(b.approver, 120), 'approver');
    await handlers.ensureEstimates(sb, { market_year_id: id, media: m });
    await q(sb.rpc('ba_assign_estimates', { p_market_year_id: id, p_media: m, p_by: who }));
    const L = await loadMarket(sb, id);
    const M = marketOf(L);
    const X = { M, STATIONS: [], ALL_STATIONS: [], MED: 'all', OWNER: 'all', gn: 'net', HIST: null, MARKETS: [M], EST_SEQ: 0, today: today() };
    const C = core.bind(X);
    const v = C.marketView('all', 'all'); X.ALL_STATIONS = v.ALL_STATIONS; X.STATIONS = v.STATIONS;
    // held-out stations are zeroed in the working plan first, as the prototype does
    const held = X.STATIONS.filter(s => M.approveInc?.[s] === false);
    if (held.length) { held.forEach(s => { M.plan[s] = core.emptyPlanRow(); }); await q(sb.from('ba_working_plan').update({ plan: M.plan, updated_by: who }).eq('market_year_id', id)); }
    M.approved = false; M.approvals = M.approvals || [];
    const snap = C.snapshotPlan(approver);
    const approved_plan_id = await q(sb.rpc('ba_approve_plan', { p_market_year_id: id, p_snapshot: JSON.parse(JSON.stringify(snap)), p_approver: approver, p_approved_by: who, p_finance_override: !!M.overBudgetOk, p_note: str(b.note, 2000) }));
    const row = await q(sb.from('ba_approved_plan').select('*').eq('id', approved_plan_id).single());
    return { approved: row };
  },

  async addOrderDocument(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const kind = need(str(b.kind, 20), 'kind'); if (!['draft', 'confirmation'].includes(kind)) throw new Bad('kind must be draft or confirmation');
    const lines = json(b.lines, 'lines') || [];
    const o = { gross: num(b.gross, 'gross') || 0, net: num(b.net, 'net') || 0, lines };
    const foot = kind === 'confirmation' ? footOrder(o) : null;
    let approved_plan_id = b.approved_plan_id ? uuid(b.approved_plan_id, 'approved_plan_id') : null;
    if (!approved_plan_id) { const cur = await q(sb.from('ba_approved_current').select('id').eq('market_year_id', id).maybeSingle()); approved_plan_id = cur ? cur.id : null; }
    if (kind === 'confirmation' && !approved_plan_id) throw new Bad('a confirmation must state which approved version it confirms — approve the plan first', 409);
    const key = need(str(b.station, 80) || str(b.station_key, 80), 'station');
    const st = await q(sb.from('ba_station').select('id, vendor_group_id').eq('market_year_id', id).eq('call_sign', key).maybeSingle());
    const row = { market_year_id: id, approved_plan_id, station_id: st ? st.id : null, station_key: key, vendor_group_id: st ? st.vendor_group_id : null, kind,
      status: kind === 'draft' ? 'received' : (foot.lines_ok && foot.order_ok ? 'footed' : 'foot_failed'), reader: str(b.reader, 40) || (kind === 'confirmation' ? 'lines-v1' : null),
      order_no: str(b.order, 60), description: str(b.desc, 200), flight: str(b.flight, 80), metric: b.metric === 'Imp' ? 'Imp' : 'Rtg', demo: str(b.demo, 40), ae: str(b.ae, 120), rev: num(b.rev, 'rev'),
      file_name: str(b.file, 300), file_url: str(b.file_url, 2000), file_sha256: str(b.file_sha256, 64), printed_gross: o.gross, printed_net: o.net, parsed_lines: lines,
      foot_checks: foot, foot_ok: foot ? (foot.lines_ok && foot.order_ok) : null, parsed_at: new Date().toISOString(), created_by: who };
    const saved = await q(sb.from('ba_order_document').insert(row).select().single());
    return { order_document: orderOf(saved), foot };
  },

  // "Accept as schedule of record" on a buyer's draft: the station has
  // confirmed the draft as proposed. The draft stays a draft; a
  // confirmation document is created from its lines, footed, and applied.
  async confirmFromDraft(sb, b, who) {
    const id = uuid(b.order_document_id, 'order_document_id');
    const d = await q(sb.from('ba_order_document').select('*').eq('id', id).single());
    if (d.kind !== 'draft') throw new Bad('confirmFromDraft needs a draft (this is a ' + d.kind + ')');
    const cur = await q(sb.from('ba_approved_current').select('id').eq('market_year_id', d.market_year_id).maybeSingle());
    if (!cur) throw new Bad('approve the plan first — a confirmation must state which approved version it confirms', 409);
    const o = { gross: Number(d.printed_gross || 0), net: Number(d.printed_net || 0), lines: d.parsed_lines || [] };
    if (!o.gross && o.lines.length) { o.gross = o.lines.reduce((a, l) => a + Number(l.gross || 0), 0); o.net = Math.round(o.gross * (1 - core.COMM) * 100) / 100; }
    const foot = footOrder(o);
    const row = { market_year_id: d.market_year_id, approved_plan_id: cur.id, station_id: d.station_id, station_key: d.station_key, vendor_group_id: d.vendor_group_id, kind: 'confirmation',
      status: foot.lines_ok && foot.order_ok ? 'footed' : 'foot_failed', reader: 'lines-v1', order_no: String(d.order_no || '').replace(/^DRAFT-/, ''), description: String(d.description || '').replace(/ · draft$/, ''), flight: d.flight, metric: d.metric, demo: d.demo, ae: d.ae, rev: d.rev,
      file_name: 'confirmed as proposed · ' + (d.file_name || ''), printed_gross: o.gross, printed_net: o.net, parsed_lines: o.lines, foot_checks: foot, foot_ok: foot.lines_ok && foot.order_ok, parsed_at: new Date().toISOString(), created_by: who };
    const conf = await q(sb.from('ba_order_document').insert(row).select().single());
    const sor_id = await q(sb.rpc('ba_apply_confirmation', { p_order_document_id: conf.id, p_applied_by: who }));
    await q(sb.from('ba_order_document').update({ status: 'superseded', superseded_by_id: conf.id }).eq('id', d.id));
    const after = await q(sb.from('ba_order_document').select('*').in('id', [d.id, conf.id]));
    return { schedule_of_record_id: sor_id, order_documents: after.map(orderOf), foot };
  },

  async applyConfirmation(sb, b, who) {
    const id = uuid(b.order_document_id, 'order_document_id');
    const sor_id = await q(sb.rpc('ba_apply_confirmation', { p_order_document_id: id, p_applied_by: who }));
    const sor = await q(sb.from('ba_schedule_of_record').select('*').eq('id', sor_id).single());
    return { schedule_of_record: sor };
  },

  async issueChangeOrder(sb, b, who) {
    const id = uuid(b.market_year_id, 'market_year_id');
    const key = need(str(b.station_key, 80), 'station_key');
    const changes = json(b.changes, 'changes'); if (!Array.isArray(changes) || !changes.length) throw new Bad('changes must be the revision entries being issued');
    const cur = await q(sb.from('ba_approved_current').select('id').eq('market_year_id', id).maybeSingle());
    if (!cur) throw new Bad('no approved plan to revise', 409);
    const st = await q(sb.from('ba_station').select('id').eq('market_year_id', id).eq('call_sign', key).maybeSingle());
    if (!st) throw new Bad('station not on the buy: ' + key);
    const rec = await q(sb.from('ba_schedule_of_record').select('order_document_id').eq('market_year_id', id).eq('station_id', st.id).is('superseded_at', null).maybeSingle());
    const od = rec ? rec.order_document_id : (b.order_document_id ? uuid(b.order_document_id, 'order_document_id') : null);
    if (!od) throw new Bad('no confirmation on record for ' + key + ' to revise', 409);
    const rev_number = num(b.rev_number, 'rev_number') || 2;
    const co = await q(sb.from('ba_order_document').insert({ market_year_id: id, approved_plan_id: cur.id, station_id: st.id, station_key: key, kind: 'change_order', status: 'generated', order_no: 'CO-' + rev_number, description: 'Change order · Rev ' + rev_number, created_by: who }).select().single());
    const row = await q(sb.from('ba_revision').insert({ market_year_id: id, approved_plan_id: cur.id, station_id: st.id, order_document_id: od, rev_number, kind: 'change_order', changes, status: 'issued', change_order_document_id: co.id, logged_by: who, issued_at: new Date().toISOString(), issued_by: who }).select().single());
    return { revision: row, change_order: orderOf(co) };
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
    return res.status(200).json({ ok: true, who, ...out });
  } catch (e) {
    if (e instanceof Bad) return res.status(e.status).json({ error: e.message });
    const status = sqlStatus(e);
    if (status === 500) console.error('buy-abyss ' + body.action + ':', e);
    return res.status(status).json({ error: status === 409 ? e.message : 'Database error', detail: status === 500 ? e.message : undefined });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '4.5mb' }, responseLimit: '8mb' } };
module.exports.footOrder = footOrder;
module.exports.marketOf = marketOf;
