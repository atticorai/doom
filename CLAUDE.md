# Doom & Deliverables — Claude Code Context

## What This App Is
Media traffic coordination platform for Atticor Media. Manages TV, Radio, Streaming Audio, Digital, and OOH (outdoor) advertising traffic for two brands: **Postman Law** and **Wettermark Keith**. Built as a single-page React app with Firebase (Firestore + Storage), deployed on Vercel.

## Theme: Megara from Hercules
The app's personality IS Megara. Snarky, competent, lording over the user. Her visual identity: dusty plum/orchid dark mode, gold accents (her headband), Pegasus blue for interactive elements. Cormorant Garamond for headings, DM Sans for body. Every page has her commentary via `DOOM.pg` quips. The light mode is "Olympus" — Meg surrounded by golden light (CSS filter inversion). Never make the app feel generic or corporate.

## Architecture

### Files
- `index.html` — Login screen, loader animations, CSS (including loader keyframes in `<head>`)
- `app.js` — Entire React app (~6000 lines), Babel-transpiled at runtime
- `config.js` — UI components, constants, data transforms, calendar
- `data-*.js` — Seed data files (ISCIs, estimates, stations, calendar, OOH postings, etc.)
- `api/auth.js` — Auth with timing-safe compare, rate limiting, crypto session tokens
- `api/config.js` — Firebase config endpoint
- `api/planner.js` — Claude AI proxy with model whitelist
- `middleware.js` — Vercel middleware, session validation (64-char hex)
- `vercel.json` — SPA rewrite

### Routing
- Main app: state-based (`pg` state variable), no URL routing
- OOH Hub: hash-based (`#ooh/wk`, `#ooh/pl`, `#ooh/isci`, `#ooh/import`)
- Confirmation portal: `?confirm=EST&sta=CALL&tok=TOKEN`
- Report mode: `?report=wk` or `?report=pl`

### Data Flow
- Seed data in `data-*.js` files loaded as `<script>` tags
- Firestore is source of truth for user edits
- On load: Firestore data merged with seed (Firestore wins for edits, seed restores missing items/fileUrls/titles)
- Save guards: `loadCompleteRef`, `saveRef`, `iscisLoadedRef`, `linksReady`, 20% ISCI drop safeguard

## Brand Logic

### Postman Law (PL)
- Markets: Chicago, Cincinnati, Denver, Minneapolis
- DMA codes: CHI, CIN, DEN, MSP
- Estimates: 4-digit (2601-2643), one per market per buy type, good ALL YEAR
- Buyer: Ken Lazar (MSP), Lynn Cortelezzi (CHI/CIN/DEN)
- Combined estimates: 6 TV buy types combined into one traffic sheet per market
- Brand color: `#9b7bb0` (dusty plum)

### Wettermark Keith (WK)
- Markets: Birmingham, Huntsville, Knoxville, Chattanooga, Montgomery, Dothan
- DMA codes: BRM, HSV, KNX, CHA, MTG, DHN
- Estimates: 3-digit MONTHLY (210=Jan, 211=Feb, 212=Mar, 213=Apr, 214=May, 215=Jun, 218=Jul, 221=Aug, 222=Sep, 223=Oct, 224=Nov, 225=Dec)
- ONE estimate number covers ALL WK markets for that month
- Traffic built PER MARKET despite shared estimate number
- Buyer: Amy Coffey
- Brand color: `#D4A040` (gold)
- Old 4-digit WK estimates (2633-2660) are DELETED — filtered on load
- `WK_MONTH_EST` mapping used for copy-to-month feature

### Airing/Confirmation Keys
- PL: keyed by estimate number (`"2609"`) — unique per market
- WK: keyed by `estimate|market` (`"213|Birmingham"`) — because estimate is shared
- `ak(est)` helper function generates the correct key
- `akFromHistory(h)` for traffic history records

