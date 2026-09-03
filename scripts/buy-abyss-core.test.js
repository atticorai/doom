#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// Proves buy-abyss-core.js reproduces the prototype's numbers exactly.
// ═══════════════════════════════════════════════════════════════════
// scripts/buy-abyss-reference.json was captured from TheBuyAbyss.html
// running in headless Chromium (Sep 3, 2026): sign in → Chicago →
// roll WBBM's four 2026 orders forward → budget $2,500,000 → assign
// estimate numbers → approve v1 → accept one confirmation as the
// schedule of record. Every figure below is compared to what the
// prototype showed; any difference fails the run.
//
//   node scripts/buy-abyss-core.test.js
// ═══════════════════════════════════════════════════════════════════
const assert = require('assert');
const core = require('../buy-abyss-core.js');
const REF = require('./buy-abyss-reference.json');
const LR26 = require('../data/buy-abyss/lr2026.json');
const HISTDATA = require('../data/buy-abyss/wbbm-2026-orders.json');

const plain = x => JSON.parse(JSON.stringify(x, (k, v) => v instanceof Set ? [...v] : v));
const eq = (a, b, what) => { try { assert.deepStrictEqual(plain(a), plain(b)); } catch (e) { console.error('MISMATCH ' + what); console.error(e.message.slice(0, 1500)); process.exit(1); } console.log('PASS  ' + what); };
const near = (a, b, what, tol = 0.005) => { if (Math.abs(a - b) > tol) { console.error(`MISMATCH ${what}: ${a} vs ${b}`); process.exit(1); } console.log(`PASS  ${what} = ${a}`); };
const money = t => Number(String(t).replace(/[^\d.()-]/g, '').replace(/^\((.*)\)$/, '-$1'));

// ── build the same world the prototype builds ─────────────────────
const MARKETS = core.buildMarkets(LR26);
eq(MARKETS.map(b => ({ id: b.id, market: b.market, code: b.code, medium: b.medium, base26: b.base26, buyer: b.buyer, status: b.status, stations: b.stations })), REF.markets, 'MARKETS from lr2026 (10 markets, every station, owner, medium, 2026 booked/actual)');

const X = { M: null, STATIONS: [], ALL_STATIONS: [], MED: 'TV', OWNER: 'all', gn: 'net', HIST: { market: 'Chicago', label: 'Atticor 2026 rate history (Postman Law annual)', orders: HISTDATA.orders }, MARKETS, EST_SEQ: core.EST_SEQ_START, today: 'Sep 2, 2026' };
const C = core.bind(X);
function setMarket(id) { X.M = MARKETS.find(x => x.id === id); const v = C.marketView(X.MED, X.OWNER); X.ALL_STATIONS = v.ALL_STATIONS; X.MED = v.MED; X.OWNER = v.OWNER; X.STATIONS = v.STATIONS; if (!Object.keys(X.M.plan).length) C.initPlan(); }
setMarket('lr-chicago');
eq({ ALL_STATIONS: X.ALL_STATIONS, STATIONS: X.STATIONS, MED: X.MED, groups: C.groupsOf(X.STATIONS), plan: X.M.plan, WEEKS: core.WEEKS, BANDS: core.BANDS, N: core.N }, REF.chicago, 'Chicago station order, TV filter, ownership groups, empty plan, 52 weeks, broadcast months');

// ── line-level arithmetic on the four WBBM 2026 orders ────────────
eq(HISTDATA.orders.map(o => ({ order: o.order, net: o.net, gross: o.gross, weeksNet: core.weeksNet(o), lines: o.lines.map(l => ({ ln: l.ln, key: core.lineKey(l), b: core.dpBucket(l), mu: core.mult(l), len: core.lenOf(l), rt: core.isRT(l) })) })), REF.lines, 'lineKey / dpBucket / mult (BE15) / lenOf / isRT / weeksNet on 106 WBBM lines');
eq(C.dpStats('WBBM'), REF.dpStats, 'dpStats(WBBM): spots, gross, net, CPM/CPP, avg rate, quarterly rates by daypart');

