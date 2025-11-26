import express from "express";
// import { connectToRabbitMQ } from "./config/rabbitMQ.js";
import path from "node:path";
import socketUploadRoutes from "./routes/upload.route.js";
import http from "http";
import dotenv from "dotenv";
import { initSocketServer } from "io.js";
import { registerRoomEvents } from "events/roomEvents.js";
import { registerMessageEvents } from "events/messageEvents.js";
import { registerTypingEvents } from "events/typingEvents.js";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const app = express();
app.get("/health", (req, res) => {
  res.json({
    token: req?.headers?.authorization,
    message: "Socket Service is Working",
  });
});
app.use("/files", socketUploadRoutes);
// connectToRabbitMQ();

//========== socket ============
const server = http.createServer(app);
const io = initSocketServer(server);

io.on("connection", (socket) => {
  console.log("====================================");
  console.log("Socket connected:", socket.id);
  console.log("====================================");

  registerRoomEvents(io, socket);
  registerMessageEvents(io, socket);
  registerTypingEvents(io, socket);
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

export { server };
