export interface ApiResponseMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiResponseMeta;
}

export function createApiResponse<T>(
  statusCode: number,
  message: string,
  data: T,
  meta?: ApiResponseMeta,
): ApiResponse<T> {
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}
