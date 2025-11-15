// ============================================================
// 1. Socket Service - src/services/socketService.ts
// ============================================================
import { io, Socket } from "socket.io-client";
import { store } from "@/redux/store";
import {
  addNewMessage,
  updateTypingStatus,
} from "@/features/message/messageSlice";
import {
  updateChatOnNewMessage,
  incrementUnreadCount,
} from "@/features/chat/chatSlice";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private currentChatId: string | null = null;

  connect(userId: string, token: string) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    this.socket = io(GATEWAY_URL, {
      auth: { token, userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Message events
    this.socket.on("new_message", (data: any) => {
      console.log("📩 New message received:", data);
      const state = store.getState();
      const currentChatId = state.message.currentChatId;

      // Add message to current chat if it matches
      if (currentChatId === data.message.chatId) {
        store.dispatch(addNewMessage(data.message));
      } else {
        // Increment unread count for other chats
        store.dispatch(incrementUnreadCount(data.message.chatId));
      }

      // Update chat list (move to top, update last message)
      store.dispatch(
        updateChatOnNewMessage({
          chatId: data.message.chatId,
          lastMessage: data.message,
        })
      );
    });

    // Typing indicator events
    this.socket.on(
      "user_typing",
      (data: { chatId: string; userId: string; username: string }) => {
        console.log("⌨️ User typing:", data);
        store.dispatch(
          updateTypingStatus({
            chatId: data.chatId,
            userId: data.userId,
            username: data.username,
            isTyping: true,
          })
        );

        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          store.dispatch(
            updateTypingStatus({
              chatId: data.chatId,
              userId: data.userId,
              username: data.username,
              isTyping: false,
            })
          );
        }, 3000);
      }
    );

    this.socket.on(
      "user_stopped_typing",
      (data: { chatId: string; userId: string }) => {
        console.log("⌨️ User stopped typing:", data);
        store.dispatch(
          updateTypingStatus({
            chatId: data.chatId,
            userId: data.userId,
            username: "",
            isTyping: false,
          })
        );
      }
    );

    // Message status events
    this.socket.on("message_delivered", (data: { messageId: string }) => {
      console.log("✓ Message delivered:", data.messageId);
      // You can add a reducer to update message status
    });

    this.socket.on(
      "message_read",
      (data: { messageId: string; chatId: string }) => {
        console.log("✓✓ Message read:", data.messageId);
        // You can add a reducer to update message status
      }
    );
  }

  // Join a chat room
  joinChat(chatId: string) {
    this.currentChatId = chatId;
    this.socket?.emit("join_chat", { chatId });
    console.log("🚪 Joined chat:", chatId);
  }

  // Leave a chat room
  leaveChat(chatId: string) {
    this.socket?.emit("leave_chat", { chatId });
    console.log("🚪 Left chat:", chatId);
    this.currentChatId = null;
  }

  // Send a message
  sendMessage(messageData: {
    chatId: string;
    content: string;
    messageType: string;
    attachments?: any[];
  }) {
    this.socket?.emit("send_message", messageData);
    console.log("📤 Message sent:", messageData);
  }

  // Typing indicators
  startTyping(chatId: string) {
    this.socket?.emit("typing", { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit("stop_typing", { chatId });
  }

  // Mark messages as read
  markAsRead(chatId: string, messageIds: string[]) {
    this.socket?.emit("mark_as_read", { chatId, messageIds });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChatId = null;
      console.log("🔌 Socket disconnected");
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
