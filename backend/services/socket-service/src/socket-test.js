import { io } from "socket.io-client";
import path from "path";
import { compressImage } from "./utils/compressFile.js";
import uploadToCloudinary from "./utils/uploadToCloudinary.js";

const SERVER_URL = "http://localhost:8080";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CHAT_ID = "6911dd310ac5869f4212c794";

const socket = io(SERVER_URL, {
    auth: { token: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
});

socket.on("connect", () => {
    console.log(`✅ Connected (socketId: ${socket.id})`);
    socket.emit("join", CHAT_ID);
});

async function sendCompressedAndUpload(chatId, filePath, caption = "") {
    try {
        const compressedPath = await compressImage(filePath);
        const url = await uploadToCloudinary(compressedPath);

        const payload = {
            chatId,
            chatType: "group",
            messageType: "image",
            content: caption || "Image",
            attachments: [{ filename: path.basename(filePath), url }],
        };

        socket.emit("send-message", payload);
        console.log("✅ Sent message with Cloudinary URL:", url);
    } catch (err) {
        console.error("❌ Failed to send compressed image:", err.message);
    }
}
// Send Text Message
// function sendTextMessage(chatId, content) {
//     if (!chatId || !content) return console.error("⚠️ Invalid chatId or content.");

//     const payload = {
//         chatId,
//         chatType: "group",
//         messageType: "text",
//         content: content.trim(),
//     };

//     socket.emit("send-message", payload);
//     console.log(`📤 Sent text message: "${content}"`);
// }

// Example usage
setTimeout(() => {
    const sourcePath = path.join(path.resolve(), 'images', 'tanjiro.jpeg');
    sendCompressedAndUpload(CHAT_ID, sourcePath, "Check this out 👇");
}, 2000);
