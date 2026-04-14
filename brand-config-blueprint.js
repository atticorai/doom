// ═══════════════════════════════════════════════════════════════
// BRAND CONFIG SCHEMA — Blueprint for dynamic brand management
//
// Goal: Adding a brand = filling out one of these objects.
// Everything else reads from it. No hunting through 6000 lines.
// ═══════════════════════════════════════════════════════════════

const BRAND_CONFIG = {

  "Postman Law": {

    // ── IDENTITY ─────────────────────────────────────────────
    code: "PL",                          // 2-letter code used in ISCI prefixes
    name: "Postman Law",                 // Full display name (no abbreviations)
    agency: "Blackacre Services",        // Agency name on traffic sheets
    color: "#9b7bb0",                    // Primary brand color (dusty plum)
    colorBg: "#F0E8F8",                  // Light background for print sheets
    gradientFrom: "#a855f7",             // Confirmation portal gradient start
    gradientTo: "#9b7bb0",              // Confirmation portal gradient end
    logo: "LOGO_PL",                     // Logo constant reference

    // ── MARKETS ──────────────────────────────────────────────
    // Each market the brand operates in. DMA code is the key.
    markets: {
      CHI: { name: "Chicago",      state: "IL" },
      CIN: { name: "Cincinnati",   state: "OH" },
      DEN: { name: "Denver",       state: "CO" },
      MSP: { name: "Minneapolis",  state: "MN" },
    },

    // ── BUYERS ───────────────────────────────────────────────
    // Who buys for which markets. Email used for CC on traffic sends.
    buyers: [
      { name: "Ken Lazar",          email: "ken.lazar@atticor.ai",          markets: ["MSP"] },
      { name: "Lynn Cortelezzi",    email: "lynn.cortelezzi@atticor.ai",    markets: ["CHI", "CIN", "DEN"] },
      { name: "Hazel Wolf",         email: "",                               markets: [] }, // Event sponsorships
      { name: "Jessica Flynn",      email: "jessica.flynn@atticor.ai",      markets: [] }, // Digital/ESPN
    ],

    // ── ESTIMATE SYSTEM ──────────────────────────────────────
    // PL uses fixed 4-digit estimates — one per market per buy type, good all year.
    estimateSystem: "fixed",   // "fixed" = one number per market/media, "monthly" = changes each month

    // Estimate definitions: { number: { market, media, group, buyer } }
    // This replaces the D_E array for this brand.
    estimates: [
      // Minneapolis
      { num: "2601", market: "MSP", media: "TV",              group: "Base" },
      { num: "2602", market: "MSP", media: "TV",              group: "Sponsorship" },
      { num: "2603", market: "MSP", media: "TV",              group: "UD/AV" },
      { num: "2604", market: "MSP", media: "TV",              group: "Sports" },
      { num: "2605", market: "MSP", media: "Cable",           group: "Cable" },
      { num: "2606", market: "MSP", media: "TV",              group: "Heavy Up" },
      { num: "2607", market: "MSP", media: "Radio",           group: "Radio" },
      { num: "2608", market: "MSP", media: "Streaming Audio", group: "Streaming Audio" },
      // Chicago
      { num: "2609", market: "CHI", media: "TV",              group: "Base" },
      { num: "2610", market: "CHI", media: "TV",              group: "Sponsorship" },
      { num: "2611", market: "CHI", media: "TV",              group: "UD/AV" },
      { num: "2612", market: "CHI", media: "TV",              group: "Sports" },
      { num: "2613", market: "CHI", media: "Cable",           group: "Cable" },
      { num: "2614", market: "CHI", media: "TV",              group: "Heavy Up" },
      { num: "2615", market: "CHI", media: "Radio",           group: "Radio" },
      { num: "2616", market: "CHI", media: "Streaming Audio", group: "Streaming Audio" },
      // Cincinnati
      { num: "2617", market: "CIN", media: "TV",              group: "Base" },
      { num: "2618", market: "CIN", media: "TV",              group: "Sponsorship" },
      { num: "2619", market: "CIN", media: "TV",              group: "UD/AV" },
      { num: "2620", market: "CIN", media: "TV",              group: "Sports" },
      { num: "2621", market: "CIN", media: "Cable",           group: "Cable" },
      { num: "2622", market: "CIN", media: "TV",              group: "Heavy Up" },
      { num: "2623", market: "CIN", media: "Radio",           group: "Radio" },
      { num: "2624", market: "CIN", media: "Streaming Audio", group: "Streaming Audio" },
      // Denver
      { num: "2625", market: "DEN", media: "TV",              group: "Base" },
      { num: "2626", market: "DEN", media: "TV",              group: "Sponsorship" },
      { num: "2627", market: "DEN", media: "TV",              group: "UD/AV" },
      { num: "2628", market: "DEN", media: "TV",              group: "Sports" },
      { num: "2629", market: "DEN", media: "Cable",           group: "Cable" },
      { num: "2630", market: "DEN", media: "TV",              group: "Heavy Up" },
      { num: "2631", market: "DEN", media: "Radio",           group: "Radio" },
      { num: "2632", market: "DEN", media: "Streaming Audio", group: "Streaming Audio" },
      // Cross-market
      { num: "2633", market: "MSP", media: "TV",              group: "TTWN" },
      { num: "2690", market: "*",   media: "Streaming Audio", group: "TTWN" },
    ],

    // Which estimate groups combine into one traffic sheet per market
    combinableGroups: ["Base", "Sponsorship", "UD/AV", "Sports", "Heavy Up"],

    // Buy types shown in the Traffic Tracker grid
    trackerBuyTypes: ["TV Base", "TV Sponsorship", "TV UD/AV", "TV Sports", "Cable", "Heavy Up", "Radio", "Streaming Audio", "Digital", "OOH"],

    // ── MEDIA TYPES ──────────────────────────────────────────
    // Which media this brand uses. Controls what shows in dropdowns.
    mediaTypes: ["TV", "Cable", "Radio", "Streaming Audio", "Digital", "OOH"],

    // ── ISCI CODE FORMAT ─────────────────────────────────────
    // Pattern: [DMA][BRAND_CODE][SERIES][SEQ][SUFFIX]
    // Example: CHIPL2630001R
    //          CHI = DMA (3 chars)
    //          PL  = brand code (2 chars)
    //          26  = year prefix (2 chars)
    //          30  = duration (2 chars: 15, 30, 60, etc.)
    //          001 = sequence (3 chars)
    //          R   = media suffix (1 char)
    isciFormat: {
      dmaLength: 3,          // CHI, CIN, DEN, MSP
      brandCode: "PL",       // 2-char brand identifier
      yearPrefix: "26",      // Current year prefix (2026 = "26")
      // Suffix mapping: media type → ISCI suffix letter
      suffixMap: {
        "TV": "T",
        "Cable": "T",        // Cable uses TV ISCIs
        "Radio": "R",
        "Streaming Audio": "S",
        "Digital": "D",
        "Display": "B",      // Banner
        "OOH": "O",
      },
      // Series number = yearPrefix + duration (e.g., "2630" = 2026 + :30)
      // Sequence = 3-digit auto-increment per DMA+series+suffix
    },

    // ── AIRING KEY FORMAT ────────────────────────────────────
    // PL: just the estimate number (unique per market)
    airingKeyFormat: "est",   // "est" = est.num, "est|market" = est.num + "|" + market

    // ── EMAIL CONFIG ─────────────────────────────────────────
    emailSignature: "Emm Caban\nAtticor Traffic Manager",
    ccAlways: "emm.caban@atticor.ai",  // Always CC'd on traffic sends

    // ── TRAFFIC SHEET CONFIG ─────────────────────────────────
    noteText: "Note: You have 24 hours to return signed Traffic Instructions or Confirm receipt via email.",
    cableStreamingEstimates: ["2613", "2629"],  // Estimates that get the Cable Digital Streaming section
  },


  "Wettermark Keith": {

    // ── IDENTITY ─────────────────────────────────────────────
    code: "WK",
    name: "Wettermark Keith",
    agency: "WK Advertising Solutions",
    color: "#D4A040",
    colorBg: "#fffbeb",
    gradientFrom: "#818cf8",
    gradientTo: "#6366f1",
    logo: "LOGO_WK",

    // ── MARKETS ──────────────────────────────────────────────
    markets: {
      BRM: { name: "Birmingham",   state: "AL" },
      HSV: { name: "Huntsville",   state: "AL" },
      KNX: { name: "Knoxville",    state: "TN" },
      CHA: { name: "Chattanooga",  state: "TN" },
      MTG: { name: "Montgomery",   state: "AL" },
      DHN: { name: "Dothan",       state: "AL" },
    },

    // ── BUYERS ───────────────────────────────────────────────
    buyers: [
      { name: "Amy Coffey", email: "acoffey@wkfirm.com", markets: ["BRM", "HSV", "KNX", "CHA", "MTG", "DHN"] },
    ],

    // ── ESTIMATE SYSTEM ──────────────────────────────────────
    // WK uses 3-digit monthly estimates shared across ALL markets.
    // One number covers every market for that month.
    // Traffic is still built per market.
    estimateSystem: "monthly",

    // Monthly estimate mapping: month → estimate number
    monthlyEstimates: {
      January: "210", February: "211", March: "212", April: "213",
      May: "214", June: "215", July: "218", August: "221",
      September: "222", October: "223", November: "224", December: "225",
    },

    // Non-monthly estimates (perpetual, not tied to a specific month)
    estimates: [
      { num: "216", media: "Radio",           group: "Base",        markets: ["BRM", "HSV", "MTG"] },
      { num: "217", media: "TV",              group: "UD/AV",       markets: "*" },
      { num: "219", media: "TV",              group: "Sports",      markets: "*" },
      { num: "226", media: "TV",              group: "Sponsorship", markets: "*" },
      { num: "227", media: "TV",              group: "UD/AV",       markets: "*" },
      { num: "228", media: "TV",              group: "UD/AV",       markets: "*" },
      { num: "229", media: "TV",              group: "UD/AV",       markets: "*" },
      { num: "230", media: "TV",              group: "UD/AV",       markets: "*" },
      { num: "231", media: "TV",              group: "Heavy Up",    markets: ["KNX"] },
      { num: "232", media: "Streaming Audio", group: "TTWN",        markets: "*" },
    ],

    combinableGroups: [],  // WK doesn't combine estimates

    trackerBuyTypes: ["TV Base", "TV Sponsorship", "TV UD/AV", "Radio", "Streaming Audio", "OOH"],

    // ── MEDIA TYPES ──────────────────────────────────────────
    mediaTypes: ["TV", "Radio", "Streaming Audio", "OOH"],

    // ── ISCI CODE FORMAT ─────────────────────────────────────
    isciFormat: {
      dmaLength: 3,          // BRM, HSV, KNX, CHA, MTG, DHN
      brandCode: "WK",
      yearPrefix: "26",
      suffixMap: {
        "TV": "T",
        "Radio": "R",
        "Streaming Audio": "S",
        "OOH": "O",
      },
    },

    // ── AIRING KEY FORMAT ────────────────────────────────────
    // WK: est number + "|" + market (because monthly estimates are shared)
    airingKeyFormat: "est|market",

    // ── EMAIL CONFIG ─────────────────────────────────────────
    emailSignature: "Emm Caban\nAtticor Traffic Manager",
    ccAlways: "emm.caban@atticor.ai",

    // ── TRAFFIC SHEET CONFIG ─────────────────────────────────
    noteText: "Note: You have 24 hours to return signed Traffic Instructions or Confirm receipt via email.",
    cableStreamingEstimates: [],
  },
};


