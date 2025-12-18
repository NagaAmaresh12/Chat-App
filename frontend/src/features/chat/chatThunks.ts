// src/features/chat/chatThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type { Chat } from "@/types/chatTypes.ts";

export const fetchChatsPage = createAsyncThunk<
  {
    chats: Chat[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    remaining: number;
    totalPages: number;
  },
  { page: number; limit: number }
>("chat/fetchChatsPage", async ({ page, limit }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/chats/common/all-chats", {
      params: { page, limit },
    });

    const total = res.data.data.count;
    const remaining = Math.max(total - page * limit, 0);
    const hasMore = page * limit < total;
    console.log("Chats:", res.data);

    return {
      chats: res.data.data.chats,
      page,
      limit,
      total,
      hasMore,
      remaining,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch chats"
    );
  }
});

interface CreateChatArgs {
  chatType: "private" | "group";
  userId: string;
  currentUserId: string; // logged-in user
}

export const createNewChat = createAsyncThunk(
  "chat/createNewChat",
  async (
    { chatType, userId, currentUserId }: CreateChatArgs,
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(`/chats/${chatType}-chat/new`, {
        participantId: userId,
      });

      const chat = response.data.data.chat;
      console.log({ chat });

      // 🔄 Transform API chat → store chat shape
      const otherParticipant = chat.participants.find(
        (p: any) => p.user._id !== currentUserId
      );

      const transformedChat = {
        chatId: chat._id,
        type: chat.type,
        chatName:
          chat.type === "private"
            ? otherParticipant?.user?.username || "Chat"
            : chat.chatName || "Group",
        chatImage: otherParticipant?.user?.avatar || "/default-avatar.png",
        unreadCount: "0",
        isPinned: false,
        isArchived: false,
        isMuted: false,
        lastMessage: "",
        lastMessageType: "Text",
        lastMessageAt: Date.now(),
      };

      return transformedChat;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create chat"
      );
    }
  }
);
