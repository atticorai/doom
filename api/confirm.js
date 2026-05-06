// Vendor confirmation endpoint. Exists so the vendor portal can write
// confirmations after Firestore rules are tightened to require auth — vendors
// don't have a session, so they can't write directly. Instead, the per-station
// token in their email URL gates this endpoint, and the server (using the
// Admin SDK, which bypasses rules) writes on their behalf.
//
// Request:  POST /api/confirm
// Body:     { action, confirmKey, sta, token, ...actionArgs }
// Actions:  "confirm"     — mark a station as having confirmed receipt
//           "addEmail"    — append an email to a station's contact list
//           "removeNote"  — log a "please remove this contact" request
//
// All actions require the submitted token to match
// confirmations[confirmKey][sta].token in Firestore.
//
// If FIREBASE_ADMIN_KEY isn't set the Admin SDK isn't available; the endpoint
// returns 503 and the client falls back to writing directly to Firestore (the
// pre-lockdown path). This means Phase B can ship without Admin configured —
// and Admin can be configured later with no further code changes.

const crypto = require('crypto');
const { getDb } = require('./_admin');

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

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGINS.length === 0) return '';
  return '';
}

// Mirror of app.js's input sanitization. confirmKey is either the bare
// estimate ("2609") or the WK composite ("213|Birmingham"). Reject anything
// that doesn't match those shapes.
function isValidConfirmKey(s) {
  return typeof s === 'string' && /^[0-9]{3,4}(\|[A-Za-z][A-Za-z\s.\-]{0,32})?$/.test(s);
}
function isValidSta(s) {
  return typeof s === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(s);
}
function isValidToken(s) {
  return typeof s === 'string' && /^[A-Fa-f0-9]{16,64}$/.test(s);
}
function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254 && !/[\r\n]/.test(s);
}

