// src/types/chatTypes.ts

export interface Chat {
  chatId: string;
  type: "group" | "private";
  chatName: string;
  chatImage: string;
  unreadCount: number;
  isPinned: boolean;
  pinnedAt?: string;
  isArchived: boolean;
  isMuted: boolean;
  lastMessage: string | null;
  lastMessageType?: string; // FIXED
  lastMessageAt: string;
}

export interface IChat {
  chatId: string;
  chatName: string;
  type: "private" | "group";
  avatar?: string;
  chatAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageType?: string;
  unreadCount: number;
  participants?: string[];
  createdAt: string;
}

export interface ChatState {
  chats: Chat[] | null;
  selectedChat: Chat | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  page: number | null;
  limit: number | null;
  total: number | null;
  hasMore: boolean | null;
  remaining: number | null;
  totalPages: number | null;
}

// ============================================================
// Types Definition - src/types/chatTypes.ts
// ============================================================
export interface IMessage {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "file" | "audio" | "video";
  attachments?: IAttachment[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  sender?: {
    id: string;
    name?: string;
    username: string;
    avatar?: string;
  };
}

export interface IAttachment {
  _id: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
}
