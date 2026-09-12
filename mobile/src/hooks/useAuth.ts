import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api';

export function useAuth() {
  const store = useAuthStore();

  const refreshUser = useCallback(async () => {
    try {
      const res = await userApi.getMe();
      await store.setUser(res.data);
    } catch {
      // 토큰 만료 시 authStore interceptor가 처리
    }
  }, []);

  return {
    ...store,
    refreshUser,
  };
}
