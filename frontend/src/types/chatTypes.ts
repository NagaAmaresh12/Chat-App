// src/types/chatTypes.ts

export interface Chat {
  chatId: string;
  type: "group" | "private";
  chatName: string;
  chatImage: string;
  lastMessage: string | null;
  unreadCount: number;
  isPinned: boolean;
  pinnedAt?: string; // ISO timestamp when pinned
  isArchived: boolean;
  isMuted: boolean;
}

export interface ChatState {
  chats: Chat[]; // All chats
  users: User[]; // All users (if needed)
  selectedChat: Chat | null;
  selectedUser: User | null;
  status?: "idle" | "loading" | "succeeded" | "failed"; // optional for API status
  error?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}
