import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginUser, logoutUser } from '../services/authApi';

export interface AuthUser {
  username: string;
  role: string;
}

interface AuthStore {
  isLoggedIn: boolean;
  token: string | null;
  user: AuthUser | null;
  error: string | null;
  loading: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setToken: (token: string, user: AuthUser) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      user: null,
      error: null,
      loading: false,

      login: async (username: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const result = await loginUser(username, password);
          if (result.success && result.data) {
            set({
              isLoggedIn: true,
              token: result.data.token,
              user: result.data.user,
              loading: false
            });
            return true;
          } else {
            set({
              error: result.error?.message || '登录失败',
              loading: false
            });
            return false;
          }
        } catch (err) {
          set({
            error: '网络错误，请检查服务器连接',
            loading: false
          });
          return false;
        }
      },

      logout: async () => {
        const state = useAuthStore.getState();
        if (state.token) {
          await logoutUser(state.token);
        }
        set({
          isLoggedIn: false,
          token: null,
          user: null
        });
      },

      clearError: () => set({ error: null }),

      setToken: (token: string, user: AuthUser) => {
        set({
          isLoggedIn: true,
          token,
          user
        });
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        user: state.user
      })
    }
  )
);
