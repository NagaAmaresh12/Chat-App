import axios from "axios";
import type { Socket, Server } from "socket.io";
import { extractTokenFromCookie } from "../utils/verifyToken";

export function registerRoomEvents(io: Server, socket: Socket) {
  const CHATS_SERVICE = process.env.CHATS_SERVICE;
  const cookieHeader = socket.request.headers.cookie;

  // ===============================
  // 🔥 Join ALL rooms user belongs to
  // ===============================
  socket.on("join_my_rooms", async () => {
    const user = socket.data.user;
    if (!user) return;

    const tokens = extractTokenFromCookie(cookieHeader);
    const accessToken = tokens?.accessToken;
    const refreshToken = tokens?.refreshToken;

    if (!accessToken) {
      console.error("❌ Missing access token for join_my_rooms");
      return;
    }

    try {
      console.log(
        "➡️ Fetching all chats from:",
        `${CHATS_SERVICE}/common/all-chats`
      );

      // API request to Chat Service to get all user chat IDs
      const response = await axios.get(`${CHATS_SERVICE}/common/all-chats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-refresh-token": refreshToken,
        },
        withCredentials: true,
      });

      const chatIds = response.data?.data?.chats || [];

      console.log("✅ Joining rooms:", chatIds);

      chatIds.forEach((chatId: string) => socket.join(chatId));
    } catch (err) {
      console.error("❌ Error joining user rooms:", err);
    }
  });

  // ===============================
  // 🔹 Optional: Join a specific chat
  // ===============================
  socket.on("join-chat", ({ chatId }) => {
    console.log("📥 joining chat:", { chatId });
    socket.join(chatId);
  });

  // ===============================
  // 🔹 Optional: Leave a specific chat
  // ===============================
  socket.on("leave-chat", ({ chatId }) => {
    console.log("📤 leaving chat:", { chatId });
    socket.leave(chatId);
  });
}
