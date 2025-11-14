export interface IAttachment {
  type: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  _id: string;
}

export interface ISender {
  _id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  displayname: string;
  isOnline: boolean;
  blockedUsers: string[] | null;
}

export interface IMessage {
  _id: string;
  chatId: string;
  chatType: "group" | "private";
  senderId: string;
  content: string;
  messageType: string;
  attachments: IAttachment[];
  isDeleted: boolean;
  readBy: string[];
  deliveredTo: string[];
  reactions: any[];
  createdAt: string;
  updatedAt: string;
  sender: ISender;
}

export interface IPaginatedMessageResponse {
  messages: IMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}
