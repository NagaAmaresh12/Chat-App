import { io } from "socket.io-client";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import uploadToCloudinary from "./utils/uploadToCloudinary.js";
import { getVideoThumbnailUrl } from "./utils/getThumbnailUrl.js";

// Socket.io config
const SERVER_URL = "http://localhost:8080";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJuYWdhYW1hcmVzaGthbm5lIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzYyOTQ5ODMxLCJleHAiOjE3NjI5NTA3MzF9.6cWI1MBddpf6Fv_lmgD3zvUoJl8C9EHyfBW-tt53Ahw";
const REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTEwOGE2NWUzMDk0ZTcxOWI1YTA0ZjQiLCJlbWFpbCI6Im5hZ2FhbWFyZXNoa2FubmVAZ21haWwuY29tIiwidG9rZW5UeXBlIjoicmVmcmVzaCIsInVzZXJuYW1lIjoibmFnYWFtYXJlc2hrYW5uZSIsImlhdCI6MTc2Mjk0OTgzMSwiZXhwIjoxNzYzNTU0NjMxfQ.F97WzPaWH3WupSJ0RCEaHT-9alzUPuoUZt9eNpfUKeg";
const CHAT_ID = "6911dd310ac5869f4212c794";
const chatType = "group";

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

// ---------- Helper: Determine file type ----------
function getFileType(resourceType) {
    switch (resourceType) {
        case "image":
            return "image";
        case "video":
            return "video";
        case "raw":
            return "document";
        case "audio":
            return "audio";
        default:
            return "document";
    }
}

// ---------- Helper: Compress image ----------
async function compressImage(sourcePath) {
    const outputDir = path.join(process.cwd(), "compressed");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = path.basename(sourcePath);
    const outputPath = path.join(outputDir, fileName);

    await sharp(sourcePath)
        .resize({ width: 800 })
        .jpeg({ quality: 70 })
        .toFile(outputPath);

    return outputPath;
}

// ✅ NEW: Universal send message function
// ✅ Fixed: Universal send message function
async function sendMessage(chatId, chatType, options = {}) {
    try {
        const { content = "", filePaths = [] } = options;

        // Validate: must have either content or files
        if (!content.trim() && filePaths.length === 0) {
            throw new Error("Must provide either content or files");
        }

        let attachments = [];
        let messageType = "text";

        // Process files if provided
        if (filePaths.length > 0) {
            attachments = await Promise.all(filePaths.map(async (filePath) => {
                const ext = path.extname(filePath).toLowerCase();
                let uploadPath = filePath;

                // Compress images only
                if ([".jpg", ".jpeg", ".png"].includes(ext)) {
                    uploadPath = await compressImage(filePath);
                }

                const result = await uploadToCloudinary(uploadPath);
                return {
                    url: result.secure_url,
                    filename: path.basename(filePath),
                    size: result.bytes,
                    mimeType: result.format
                        ? `${result.resource_type}/${result.format}`
                        : "application/octet-stream",
                    type: getFileType(result.resource_type),
                    thumbnailUrl: result.resource_type === "video"
                        ? getVideoThumbnailUrl(result.public_id)
                        : undefined
                };
            }));

            // Determine messageType based on attachments
            if (attachments.every(att => att.type === "image")) {
                messageType = "image";
            } else if (attachments.every(att => att.type === "video")) {
                messageType = "video";
            } else if (attachments.every(att => att.type === "audio")) {
                messageType = "audio";
            } else if (attachments.every(att => att.type === "document")) {
                messageType = "document";
            } else {
                messageType = "media"; // Mixed types
            }
        }

        // ✅ Build payload conditionally - don't include content if empty
        const payload = {
            chatId,
            chatType,
            messageType,
        };

        // Only add content if it's not empty after trimming
        if (content.trim()) {
            payload.content = content.trim();
        }

        // Only add attachments if they exist
        if (attachments.length > 0) {
            payload.attachments = attachments;
        }

        console.log("📤 Sending payload:", payload);

        socket.emit("send-message", payload);
        console.log("✅ Message sent successfully");

    } catch (err) {
        console.error("❌ Failed to send message:", err.message || err);
    }
}
// Socket event listeners
socket.on("error", (error) => {
    console.error("❌ Socket error from server:", error);
});

socket.on("message-created", (data) => {
    console.log("✅ Message confirmed saved:", data);
});

socket.on("new-message", (message) => {
    console.log("✅ New message broadcasted:", message);
});

// ========== EXAMPLES ==========

// Example 1: Text only
// setTimeout(() => {
//     sendMessage(CHAT_ID, chatType, {
//         content: "Hello! This is a text-only message"
//     });
// }, 2000);

// Example 2: Images only
// setTimeout(() => {
//     sendMessage(CHAT_ID, chatType, {
//         filePaths: [
//             path.join(process.cwd(), "images", "tanjiro.jpeg"),
//             path.join(process.cwd(), "images", "download.jpeg")
//         ]
//     });
// }, 4000);

// Example 3: Images with text
// setTimeout(() => {
//     sendMessage(CHAT_ID, chatType, {
//         content: "Check out these awesome images! 🎨",
//         filePaths: [
//             path.join(process.cwd(), "images", "tanjiro.jpeg"),
//             path.join(process.cwd(), "images", "download.jpeg")
//         ]
//     });
// }, 6000);

// Example 4: Mixed files with text
// setTimeout(() => {
//     sendMessage(CHAT_ID, chatType, {
//         content: "Here are some files 📁",
//         filePaths: [
//             path.join(process.cwd(), "images", "tanjiro.jpeg"),
//             path.join(process.cwd(), "images", "cloudinaryDataForLMSMERN.txt")
//         ]
//     });
// }, 8000);