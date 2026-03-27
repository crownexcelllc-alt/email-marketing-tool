import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/lib/types/api';

export class HttpClientError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(input: { message: string; status?: number; code?: string; details?: unknown }) {
    super(input.message);
    this.name = 'HttpClientError';
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }
}

export function normalizeAxiosError(error: AxiosError<ApiErrorResponse>): HttpClientError {
  const status = error.response?.status;
  const payload = error.response?.data;
  const code = payload?.error?.code;
  const message =
    payload?.error?.message ??
    error.message ??
    'Unexpected API error. Please retry your request.';

  return new HttpClientError({
    status,
    code,
    message,
    details: payload?.error?.details,
  });
}
