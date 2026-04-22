const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGINS.length === 0) return '';
  return '';
}

// Whitelist of allowed models and max token cap
const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514'];
const MAX_TOKENS_CAP = 16000;

// Vercel function timeout (seconds). Sonnet with long prompts and 6k-12k
// max_tokens can take 30-50s to complete; default Hobby timeout is 10s
// which was causing the Planner to silently fail. 60s buys us headroom.
module.exports.config = { maxDuration: 60 };

module.exports = async function handler(req, res) {
  const corsOrigin = getCorsOrigin(req);
  if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body || {};

    const safeModel = ALLOWED_MODELS.includes(model) ? model : 'claude-sonnet-4-6';
    const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 4000, 1), MAX_TOKENS_CAP);

    if (messages && !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    if (system && typeof system !== 'string') {
      return res.status(400).json({ error: 'Invalid system prompt format' });
    }

    // Hard-stop the upstream call slightly before the function timeout so
    // we can return a readable error instead of Vercel killing us cold.
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 55000);

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: safeModel,
          max_tokens: safeMaxTokens,
          system: typeof system === 'string' ? system : '',
          messages: Array.isArray(messages) ? messages : []
        }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(abortTimer);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'AI request timed out (55s) — try a shorter prompt or fewer tokens' });
      }
      throw fetchErr;
    }
    clearTimeout(abortTimer);

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, data);
      return res.status(response.status).json({ error: data?.error?.message || 'AI request failed', upstream: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Planner error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
