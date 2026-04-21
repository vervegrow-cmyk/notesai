export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { token } = req.body ?? {};
  if (!token) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'token 必填' } });
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!payload.username || !payload.expiresAt) throw new Error('invalid');
    if (new Date(payload.expiresAt) < new Date()) {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: '登录已过期' } });
    }
    return res.status(200).json({ success: true, data: { user: { username: payload.username, role: payload.role } } });
  } catch {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: '无效的 token' } });
  }
}
