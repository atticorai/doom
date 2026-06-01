// ═══════════════════════════════════════════════════════════════════
// /api/users — in-app team management (role-gated, service-role).
// ═══════════════════════════════════════════════════════════════════
// Actions (POST { action, ... }):
//   list               — owner/admin: list users (no secrets)
//   add {name,role}     — owner/admin: create user, returns one-time tempPassword
//   reset {name}        — owner/admin: reset to a new tempPassword (forced change)
//   remove {name}       — owner/admin: delete a user
//   setRole {name,role} — owner only: change a user's role
//   changeOwnPassword {newPassword} — any signed-in user: set own password
//
// Roles: owner (protected — can't be removed/demoted; only owner manages
// admins), admin (manages members only), member (no management).
// Identity comes from the signed dd_session cookie; role is looked up
// server-side from the store — the client is never trusted for authorization.
// ═══════════════════════════════════════════════════════════════════

const {
  getSupabase, ensureSeed, findUser, publicUser,
  hashPassword, generateTempPassword, writeUsersDoc,
} = require('./_users');
const { validateSessionToken, userFromToken, getSessionSecret } = require('./auth');

function callerName(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/dd_session=([^;]+)/);
  const tok = m ? decodeURIComponent(m[1]) : '';
  const secret = getSessionSecret();
  if (!tok || !secret || !validateSessionToken(tok, secret)) return null;
  return userFromToken(tok);
}

const isManager = (role) => role === 'owner' || role === 'admin';
// Who an actor may act on. Owner → anyone except the owner. Admin → members.
function canManage(actorRole, targetRole) {
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') return targetRole === 'member';
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const name = callerName(req);
  if (!name) return res.status(401).json({ error: 'Not signed in' });

  let doc;
  try { doc = await ensureSeed(supabase); }
  catch (e) { console.error('users store error:', e); return res.status(500).json({ error: 'User store unavailable' }); }
  if (!doc.users) doc.users = [];

  const me = findUser(doc, name);
  const ownerName = (process.env.OWNER_NAME || 'Emm').trim().toLowerCase();
  const myRole = me ? me.role : (name.toLowerCase() === ownerName ? 'owner' : 'member');
  const { action } = req.body || {};

  try {
    // Anyone signed in can change their own password (used by forced change).
    if (action === 'changeOwnPassword') {
      const np = (req.body && req.body.newPassword) || '';
      if (typeof np !== 'string' || np.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      if (!me) return res.status(400).json({ error: 'No managed account for this user' });
      me.pw = hashPassword(np); me.mustChange = false; me.updatedAt = Date.now();
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true });
    }

    if (action === 'list') {
      if (!isManager(myRole)) return res.status(403).json({ error: 'Not allowed' });
      return res.status(200).json({ users: doc.users.map(publicUser), me: { name, role: myRole } });
    }

    if (!isManager(myRole)) return res.status(403).json({ error: 'Not allowed' });

    if (action === 'add') {
      const nn = ((req.body && req.body.name) || '').trim();
      let rr = ((req.body && req.body.role) || 'member').trim();
      if (!nn) return res.status(400).json({ error: 'Name required' });
      if (findUser(doc, nn)) return res.status(409).json({ error: 'A user with that name already exists' });
      // Only the owner can mint admins; everyone else's adds are members.
      if (rr === 'admin' && myRole !== 'owner') return res.status(403).json({ error: 'Only the owner can add admins' });
      if (rr !== 'admin') rr = 'member';
      const temp = generateTempPassword();
      const now = Date.now();
      doc.users.push({ name: nn, role: rr, pw: hashPassword(temp), active: true, mustChange: true, createdAt: now, updatedAt: now });
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true, tempPassword: temp, name: nn, role: rr });
    }

    if (action === 'reset') {
      const tn = ((req.body && req.body.name) || '').trim();
      const target = findUser(doc, tn);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (!canManage(myRole, target.role)) return res.status(403).json({ error: 'Not allowed to reset that user' });
      const temp = generateTempPassword();
      target.pw = hashPassword(temp); target.mustChange = true; target.updatedAt = Date.now();
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true, tempPassword: temp, name: target.name });
    }

    if (action === 'remove') {
      const tn = ((req.body && req.body.name) || '').trim();
      const target = findUser(doc, tn);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (!canManage(myRole, target.role)) return res.status(403).json({ error: 'Not allowed to remove that user' });
      doc.users = doc.users.filter(u => u !== target);
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true });
    }

    if (action === 'setRole') {
      if (myRole !== 'owner') return res.status(403).json({ error: 'Only the owner can change roles' });
      const tn = ((req.body && req.body.name) || '').trim();
      let rr = ((req.body && req.body.role) || '').trim();
      const target = findUser(doc, tn);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.role === 'owner') return res.status(403).json({ error: "Can't change the owner's role" });
      if (rr !== 'admin' && rr !== 'member') return res.status(400).json({ error: 'Invalid role' });
      target.role = rr; target.updatedAt = Date.now();
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('users endpoint error:', e);
    return res.status(500).json({ error: 'User store error', detail: e.message });
  }
};
