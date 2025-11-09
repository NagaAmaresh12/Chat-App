import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";

const userService = process.env.USER_SERVICE || "http://localhost:3001";
const chatService = process.env.CHAT_SERVICE || "http://localhost:3002";
const messageService = process.env.MESSAGE_SERVICE || "http://localhost:3003";
const notificationService =
  process.env.NOTIFICATION_SERVICE || "http://localhost:3004";
if (
  !isValid(userService as string) ||
  !isValid(chatService as string) ||
  !isValid(messageService as string) ||
  !isValid(notificationService as string)
) {
  throw new AppError("Invalid Service Origin Details", 500);
}
export const getServiceTarget = (serviceName: string) => {
  const services: Record<string, string> = {
    "users-service": userService as string,
    "chats-service": chatService as string,
    "messages-service": messageService as string,
    "notifications-service": notificationService as string,
  };
  console.log("Service-Check",{
    serviceName,
    url:services[serviceName]
  });
  
  return services[serviceName] || "http://localhost:3000";
};