// ── roll 2026 forward as a draft, exactly as the prototype's button does ──
C.histFor('WBBM').forEach(o => X.M.orders.push(core.rollForward(o, 'WBBM')));
if (!core.sum(X.ALL_STATIONS.map(x => core.sum(X.M.plan[x].$)))) C.initPlan();
eq(X.M.orders.map(o => ({ order: o.order, station: o.station, status: o.status, desc: o.desc, file: o.file, nLines: o.lines.length, weeks: Object.keys(o.lines[0].weeks) })), REF.afterRoll.orders, 'rollForward: four DRAFT orders shifted 364 days into 2027 weeks');
eq(C.draftWeeks('WBBM'), REF.afterRoll.draftWeeks, 'draftWeeks(WBBM)');
eq(C.flightOf('WBBM'), REF.afterRoll.flightOf, 'flightOf(WBBM): draft shape scaled to plan dollars');
eq(C.planTotals(), REF.afterRoll.planTotals, 'planTotals after roll-forward (net $721,246.25 · CPM $4.5208)');
eq(X.M.plan, REF.afterRoll.plan, 'initPlan from drafts: $ / pts / imp / imp$ by daypart bucket, every Chicago TV station');
eq(C.intakeChecks(), REF.afterRoll.intake, 'intakeChecks (budget, dropped stations, spend shift, CPM, flighting)');
eq(C.qaChecks(), REF.afterRoll.qa, 'qaChecks before budget/estimates');
eq(C.spotsByWeek('WBBM'), REF.afterRoll.spotsByWeek, 'spotsByWeek(WBBM)');

// schedules screen — merged lines, totals, KPIs
const sch = C.mergeSchedule('WBBM', 'spots', 'week');
const kp = REF.afterRoll.scKpis.split('\n');
near(sch.S.paid, money(kp[1].split('+')[0]), 'schedule paid spots');
near(sch.S.bonus, Number(kp[1].match(/\+ ([\d,]+) bonus/)[1].replace(/,/g, '')), 'schedule bonus spots');
near(sch.S.$, money(kp[3].split('gross')[0]), 'schedule net $');
near(sch.cpm, money(kp[5].split('on')[0]), 'schedule net CPM', 0.005);
near(Math.round(sch.S.g), Number(kp[7]), 'schedule rating points');
assert.strictEqual(sch.rows.length, REF.afterRoll.scRows - REF.afterRoll.scGroups.length, 'schedule line count'); console.log('PASS  schedule line rows = ' + sch.rows.length);
eq(sch.groups.map(G => core.DP_TV[G.g] + G.pb), REF.afterRoll.scGroups, 'schedule daypart groups (paid first, bonus after)');
const refLines = REF.afterRoll.scLines; // [st, days, time, len, paid, rate, rtg, imp, post, tot]
sch.rows.forEach((r, i) => { const L = refLines[i]; const got = [r.X.days, r.X.time, r.X.len, r.X.paid ? 'Paid' : 'Bonus', r.rateTxt, r.rtgTxt, r.impTxt, '–', String(r.rtText)]; const want = L.slice(1); assert.deepStrictEqual(got, want, `schedule line ${i} (${r.X.program}): ${JSON.stringify(got)} vs ${JSON.stringify(want)}`); assert.ok(L[0].startsWith(r.X.program), 'program ' + r.X.program); });
console.log('PASS  every schedule line: days, time, len, paid/bonus, rate range, rtg, imp, total');
near(core.sum(sch.tot), money(REF.afterRoll.scFoot.split('\t').filter(x => x.trim()).pop()), 'schedule totals row');
const hist = C.scheduleHistory('WBBM', sch);
near(hist.oS, sch.S.paid + sch.S.bonus, 'history original spots = schedule spots');

// ── approve: budget, estimate numbers, snapshot v1 ────────────────
X.M.budget = 2500000;
C.ESTS().filter(e => e.active && !e.no).forEach(C.assignEst);
eq({ qa: C.qaChecks(), ests: C.ESTS() }, { qa: REF.preApprove.qa, ests: REF.preApprove.ests }, 'estimate numbers 2701/2702 assigned, QA clear');
const snap = C.approve(X.M.approver || 'Jessica Flynn');
eq({ approved: X.M.approved, status: X.M.status, approvals: X.M.approvals, snap, planTotals: C.planTotals() }, { approved: REF.approved.approved, status: REF.approved.status, approvals: REF.approved.approvals, snap: REF.approved.snap, planTotals: REF.approved.planTotals }, 'approve → snapshot v1 (plan, flight, budget, demo, goal, estimates, stations) byte-identical to the prototype');

