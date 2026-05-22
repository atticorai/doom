# Drive Import — DigitalOcean walkthrough

End-to-end: rent a $6/month Linux box, point it at a Google Drive folder, it streams every file into Supabase Storage and writes a row per file to the `legacy_assets` table. Classified by type (TV/Radio/Logo/OOH/Banner/Social/B-roll/Print/Document/Other). Resumable. You don't touch the bytes.

Total active time: ~25 minutes of clicking/pasting. Then it runs unattended.

---

## Part A — DigitalOcean (10–15 minutes for first-time signup)

### A1. Sign up

1. Open **https://www.digitalocean.com** in a new tab.
2. Click **Sign Up** (top right).
3. Use email/password, Google, or GitHub login — whichever's easiest. (New accounts get $200 in free credit for 60 days; you'll burn ~$2 of it tops.)
4. **Verify your email** when prompted (check inbox, click the link).
5. DigitalOcean will ask you to add a payment method (credit card or PayPal). They run a small auth charge ($1, refunded) to verify the card.
6. You may get a verification step asking for a phone number or, occasionally, a photo ID. Just complete it — it's anti-fraud, not a scam.
7. When you land on the dashboard, it may ask you to create a **Project**. Name it `doom` (anything). Click **Create Project**.

### A2. Create the Droplet

1. Top right of the dashboard → big green **Create** button → **Droplets**.
2. **Choose Region**: pick the one geographically closest to you. (New York 3, San Francisco 3, Toronto 1, Frankfurt 1, etc.) Doesn't really matter for our use case — the work happens between Google and Supabase, not between you and the droplet.
3. **Choose an image**: leave on **Ubuntu** → version **22.04 (LTS) x64**. (Default.)
4. **Choose Size**:
   - Type tab: **Basic**
   - CPU options: **Regular** (the cheapest column)
   - Pick the **$6/mo** plan: 1 GB RAM / 1 CPU / 25 GB SSD / 1 TB transfer. (If you want a slight speed bump, $12/mo with 2 GB RAM also fine — your call.)
5. **Add improved metrics**: leave unchecked (saves $)
6. **Backups**: leave unchecked (we're deleting this in a few hours, no point)
7. **Authentication Method**: this is the one that trips people up. DigitalOcean defaults to **SSH Key** and will try to push you that direction. Instead:
   - Click the **Password** tab (it's a tab next to "SSH Key")
   - Enter a strong password. Save it somewhere (1Password, Notes, etc.) — you'll paste it twice.
   - DO will warn you that password auth is less secure. Ignore — this droplet exists for a few hours then gets destroyed.
8. **Quantity**: 1
9. **Hostname**: `doom-drive` (or anything — labels only)
10. **Tags**: leave blank
11. **Select Project**: the one you made earlier (`doom`)
12. Click the big **Create Droplet** button at the bottom.
13. Wait ~30 seconds. The droplet appears in your project's list with a green dot.
14. **Click the droplet's name** to open its detail page. The IPv4 address is shown at top — looks like `134.122.55.10`. Click the small copy icon next to it. That's the address you'll use in Part C.

### A3. (Optional) Test access from DigitalOcean's web console first

If you're nervous about SSH, you can verify the droplet works from inside DigitalOcean's web UI:

1. On the droplet detail page, top-right → **Console** button.
2. A black terminal window opens in your browser, prompted with "login as:".
3. Type `root`, Enter, then paste your password.
4. **First-time login**: it will say "You are required to change your password immediately (administrator enforced)" and ask for:
   - Current password (paste the one you set)
   - New password (type a new one, twice)
   - Save the new password. **Use this new one when you SSH from your laptop.**
5. You're logged in. Type `exit` to close the web console.

This step is optional but saves a back-and-forth if the password expiry thing surprises you in the next part.

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

- **Mac**: Open **Terminal** (Spotlight → search "Terminal", Enter).
- **Windows**: Open **PowerShell** (Start menu → search "PowerShell", Enter). Windows 10/11 has SSH built in. If on older Windows, install [PuTTY](https://www.putty.org/) instead.

Connect to the droplet (paste this, replacing the IP with yours — drop the angle brackets):

```
ssh root@134.122.55.10
```

What happens, in order:

1. First time only, you'll see a "The authenticity of host can't be established" warning with a fingerprint. Type **yes** and Enter. (Adds the droplet to your known hosts file. Normal.)
2. It asks for the password. Paste the one you set in Part A. **Note: nothing appears as you type/paste — no dots, no asterisks. That's normal.** Hit Enter.
3. **First login only**: Ubuntu forces a password change. You'll see:
   ```
   You are required to change your password immediately (administrator enforced)
   Current password: 
   ```
   - Paste your password again (Enter)
   - It asks for a New password — type something (Enter). (No paste-from-1Password trick here — just type it. You can reuse the same password if you want.)
   - Re-type the new password (Enter)
   - **If you skipped Part A3**, this happens here in your laptop terminal. **If you did Part A3**, this already happened in the web console — use the new password from there at step 2, and you'll skip straight past this step.
4. SSH will then immediately disconnect with the message "Connection to ... closed." (annoying, but normal — DO requires re-connecting after password change.) Re-run `ssh root@<IP>`, paste the **new** password.
5. You're in. The prompt will look like `root@doom-drive:~#`.

Run the one-shot bootstrap (installs Node 20, git, clones the repo, installs deps):

```
curl -fsSL https://raw.githubusercontent.com/atticorai/doom/main/scripts/setup-vm.sh | bash
```

Wait ~30 seconds. It'll print "✓ VM ready." with next steps.

**If `curl` errors**: it usually means the repo URL needs adjusting (private vs public). If `atticorai/doom` is private, swap the bootstrap step for:

```
apt-get update -y && apt-get install -y nodejs npm git
git clone https://<your-github-username>:<your-personal-access-token>@github.com/atticorai/doom.git
cd doom
npm install --no-save googleapis @supabase/supabase-js
```

(GitHub personal access tokens: github.com → Settings → Developer settings → Personal access tokens → generate one with `repo` scope. Or share the repo publicly for the duration of this task.)

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
