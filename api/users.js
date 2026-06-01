// ═══════════════════════════════════════════════════════════════════
// /api/users — in-app team management (role-gated, service-role).
// ═══════════════════════════════════════════════════════════════════
// Actions (POST { action, ... }):
//   list                — owner/admin: list users (no PINs)
//   add {name,role,pin} — owner/admin: create a user with a PIN
//   setPin {name,pin}   — owner/admin: reset someone's PIN
//   remove {name}       — owner/admin: delete a user
//   setRole {name,role} — owner only: change a user's role
//   changeOwnPin {pin}  — any signed-in user: change own PIN
//
// Roles: owner (protected), admin (manages members only), member.
// Identity comes from the signed dd_session cookie; role is resolved
// server-side from the store — the client is never trusted for authz.
// PINs are 4-8 digits, unique across users, scrypt-hashed.
// ═══════════════════════════════════════════════════════════════════

const {
  getSupabase, ensureSeed, findUser, publicUser,
  hashSecret, writeUsersDoc, isValidPin, pinInUse,
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
  const pinOf = (b) => String((b && b.pin) || '').trim();

  try {
    // Anyone signed in can change their own PIN.
    if (action === 'changeOwnPin') {
      const np = pinOf(req.body);
      if (!isValidPin(np)) return res.status(400).json({ error: 'PIN must be 4–8 digits' });
      if (!me) return res.status(400).json({ error: 'No account to set a PIN on (you signed in with the App Password only).' });
      if (pinInUse(doc, np, me.name)) return res.status(409).json({ error: 'That PIN is already taken — pick another.' });
      me.pin = hashSecret(np); me.updatedAt = Date.now();
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true });
    }

    if (action === 'list') {
      if (!isManager(myRole)) return res.status(403).json({ error: 'Not allowed' });
      const out = doc.users.map(publicUser);
      const ownerDisplay = (process.env.OWNER_NAME || 'Emm').trim();
      if (!out.some(u => u.role === 'owner')) {
        out.unshift({ name: ownerDisplay, role: 'owner', active: true, hasPin: true, updatedAt: null });
      }
      return res.status(200).json({ users: out, me: { name, role: myRole } });
    }

    if (!isManager(myRole)) return res.status(403).json({ error: 'Not allowed' });

    if (action === 'add') {
      const nn = ((req.body && req.body.name) || '').trim();
      let rr = ((req.body && req.body.role) || 'member').trim();
      if (!nn) return res.status(400).json({ error: 'Name required' });
      if (findUser(doc, nn)) return res.status(409).json({ error: 'A user with that name already exists' });
      if (rr === 'admin' && myRole !== 'owner') return res.status(403).json({ error: 'Only the owner can add admins' });
      if (rr !== 'admin') rr = 'member';
      const now = Date.now();
      // No PIN — the person creates their own the first time they sign in.
      doc.users.push({ name: nn, role: rr, pin: null, active: true, createdAt: now, updatedAt: now });
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true, name: nn, role: rr });
    }

    if (action === 'resetPin') {
      const tn = ((req.body && req.body.name) || '').trim();
      const target = findUser(doc, tn);
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (!canManage(myRole, target.role)) return res.status(403).json({ error: 'Not allowed to change that user' });
      // Clear the PIN — they'll set a fresh one at their next sign-in.
      target.pin = null; target.updatedAt = Date.now();
      await writeUsersDoc(supabase, doc);
      return res.status(200).json({ ok: true, name: target.name });
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
