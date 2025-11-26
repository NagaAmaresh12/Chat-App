import { getSocket } from "@/services/socket/socketClientFile.ts";

let lastTyping = 0;

export function sendTyping(chatId: string) {
  const now = Date.now();
  if (now - lastTyping > 5000) {
    lastTyping = now;
    getSocket().emit("typing", { chatId });
  }
}

export function subscribeToTyping(handler: (data: any) => void) {
  const socket = getSocket();
  socket.on("typing", handler);

  return () => socket.off("typing", handler);
}
