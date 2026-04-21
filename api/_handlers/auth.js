// Auth handlers — stateless (no DB needed)

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

export function login(req, res) {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '用户名和密码不能为空' } });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' } });
  }
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const token = Buffer.from(JSON.stringify({ username, role: 'admin', expiresAt })).toString('base64');
  return res.status(200).json({ success: true, data: { token, user: { username, role: 'admin' }, expiresAt } });
}

export function logout(_req, res) {
  return res.status(200).json({ success: true, data: { message: '已退出登录' } });
}

export function register(_req, res) {
  return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: '注册功能已关闭，请联系管理员' } });
}

export function verify(req, res) {
  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'token 必填' } });
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
