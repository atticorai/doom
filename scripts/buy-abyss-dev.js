#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// Local dev server for The Buy Abyss — the real api/buy-abyss.js
// handler against a local Postgres, with a stubbed Doom session.
// ═══════════════════════════════════════════════════════════════════
//   DATABASE_URL=postgres://postgres@localhost/doom node scripts/buy-abyss-dev.js [port]
//   then open http://localhost:8787/abyss.html
//
// Not for production: Vercel serves abyss.html and /api/buy-abyss with
// the Supabase service-role client and the signed dd_session cookie.
// Here a tiny query-builder shim over `pg` stands in for supabase-js
// (the subset the handler uses) and every request is "Emm Caban".
// scripts/buy-abyss-e2e.js drives this server in headless Chromium.
// ═══════════════════════════════════════════════════════════════════
const http = require('http'); const fs = require('fs'); const path = require('path'); const url = require('url');
let Pool; try { ({ Pool } = require('pg')); } catch (e) { try { ({ Pool } = require(process.env.PG_MODULE || '/tmp/pg-missing')); } catch (e2) { console.error('needs the pg module: npm install pg (or PG_MODULE=/path/to/pg)'); process.exit(1); } }
const ROOT = path.join(__dirname, '..');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/doom' });
const USER = process.env.DEV_USER || 'Emm Caban';

// ── supabase-js subset over pg ─────────────────────────────────────
const ident = s => '"' + String(s).replace(/"/g, '""') + '"';
function builder(table) {
  const st = { table, op: 'select', cols: '*', where: [], order: [], limit: null, single: null, values: null, onConflict: null, returning: false };
  const b = {
    select(c) { if (st.op === 'select') st.cols = c || '*'; else st.returning = true; return b; },
    insert(v) { st.op = 'insert'; st.values = Array.isArray(v) ? v : [v]; return b; },
    upsert(v, o) { st.op = 'insert'; st.values = Array.isArray(v) ? v : [v]; st.onConflict = (o && o.onConflict) || null; return b; },
    update(v) { st.op = 'update'; st.values = v; return b; },
    delete() { st.op = 'delete'; return b; },
    eq(k, v) { st.where.push([k, '=', v]); return b; }, is(k, v) { st.where.push([k, v === null ? 'is null' : 'is', v]); return b; },
    in(k, v) { st.where.push([k, 'in', v]); return b; }, neq(k, v) { st.where.push([k, '<>', v]); return b; },
    order(k, o) { st.order.push(ident(k) + (o && o.ascending === false ? ' desc' : ' asc')); return b; },
    limit(n) { st.limit = n; return b; }, maybeSingle() { st.single = 'maybe'; return b; }, single() { st.single = 'one'; return b; },
    then(res, rej) { return run().then(res, rej); },
  };
  async function run() {
    const params = []; const P = v => { params.push(v); return '$' + params.length; };
    const wh = () => st.where.length ? ' where ' + st.where.map(([k, op, v]) => op === 'is null' ? ident(k) + ' is null' : op === 'in' ? ident(k) + ' = any(' + P(v) + ')' : ident(k) + ' ' + op + ' ' + P(v)).join(' and ') : '';
    const jv = v => (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) ? JSON.stringify(v) : (Array.isArray(v) && v.length && typeof v[0] === 'object' ? JSON.stringify(v) : v);
    let sql;
    try {
      if (st.op === 'select') sql = `select ${st.cols === '*' ? '*' : st.cols.split(',').map(c => ident(c.trim())).join(', ')} from ${ident(st.table)}${wh()}${st.order.length ? ' order by ' + st.order.join(', ') : ''}${st.limit ? ' limit ' + st.limit : ''}`;
      else if (st.op === 'insert') { const cols = [...new Set(st.values.flatMap(Object.keys))]; const rowsSql = st.values.map(r => '(' + cols.map(c => r[c] === undefined ? 'default' : P(jv(r[c]))).join(', ') + ')').join(', ');
        sql = `insert into ${ident(st.table)} (${cols.map(ident).join(', ')}) values ${rowsSql}` + (st.onConflict ? ` on conflict (${st.onConflict.split(',').map(c => ident(c.trim())).join(', ')}) do update set ${cols.map(c => ident(c) + ' = excluded.' + ident(c)).join(', ')}` : '') + ' returning *'; }
      else if (st.op === 'update') { const cols = Object.keys(st.values); sql = `update ${ident(st.table)} set ${cols.map(c => ident(c) + ' = ' + P(jv(st.values[c]))).join(', ')}${wh()} returning *`; }
      else if (st.op === 'delete') sql = `delete from ${ident(st.table)}${wh()} returning *`;
      const r = await pool.query(sql, params);
      let data = r.rows;
      if (st.single === 'one') { if (data.length !== 1) return { data: null, error: { message: `expected one row, got ${data.length} (${st.table})` } }; data = data[0]; }
      else if (st.single === 'maybe') data = data[0] || null;
      return { data, error: null };
    } catch (e) { return { data: null, error: { message: e.message + ' [' + (sql || st.op) + ']' } }; }
  }
  return b;
}
const sb = { from: builder, async rpc(fn, args) { const keys = Object.keys(args || {}); try { const r = await pool.query(`select ${ident(fn)}(${keys.map((k, i) => k + ' := $' + (i + 1)).join(', ')}) as v`, keys.map(k => (args[k] && typeof args[k] === 'object') ? JSON.stringify(args[k]) : args[k])); return { data: r.rows[0].v, error: null }; } catch (e) { return { data: null, error: { message: e.message } }; } } };

// the handler, with its Supabase client and session helpers replaced
const Module = require('module'); const origLoad = Module._load;
Module._load = function (req, parent, ...rest) {
  if (/_supabase$/.test(req)) return { getSupabase: () => sb };
  if (/\/auth$/.test(req) && parent && /buy-abyss\.js$/.test(parent.filename)) return { validateSessionToken: () => true, userFromToken: () => USER, getSessionSecret: () => 'dev' };
  return origLoad.call(this, req, parent, ...rest);
};
const handler = require(path.join(ROOT, 'api/buy-abyss.js'));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const port = Number(process.argv[2] || process.env.PORT || 8787);
http.createServer(async (req, res) => {
  const u = url.parse(req.url); let body = '';
  req.on('data', c => body += c); await new Promise(r => req.on('end', r));
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (u.pathname === '/api/auth') return send(200, { authenticated: true, user: USER, role: 'owner' });
  if (u.pathname === '/api/buy-abyss') {
    const fakeReq = { method: req.method, headers: { cookie: 'dd_session=dev' }, body: body ? JSON.parse(body) : {} };
    const fakeRes = { status(c) { this.code = c; return this; }, json(o) { send(this.code || 200, o); }, end() { res.writeHead(this.code || 200); res.end(); }, setHeader() {} };
    return handler(fakeReq, fakeRes);
  }
  const file = path.join(ROOT, decodeURIComponent(u.pathname === '/' ? '/abyss.html' : u.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`The Buy Abyss dev server → http://localhost:${port}/abyss.html  (db: ${process.env.DATABASE_URL || 'postgres://postgres@localhost/doom'}, user: ${USER})`));
