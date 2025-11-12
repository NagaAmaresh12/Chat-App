import dotenv from "dotenv";
dotenv.config();
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:8080";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJuYWdhYW1hcmVzaGthbm5lIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYyOTQ4NDQxLCJleHAiOjE3NjI5NDkzNDF9.y-5O9VYxt2w8ViBYZ2j1AKhWjjDqtbBmiN44HjvW5Wg";
const REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidG9rZW5UeXBlIjoicmVmcmVzaCIsInVzZXJuYW1lIjoibmFnYWFtYXJlc2hrYW5uZSIsImlhdCI6MTc2Mjk0ODQ0MSwiZXhwIjoxNzYzNTUzMjQxfQ.wJsrStfo_OE1qcUx0ZX4siL3ggPJQhGkbkzXYPsLMfE";
const CHAT_ID = "6911dd310ac5869f4212c794";

console.log('====================================');
console.log({ ACCESS_TOKEN, REFRESH_TOKEN });
console.log('====================================');
const socket = io(SERVER_URL, {
    auth: {
        token: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
});

socket.on("connect", () => {
    console.log(`✅ Connected (socketId: ${socket.id})`);
    socket.emit("join", CHAT_ID);
});

socket.on("error", (err) => console.error("❌ Socket error:", err));
socket.on("message-created", (data) => console.log("✅ Message confirmed:", data));
socket.on("new-message", (message) => console.log("🆕 New message broadcasted:", message));
