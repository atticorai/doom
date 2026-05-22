# Drive Import — Cloud Shell setup

Pulls every file out of a Google Drive folder, classifies it, copies bytes to Supabase Storage (`legacy-vault` bucket), and writes one row per file to the `legacy_assets` table. Resumable.

## One-time setup (5 minutes)

1. Open https://shell.cloud.google.com in your browser. (You already have a free Cloud Shell tied to your Google account — no setup, no credit card.)
2. Authorize Drive access — Cloud Shell already has your Google credentials, but the Drive scope needs an explicit consent the first time:
   ```bash
   gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/cloud-platform
   ```
   Follow the URL it prints, click through the consent screen, paste the code back.
3. Clone the repo and install deps:
   ```bash
   git clone https://github.com/atticorai/doom.git
   cd doom
   npm install --no-save googleapis @supabase/supabase-js
   ```
4. Export your Supabase credentials. Get them from the Supabase dashboard → Settings → API. **Use the service_role key** (not anon).
   ```bash
   export SUPABASE_URL=https://<your-project>.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
5. **First, run the schema** (if you haven't already) so the `legacy_assets` table and `legacy-vault` bucket exist:
   Open Supabase → SQL Editor → paste `supabase/schema.sql` → Run.

## Run it

Find the Drive folder ID (the long string in the folder's URL: `https://drive.google.com/drive/folders/<THIS_PART>`).

**Dry run first** — walks and classifies but doesn't upload or write anything. Tells you what it would do:

```bash
node scripts/drive-import.js <DRIVE_FOLDER_ID> --dry-run
```

If the summary at the end looks right, run it for real:

```bash
node scripts/drive-import.js <DRIVE_FOLDER_ID>
```

Live progress prints to the terminal. If you close the Cloud Shell tab or your connection drops, just re-run the same command — it's resumable via `drive-import-state.json` in the working directory.

## Flags

- `--dry-run` — classify only, no uploads, no DB writes
- `--types=TV,Radio` — only process specific classifications (comma-separated)
- `--max=100` — stop after N files (useful for smoke tests)
- `--reset` — ignore the state file and start fresh
- `--state=path.json` — use a non-default state file (e.g. one per Drive folder)

## What gets classified how

- `mp4/mov/avi/m4v/wmv/mkv/webm` ≥4s horizontal → **TV**
- Same but vertical (9:16) and <90s → **Social**
- Same with "broll/raw/rough/unedited" in name or path → **B-roll**
- `mp3/wav/m4a/aac/flac/ogg` → **Radio**
- `svg` OR small transparent PNG OR "logo/wordmark/mark" in name → **Logo**
- Images with standard banner dimensions (300×250, 728×90, 160×600, 320×50, etc.) → **Banner**
- Large images (≥3000px) or "billboard/poster/ooh/outdoor" in name/path → **OOH**
- `pdf` → **Print** (unless "billboard/poster/ooh" cue → OOH)
- `psd/ai/eps/indd` → **Other** (source design files)
- `doc/xlsx/key/ppt` → **Document**
- Anything else → **Other** with a classifier note

All rules live in `classifyV()` near the top of `scripts/drive-import.js`. Tune them, re-run, idempotent.

## After it finishes

- Look at the summary in the terminal.
- Open the app → Audit Log → click **📦 Export Other Assets Manifest** to download a CSV of everything that isn't TV/Radio (filename, type, brand, market, year, Supabase public URL, original Drive path). Hand the CSV to your other app.
- TV/Radio rows are now in `legacy_assets` and ready to surface in the WK Legacy Vault Creative tab (separate UI wire-up, see step 3 of the plan).
