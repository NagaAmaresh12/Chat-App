// export interface User {
//   id: string;
//   name: string;
//   email: string;

import type { AuthUser } from "./chatTypes";
import type { UserProfile } from "./userTypes";

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
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  email: string;
}
