# WK Legacy Vault — Drop-In Changes

Three files. No Firebase. Supabase Storage only. Click a row in the archive and you see the instruction rendered exactly like the current WK format from your screenshot.

## Files

| File | Where it goes | What it does |
|---|---|---|
| `app.js` | Replaces project root `app.js` | Adds the `WK Legacy Vault` page (Instructions + Creative tabs) with a built-in detail view |
| `api/storage.js` | New file at project `api/storage.js` | Server endpoint that talks to Supabase Storage with the service-role key |
| `supabase/migration_legacy_vault.sql` | Optional | Just creates the `legacy-wk` bucket. Easier to do in the dashboard. |

## Apply order

1. **Create the storage bucket** — either:
   - In the Supabase dashboard: Storage → New bucket → name `legacy-wk` → Public → Save
   - Or run the one-time SQL in the Editor (same result)
2. Drop `api/storage.js` into the `api/` folder. Existing `middleware.js` cookie auth protects it automatically.
3. Replace `app.js`. Deploy.

No table changes. Legacy records sit in the same `trafficHistory` and `iscis` blobs the app already uses, distinguished by a `legacy:true` flag.

## What you get

**🗄 WK Legacy Vault** in the left nav (between Traffic Library and AI Planner).

### Tab 1 — 📜 Instructions

- **Form** — year/month/market/media required; everything else (estimate, version, buyer, flight, comments, stations, ISCIs) blank-tolerant. Schedule field is a dropdown with the canonical values (M-F Schedule, M-F Bookend, Weekend Schedule, Weekend Bookend, All Week, Holiday Only).
- **Source-file upload** — goes to Supabase Storage at `legacy-wk/instructions/{year}/{filename}`
- **Archive table** with filters and search. **Click any row** to open the detail view.

### Detail View

When you click a row, a modal opens with the instruction **rendered in the exact same format as a current WK traffic instruction**:

- Wettermark Keith logo header
- Header block: Agency / Client / Market / Buyer / Estimate(s) / Media / Stations / Broadcast Month / Flight Dates / Version
- Rotation table grouped by schedule type with the standard color bands
- "Legacy / Historical" banner at the top so it can't be confused with current work
- Clickable creative file links when the ISCI has a fileUrl
- Link to the original source PDF if uploaded
- Action buttons: ↗ Open in New Window, 🖨 Print, 📎 View Original Source File, ✎ Edit

### Tab 2 — 🎬 Creative

- **Drop zone** — upload video/audio/image files. Auto-links by filename match against legacy WK ISCI codes.
- **Linked Creative · by Month** — every legacy ISCI grouped by the month of its first associated instruction
- **Unlinked Files** — orphans organized by year/month, each with a 🔗 Link to ISCI button
