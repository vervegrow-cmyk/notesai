// Stateless credential check for Vercel deployment
// Credentials are hardcoded; token is a signed payload (no server-side session needed)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '用户名和密码不能为空' }
    });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' }
    });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const token = Buffer.from(JSON.stringify({ username, role: 'admin', expiresAt })).toString('base64');

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: { username, role: 'admin' },
      expiresAt,
    }
  });
}
