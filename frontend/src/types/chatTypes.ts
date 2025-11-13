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
  chats: Chat[];
  users: User[];
  selectedChat: Chat | null;
  selectedUser: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}
