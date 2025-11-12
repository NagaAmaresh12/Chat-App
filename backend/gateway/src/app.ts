import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import axios from "axios";
import { Server, Socket } from "socket.io";
import cors from "./middlewares/cors.js";
import { helmetMiddleware } from "./middlewares/helmet.js";
import { ratelimiter } from "./middlewares/rate.limiter.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";

config({ override: true });

const app = express();

// ------------------- Middlewares -------------------
app.use(cors);
app.use(cookieParser());
app.use(helmetMiddleware);
app.use(ratelimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan("combined", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

app.use("/api", routes);
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "gateway" })
);

// ------------------- Server + Socket Setup -------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const { USERS_SERVICE_URL, MESSAGES_SERVICE_URL, NOTIFICATIONS_SERVICE_URL } =
  process.env;

// ------------------- Socket Auth Middleware -------------------
io.use(async (socket, next) => {
  const { token, refreshToken } = socket.handshake.auth || {};

  if (!token) return next(new Error("Unauthorized"));

  try {
    const { data } = await axios.get(`${USERS_SERVICE_URL}/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.status !== "success") return next(new Error("Invalid token"));

    socket.data.user = data.user;
    socket.data.token = token;
    socket.data.refreshToken = refreshToken;

    next();
  } catch (err: any) {
    logger.error("❌ Socket auth failed:", err?.message);
    next(new Error("Authentication failed"));
  }
});

// ------------------- Socket Events -------------------
io.on("connection", (socket: Socket) => {
  const { user, token, refreshToken } = socket.data;
  logger.info(`✅ User connected: ${user}${user.id} (${socket.id})`);

  // Auto-join all user chats
  user.chats?.forEach((chatId: string) => socket.join(chatId));

  // Manual join
  socket.on("join", (chatId) => {
    socket.join(chatId);
    logger.info(`User ${user.id} joined chat ${chatId}`);
  });

  // ------------------- Send Message -------------------
  socket.on("send-message", async (payload) => {
    try {
      if (!payload.chatId || !payload.content)
        return socket.emit("error", { message: "Invalid payload" });

      const { data } = await axios.post(
        `${MESSAGES_SERVICE_URL}/msg/v1/create`,
        payload,
        {
          headers: {
            "x-user-id": user.id,
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        }
      );

      const message = data.data;

      if (!message?.chatId)
        return socket.emit("error", { message: "Invalid message response" });

      // Emit to chat room
      io.to(message.chatId).emit("new-message", message);

      // Confirm to sender
      socket.emit("message-created", { messageId: message._id });

      // Optionally notify others (async)
      // axios.post(`${NOTIFICATIONS_SERVICE_URL}/notify`, { message }).catch(() => {});
    } catch (err: any) {
      logger.error("Send message error:", err.response?.data || err.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ------------------- Add Reaction -------------------
  socket.on("add-reaction", async (payload) => {
    try {
      const { data } = await axios.post(
        `${MESSAGES_SERVICE_URL}/msg/v1/add/reactions`,
        payload,
        {
          headers: {
            "x-user-id": user.id,
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        }
      );
      io.to(data.data.chatId).emit("reaction-updated", data.data);
    } catch (err: any) {
      logger.error("Add reaction error:", err.message);
      socket.emit("error", { message: "Failed to add reaction" });
    }
  });

  // ------------------- Remove Reaction -------------------
  socket.on("remove-reaction", async (payload) => {
    try {
      const { data } = await axios.post(
        `${MESSAGES_SERVICE_URL}/msg/v1/remove/reactions`,
        payload,
        {
          headers: {
            "x-user-id": user.id,
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
        }
      );
      io.to(data.data.chatId).emit("reaction-updated", data.data);
    } catch (err: any) {
      logger.error("Remove reaction error:", err.message);
      socket.emit("error", { message: "Failed to remove reaction" });
    }
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${user.id} (${socket.id})`);
  });
});

export { server, io, app };
