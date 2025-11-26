import type { IAttachment } from "@/types/messageTypes.ts";

export interface TypingPayload {
  chatId: string;
  userId: string;
}

export interface SendMessagePayload {
  id: string;
  chatId: string;
  chatType: "group" | "private";
  messageType: "text" | "image" | "video" | "document" | "audio";
  content?: string;
  attachments?: IAttachment[] | [];
}
