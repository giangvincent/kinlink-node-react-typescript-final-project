/** Payload sent when registering a new user */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** What follows the user home after login */
export interface AuthResponse {
  userId: string;
  email: string;
}

/** Consistent error envelope */
export interface ApiErrorBody {
  message: string;
}
