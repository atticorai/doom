// Vendor confirmation endpoint — Supabase edition.
//
// The vendor portal has no staff session, so it can't read or write the
// Supabase data directly (middleware blocks /api/db for session-less callers).
// This endpoint is the vendor's authenticated path: the per-station token in
// their email URL is the credential, validated server-side, and the server
// (using the Supabase service-role key, which bypasses RLS) reads/writes on
// their behalf.
//
// Request:  POST /api/confirm
// Body:     { action, ...args }
// Actions:
//   "load"        — { estNum, sta, token } → returns the portal payload
//                   (airing, sheet HTML, confirmation status) after resolving
//                   the correct confirmKey by token match. This is what lets
//                   the portal render without a staff login.
//   "confirm"     — mark a station as having confirmed receipt
//   "addEmail"    — append an email to a station's contact list
//   "removeNote"  — log a "please remove this contact" request
//
// All write actions require the submitted token to match
// confirmations[confirmKey][sta].token in Supabase.

const crypto = require('crypto');
const { getSupabase } = require('./_supabase');
const { archiveDoc } = require('./_archive');

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

// confirmKey is either the bare estimate ("2609") or the WK composite
// ("213|Birmingham"). Reject anything that doesn't match those shapes.
function isValidConfirmKey(s) {
  return typeof s === 'string' && /^[0-9]{3,4}(\|[A-Za-z][A-Za-z\s.\-]{0,32})?$/.test(s);
}
function isValidEstNum(s) {
  return typeof s === 'string' && /^[0-9]{3,4}$/.test(s);
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

// ── Supabase legacy_docs blob helpers ──────────────────────────────
// Each "collection/doc" is one JSON blob, mirroring the Firestore shape the
// app was built against.
async function readDoc(supabase, collection, docId) {
  const { data, error } = await supabase
    .from('legacy_docs')
    .select('data')
    .eq('collection', collection)
    .eq('doc_id', docId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.data == null) return null;
  return typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
}

async function writeDoc(supabase, collection, docId, obj, op) {
  // SAFETY: archive the prior version before overwriting.
  await archiveDoc(supabase, collection, docId, op || 'confirm', 'api/confirm');
  const { error } = await supabase
    .from('legacy_docs')
    .upsert(
      { collection, doc_id: docId, data: JSON.stringify(obj), ts: Date.now(), updated_at: new Date().toISOString() },
      { onConflict: 'collection,doc_id' }
    );
  if (error) throw error;
}

// Resolve the confirmKey for a (estNum, sta, token) tuple. PL keys are the
// bare estimate; WK keys are estNum|market — and the market isn't in the URL,
// so we locate it by finding the estNum|* entry whose token matches.
function resolveConfirmKey(confirmations, estNum, sta, token) {
  if (confirmations[estNum] && confirmations[estNum][sta] && confirmations[estNum][sta].token) {
    return estNum;
  }
  const prefix = estNum + '|';
  for (const k of Object.keys(confirmations)) {
    if (k.indexOf(prefix) !== 0) continue;
    const entry = confirmations[k] && confirmations[k][sta];
    if (entry && entry.token && timingSafeEqual(String(token), String(entry.token))) return k;
  }
  return null;
}

// Simple in-memory rate limiter, scoped per IP.
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

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { action, sta, token } = req.body || {};
  if (typeof action !== 'string') return res.status(400).json({ error: 'Missing action' });
  if (!isValidSta(sta)) return res.status(400).json({ error: 'Invalid sta' });
  if (!isValidToken(token)) return res.status(400).json({ error: 'Invalid token' });

  let confirmations;
  try {
    confirmations = (await readDoc(supabase, 'appData', 'confirmations')) || {};
  } catch (e) {
    console.error('confirm: read confirmations failed:', e.message);
    return res.status(500).json({ error: 'Read failed' });
  }

  // ── LOAD: render the portal without a staff session ───────────────
  // Token-gated public read. Resolves the confirmKey, validates the token,
  // and returns everything the vendor view needs.
  if (action === 'load') {
    const { estNum } = req.body || {};
    if (!isValidEstNum(estNum)) return res.status(400).json({ error: 'Invalid estNum' });
    const confirmKey = resolveConfirmKey(confirmations, estNum, sta, token);
    if (!confirmKey) return res.status(200).json({ ok: true, invalid: true });
    const stored = confirmations[confirmKey][sta];
    if (!timingSafeEqual(String(token), String(stored.token))) {
      return res.status(200).json({ ok: true, invalid: true });
    }
    let airing = null, sheetHtml = null;
    try {
      const nowAiring = (await readDoc(supabase, 'appData', 'nowAiring')) || {};
      airing = nowAiring[confirmKey] || null;
    } catch (e) { console.error('confirm/load: nowAiring read failed:', e.message); }
    try {
      const sheet = await readDoc(supabase, 'trafficSheets', estNum + '_' + sta);
      sheetHtml = (sheet && sheet.html) || null;
    } catch (e) { console.error('confirm/load: sheet read failed:', e.message); }
    const market = confirmKey.indexOf('|') >= 0 ? confirmKey.split('|')[1] : null;
    return res.status(200).json({
      ok: true,
      confirmKey,
      market,
      confirmed: !!stored.confirmed,
      ts: stored.ts || null,
      airing,
      sheetHtml,
    });
  }

  // ── Write actions: confirmKey comes from the body (the portal passes
  //    back the server-resolved key from the load step). Validate it and
  //    the token before mutating.
  const { confirmKey } = req.body || {};
  if (!isValidConfirmKey(confirmKey)) return res.status(400).json({ error: 'Invalid confirmKey' });

  const stored = confirmations[confirmKey] && confirmations[confirmKey][sta];
  const storedToken = stored && stored.token;
  if (!storedToken) return res.status(404).json({ error: 'No confirmation pending for this station' });
  if (!timingSafeEqual(String(token), String(storedToken))) return res.status(401).json({ error: 'Invalid token' });

  const ts = new Date().toISOString();

  if (action === 'confirm') {
    confirmations[confirmKey] = confirmations[confirmKey] || {};
    confirmations[confirmKey][sta] = Object.assign({}, stored, { confirmed: true, ts });
    // Optional batch: confirm sibling stations in the same ownership group.
    // The server enforces that siblings actually share the requestor's
    // ownership (so a token can't be replayed to confirm arbitrary stations).
    const { siblings } = req.body || {};
    let confirmedSiblings = [];
    if (Array.isArray(siblings) && siblings.length > 0) {
      try {
        const stationsArr = (await readDoc(supabase, 'appData', 'stations')) || [];
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
      await writeDoc(supabase, 'appData', 'confirmations', confirmations, 'confirm');
      return res.status(200).json({ ok: true, ts, siblings: confirmedSiblings });
    } catch (e) {
      console.error('confirm: write failed:', e.message);
      return res.status(500).json({ error: 'Write failed' });
    }
  }

  if (action === 'addEmail') {
    const { email } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    try {
      const stations = (await readDoc(supabase, 'appData', 'stations')) || [];
      let mutated = false;
      const next = stations.map(s => {
        if (s.call !== sta) return s;
        const existing = (s.contact || '').split(';').map(e => e.trim()).filter(Boolean);
        if (existing.includes(email)) return s;
        mutated = true;
        return Object.assign({}, s, { contact: existing.concat([email]).join('; ') });
      });
      if (mutated) {
        await writeDoc(supabase, 'appData', 'stations', next, 'addEmail');
      }
      const logs = (await readDoc(supabase, 'appData', 'portalRequests')) || [];
      logs.unshift({ ts, action: 'addEmail', sta, email, confirmKey });
      await writeDoc(supabase, 'appData', 'portalRequests', logs.slice(0, 500), 'addEmail');
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
      const logs = (await readDoc(supabase, 'appData', 'portalRequests')) || [];
      logs.unshift({ ts, action: 'removeNote', sta, note: note.trim(), confirmKey });
      await writeDoc(supabase, 'appData', 'portalRequests', logs.slice(0, 500), 'removeNote');
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('confirm/removeNote: failed:', e.message);
      return res.status(500).json({ error: 'removeNote failed' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