// Simple in-memory rate limiter, scoped per IP. Not perfect across Vercel
// instances but raises the bar for casual abuse.
const recent = new Map();
const RATE_WINDOW = 60 * 1000;
const MAX_REQ = 30;
function rateLimit(ip) {
  const now = Date.now();
  const arr = (recent.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > MAX_REQ;
}

module.exports = async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  if (rateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });

  const db = getDb();
  if (!db) {
    // Admin SDK not configured — client falls back to direct Firestore write.
    return res.status(503).json({ error: 'Admin not configured' });
  }

  const { action, confirmKey, sta, token } = req.body || {};

  if (!isValidConfirmKey(confirmKey)) return res.status(400).json({ error: 'Invalid confirmKey' });
  if (!isValidSta(sta)) return res.status(400).json({ error: 'Invalid sta' });
  if (!isValidToken(token)) return res.status(400).json({ error: 'Invalid token' });
  if (typeof action !== 'string') return res.status(400).json({ error: 'Missing action' });

  // Load confirmations and validate the per-station token. Stored shape:
  // { data: JSON.stringify({ [confirmKey]: { [sta]: { token, confirmed, ts } } }) }
  let confirmations;
  try {
    const doc = await db.collection('appData').doc('confirmations').get();
    confirmations = doc.exists && doc.data().data ? JSON.parse(doc.data().data) : {};
  } catch (e) {
    console.error('confirm: read confirmations failed:', e.message);
    return res.status(500).json({ error: 'Read failed' });
  }

  const stored = confirmations[confirmKey] && confirmations[confirmKey][sta];
  const storedToken = stored && stored.token;
  if (!storedToken) return res.status(404).json({ error: 'No confirmation pending for this station' });
  if (!timingSafeEqual(token, storedToken)) return res.status(401).json({ error: 'Invalid token' });

  const ts = new Date().toISOString();

  if (action === 'confirm') {
    confirmations[confirmKey] = confirmations[confirmKey] || {};
    confirmations[confirmKey][sta] = Object.assign({}, stored, { confirmed: true, ts });
    // Optional batch: confirm sibling stations in the same ownership group.
    // The requesting vendor's token authorizes the batch; the server enforces
    // that siblings actually share the requestor's ownership in stations data
    // (so a token can't be replayed to confirm arbitrary stations).
    const { siblings } = req.body || {};
    let confirmedSiblings = [];
    if (Array.isArray(siblings) && siblings.length > 0) {
      try {
        const stationsDoc = await db.collection('appData').doc('stations').get();
        const stationsArr = stationsDoc.exists ? JSON.parse(stationsDoc.data().data || '[]') : [];
        const requestor = stationsArr.find(s => s.call === sta);
        const ownership = requestor && requestor.ownership;
        if (ownership) {
          const validSiblings = stationsArr
            .filter(s => s.ownership === ownership && s.call !== sta)
            .map(s => s.call);
          siblings
            .filter(c => isValidSta(c) && validSiblings.includes(c))
            .forEach(c => {
              const sibStored = confirmations[confirmKey][c] || { confirmed: false };
              confirmations[confirmKey][c] = Object.assign({}, sibStored, { confirmed: true, ts });
              confirmedSiblings.push(c);
            });
        }
      } catch (e) {
        console.error('confirm/siblings: failed:', e.message);
      }
    }
    try {
      await db.collection('appData').doc('confirmations').set({ data: JSON.stringify(confirmations), ts: Date.now() });
      return res.status(200).json({ ok: true, ts, siblings: confirmedSiblings });
    } catch (e) {
      console.error('confirm: write failed:', e.message);
      return res.status(500).json({ error: 'Write failed' });
    }
  }

  if (action === 'addEmail') {
    const { email } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    // Append to the station's contact list. Read stations, find by call letter,
    // append if not duplicate.
    try {
      const stationsDoc = await db.collection('appData').doc('stations').get();
      if (!stationsDoc.exists) return res.status(500).json({ error: 'Stations not found' });
      const stations = JSON.parse(stationsDoc.data().data || '[]');
      let mutated = false;
      const next = stations.map(s => {
        if (s.call !== sta) return s;
        const existing = (s.contact || '').split(';').map(e => e.trim()).filter(Boolean);
        if (existing.includes(email)) return s;
        mutated = true;
        return Object.assign({}, s, { contact: existing.concat([email]).join('; ') });
      });
      if (mutated) {
        await db.collection('appData').doc('stations').set({ data: JSON.stringify(next), ts: Date.now() });
      }
      // Also append to a portalRequests log so the operator sees the change.
      const logsRef = db.collection('appData').doc('portalRequests');
      const logsDoc = await logsRef.get();
      const logs = logsDoc.exists && logsDoc.data().data ? JSON.parse(logsDoc.data().data) : [];
      logs.unshift({ ts, action: 'addEmail', sta, email, confirmKey });
      await logsRef.set({ data: JSON.stringify(logs.slice(0, 500)), ts: Date.now() });
      return res.status(200).json({ ok: true, mutated });
    } catch (e) {
      console.error('confirm/addEmail: failed:', e.message);
      return res.status(500).json({ error: 'addEmail failed' });
    }
  }

  if (action === 'removeNote') {
    const { note } = req.body || {};
    if (typeof note !== 'string' || note.length === 0 || note.length > 500) {
      return res.status(400).json({ error: 'Invalid note' });
    }
    try {
      const logsRef = db.collection('appData').doc('portalRequests');
      const logsDoc = await logsRef.get();
      const logs = logsDoc.exists && logsDoc.data().data ? JSON.parse(logsDoc.data().data) : [];
      logs.unshift({ ts, action: 'removeNote', sta, note: note.trim(), confirmKey });
      await logsRef.set({ data: JSON.stringify(logs.slice(0, 500)), ts: Date.now() });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('confirm/removeNote: failed:', e.message);
      return res.status(500).json({ error: 'removeNote failed' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