// ═══════════════════════════════════════════════════════════════
// ISCI CODE GENERATOR
//
// Input: { brand, media, market (DMA), duration, sequence }
// Output: "BRMWK2630001R"
// ═══════════════════════════════════════════════════════════════

function generateIsciCode(brand, media, dma, duration, sequence) {
  const cfg = BRAND_CONFIG[brand];
  if (!cfg) throw new Error("Unknown brand: " + brand);

  const suffix = cfg.isciFormat.suffixMap[media];
  if (!suffix) throw new Error("No ISCI suffix for media: " + media);

  const durPad = String(duration).padStart(2, "0");      // "30", "15", "60", "05"
  const seqPad = String(sequence).padStart(3, "0");       // "001", "002", etc.
  const series = cfg.isciFormat.yearPrefix + durPad;      // "2630", "2615", etc.

  return dma + cfg.isciFormat.brandCode + series + seqPad + suffix;
  // Example: "BRM" + "WK" + "2630" + "001" + "R" = "BRMWK2630001R"
}


// ═══════════════════════════════════════════════════════════════
// AUTO-GENERATE ISCI SET
//
// "We have a new :30 Radio spot called 'Blue Collar Roots'
//  for WK markets Birmingham, Huntsville, Montgomery"
//
// Input: { brand, media, duration, title, markets: [DMAs] }
// Output: Array of ISCI objects ready for the registry
// ═══════════════════════════════════════════════════════════════

