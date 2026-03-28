const crypto = require('crypto');

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Simple in-memory rate limiter
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
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
  if (ALLOWED_ORIGINS.length === 0) return origin || '*';
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

  // Check if user has a valid session cookie
  if (type === 'check') {
    const cookie = req.headers.cookie || '';
    // Validate session token format (64-char hex string) instead of just checking existence
    const match = cookie.match(/dd_session=([a-f0-9]{64})/);
    const authenticated = !!match;
    return res.status(200).json({ authenticated });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing password' });
  }

  if (!SYS_PASSWORD || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  if (type === 'login') {
    recordAttempt(clientIp);
    const success = timingSafeEqual(password, SYS_PASSWORD);
    if (success) {
      const sessionToken = generateSessionToken();
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
