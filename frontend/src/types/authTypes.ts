// export interface User {
//   id: string;
//   name: string;
//   email: string;

// }

export interface AuthResponse {
  id: string | null;
  username: string | null;
  email: string | null;
  bio: string | null;
  isOnline?: string | null;
  avatar?: string | null;
}

export interface AuthState {
  id: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  isOnline: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  otpSent?: boolean;
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
export interface SendOTPData {
  username: string;
  email: string;
}

export interface VerifyOTPData {
  username: string;
  email: string;
  otp: string;
}
