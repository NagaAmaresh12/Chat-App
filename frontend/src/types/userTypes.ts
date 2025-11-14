export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline?: "online" | "offline";
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
  totalPages: number;
  remaining: number;
}
