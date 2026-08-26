// ═══════════════════════════════════════════════════════════════════
// /api/check-landing-page — server-side pixel / tag presence check.
// The Mayhem tracking room POSTs {url, providers, events}; this fetches
// the page server-side (no CORS wall) and reports which tag signatures
// are actually present in the page source. Honest by design: it can
// verify tag PRESENCE only — click/form/conversion events still need a
// live event test, and the response says so.
// ═══════════════════════════════════════════════════════════════════

const SIGNATURES = {
  gtm: [/googletagmanager\.com\/gtm\.js/i, /\bGTM-[A-Z0-9]{4,}\b/],
  ga4: [/googletagmanager\.com\/gtag\/js/i, /\bgtag\s*\(/, /\bG-[A-Z0-9]{6,}\b/],
  meta: [/connect\.facebook\.net/i, /\bfbq\s*\(/],
  vendor: [/callrail|calltrk\.com/i, /bat\.bing\.com|\buetq\b/i, /snap\.licdn\.com|px\.ads\.linkedin/i, /analytics\.tiktok\.com/i, /clarity\.ms/i],
};

module.exports = async function (req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, providers = [], events = [] } = req.body || {};
  if (!url || !/^https?:\/\//i.test(String(url))) {
    return res.status(400).json({ error: 'A valid http(s) url is required' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MayhemTrackingCheck/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const html = (await r.text()).slice(0, 1000000);

    const found = {};
    for (const key of Object.keys(SIGNATURES)) {
      found[key] = SIGNATURES[key].some((re) => re.test(html));
    }

    // 'other' and unknown provider keys can't be signature-matched — report null (unverifiable), never false certainty
    const out = {};
    for (const p of providers) out[p] = p in SIGNATURES ? found[p] : null;

    const ev = {};
    for (const e of events) ev[e] = e === 'pageview' ? (found.gtm || found.ga4 || found.meta ? true : null) : null;

    return res.status(200).json({
      https: /^https:/i.test(r.url || url),
      status: r.status,
      providers: out,
      events: ev,
      note: 'Server checked the live page source for tag signatures. Click / form / conversion events still need a live event test.',
    });
  } catch (e) {
    return res.status(502).json({
      error: 'Page could not be loaded by the checker',
      detail: String((e && e.message) || e).slice(0, 160),
    });
  }
};