## Email System
- n8n webhook (`doomndeliverables.app.n8n.cloud/webhook/...`) via `/api/send-traffic`
- Sends from: `emm.caban@atticor.ai` (Outlook, configured in n8n)
- CC: buyer email + `emm.caban@atticor.ai`
- Groups by ownership — ONE email per ownership group per market
- Combined PL estimates: deduped stations, one email per ownership group (not per estimate)

## Streaming Audio / Digital Builders
- **Pandora**: per-ISCI URLs with `UTM_Content={ISCI}&Placement=AudioSelect|CompanionBanners|DisplayBanners`, `UTM_Source=SiriusXM`, generates all 4 PL markets at once
- **ESPN Digital**: 3 URLs per campaign per market (Video/ESPNweb, Video/GKBPS, Display/ESPNweb), campaign selector (MarchMadness, MLB, etc.)
- **Spotify/Generic**: manual UTM fields

## PDF Generation
- `generatePdfBase64(html, trafficRec)` — uses jsPDF text rendering with clickable `textWithLink()` for creative files when trafficRec is passed, falls back to html2canvas when not
- `generateDigitalTrafficPdf(opts)` — dedicated jsPDF generator for ESPN/Digital
- Pandora has its own jsPDF generator in the Download PDF button

## Color Palette
```
Background:     #1e1233 (deep orchid)
Gradient mid:   #2a1a3e (orchid shadow)
Surfaces:       #2d1f42 (plum shadow)
Borders:        #4a3565 (dusty plum edge)
Primary:        #9b7bb0 (Meg's dusty plum)
Lilac:          #C4A0C8 (dress catching light)
Pegasus blue:   #4AC8E8 (interactive/links)
Gold:           #D4A040 (headband, accents, WK brand)
Rose:           #E85A7A (alerts/danger)
Teal:           #5BC4A0 (success)
Muted text:     #9B8EAD (dusty lavender)
Bright text:    #E8DFF0 (soft lilac white)
Heading text:   #F0E8F8 (warm white)
```

## Critical Rules
1. **NEVER overwrite Firestore with empty/small data** — save guards prevent this
2. **Firestore wins** for user edits (active status, titles, tags)
3. **Seed data** restores missing ISCIs and blank titles/fileUrls
4. **Markets filter by brand** — no Chicago in WK dropdowns
5. **ISCIs use code+dma composite key** — same code in different markets are different ISCIs
5b. **OOH unit IDs are NOT unique across brands** — Postman Law and Lerner & Rowe buy the same View Chicago inventory (`3950-1`, `4640-1`, ...). Anything keyed by unit alone (`POP_PHOTOS`, `POP_TITLES`, `oohPhotos` uploads) will bleed one brand's proof onto the other's board. Brand-scoped proofs go in their own map — see `data-lr-view-chi-pops.js`
6. **OOH ISCIs only in OOH Hub** — filtered out of main ISCI Registry
7. **No abbreviations** — full brand names and market names everywhere except ISCI codes
8. **Ownership group sends** — never send individual emails per station
9. **HTML loader stays visible** until React's `dbLoaded` is true (React returns null while loading)
10. **Loader animations CSS in `<head>`** — not inside `#R` where React would destroy them
11. **Log every change** — `DOOM_CHANGELOG` is retired (empty array). Every change to Doom gets a "The Living Record — MM/DD/YYYY: …" paragraph appended to the end of `BOOK_PAGES_3` in app.js (the Guide book, oldest first, `&amp;` for ampersands). The Guide is a live document — keep the brand/market/prefix data and the record current with every change.

