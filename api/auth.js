const crypto = require('crypto');
const { getAuth } = require('./_admin');
let _usersMod = null;
function usersMod() {
  // Lazy-require so api/users.js (which requires this file) doesn't create a
  // load-order problem, and so auth keeps working if the module is absent.
  if (_usersMod === null) { try { _usersMod = require('./_users'); } catch (e) { _usersMod = false; } }
  return _usersMod;
}

// Stable Firebase Auth uid for any password-authed staff member. The app uses
// a single shared password for all staff — there's no per-user identity to
// preserve — so all sessions sign into the same Firebase Auth principal.
// Tightened Firestore rules check `request.auth != null`, not the uid, so this
// gives every authed client write access while leaving anonymous clients
// (vendor portals) blocked.
const STAFF_UID = 'atticor-staff';

// Per-user logins. Configure in Vercel as STAFF_USERS, pipe-separated
// "Name:password" pairs, e.g.  STAFF_USERS="Emm:hunter2|Jordan:correcthorse".
// The matched name is embedded (signed) in the session token so the audit log
// can show who did what. If STAFF_USERS is unset, the app falls back to the
// shared SYS_PASSWORD as user "Staff" — nothing breaks, no one gets locked out.
function parseStaffUsers() {
  const raw = process.env.STAFF_USERS || '';
  const users = [];
  raw.split('|').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const pw = pair.slice(idx + 1).replace(/[\r\n]+$/, '');
      if (name && pw) users.push({ name, password: pw });
    }
  });
  return users;
}

function userFromToken(token) {
  const parts = (token || '').split('.');
  if (parts.length === 4) {
    try {
      const b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(b64, 'base64').toString('utf8') || null;
    } catch (e) { return null; }
  }
  return null; // legacy 3-part token carries no identity
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Resolve the secret used to sign session tokens. Prefer SESSION_SECRET; fall
// back to deriving one from the existing passwords so a missing env var does
// not break login. The fallback is stable across cold-starts as long as the
// passwords don't change, which means existing sessions stay valid.
function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const seed = (process.env.SYS_PASSWORD || '') + '|' + (process.env.ADMIN_PASSWORD || '');
  if (!seed || seed === '|') return null;
  return crypto.createHash('sha256').update('dd:session:' + seed).digest('hex');
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Token format: <id>.<expiry>.<sig> where sig = HMAC-SHA256(secret, id+"."+expiry).
// Replaces the previous "random hex of any 64 chars passes" scheme — middleware
// can now reject any cookie that isn't issued (and signed) by this server.
// Token format: <user>.<id>.<expiry>.<sig>  (user = base64url of the name).
// sig = HMAC-SHA256(secret, user+"."+id+"."+expiry). Legacy 3-part tokens
// (no embedded user) are still accepted by validateSessionToken below so
// existing sessions survive the rollout.
function generateSessionToken(secret, user) {
  const id = b64url(crypto.randomBytes(18));
  const expiry = String(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const u = b64url(Buffer.from(user || '', 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', secret).update(u + '.' + id + '.' + expiry).digest());
  return u + '.' + id + '.' + expiry + '.' + sig;
}

function validateSessionToken(token, secret) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length === 4) {
    const [u, id, expiry, sig] = parts;
    if (!/^[A-Za-z0-9_-]*$/.test(u) || !/^[A-Za-z0-9_-]+$/.test(id) || !/^[0-9]+$/.test(expiry) || !/^[A-Za-z0-9_-]+$/.test(sig)) return false;
    if (Number(expiry) < Date.now()) return false;
    const expected = b64url(crypto.createHmac('sha256', secret).update(u + '.' + id + '.' + expiry).digest());
    return timingSafeEqual(sig, expected);
  }
  if (parts.length === 3) {
    const [id, expiry, sig] = parts;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[0-9]+$/.test(expiry) || !/^[A-Za-z0-9_-]+$/.test(sig)) return false;
    if (Number(expiry) < Date.now()) return false;
    const expected = b64url(crypto.createHmac('sha256', secret).update(id + '.' + expiry).digest());
    return timingSafeEqual(sig, expected);
  }
  return false;
}

const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
  loginAttempts.set(ip, recent);
  return recent.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGINS.length === 0) return '';
  return '';
}

