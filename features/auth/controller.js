import { login, register, logout, verifyToken, getAllUsers } from './service.js';

export async function authLoginController(req) {
  const { username, password } = req;

  if (!username || !password) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '用户名和密码不能为空' }
    };
  }

  return login(username, password);
}

export async function authRegisterController(req) {
  const { username, password } = req;

  if (!username || !password) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '用户名和密码不能为空' }
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '密码至少6个字符' }
    };
  }

  return register(username, password);
}

export async function authLogoutController(req) {
  const { token } = req;

  if (!token) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Token不能为空' }
    };
  }

  return logout(token);
}

export async function authVerifyController(req) {
  const { token } = req;

  if (!token) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Token不能为空' }
    };
  }

  return verifyToken(token);
}