## Outstanding Work
- Pegasus SVG character for empty states, transitions, Help page
- **AI Planner: The Muses UI** — the 5 Muses from Hercules narrate the AI analysis like they're telling a story. Each Muse could represent a different analysis angle (staleness, coverage, creative mix, market balance, recommendations). They present data as dramatic storytelling, interrupt each other, and have distinct personalities.
- **Help & Docs: Book Tome UI** — user has a book tome UI from another project to port into the docs page. Uses React + Tailwind + Framer Motion. Components: Book (page flipping with 3D transforms), BookCover (leather texture, Greek ornaments, Pegasus silhouette, clasp unlock), BookPage (parchment texture, corner ornaments, side runes, damage effects), DamageEffects (bite marks, hoof prints, burn marks, ink splatters, lipstick marks from Meg, drool stains), GreekOrnaments (Greek key borders/dividers, corner ornaments, rune accents, laurel accents, side runes), MarginNote (author-specific notes — Meg in purple italic, Muses in pink, Hades in dark), Pegasus (silhouette SVG, constellation animation, flying across screen), SoulParticles (floating particles + Greek text fragments). Needs: Tailwind Play CDN + Framer Motion CDN added to script chain, TypeScript components ported to Babel JSX. Full source code was provided in the session — check git history for the user's message with all component files.
- Page transition animations
- Deeper atmospheric design (card hover glows, breathing effects)
- OOH Hub feature parity with removed pages
- Olympus light mode needs tuning for new palette

## The Buy Abyss (Lerner & Rowe media buying, 2027)
A media buying system inside Doom: Overview → Research → Buy intake & check → Plan → Approve → Order & confirm → Schedules & revisions · Buy grid · Sponsorships · Reconcile & track · Reports. The prototype (`TheBuyAbyss.html` + `app.py`, kept outside this repo) is the behavioral spec: its calculations (`dpBucket`, `lineKey`, `mult`/BE15, `dpStats`, `planTotals`, `snapshotPlan`, `intakeChecks`, `qaChecks`, `stageOf`, `renderSchedules`, `docOrder`, `docChange`, `docGuidelines`, `docAvail`, `mediumOf`, `stationsFrom`, `OWN`/`OWN_RADIO`) are ported, never redesigned. If the prototype looks wrong, ask — don't fix silently. Do not rename its things.

### Three states, one direction
```
Working Plan  (ba_working_plan, mutable, one per market/year)
   │  ba_approve_plan()  — the ONLY writer of ba_approved_plan
   ▼
Approved Snapshot  (ba_approved_plan, insert-only JSON, one row per version, approved_plan_id = uuid)
   │  station confirmation → ba_order_document; ba_apply_confirmation() — the ONLY writer of ba_schedule_of_record
   ▼
Schedule of Record  (ba_schedule_of_record, one current row per station, superseded never edited)
```
Invariants are enforced in Postgres (triggers + a transaction-local `ba.context` flag), not in the UI:
1. Nothing writes to `ba_approved_plan` except approval. Rows can never be updated or deleted. Re-approval inserts v(n+1); v1 stays byte-identical.
2. Accepting a confirmation changes the schedule of record and variance only. Any write to `ba_working_plan` inside that transaction is refused.
3. Every downstream artifact (order document, revision, guidelines envelope, package, schedule-of-record row) carries `approved_plan_id`. A confirmation states which approved version it confirmed. Revisions reference the approved version they depart from AND the confirmation they modify, and link the re-confirmation.