module.exports = async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, type } = req.body || {};

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing type' });
  }

  const SYS_PASSWORD = process.env.SYS_PASSWORD;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const sessionSecret = getSessionSecret();

  // Validate cookie via HMAC instead of just regex shape — this is what closes
  // the "any 64-char hex string passes" hole the audit flagged.
  if (type === 'check') {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/dd_session=([^;]+)/);
    const rawToken = match ? decodeURIComponent(match[1]) : '';
    const authenticated = !!(rawToken && sessionSecret && validateSessionToken(rawToken, sessionSecret));
    // Recover the signed-in name from the token so the client can stamp the
    // audit log after a reload without re-logging in.
    const user = authenticated ? userFromToken(rawToken) : null;
    // Look up role + forced-password-change flag from the managed user store
    // (best effort — if the store is unavailable we just omit them).
    let role = null, mustChange = false;
    if (authenticated && user) {
      const um = usersMod();
      if (um) {
        try {
          const supabase = um.getSupabase();
          if (supabase) {
            const doc = await um.ensureSeed(supabase);
            const u = um.findUser(doc, user);
            if (u) { role = u.role; mustChange = !!u.mustChange; }
            else { role = user.trim().toLowerCase() === (process.env.OWNER_NAME || 'Emm').trim().toLowerCase() ? 'owner' : 'member'; }
          }
        } catch (e) { console.error('role lookup (check) failed:', e.message); }
      }
    }
    // Also mint a Firebase custom token for already-authed clients so they can
    // sign into Firebase Auth without re-logging in.
    let customToken = null;
    if (authenticated) {
      const adminAuth = getAuth();
      if (adminAuth) {
        try { customToken = await adminAuth.createCustomToken(STAFF_UID, { role: 'staff' }); }
        catch (e) { console.error('createCustomToken (check) failed:', e.message); }
      }
    }
    return res.status(200).json({ authenticated, user, role, mustChange, customToken });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing password' });
  }

  if (!SYS_PASSWORD || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  if (!sessionSecret) {
    return res.status(500).json({ error: 'Session secret unavailable' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  if (type === 'login') {
    recordAttempt(clientIp);
    let matched = null; // { name, role?, mustChange? }
    // 1. Managed user store (hashed passwords + roles), if Supabase is set up.
    const um = usersMod();
    if (um) {
      try {
        const supabase = um.getSupabase();
        if (supabase) {
          const doc = await um.ensureSeed(supabase);
          for (const u of (doc.users || [])) {
            if (u.active !== false && um.verifyPassword(password, u.pw)) {
              matched = { name: u.name, role: u.role, mustChange: !!u.mustChange };
            }
          }
        }
      } catch (e) { console.error('store login failed, falling back:', e.message); }
    }
    // 2. Fallback: env-configured logins (bootstrap / store unavailable). The
    //    shared SYS_PASSWORD always works as a safety net so no one is locked out.
    if (!matched) {
      const staffUsers = parseStaffUsers();
      for (const u of staffUsers) {
        if (timingSafeEqual(password, u.password)) matched = { name: u.name };
      }
      if (!matched && timingSafeEqual(password, SYS_PASSWORD)) {
        const ownerName = (process.env.OWNER_NAME || 'Emm').trim();
        matched = { name: ownerName, role: 'owner' };
      }
    }
    const success = !!matched;
    if (success) {
      const sessionToken = generateSessionToken(sessionSecret, matched.name);
      res.setHeader('Set-Cookie', `dd_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
      // Mint a Firebase Auth custom token if the Admin SDK is configured.
      // Client uses signInWithCustomToken so locked-down Firestore rules
      // accept its writes. If FIREBASE_ADMIN_KEY isn't set, customToken is
      // null and the client skips Firebase Auth — app behaves as before.
      let customToken = null;
      const adminAuth = getAuth();
      if (adminAuth) {
        try {
          customToken = await adminAuth.createCustomToken(STAFF_UID, { role: 'staff' });
        } catch (e) {
          console.error('createCustomToken failed:', e.message);
        }
      }
      return res.status(200).json({ success, user: matched.name, role: matched.role || null, mustChange: !!matched.mustChange, customToken });
    }
    return res.status(200).json({ success });
  }

  if (type === 'admin') {
    recordAttempt(clientIp);
    return res.status(200).json({ success: timingSafeEqual(password, ADMIN_PASSWORD) });
  }

  return res.status(400).json({ error: 'Invalid auth type' });
};

// Exposed for api/users.js to authenticate the session cookie and recover the
// signed-in identity. (module.exports is the handler above; attach helpers.)
module.exports.validateSessionToken = validateSessionToken;
module.exports.userFromToken = userFromToken;
module.exports.getSessionSecret = getSessionSecret;
