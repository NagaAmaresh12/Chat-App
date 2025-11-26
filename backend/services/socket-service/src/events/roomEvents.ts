import type { Socket, Server } from "socket.io";

export function registerRoomEvents(io: Server, socket: Socket) {
  socket.on("join-chat", ({ chatId }) => {
    console.log("joining chat:", { chatId });

    socket.join(chatId);
  });

  socket.on("leave-chat", ({ chatId }) => {
    console.log("leaving chat:", { chatId });
    socket.leave(chatId);
  });
}
