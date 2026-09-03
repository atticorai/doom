#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// Phase 1 done-state, end to end, in a real browser against real rows:
// Chicago 2027 goes budget → approved v1 → confirmation with the
// prototype's numbers.
// ═══════════════════════════════════════════════════════════════════
//   DATABASE_URL=postgres://postgres@127.0.0.1/doom node scripts/buy-abyss-dev.js 8787 &
//   node scripts/buy-abyss-e2e.js [http://localhost:8787]
// Needs playwright + Chromium (PLAYWRIGHT_CHROMIUM=/path/to/chrome if not on PATH).
// Leaves Chicago 2027 approved in the database it ran against — run it on a
// scratch database, not production.
// ═══════════════════════════════════════════════════════════════════
const { chromium } = require('playwright');
const assert = require('assert');
const BASE = process.argv[2] || 'http://localhost:8787';
const money = t => Number(String(t).replace(/[^\d.()-]/g, '').replace(/^\((.*)\)$/, '-$1'));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
  const p = await b.newPage(); const errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(BASE + '/abyss.html');
  await p.waitForFunction(() => document.getElementById('gate').classList.contains('off'), null, { timeout: 30000 });
  const who = await p.textContent('#userBox'); console.log('signed in:', who.trim().split('\n')[0]);
  // Emm lands on Overview; go to Chicago
  const chi = await p.evaluate(() => MARKETS.find(m => m.market === 'Chicago').id);
  await p.evaluate(id => setMarket(id), chi); await p.waitForFunction(() => M && M.market === 'Chicago' && STATIONS.length);
  const st = await p.evaluate(() => ({ all: ALL_STATIONS.length, tv: STATIONS.length, hist: histFor('WBBM').length, approved: M.approved }));
  console.log('Chicago:', st); assert.strictEqual(st.all, 36); assert.strictEqual(st.tv, 10); assert.strictEqual(st.hist, 4); assert.strictEqual(st.approved, false, 'run on a fresh database');
  // roll WBBM's 2026 forward
  await p.evaluate(() => { show('schedules'); scStation = 'WBBM'; renderSchedules(); });
  await p.click('#rollFwd'); await p.waitForFunction(() => M.orders.length === 4 && document.querySelector('#scKpis b'), null, { timeout: 30000 });
  const kp = (await p.textContent('#scKpis')).replace(/\s+/g, ' ');
  console.log('schedule KPIs:', kp);
  const T = await p.evaluate(() => planTotals());
  assert.strictEqual(T.tot, 721246.25, 'plan net'); assert.ok(Math.abs(T.cpm - 4.520821516946057) < 1e-9, 'cpm');
  assert.ok(/5,656\+ 592 bonus = 6,248/.test(kp) && /\$721,246\.25gross \$848,525\.00/.test(kp) && /\$4\.52on 42,363k imps/.test(kp) && /Rating points3698/.test(kp), 'schedule KPIs');
  // persisted?
  const wp = await p.evaluate(async () => (await api('load', { market_year_id: M.id })).working_plan.plan);
  assert.strictEqual(Object.values(wp).reduce((a, r) => a + r.$.reduce((x, y) => x + y, 0), 0), 721246.25, 'working plan persisted in ba_working_plan');
  // budget from Finance, estimates, approve
  await p.evaluate(() => show('plan')); await p.fill('#gBudget', '2500000'); await p.press('#gBudget', 'Tab');
  await p.waitForFunction(() => M.budget === 2500000);
  await p.evaluate(() => show('approve')); await p.click('#estAuto'); await p.waitForFunction(() => ESTS().every(e => !e.active || e.no));
  const qa = await p.evaluate(() => qaChecks()); console.log('QA:', JSON.stringify(qa)); assert.strictEqual(qa.B.length, 0, 'no blocks');
  await p.click('#approveBtn'); await p.click('#runFlow');
  await p.waitForFunction(() => M.approved === true, null, { timeout: 30000 });
  const ap = await p.evaluate(async () => { const L = await api('load', { market_year_id: M.id }); return { v: APPROVED().v, by: APPROVED().by, net: APPROVED().totals.net, versions: L.versions.map(v => [v.version, v.approver, v.snapshot_sha256.slice(0, 12), Number(v.plan_total_net)]), ests: ESTS().map(e => e.type + ':' + e.no) }; });
  console.log('approved:', JSON.stringify(ap));
  assert.strictEqual(ap.v, 1); assert.strictEqual(Number(ap.net), 721246.25); assert.deepStrictEqual(ap.versions, [[1, 'Jessica Flynn', ap.versions[0][2], 721246.25]]); assert.ok(ap.ests.includes('Base buy:2701') && ap.ests.includes('No-cash:2702'), 'estimate numbers 2701/2702');
  // accept the last draft (Q4) as the schedule of record — the same one the prototype accepted
  await p.evaluate(() => show('order')); await p.click('#confDocs .doc'); await p.click('#acceptBtn');
  await p.waitForFunction(() => M.orders.some(o => o.status === 'applied'), null, { timeout: 30000 });
  const rec = await p.evaluate(async () => { show('grid'); const L = await api('load', { market_year_id: M.id }); return { recordNet: recordNet('WBBM').reduce((a, b) => a + b, 0), stage: stageOf(M), gKpis: document.getElementById('gKpis').innerText, sor: L.schedule_of_record.map(r => [r.applied_by, r.approved_plan_id === M.approvedId]), variance: L.variance.filter(v => v.confirmed_net != null).map(v => [v.call_sign, Number(v.approved_net), Number(v.confirmed_net), Number(v.variance_net)]), docs: L.order_documents.map(o => o.order + ':' + o.status), active: M.orders.map(o => o.order + ':' + o.status) }; });
  console.log('record:', JSON.stringify(rec));
  assert.strictEqual(rec.recordNet, 191517.75, 'schedule of record net'); assert.deepStrictEqual(rec.stage, ['Approved', 'orders not sent']);
  const g = rec.gKpis.split('\n'); assert.strictEqual(money(g[1]), 721246.25); assert.ok(g[3].startsWith('$191,517.75')); assert.strictEqual(money(g[5]), -529728.5);
  assert.deepStrictEqual(rec.sor, [['Emm Caban', true]]); assert.deepStrictEqual(rec.variance, [['WBBM', 721246.25, 191517.75, -529728.5]]);
  assert.ok(rec.docs.includes('742220:applied') && rec.docs.includes('DRAFT-742220:superseded'), 'draft superseded by its confirmation (kept in ba_order_document)'); assert.ok(!rec.active.some(x => x.startsWith('DRAFT-742220')) && rec.active.includes('742220:applied'), 'superseded draft leaves the active orders');
  // invariant 1 from the browser: a bare write to v1 is refused; the working plan is locked
  const locked = await p.evaluate(() => document.getElementById('planT').classList.contains('locked') || (show('plan'), document.getElementById('planT').classList.contains('locked')));
  assert.ok(locked, 'plan grid locked after approval');
  await p.setViewportSize({ width: 1440, height: 900 }); for (const [scr, file] of [['grid', 'grid'], ['plan', 'plan'], ['approve', 'approve'], ['schedules', 'schedules']]) { await p.evaluate(sc => show(sc), scr); await p.waitForTimeout(300); await p.screenshot({ path: (process.env.SHOTS || '.') + '/abyss-' + file + '.png' }); }
  assert.deepStrictEqual(errors.filter(e => !/favicon|fonts|ERR_FAILED/.test(e)), [], 'no page errors');
  console.log('\nPHASE 1 DONE-STATE REACHED — Chicago 2027: budget $2,500,000 → approved v1 ($721,246.25 net, estimates 2701/2702) → WBBM confirmation accepted as schedule of record ($191,517.75), same numbers as the prototype.');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
