import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";

const userService = process.env.USER_SERVICE || "http://localhost:3000";
const chatService = process.env.CHAT_SERVICE || "http://localhost:3001";
const messageService = process.env.MESSAGE_SERVICE || "http://localhost:3002";
const socketService =
  process.env.NOTIFICATION_SERVICE || "http://localhost:3004";
if (
  !isValid(userService as string) ||
  !isValid(chatService as string) ||
  !isValid(messageService as string) ||
  !isValid(socketService as string)
) {
  throw new AppError("Invalid Service Origin Details", 500);
}
export const getServiceTarget = (serviceName: string) => {
  const services: Record<string, string> = {
    "user-service": userService as string,
    "chat-service": chatService as string,
    "message-service": messageService as string,
    "socket-service": socketService as string,
  };
  return services[serviceName] || "http://localhost:3000";
};
