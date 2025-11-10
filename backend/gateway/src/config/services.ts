export const SERVICES = {
  USER_SERVICE: process.env.USERS_SERVICE_URL || "http://localhost:3001",
  CHAT_SERVICE: process.env.CHATS_SERVICE_URL || "http://localhost:3002",
  MESSAGE_SERVICE: process.env.MESSAGES_SERVICE_URL || "http://localhost:3003",
  NOTIFICATION_SERVICE: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3004",
};
