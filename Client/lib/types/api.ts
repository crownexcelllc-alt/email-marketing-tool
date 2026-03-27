export interface ApiMeta {
  timestamp: string;
  path: string;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  meta: ApiMeta;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorShape;
  meta: ApiMeta;
}
