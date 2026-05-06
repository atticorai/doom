#!/usr/bin/env bash
# Pre-flight checklist printer for the Firestore-rules lockdown.
# Run this before `firebase deploy --only firestore:rules,storage`.
#
# Usage: bash scripts/preflight-lockdown.sh

set -e

cat <<'EOF'

═══════════════════════════════════════════════════════════════════════
  FIRESTORE / STORAGE LOCKDOWN — PRE-FLIGHT CHECKLIST
═══════════════════════════════════════════════════════════════════════

Confirm each of these BEFORE running:
  firebase deploy --only firestore:rules,storage

If any answer is NO, stop. Restore from firestore.rules.previous and
investigate.

  [ ] 1. FIREBASE_ADMIN_KEY env var set in Vercel (Production AND Preview)?
         Check: Vercel project -> Settings -> Environment Variables.
         Value should start with {"type":"service_account",...

  [ ] 2. Logged in to the app on a fresh tab?
         Open DevTools console BEFORE refreshing. After login (or auto-resume),
         the console must print:
             Firebase Auth signed in: atticor-staff

         If it prints a warning instead ("createCustomToken failed", "no token"),
         step 1 is misconfigured.

  [ ] 3. Made a small edit and confirmed it persists?
         Toggle any ISCI active/inactive. Refresh. State stays.

  [ ] 4. Vendor confirm link works through the server endpoint?
         Open Network tab. Click any /?confirm=... URL. Click Confirm Receipt.
         You should see:
             POST /api/confirm   ->   200 OK
         If you see 503: FIREBASE_ADMIN_KEY is missing or malformed (don't deploy).
         If you see 401: token mismatch (try a fresh confirm URL — older URLs
                         were sent with tok=auto and only work via the legacy
                         fallback path, which will stop working after lockdown).

  [ ] 5. Firestore export taken in the last hour?
         Firebase Console -> Cloud Firestore -> Import/Export -> Export.
         Pick a Cloud Storage bucket. Wait for "Export complete".

  [ ] 6. storage.rules.previous captured (if you've loosened the defaults)?
         Console -> Storage -> Rules tab. Copy current text, paste into
         storage.rules.previous, commit, then deploy.

  [ ] 7. Have time to monitor for 30 minutes after deploy?
         If a write breaks for any user, you'll need to revert quickly.

═══════════════════════════════════════════════════════════════════════
  RECOVERY (if anything breaks after deploy)
═══════════════════════════════════════════════════════════════════════

  cp firestore.rules.previous firestore.rules
  firebase deploy --only firestore:rules

  Storage:
  # If you saved storage.rules.previous, restore it. Otherwise, in the
  # Firebase Console -> Storage -> Rules, set:
  #   allow read, write: if true;
  # then redeploy. (Temporarily insecure but unblocks users.)

═══════════════════════════════════════════════════════════════════════

EOF
