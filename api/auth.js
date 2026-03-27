module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, type } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Missing type' });
  }

  const SYS_PASSWORD = process.env.SYS_PASSWORD;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // Check if user has a valid session cookie
  if (type === 'check') {
    const cookie = req.headers.cookie || '';
    const authenticated = cookie.includes('dd_session=');
    return res.status(200).json({ authenticated });
  }

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  if (!SYS_PASSWORD || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  if (type === 'login') {
    const success = password === SYS_PASSWORD;
    if (success) {
      // Set HttpOnly session cookie (7 days)
      res.setHeader('Set-Cookie', 'dd_session=1; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800');
    }
    return res.status(200).json({ success });
  }

  if (type === 'admin') {
    return res.status(200).json({ success: password === ADMIN_PASSWORD });
  }

  return res.status(400).json({ error: 'Invalid auth type' });
};
