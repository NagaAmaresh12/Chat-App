import { getSocket } from "@/services/socket/socketClientFile.ts";

export function joinChat(chatId: string) {
  const socket = getSocket();
  socket.emit("join-chat", { chatId });
}

export function leaveChat(chatId: string) {
  const socket = getSocket();
  socket.emit("leave-chat", { chatId });
}
