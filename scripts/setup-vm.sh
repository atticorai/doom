#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# setup-vm.sh — one-shot bootstrap for a fresh Ubuntu 22.04 droplet.
# ════════════════════════════════════════════════════════════════════
# After you SSH into the droplet, run:
#   curl -fsSL https://raw.githubusercontent.com/atticorai/doom/main/scripts/setup-vm.sh | bash
# OR if you've already cloned the repo:
#   bash scripts/setup-vm.sh
#
# Installs Node 20, git, and clones the doom repo if it isn't already
# there. Prints next-step instructions at the end.
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

echo "▸ updating apt"
apt-get update -y >/dev/null
apt-get install -y curl git ca-certificates >/dev/null

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -Eq '^v(2[0-9]|[3-9][0-9])'; then
  echo "▸ installing Node 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi

echo "▸ Node $(node --version) installed"

# Clone the repo if we're not already inside it.
if [ ! -f "scripts/drive-import.js" ]; then
  if [ -d "doom" ]; then
    cd doom
  else
    echo "▸ cloning atticorai/doom"
    git clone https://github.com/atticorai/doom.git
    cd doom
  fi
fi

echo "▸ installing script dependencies (googleapis + supabase-js)"
npm install --no-save googleapis @supabase/supabase-js >/dev/null 2>&1 || \
  npm install --no-save googleapis @supabase/supabase-js

cat <<'EOM'

────────────────────────────────────────────────────────────────────
✓ VM ready. Next steps (do these in order):

1. Upload the OAuth client JSON you downloaded from Google Cloud.
   From YOUR LAPTOP terminal (not this VM), run:

     scp ~/Downloads/client_secret_*.json root@<THIS_VM_IP>:/root/oauth.json

   (Find <THIS_VM_IP> in your DigitalOcean dashboard or by typing
   `hostname -I | awk '{print $1}'` in this VM.)

2. Back in THIS VM terminal, export your Supabase credentials:

     export SUPABASE_URL='https://<your-project>.supabase.co'
     export SUPABASE_SERVICE_ROLE_KEY='<your-service-role-key>'
     export OAUTH_CLIENT_JSON='/root/oauth.json'

3. Smoke test with a dry-run on a SMALL folder first (no uploads):

     cd ~/doom
     node scripts/drive-import.js <DRIVE_FOLDER_ID> --dry-run --max=20

   The first run will print a URL. Open it on your laptop, sign in
   with the Google account that can see the Drive folder, approve,
   copy the code Google shows, paste it back here.

4. If the dry-run output looks right, run for real:

     node scripts/drive-import.js <DRIVE_FOLDER_ID>

   It's resumable — re-running the same command picks up where it
   left off (state file: drive-import-state.json).
────────────────────────────────────────────────────────────────────
EOM
