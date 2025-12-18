// ============================================================
// 3. Updated Chat Slice - src/features/chat/chatSlice.ts
// ============================================================
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ChatState, Chat } from "@/types/chatTypes.ts";
import { fetchChatsPage } from "@/features/chat/chatThunks.ts";

const initialState: ChatState = {
  chats: [],
  selectedChat: null,
  status: "idle",
  error: null,
  page: 1,
  limit: 0,
  total: 0,
  hasMore: false,
  remaining: 0,
  totalPages: 1,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },

    clearChatData: (state) => {
      state.chats = [];
      state.page = 1;
      state.limit = 0;
      state.remaining = 0;
      state.selectedChat = null;
      state.total = 0;
      state.totalPages = 1;
      state.hasMore = false;
    },

    updateChatOnNewMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        lastMessage: {
          content: string;
          createdAt: string;
          messageType: string;
        };
      }>
    ) => {
      if (!state.chats) return;

      const { chatId, lastMessage } = action.payload;

      const chatIndex = state.chats.findIndex((c) => c.chatId === chatId);
      if (chatIndex === -1) return;

      const chat = state.chats[chatIndex];
      if (!chat) return;

      // Update fields
      chat.lastMessage = lastMessage.content;
      chat.lastMessageAt = lastMessage.createdAt;
      chat.lastMessageType = lastMessage.messageType;

      // Move chat to top
      state.chats.splice(chatIndex, 1);
      state.chats.unshift(chat);
    },

    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      if (!state.chats) return;

      const chat = state.chats.find((c) => c.chatId === action.payload);
      if (chat) chat.unreadCount = (chat.unreadCount || 0) + 1;
    },

    resetUnreadCount: (state, action: PayloadAction<string>) => {
      if (!state.chats) return;

      const chat = state.chats.find((c) => c.chatId === action.payload);
      if (chat) chat.unreadCount = 0;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchChatsPage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchChatsPage.fulfilled, (state, action) => {
        if (action.payload.page === 1) {
          state.chats = action.payload.chats;
          // } else {
          //   state.chats.push(...action.payload.chats) ;
          // }
        } else {
          state.chats = [...action.payload.chats];
        }

        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
        state.status = "succeeded";
      })
      .addCase(fetchChatsPage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedChat,
  updateChatOnNewMessage,
  incrementUnreadCount,
  resetUnreadCount,
  clearChatData,
} = chatSlice.actions;

export default chatSlice.reducer;
