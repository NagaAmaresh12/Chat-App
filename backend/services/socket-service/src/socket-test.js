import { io } from "socket.io-client";
import fs from "fs";
import path from "path";

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJuYWdhYW1hcmVzaGthbm5lIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYyODg3ODA0LCJleHAiOjE3NjI4ODg3MDR9.YMRWWc9ImuivFdvCP6KsLZu__VPZ7FczUmFpXWqiyFk";
const REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidG9rZW5UeXBlIjoicmVmcmVzaCIsInVzZXJuYW1lIjoibmFnYWFtYXJlc2hrYW5uZSIsImlhdCI6MTc2Mjg4NzgwNCwiZXhwIjoxNzYzNDkyNjA0fQ.yX_E0zxBFtuyywaBHontinIhWeEetoo4wLYdZWw5yNE";
const USER_ID = "YOUR_USER_ID";

const socket = io("http://localhost:8080", {
    auth: { token: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN },
});

socket.on("connect", () => console.log("✅ Connected", socket.id));
socket.on("new-message", (msg) => console.log("📩 New message:", msg));
socket.on("reaction-updated", (msg) => console.log("👍 Reaction updated:", msg));
socket.on("error", (err) => console.error("❌ Socket error:", err));

// -------------------- Send text message --------------------
const sendTextMessage = (chatId, content) => {
    // wrap text as a single-element attachments array to mimic form-data
    socket.emit("send-message", {
        chatId,
        chatType: "group",
        messageType: "text",
        content,
        attachments: [
            {
                filename: "message.txt", // dummy filename
                data: Buffer.from(content, "utf-8").toString("base64"),
            },
        ],
        xUserId: USER_ID,
        authorization: `Bearer ${ACCESS_TOKEN}`,
        xRefreshToken: REFRESH_TOKEN,
    });
};

// -------------------- Send media message --------------------
const sendMediaMessage = (chatId, filePath, messageType = "image") => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        socket.emit("send-message", {
            chatId,
            chatType: "group",
            messageType,
            content: fileName,
            attachments: [
                {
                    filename: fileName,
                    data: fileBuffer.toString("base64"),
                },
            ],
            xUserId: USER_ID,
            authorization: `Bearer ${ACCESS_TOKEN}`,
            xRefreshToken: REFRESH_TOKEN,
        });

        console.log(`📤 Media message sent: ${fileName}`);
    } catch (err) {
        console.error("❌ Failed to send media message:", err);
    }
};

// -------------------- Example usage --------------------
setTimeout(() => sendTextMessage("6911dd310ac5869f4212c794", "Hello via Socket.IO!"), 2000);
// setTimeout(() => sendMediaMessage("6911dd310ac5869f4212c794", "./test-image.jpg"), 4000);
