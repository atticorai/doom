# Drive Import — DigitalOcean walkthrough

End-to-end: rent a $6/month Linux box, point it at a Google Drive folder, it streams every file into Supabase Storage and writes a row per file to the `legacy_assets` table. Classified by type (TV/Radio/Logo/OOH/Banner/Social/B-roll/Print/Document/Other). Resumable. You don't touch the bytes.

Total active time: ~25 minutes of clicking/pasting. Then it runs unattended.

---

## Part A — DigitalOcean (5 minutes)

1. Go to **https://www.digitalocean.com** → **Sign Up**. Email + password + credit card.
2. On the dashboard, click **Create → Droplets**.
3. Settings:
   - **Region**: closest one to you
   - **OS image**: Ubuntu 22.04 (x64) — the default
   - **Size**: Basic → Regular → **$6/month** (1 GB RAM, 25 GB disk, 1 TB transfer). For 50 GB you fit within the transfer cap easily because Supabase is the destination, not external.
   - **Authentication**: pick **Password**. Set a strong password. (You'll paste this once.)
   - **Hostname**: `doom-drive` (or whatever, doesn't matter)
4. Click **Create Droplet**. Wait 30 seconds.
5. The droplet appears in the list. **Copy the IPv4 address** — it's a number like `134.122.55.10`. You'll need it.

You're now paying ~$0.009/hour ($0.22/day). Delete the droplet when done.

---

## Part B — Google Cloud OAuth client (10 minutes)

You already have a Cloud project. We just need to add an OAuth Client so the script can sign in as you and read your Drive.

1. **https://console.cloud.google.com** → make sure your project is selected at the top (the one you made earlier).
2. Top search bar: type **"OAuth consent screen"**, click the result.
3. If asked, pick **User Type → External**, click **CREATE**.
4. Fill in:
   - App name: `Doom Drive Import` (anything)
   - User support email: your email
   - Developer contact email: your email
   - Leave the rest blank
   - **SAVE AND CONTINUE**
5. **Scopes** step → **ADD OR REMOVE SCOPES** → in the filter type `drive.readonly` → check the row for `.../auth/drive.readonly` → click **UPDATE** at the bottom → then **SAVE AND CONTINUE**.
6. **Test users** step → **+ ADD USERS** → enter your Gmail (the one that can see the Drive folder) → **ADD** → **SAVE AND CONTINUE**.
7. **Summary** step → just click **BACK TO DASHBOARD**.

Now create the actual client:

8. Top search: **"Credentials"**, click the result.
9. Click **+ CREATE CREDENTIALS** at the top → **OAuth client ID**.
10. **Application type**: pick **Desktop app**.
11. Name: `Doom Drive Import`. Click **CREATE**.
12. A dialog shows your Client ID. Click **DOWNLOAD JSON**. A file named like `client_secret_*.json` lands in your Downloads. Keep track of where it saved.

---

## Part C — Connect to the VM (5 minutes)

You'll use Terminal (Mac) or PowerShell (Windows).

- **Mac**: Open **Terminal** (Spotlight → "Terminal").
- **Windows**: Open **PowerShell** (Start menu → "PowerShell").

Connect to the droplet (paste this, replacing the IP with yours):

```
ssh root@<YOUR_DROPLET_IP>
```

- It'll warn about a new fingerprint the first time — type **yes** and Enter.
- Paste the password you set when creating the droplet. (Won't show as you type, that's normal.)

You're now inside the rented Linux box. The prompt will look like `root@doom-drive:~#`.

Run the one-shot bootstrap (installs Node, clones the repo, installs deps):

```
curl -fsSL https://raw.githubusercontent.com/atticorai/doom/main/scripts/setup-vm.sh | bash
```

Wait ~30 seconds. It'll print "✓ VM ready." plus next steps.

---

## Part D — Upload your OAuth JSON to the VM (1 minute)

Open a **second Terminal window on your laptop** (don't close the SSH session). In the new window, run (Mac path; adjust for Windows):

```
scp ~/Downloads/client_secret_*.json root@<YOUR_DROPLET_IP>:/root/oauth.json
```

Paste the password again. It uploads the JSON.

---

## Part E — Set Supabase credentials + smoke test (3 minutes)

Back in the **first terminal window** (the SSH session), paste:

```
export SUPABASE_URL='https://<YOUR-PROJECT>.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='<YOUR-SERVICE-ROLE-KEY>'
export OAUTH_CLIENT_JSON='/root/oauth.json'
cd ~/doom
```

(Get the Supabase URL + service_role key from Supabase dashboard → Settings → API.)

Find your Drive folder ID — it's the long string in the folder's URL after `/folders/`:

```
https://drive.google.com/drive/folders/1abc...XYZ
                                       ^^^^^^^^^^ this part
```

**Smoke test** — walks, classifies, prints what it would do, no uploads:

```
node scripts/drive-import.js <FOLDER_ID> --dry-run --max=20
```

First run will print a URL. Open the URL on your laptop browser, sign in with the Gmail you added as a test user in Part B step 6, click **Continue** through the unverified-app warning, click **Allow**. Google shows a code — copy it. Paste it into the VM terminal where it's waiting. Hit Enter.

Now the script processes 20 files (max=20) and prints a classification summary. Look at it. If it looks reasonable, kill it with Ctrl-C if it hasn't finished — we're moving to the real run.

---

## Part F — Run for real

```
node scripts/drive-import.js <FOLDER_ID>
```

Walks the whole folder tree, streams every file Drive → Supabase, writes one `legacy_assets` row per file. Prints live progress. Checkpoints `drive-import-state.json` every 20 files so a disconnect doesn't lose work.

When you're done with one folder, run it again with a different `<FOLDER_ID>`. Or call the same one — it'll skip everything already in the state file.

**You can disconnect from SSH and leave the script running** if you use `nohup`:

```
nohup node scripts/drive-import.js <FOLDER_ID> > import.log 2>&1 &
```

Then `tail -f import.log` to watch progress. Close the SSH window, the script keeps running. Reconnect any time to check on it.

---

## When everything's done

1. In the Doom app → Audit Log → click **📦 Export Other Assets Manifest**. Downloads a CSV of everything that isn't TV/Radio (filename, type, brand, market, year, Supabase public URL, original Drive path). Hand the CSV to your other app.
2. On DigitalOcean → click the droplet → **Destroy** → **Destroy this Droplet**. Bill stops. You used maybe ~$0.50 to ~$2 in compute depending on how long the import ran.

---

## Flags (reminder)

- `--dry-run` — classify only, no uploads, no DB writes
- `--types=TV,Radio` — only process specific classifications
- `--max=100` — stop after N files (smoke test)
- `--reset` — ignore the state file and start fresh
- `--state=path.json` — use a non-default state file (one per Drive folder)

Classification rules live in `classifyV()` near the top of `scripts/drive-import.js`. Tune them, re-run, idempotent.
