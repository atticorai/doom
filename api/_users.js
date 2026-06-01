// ═══════════════════════════════════════════════════════════════════
// _users.js — user + PIN store for in-app team management.
// ═══════════════════════════════════════════════════════════════════
// Model: one shared App Password (SYS_PASSWORD) gets you into the app.
// Each person also has a short PIN that says WHO they are and their role.
// Login = App Password + PIN. No PIN = generic "Staff" member.
//
// Users live in Supabase `legacy_docs` under collection '_auth', doc 'users'
// — a collection NOT in /api/db's allow-list, so the browser can never read
// it. PINs are scrypt-hashed, never stored or returned in the clear.
//
// The Owner is seeded from OWNER_NAME + OWNER_PIN on first use (and OWNER_PIN
// stays a permanent break-glass), so the Owner is never locked out and can
// still change their own PIN in-app afterward.
// ═══════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');

const AUTH_COLLECTION = '_auth';
const USERS_DOC = 'users';

function hashSecret(secret) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(secret), salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifySecret(secret, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(String(secret), salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (e) { return false; }
}

const isValidPin = (pin) => typeof pin === 'string' && /^[0-9]{4,8}$/.test(pin);

async function readUsersDoc(supabase) {
  const { data: row, error } = await supabase
    .from('legacy_docs')
    .select('data')
    .eq('collection', AUTH_COLLECTION)
    .eq('doc_id', USERS_DOC)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.data == null) return null;
  if (typeof row.data === 'string') { try { return JSON.parse(row.data); } catch (e) { return null; } }
  return row.data;
}

async function writeUsersDoc(supabase, doc) {
  const { error } = await supabase
    .from('legacy_docs')
    .upsert({ collection: AUTH_COLLECTION, doc_id: USERS_DOC, data: JSON.stringify(doc), ts: Date.now(), updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Returns the users doc, seeding the Owner from OWNER_NAME + OWNER_PIN the
// first time. Owner remains break-glass via env even after seeding.
async function ensureSeed(supabase) {
  let doc = await readUsersDoc(supabase);
  if (doc && Array.isArray(doc.users) && doc.users.length) return doc;
  const ownerName = (process.env.OWNER_NAME || 'Emm').trim();
  const ownerPin = process.env.OWNER_PIN;
  const users = [];
  if (ownerPin && isValidPin(ownerPin)) {
    users.push({ name: ownerName, role: 'owner', pin: hashSecret(ownerPin), active: true, createdAt: Date.now(), updatedAt: Date.now() });
  }
  doc = { users };
  if (users.length) { try { await writeUsersDoc(supabase, doc); } catch (e) { /* best effort */ } }
  return doc;
}

function findUser(doc, name) {
  if (!doc || !Array.isArray(doc.users) || !name) return null;
  const lc = String(name).toLowerCase();
  return doc.users.find(u => (u.name || '').toLowerCase() === lc) || null;
}

// Identify a user by their PIN (verifies against each stored hash).
function findByPin(doc, pin) {
  if (!doc || !Array.isArray(doc.users) || !pin) return null;
  return doc.users.find(u => u.active !== false && verifySecret(pin, u.pin)) || null;
}

function pinInUse(doc, pin, exceptName) {
  if (!doc || !Array.isArray(doc.users)) return false;
  const ex = (exceptName || '').toLowerCase();
  return doc.users.some(u => (u.name || '').toLowerCase() !== ex && verifySecret(pin, u.pin));
}

// Strip secrets before returning to the client.
function publicUser(u) {
  return { name: u.name, role: u.role, active: u.active !== false, hasPin: !!u.pin, updatedAt: u.updatedAt || null };
}

module.exports = {
  getSupabase, hashSecret, verifySecret, isValidPin,
  readUsersDoc, writeUsersDoc, ensureSeed, findUser, findByPin, pinInUse, publicUser,
  AUTH_COLLECTION, USERS_DOC,
};
