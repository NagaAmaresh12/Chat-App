import axios from "axios";
import type { Server, Socket } from "socket.io";
import { extractTokenFromCookie } from "utils/verifyToken";

export function registerMessageEvents(io: Server, socket: Socket) {
  const API_GATEWAY = process.env.API_GATEWAY;
  const cookieHeader = socket.request.headers.cookie;
  socket.on("send-message", async (payload) => {
    const tokens = extractTokenFromCookie(cookieHeader);
    const accessToken = tokens?.accessToken;
    const refreshToken = tokens?.refreshToken;
    console.log({
      API_GATEWAY: `${API_GATEWAY}/api/messages/msg/v1/create`,
      payload,
    });
    try {
      const saved = await axios.post(
        `${API_GATEWAY}/api/messages/msg/v1/create`,
        {
          chatId: payload.chatId,
          chatType: payload.chatType,
          messageType: payload.messageType,
          content: payload.content,
          attachments: payload.attachments,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-refresh-token": refreshToken,
          },
          withCredentials: true,
        }
      );
      const message = saved.data;
      console.log({ message });
      io.to(payload.chatId).emit("new-message", message);
    } catch (err) {
      console.error("Error creating message:", err);
    }
  });
}
