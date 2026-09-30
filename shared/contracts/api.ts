export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}
