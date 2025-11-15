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

export interface IChat {
  chatId: string;
  chatName: string;
  type: "private" | "group";
  avatar?: string;
  chatAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageType?: string;
  unreadCount: number;
  participants?: string[];
  createdAt: string;
}

export interface ChatState {
  chats: Chat[];
  // users: User[];
  selectedChat: Chat | null;
  // selectedUser: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  remaining: number;
  totalPages: number;
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

// export interface ChatState {
//   chats: IChat[];
//   users: any[];
//   selectedChat: IChat | null;
//   selectedUser: any | null;
//   status: "idle" | "loading" | "succeeded" | "failed";
//   error: string | null;
//   page: number;
//   limit: number;
//   total: number;
//   hasMore: boolean;
//   remaining: number;
//   totalPages: number;
// }
