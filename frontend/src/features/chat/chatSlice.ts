// ============================================================
// 3. Updated Chat Slice - src/features/chat/chatSlice.ts
// ============================================================
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ChatState } from "@/types/chatTypes.ts";
import { fetchChatsPage } from "@/features/chat/chatThunks.ts";

const initialState: ChatState = {
  chats: [],
  selectedChat: null,
  status: "idle",
  error: null,
  page: 1,
  limit: 0,
  total: 0,
  hasMore: true,
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
    // setSelectedUser: (state, action) => {
    //   state.selectedUser = action.payload;
    // },

    // Update chat when new message arrives
    updateChatOnNewMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        lastMessage: any;
      }>
    ) => {
      const { chatId, lastMessage } = action.payload;
      const chatIndex = state.chats.findIndex((c) => c.chatId === chatId);

      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];

        // Update last message and timestamp
        chat.lastMessage = lastMessage.content;
        chat.lastMessageTime = lastMessage.createdAt;
        chat.lastMessageType = lastMessage.messageType;

        // Move chat to top
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
    },

    // Increment unread count
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const chat = state.chats.find((c) => c.chatId === chatId);

      if (chat) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
    },

    // Reset unread count when user opens chat
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const chat = state.chats.find((c) => c.chatId === chatId);

      if (chat) {
        chat.unreadCount = 0;
      }
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
        } else {
          state.chats = [...state.chats, ...action.payload.chats];
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
  setSelectedUser,
  updateChatOnNewMessage,
  incrementUnreadCount,
  resetUnreadCount,
} = chatSlice.actions;

export default chatSlice.reducer;