### Files
- `abyss.html` — the prototype's screens, beside Doom like `mayhem.html` (nav 🕳, protected in `middleware.js`). Same markup, Meg's palette, Doom's session, every edit persisted through the API. Approval and accepting a confirmation are database acts.
- `buy-abyss-core.js` — the prototype's calculation block as a module (browser + Node): `dpBucket`, `lineKey`, `mult`/BE15, `dpStats`, `planTotals`, `snapshotPlan`, `flightOf`, `intakeChecks`, `qaChecks`, `stageOf`, the schedule merge, the four documents, `mediumOf`, `stationsFrom`, `OWN`/`OWN_RADIO`, plus `rows.*` adapters between `ba_*` rows and the prototype's `M`. Never redesign it; if the prototype looks wrong, ask.
- `scripts/buy-abyss-core.test.js` + `scripts/buy-abyss-reference.json` — 57 checks against the prototype's own run captured in headless Chromium (Chicago: plan $721,246.25 · 6,248 spots · $4.52 CPM · v1 · WBBM record $191,517.75), documents character for character. `node scripts/buy-abyss-core.test.js`.
- `supabase/buy_abyss.sql` — all `ba_*` tables, guards, `ba_approve_plan(p_snapshot)`, `ba_apply_confirmation()`, `ba_assign_estimates()`, `ba_variance`, the 10 L&R 2027 market/years. Idempotent; run after `schema.sql`.
- `supabase/buy_abyss_seed.sql` — generated by `scripts/buy-abyss-seed.js` from `data/buy-abyss/` (lr2026.json, the four parsed WBBM 2026 orders): 3,300 history rows with the raw source, 203 stations in 10 markets exactly as `stationsFrom()` derives them, 106 rate-history lines. Run after `buy_abyss.sql`; safe to re-run.
- `scripts/buy-abyss-invariants.sql` — 12 acceptance checks on a live database (`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f …`). One transaction, rolls back.
- `scripts/buy-abyss-dev.js` + `scripts/buy-abyss-e2e.js` — local dev server (real handler over `pg`, stubbed session) and the Phase 1 done-state driven in Chromium: Chicago budget → approved v1 → confirmation, asserted against the prototype's numbers. Scratch database only.
- `api/buy-abyss.js` — the only door: whitelisted actions, identity from the `dd_session` cookie, approve/apply via the SQL functions, confirmations footed the way `read_lines.py` foots them, research and owner lookup with the server-side Claude key. Listed in `middleware.js`.
- `scripts/buy-abyss-import.js` + `scripts/buy-abyss-adapters/` — source workbook → normalized `ba_history_2026` rows → totals footed back to the source by market, medium, station/vendor, month, annual, booked vs actual. `lr2026.json` carries no totals of its own, so the seed stores it unreconciled; foot against the OTM workbook when it arrives.

### Where Doom departs from the prototype (on purpose, and only here)
- "Accept as schedule of record" on a buyer's draft creates a footed confirmation document from it and applies that; the draft is superseded, never applied. The database only ever records confirmations.
- DocuSign is not wired (Phase 2): Guidelines status per vendor group is kept by hand (Send / Mark signed) in `ba_market_state.ds`; nothing signs itself.
- The confirmation reader (`read_lines.py`) is not wired: drop zones are inert. Footing runs on lines already in JSON.
- The Claude key never reaches the browser: research and owner lookup are API actions.
- Estimate numbers come from `ba_counter` (shared sequence from 2700), assigned by the database.

### Rules that must survive
- Finance sets the budget; Jessica enters it (`ba_budget.set_by` / `entered_by`). Budget grain (market-only, market × medium, or market total with allocations) is Finance's call — `ba_budget.media` NULL = market total, set = allocation, so all three fit. Plan starts at zero. 2026 (OTM) is `ba_history_2026`, labeled history, never a target.
- Each bookend end is a spot (BE15) at half the pair rate. Paid vs bonus separated; rotators out of daypart %. Net CPM under $5 is a guardrail, not a KPI. Impressions come from a secondary source.
- QA gate at approval (in `ba_approve_plan`): approver, demo, posting, an estimate per media in the plan, budget present, not over budget without a Finance override.
- Plan-line contract for the JSON snapshot: each `plan.lines[]` element carries `station`, `media`, `gross`, `net` so the database can total by station/media. The prototype's arithmetic produces those numbers; the app writes them onto the line.
- Statuses for Guidelines / order / confirmation live on the vendor group (one envelope per vendor group); invoices and posts live on the station. Notes are typed (`entity_type`, `entity_id`).
- Integrations, and only these, all downstream of the approved snapshot: DocuSign, email (orders + change orders — build with DocuSign, "Send Orders" is one transaction), SharePoint filing, Claude web search for research/owner lookup. Sigma is a CSV export. RecNorm and Sigma never write to the plan.
- One order reader (WideOrbit) until the historical schedules show which other document formats actually exist — inventory formats, not stations.

## Traffic Tracker
New page (📡 in nav). Mission control + grid showing traffic status per market × buy type for the current month. Auto-populated from traffic history. Color-coded: green=sent, gold=built, rose=partial, dark=empty. Handles combined estimates and multi-market records. Meg commentary based on completion percentage.
