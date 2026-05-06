// Lazy Firebase Admin init for Vercel serverless functions.
//
// FIREBASE_ADMIN_KEY must be the full JSON contents of a Firebase service-account
// key (Console → Project Settings → Service Accounts → Generate new private key).
// Paste the entire JSON as a single env var value — Vercel preserves the JSON
// text including newlines.
//
// If the env var is missing or malformed, getAdmin() returns null and callers
// should degrade gracefully (Phase B/C use this to fall back to the legacy
// client-side direct-Firestore path).

let _admin = null;
let _initAttempted = false;
let _initError = null;

function getAdmin() {
  if (_admin) return _admin;
  if (_initAttempted) return null;
  _initAttempted = true;

  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) {
    console.warn('FIREBASE_ADMIN_KEY not set — Firebase Admin features disabled');
    return null;
  }

  try {
    const admin = require('firebase-admin');
    let creds;
    try {
      creds = JSON.parse(raw);
    } catch (e) {
      // Some users paste with escaped newlines; tolerate that.
      creds = JSON.parse(raw.replace(/\\n/g, '\n'));
    }
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: creds.project_id || process.env.FIREBASE_PROJECT_ID
      });
    }
    _admin = admin;
    return admin;
  } catch (e) {
    _initError = e;
    console.error('Firebase Admin init failed:', e.message);
    return null;
  }
}

function getDb() {
  const admin = getAdmin();
  return admin ? admin.firestore() : null;
}

function getAuth() {
  const admin = getAdmin();
  return admin ? admin.auth() : null;
}

module.exports = { getAdmin, getDb, getAuth };
