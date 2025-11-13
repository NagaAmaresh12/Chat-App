export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  id: string;
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  id: string | null;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  email: string;
}
