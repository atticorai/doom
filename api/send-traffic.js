module.exports = async function handler(req, res) {
  // Session is validated by middleware.js — this is belt-and-suspenders
  const cookie = req.headers.cookie || '';
  if (!/dd_session=[a-f0-9]{64}/.test(cookie)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  if (!N8N_WEBHOOK_URL) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, cc, subject, message, pdfBase64, pdfName } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required fields (to, subject)' });
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, cc, subject, message, pdfBase64, pdfName })
    });

    if (!response.ok) {
      console.error('n8n webhook error:', response.status);
      return res.status(response.status).json({ error: 'Email delivery failed' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('send-traffic error:', error.message);
    return res.status(500).json({ error: 'Failed to send traffic' });
  }
};
