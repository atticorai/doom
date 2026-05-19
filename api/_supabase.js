// Lazy Supabase service-role client for Vercel serverless functions.
//
// SUPABASE_URL              — the project URL (https://xxx.supabase.co)
// SUPABASE_SERVICE_ROLE_KEY — the secret key (bypasses RLS). NEVER ship to
//                             the browser. Lives in Vercel env vars only.
//
// Returns null if env vars are missing — callers should degrade gracefully
// (the app can keep running off Firestore while Supabase is being set up).

let _client = null;
let _initAttempted = false;

function getSupabase() {
  if (_client) return _client;
  if (_initAttempted) return null;
  _initAttempted = true;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('Supabase env vars not set — adapter disabled');
    return null;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return _client;
  } catch (e) {
    console.error('Supabase init failed:', e.message);
    return null;
  }
}

module.exports = { getSupabase };
