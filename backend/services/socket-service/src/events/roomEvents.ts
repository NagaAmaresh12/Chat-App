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
    console.log("Request Comes to join_my_rooms");

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
        `${CHATS_SERVICE}/common/my-chatIds`
      );
      console.log({ userId: socket.data.user.userId });

      // API request to Chat Service to get all user chat IDs
      const response = await axios.get(`${CHATS_SERVICE}/common/my-chatIds`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-refresh-token": refreshToken,
          "x-user-id": socket.data.user.userId,
        },
        withCredentials: true,
      });
      console.log("====================================");
      console.log("FULL RESPONSE:", JSON.stringify(response.data, null, 2));

      console.log("====================================");
      const chatIds = response.data?.data?.chatIds || "not found";

      console.log("✅ Joining rooms:", chatIds);

      chatIds.forEach((chatId: string) => socket.join(chatId));
    } catch (error: any) {
      console.error("❌ Error joining user rooms:", error.message);
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
