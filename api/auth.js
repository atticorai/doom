const crypto = require('crypto');

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
function generateSessionToken(secret) {
  const id = b64url(crypto.randomBytes(18));
  const expiry = String(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const sig = b64url(crypto.createHmac('sha256', secret).update(id + '.' + expiry).digest());
  return id + '.' + expiry + '.' + sig;
}

function validateSessionToken(token, secret) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, expiry, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[0-9]+$/.test(expiry) || !/^[A-Za-z0-9_-]+$/.test(sig)) return false;
  if (Number(expiry) < Date.now()) return false;
  const expected = b64url(crypto.createHmac('sha256', secret).update(id + '.' + expiry).digest());
  return timingSafeEqual(sig, expected);
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
    const authenticated = !!(match && sessionSecret && validateSessionToken(decodeURIComponent(match[1]), sessionSecret));
    return res.status(200).json({ authenticated });
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
    const success = timingSafeEqual(password, SYS_PASSWORD);
    if (success) {
      const sessionToken = generateSessionToken(sessionSecret);
      res.setHeader('Set-Cookie', `dd_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
    }
    return res.status(200).json({ success });
  }

  if (type === 'admin') {
    recordAttempt(clientIp);
    return res.status(200).json({ success: timingSafeEqual(password, ADMIN_PASSWORD) });
  }

  return res.status(400).json({ error: 'Invalid auth type' });
};
