module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, type } = req.body;

  if (!password || !type) {
    return res.status(400).json({ error: 'Missing password or type' });
  }

  const SYS_PASSWORD = process.env.SYS_PASSWORD;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!SYS_PASSWORD || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  if (type === 'login') {
    return res.status(200).json({ success: password === SYS_PASSWORD });
  }

  if (type === 'admin') {
    return res.status(200).json({ success: password === ADMIN_PASSWORD });
  }

  return res.status(400).json({ error: 'Invalid auth type' });
};
