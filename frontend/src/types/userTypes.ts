export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  status?: "online" | "offline";
}

export interface UserState {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
