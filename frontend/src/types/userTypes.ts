export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  isOnline?: "online" | "offline";
  avatar?: string;
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
