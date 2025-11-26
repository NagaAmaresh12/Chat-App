import type { Socket, Server } from "socket.io";
export function registerTypingEvents(io: Server, socket: Socket) {
  socket.on("typing", ({ chatId }: { chatId: string }) => {
    socket.to(chatId).emit("typing", {
      chatId,
      userId: socket.data.user.id,
    });
  });
}
