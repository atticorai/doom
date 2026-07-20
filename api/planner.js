const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

function getCorsOrigin(req) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) return origin;
  if (ALLOWED_ORIGINS.length === 0) return '';
  return '';
}

// Whitelist of allowed models and max token cap
const ALLOWED_MODELS = ['claude-sonnet-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-8'];
const MAX_TOKENS_CAP = 32000;

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

    // Validate model against whitelist
    const safeModel = ALLOWED_MODELS.includes(model) ? model : 'claude-sonnet-5';

    // Cap max_tokens to prevent abuse
    const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 4000, 1), MAX_TOKENS_CAP);

    // Validate messages is an array
    if (messages && !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Validate system is a string
    if (system && typeof system !== 'string') {
      return res.status(400).json({ error: 'Invalid system prompt format' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, data);
      return res.status(response.status).json({ error: 'AI request failed' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Planner error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
