'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const logout = useAuthStore((state) => state.logout);

  return useMemo(
    () => ({
      token,
      user,
      hydrated,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      fetchUser,
      logout,
    }),
    [token, user, hydrated, isLoading, login, signup, fetchUser, logout],
  );
}
