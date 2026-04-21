// 简单的内存认证管理（生产环境建议使用数据库）
const users = new Map();
const tokens = new Map();
const sessions = new Map();

// 初始化默认管理员账户
users.set('admin', { username: 'admin', password: '123456', role: 'admin' });

// 生成随机token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 登录服务
export function login(username, password) {
  const user = users.get(username);
  
  if (!user) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' }
    };
  }

  if (user.password !== password) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' }
    };
  }

  const token = generateToken();
  const sessionData = {
    username: user.username,
    role: user.role,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时过期
  };

  tokens.set(token, sessionData);
  sessions.set(username, { token, ...sessionData });

  return {
    success: true,
    data: {
      token,
      user: {
        username: user.username,
        role: user.role
      },
      expiresAt: sessionData.expiresAt
    }
  };
}

// 注册新用户（可选）
export function register(username, password) {
  if (users.has(username)) {
    return {
      success: false,
      error: { code: 'USER_EXISTS', message: '用户已存在' }
    };
  }

  users.set(username, { username, password, role: 'user' });
  
  return {
    success: true,
    data: { username, role: 'user' }
  };
}

// 验证token
export function verifyToken(token) {
  const session = tokens.get(token);
  
  if (!session) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token无效或已过期' }
    };
  }

  // 检查是否过期
  if (new Date(session.expiresAt) < new Date()) {
    tokens.delete(token);
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token已过期' }
    };
  }

  return {
    success: true,
    data: session
  };
}

// 登出
export function logout(token) {
  tokens.delete(token);
  return { success: true, data: { message: '登出成功' } };
}

// 获取所有用户（仅用于调试）
export function getAllUsers() {
  return Array.from(users.values()).map(u => ({ username: u.username, role: u.role }));
}
