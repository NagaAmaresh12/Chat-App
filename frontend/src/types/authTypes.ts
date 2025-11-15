// export interface User {
//   id: string;
//   name: string;
//   email: string;

// }

export interface AuthResponse {
  id: string;
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  id: string | null;
  user: AuthUser | null;
  otpSent: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}