// ── accept the confirmation the prototype accepted (the last order) ──
X.M.orders[3].status = 'applied';
eq({ statuses: X.M.orders.map(o => o.status), recordNet: C.recordNet('WBBM'), stage: C.stageOf(X.M) }, { statuses: REF.record.statuses, recordNet: REF.record.recordNet, stage: REF.record.stage }, 'schedule of record: recordNet(WBBM) + stageOf');
const g = C.gridRows('planned', 'dollars', 'week'); const gk = REF.record.gKpis.split('\n');
near(g.P, money(gk[1]), 'grid approved plan net'); near(g.R, money(gk[3].split('\n')[0].replace(/1 confirmations$/, '')), 'grid confirmed (record) net'); near(g.R - g.P, money(gk[5]), 'grid confirmed − plan');

// ── reports ───────────────────────────────────────────────────────
const pace = C.paceRows(); const paceRef = REF.reports.jPace.split('\n').slice(1).map(l => l.split('\t'));
pace.forEach((r, i) => { assert.strictEqual(r.market, paceRef[i][0]); near(Math.round(r.booked26), money(paceRef[i][4]), 'pace booked26 ' + r.market); near(Math.round(r.cleared26), money(paceRef[i][5]), 'pace cleared26 ' + r.market); assert.strictEqual(String(r.stations), paceRef[i][6]); });
const b26 = C.base26Rows([X.M], false, 'all'); // the Total row ends "…<booked><cleared><var>" in the captured text
assert.ok(REF.reports.base26.endsWith(core.fmt(core.sum(b26.TB)) + core.fmt(core.sum(b26.TA)) + core.fmt(core.sum(b26.TA.slice(0, 6)) - core.sum(b26.TB.slice(0, 6)))), '2026 booked / cleared / Jan–Jun variance totals (Chicago)');
console.log('PASS  2026 booked ' + core.fmt(core.sum(b26.TB)) + ' · cleared ' + core.fmt(core.sum(b26.TA)) + ' · Jan–Jun var ' + core.fmt(core.sum(b26.TA.slice(0, 6)) - core.sum(b26.TB.slice(0, 6))) + ' (Chicago)');
const mon = C.finMonthly();
assert.ok(REF.reports.monthly.replace(/\s/g, '').endsWith('Year52' + core.fmt(core.sum(mon) / (1 - core.COMM)) + core.fmt(core.sum(mon))), 'Finance billing forecast year row');
console.log('PASS  Finance billing forecast: gross ' + core.fmt(core.sum(mon) / (1 - core.COMM)) + ' · net ' + core.fmt(core.sum(mon)));
const cac = C.cacRows(); const cacTot = core.BANDS.map((b, i) => core.sum(cac.map(r => r.vals[i])));
assert.ok(REF.reports.cac.replace(/\s/g, '').endsWith('Total' + cacTot.map(core.fmt).join('') + core.fmt(core.sum(cac.map(r => r.st)))), 'CAC allocation total row');
console.log('PASS  CAC allocation by month, annual ' + core.fmt(core.sum(cac.map(r => r.st))));
eq(C.ownerBars(), REF.reports.owners.split('\n').filter(Boolean).map(l => { const m = l.match(/^(.*?)(\(?\$[\d,.]+\)?)$/); return [m[1], money(m[2])]; }), 'client report: by owner');
eq(MARKETS.map(b => [b.market, ...C.stageOf(b)]), REF.overview.stages, 'overview: stageOf for every market');

// ── documents, character for character ────────────────────────────
eq(C.docOrder('WBBM'), REF.docs.order, 'docOrder(WBBM) HTML');
eq(C.docAvail('WBBM'), REF.docs.avail, 'docAvail(WBBM) HTML');
eq(C.docGuidelines('WBBM'), REF.docs.guidelines, 'docGuidelines(WBBM) HTML with estimate grids');
eq(C.docChange('WBBM', 2), REF.docs.change, 'docChange(WBBM, Rev 2) HTML');

console.log('\nALL MATCH — buy-abyss-core.js reproduces the prototype (Chicago 2027: plan $721,246.25 net · v1 · WBBM record $191,517.75)');
