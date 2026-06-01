// ═══════════════════════════════════════════════════════════════════
// _users.js — managed user store for in-app team management.
// ═══════════════════════════════════════════════════════════════════
// Users live in the Supabase `legacy_docs` table under collection '_auth',
// doc 'users'. That collection is NOT in /api/db's allow-list, so the
// browser shim can never read or write it — only the service-role endpoints
// (api/users.js, api/auth.js) touch it.
//
// Passwords are stored as scrypt hashes ("saltHex:hashHex"), never plaintext.
// Roles: 'owner' (you — protected, can't be removed/demoted), 'admin'
// (can manage members), 'member' (no management). The store is seeded with
// the Owner from OWNER_NAME + SYS_PASSWORD on first use, so the existing
// password keeps working and you start out as Owner.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');

const AUTH_COLLECTION = '_auth';
const USERS_DOC = 'users';

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (e) { return false; }
}

// Readable one-time temp password, e.g. "doom-7f3a9c2b".
function generateTempPassword() {
  return 'doom-' + crypto.randomBytes(4).toString('hex');
}

function firstStaffPassword() {
  const raw = process.env.STAFF_USERS || '';
  for (const pair of raw.split('|')) {
    const idx = pair.indexOf(':');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const pw = pair.slice(idx + 1).replace(/[\r\n]+$/, '');
      if (name && pw) return { name, pw };
    }
  }
  return null;
}

async function readUsersDoc(supabase) {
  const { data: row, error } = await supabase
    .from('legacy_docs')
    .select('data')
    .eq('collection', AUTH_COLLECTION)
    .eq('doc_id', USERS_DOC)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.data == null) return null;
  if (typeof row.data === 'string') {
    try { return JSON.parse(row.data); } catch (e) { return null; }
  }
  return row.data; // jsonb column
}

async function writeUsersDoc(supabase, doc) {
  const { error } = await supabase
    .from('legacy_docs')
    .upsert({ collection: AUTH_COLLECTION, doc_id: USERS_DOC, data: JSON.stringify(doc), ts: Date.now(), updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Returns the users doc. The Owner authenticates via the OWNER_PASSWORD env
// var (not the store), so this also prunes any stale 'owner' rows that older
// builds seeded — that's what stops the shared password from granting Owner.
async function ensureSeed(supabase) {
  let doc = await readUsersDoc(supabase);
  if (!doc || !Array.isArray(doc.users)) doc = { users: [] };
  const before = doc.users.length;
  doc.users = doc.users.filter(u => u.role !== 'owner');
  if (doc.users.length !== before) { try { await writeUsersDoc(supabase, doc); } catch (e) { /* best effort */ } }
  return doc;
}

function findUser(doc, name) {
  if (!doc || !Array.isArray(doc.users) || !name) return null;
  const lc = String(name).toLowerCase();
  return doc.users.find(u => (u.name || '').toLowerCase() === lc) || null;
}

// Strip secrets before returning users to the client.
function publicUser(u) {
  return { name: u.name, role: u.role, active: u.active !== false, mustChange: !!u.mustChange, updatedAt: u.updatedAt || null };
}

module.exports = {
  getSupabase, hashPassword, verifyPassword, generateTempPassword,
  readUsersDoc, writeUsersDoc, ensureSeed, findUser, publicUser,
  AUTH_COLLECTION, USERS_DOC,
};
