const API_URL = 'http://localhost:3001';

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      username: string;
      role: string;
    };
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const data = await response.json();
    return {
      success: false,
      error: data.error || { code: 'NETWORK_ERROR', message: '网络请求失败' }
    };
  }

  return response.json();
}

export async function registerUser(username: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  return response.json();
}

export async function verifyToken(token: string) {
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  return response.json();
}

export async function logoutUser(token: string) {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  return response.json();
}
