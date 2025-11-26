export interface UserProfile {
  id: string | null;
  username: string | null;
  email: string | null;
  bio?: string | null;
  isOnline?: "online" | "offline" | null;
  avatar?: string | null;
}

export interface UserState {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
  remaining: number;
  totalPages: number;
}