function generateIsciSet({ brand, media, duration, title, markets, category }) {
  const cfg = BRAND_CONFIG[brand];
  if (!cfg) throw new Error("Unknown brand: " + brand);

  const suffix = cfg.isciFormat.suffixMap[media];
  const series = cfg.isciFormat.yearPrefix + String(duration).padStart(2, "0");

  // Find next available sequence number across all provided markets
  // (In production, this reads from the current ISCI registry)
  // For now, caller provides the next sequence number
  // TODO: Auto-detect from existing ISCIs

  return markets.map(dma => ({
    code: null,  // Set by caller with generateIsciCode() + next sequence
    title: title,
    media: media,
    brand: brand,
    dma: dma,
    dur: String(duration),
    suffix: suffix,
    active: true,
    category: category || "",
    fileUrl: "",  // Uploaded separately
  }));
}


// ═══════════════════════════════════════════════════════════════
// ADD BRAND CHECKLIST
//
// When adding a new brand, what's REQUIRED vs what has defaults:
//
// REQUIRED (must provide):
//   ✓ name          — full brand name
//   ✓ code          — 2-letter code (unique, used in ISCI codes)
//   ✓ agency        — agency name for traffic sheets
//   ✓ color         — primary hex color
//   ✓ logo          — base64 or URL
//   ✓ markets       — at least one { dma: { name, state } }
//   ✓ buyers        — at least one { name, email, markets }
//   ✓ estimateSystem — "fixed" or "monthly"
//   ✓ estimates     — at least one estimate definition
//   ✓ mediaTypes    — which media the brand uses
//
// HAS DEFAULTS (optional):
//   · colorBg        → auto-generated light tint of color
//   · gradientFrom   → derived from color
//   · gradientTo     → derived from color
//   · ccAlways       → "emm.caban@atticor.ai"
//   · emailSignature → "Emm Caban\nAtticor Traffic Manager"
//   · noteText       → standard 24-hour confirmation note
//   · airingKeyFormat → "est" for fixed, "est|market" for monthly
//   · isciFormat     → derived from code + standard structure
//   · trackerBuyTypes → derived from estimates
//   · combinableGroups → empty (no combining)
//   · cableStreamingEstimates → empty
//
// AUTO-GENERATED (system creates):
//   · ISCI codes     — from brand code + DMA + media + duration
//   · Station links  — auto-linked from market + media matching
//   · Traffic sheets — built from brand config (agency, color, logo)
//   · Airing keys    — from estimate system type
//   · DM mapping     — from markets object
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// HELPER: Get brand config by name or code
// ═══════════════════════════════════════════════════════════════

function getBrand(nameOrCode) {
  return BRAND_CONFIG[nameOrCode]
    || Object.values(BRAND_CONFIG).find(b => b.code === nameOrCode)
    || null;
}

function getBrandColor(brand) {
  const cfg = getBrand(brand);
  return cfg ? cfg.color : "#9B8EAD";  // Muted fallback
}

function getBrandAgency(brand) {
  const cfg = getBrand(brand);
  return cfg ? cfg.agency : "Atticor";
}

function getAiringKey(est) {
  const cfg = getBrand(est.brand);
  if (!cfg) return est.num;
  return cfg.airingKeyFormat === "est|market"
    ? est.num + "|" + est.market
    : est.num;
}

function getBuyerForMarket(brand, dma) {
  const cfg = getBrand(brand);
  if (!cfg) return null;
  return cfg.buyers.find(b => b.markets.includes(dma) || b.markets.includes("*"))
    || cfg.buyers[0]  // fallback to first buyer
    || null;
}
