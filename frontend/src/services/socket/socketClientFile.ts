// src/lib/socket.ts
import type { SendMessagePayload } from "@/types/socketTypes";
import type { IMessage } from "@/types/messageTypes.ts";
import { io, Socket } from "socket.io-client";

// Define your event types (incoming + outgoing)
interface ClientToServerEvents {
  "send-message": (data: SendMessagePayload) => void;
}

interface ServerToClientEvents {
  "new-message": (payload: {
    success: boolean;
    message: string;
    data: IMessage;
  }) => void;
}

// Socket instance type with full TS support
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const VITE_API_SOCKET_SERVICE = import.meta.env.VITE_API_SOCKET_SERVICE;

// Global singleton socket (recommended)
let socket: AppSocket | null = null;

// Initialize socket connection only when needed
export const connectSocket = (): AppSocket => {
  if (!VITE_API_SOCKET_SERVICE) {
    console.error("❌ VITE_GATEWAY_URL is missing in .env");
    throw new Error("VITE_GATEWAY_URL is missing");
  }

  if (!socket) {
    socket = io(VITE_API_SOCKET_SERVICE, {
      withCredentials: true, // send HttpOnly cookies automatically
      transports: ["websocket"], // force WebSocket (recommended for production)
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Socket connection error:", err.message);
    });
  }

  return socket;
};

// Safely return socket instance
export const getSocket = (): AppSocket | null => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initSocket() first.");
  }
  return socket;
};
