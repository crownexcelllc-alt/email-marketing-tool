import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api/axios';
import type { ApiSuccessResponse } from '@/lib/types/api';

export async function apiRequest<TResponse, TPayload = unknown>(
  config: AxiosRequestConfig<TPayload>,
): Promise<TResponse> {
  const response = await apiClient.request<ApiSuccessResponse<TResponse> | TResponse>(config);
  const payload = response.data;

  if (
    payload !== null &&
    typeof payload === 'object' &&
    'success' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiSuccessResponse<TResponse>).data;
  }

  return payload as TResponse;
}
