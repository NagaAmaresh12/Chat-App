import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "./middlewares/cors.js";
import { ratelimiter } from "./middlewares/rate.limiter.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { helmetMiddleware } from "./middlewares/helmet.js";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import axios from "axios";

config({ override: true });

const app = express();
// ✅ Add JSON parser BEFORE routes and Multer
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use(cors);
app.use(cookieParser());
app.use(helmetMiddleware);
app.use(ratelimiter);

app.use(
  morgan("combined", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

app.use("/api", routes);

app.get("/health", (_req, res) => res.json({ message: "Gateway is working" }));
app.get("/", (_req, res) =>
  res.json({ message: "API Gateway is working Fine" })
);

// ================== Socket Setup ==================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL!;
const CHATS_SERVICE_URL = process.env.CHATS_SERVICE_URL!;
const MESSAGES_SERVICE_URL = process.env.MESSAGES_SERVICE_URL!;
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL!;
console.log("====================================");
console.log({ USERS_SERVICE_URL, MESSAGES_SERVICE_URL });
console.log("====================================");
// --- Socket authentication middleware ---
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const refreshToken = socket.handshake.auth.refreshToken;

    if (!token) return next(new Error("Unauthorized"));

    // Verify token with user-service
    const userResponse = await axios.get(
      `${USERS_SERVICE_URL}/auth/verify-token`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("====================================");
    console.log({ userResponse });
    console.log("====================================");

    if (userResponse.data.status !== "success")
      return next(new Error("Invalid token"));

    // Attach user + tokens to socket data for future events
    socket.data.user = userResponse.data.user;
    socket.data.token = token;
    socket.data.refreshToken = refreshToken;

    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Authentication failed"));
  }
});

// --- Socket connection ---
io.on("connection", (socket: Socket) => {
  const { user, token, refreshToken } = socket.data;
  console.log(`User connected: ${user.id}, socketId: ${socket.id}`);

  // Join user to rooms for their chats
  if (user.chats) user.chats.forEach((chatId: string) => socket.join(chatId));

  // --- Send message event ---
  socket.on("send-message", async (payload) => {
    try {
      const response = await axios.post(
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

      console.log("====================================");
      console.log({ response });
      console.log("====================================");

      const savedMessage = response.data.data;

      // Broadcast to room
      io.to(savedMessage.chatId).emit("new-message", savedMessage);

      // Notify other services
      // await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
      //   message: savedMessage,
      // });
    } catch (err) {
      console.error("Send message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // --- Add reaction event ---
  socket.on("add-reaction", async (payload) => {
    try {
      const response = await axios.post(
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

      console.log("====================================");
      console.log({ response });
      console.log("====================================");

      const updatedMessage = response.data.data;
      io.to(updatedMessage.chatId).emit("reaction-updated", updatedMessage);
    } catch (err) {
      console.error("Add reaction error:", err);
      socket.emit("error", { message: "Failed to add reaction" });
    }
  });

  // --- Remove reaction event ---
  socket.on("remove-reaction", async (payload) => {
    try {
      const response = await axios.post(
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

      console.log("====================================");
      console.log({ response });
      console.log("====================================");

      const updatedMessage = response.data.data;
      io.to(updatedMessage.chatId).emit("reaction-updated", updatedMessage);
    } catch (err) {
      console.error("Remove reaction error:", err);
      socket.emit("error", { message: "Failed to remove reaction" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${user.id}, socketId: ${socket.id}`);
  });
});

export { server, io, app };
