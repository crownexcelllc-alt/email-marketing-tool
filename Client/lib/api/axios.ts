import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/config/env';
import { ROUTES } from '@/lib/constants/routes';
import { clearAuthSession, getAuthAccessToken } from '@/lib/stores/auth-store';
import { normalizeAxiosError } from '@/lib/api/errors';
import type { ApiErrorResponse } from '@/lib/types/api';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isHandlingUnauthorized = false;

function isAuthRequest(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return url.includes('/auth/login') || url.includes('/auth/signup');
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      clearAuthSession();

      if (typeof window !== 'undefined' && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;

        const currentPath = window.location.pathname;
        const isOnAuthRoute =
          currentPath === ROUTES.auth.login || currentPath === ROUTES.auth.signup;

        if (!isOnAuthRoute) {
          const nextValue = `${window.location.pathname}${window.location.search}`;
          const params = new URLSearchParams({ next: nextValue });
          window.location.replace(`${ROUTES.auth.login}?${params.toString()}`);
        }

        window.setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 400);
      }
    }

    return Promise.reject(normalizeAxiosError(error));
  },
);
