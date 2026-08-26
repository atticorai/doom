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

// The starting roster — shown on the login name-picker. Each person sets their
// own PIN the first time they pick their name. Roles: owner/admin/member;
// title is display-only.
const DEFAULT_TEAM = [
  { name: 'Emm Caban', role: 'owner', title: 'Traffic Manager' },
  { name: 'Hayley Banks', role: 'admin', title: 'VP of Creative' },
  { name: 'Jessica Flynn', role: 'member', title: 'Paid Media Manager' },
  { name: 'Hazel Wolf', role: 'member', title: 'Marketing & Communications Manager' },
  { name: 'Marti Rodda', role: 'member', title: 'Wettermark Keith Marketing Manager' },
  { name: 'Jon Podschun', role: 'member', title: 'Senior Graphic Designer' },
  { name: 'Michelle Diaz', role: 'member', title: 'Social Media Marketing Coordinator' },
  { name: 'Brandy Newton', role: 'member', title: 'Creative Ops Manager' },
];

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

// Ensures the starting roster exists (idempotent). Adds any missing person
// from DEFAULT_TEAM (no PIN — they create it at first login), backfills titles,
// and clears out the old auto-seed placeholder "Emm" if it's lingering from an
// earlier build. Never touches an existing person's PIN.
async function ensureSeed(supabase) {
  let doc = await readUsersDoc(supabase);
  if (!doc || !Array.isArray(doc.users)) doc = { users: [] };
  let changed = false;
  // Drop the legacy placeholder owner named exactly "Emm" (real owner is "Emm Caban").
  const before = doc.users.length;
  doc.users = doc.users.filter(u => (u.name || '').trim().toLowerCase() !== 'emm');
  if (doc.users.length !== before) changed = true;
  DEFAULT_TEAM.forEach(d => {
    const ex = findUser(doc, d.name);
    if (!ex) {
      doc.users.push({ name: d.name, role: d.role, title: d.title, pin: null, active: true, createdAt: Date.now(), updatedAt: Date.now() });
      changed = true;
    } else if (!ex.title && d.title) { ex.title = d.title; changed = true; }
  });
  if (changed) { try { await writeUsersDoc(supabase, doc); } catch (e) { /* best effort */ } }
  return doc;
}

// Roster for the login name-picker: names + roles + titles + whether a PIN is set.
function roster(doc) {
  return (doc && doc.users || []).filter(u => u.active !== false).map(u => ({ name: u.name, role: u.role, title: u.title || '', hasPin: !!u.pin }));
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
  return { name: u.name, role: u.role, title: u.title || '', active: u.active !== false, hasPin: !!u.pin, updatedAt: u.updatedAt || null };
}

module.exports = {
  getSupabase, hashSecret, verifySecret, isValidPin,
  readUsersDoc, writeUsersDoc, ensureSeed, findUser, findByPin, pinInUse, publicUser, roster,
  AUTH_COLLECTION, USERS_DOC,
};
