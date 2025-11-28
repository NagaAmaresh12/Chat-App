import { getSocket } from "@/services/socket/socketClientFile.ts";

// Example usage
// export function joinChat(chatId: string) {
//   const socket = getSocket()!;
//   socket.emit("join-chat", { chatId }); // ✅ now type-safe
// }

export function join_my_rooms() {
  const socket = getSocket();
  socket?.emit("join_my_rooms"); // ✅ type-safe
}

export function leaveChat(chatId: string) {
  const socket = getSocket();
  socket?.emit("leave-chat", { chatId }); // ✅ type-safe
}
