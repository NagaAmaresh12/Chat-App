// ============================================================
// 2. Updated Message Slice - src/features/message/messageSlice.ts
// ============================================================
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { fetchMsgsByChatId } from "@/features/message/messageThunks.ts";
import type { IMessage } from "@/types/messageTypes.ts";

interface TypingUser {
  userId: string;
  username: string;
}

interface MessageState {
  messages: IMessage[];
  page: number;
  limit: number;
  totalPages: number;
  totalMessages: number;
  loading: boolean;
  error: string | null;
  currentChatId: string | null;
  hasMore: boolean;
  typingUsers: Record<string, TypingUser[]>; // chatId -> users typing
}

const initialState: MessageState = {
  messages: [],
  page: 1,
  limit: 20,
  totalPages: 1,
  totalMessages: 0,
  loading: false,
  error: null,
  currentChatId: null,
  hasMore: false,
  typingUsers: {},
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessageData: (state) => {
      state.messages = [];
      state.page = 1;
      state.limit = 20;
      state.totalPages = 1;
      state.totalMessages = 0;
      state.currentChatId = null;
      state.hasMore = false;
      state.typingUsers = {};
    },
    resetMessages: (state) => {
      state.messages = [];
      state.page = 1;
      state.totalPages = 1;
      state.totalMessages = 0;
      state.error = null;
    },

    setCurrentChatId: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },

    // Add new real-time message
    addNewMessage: (state, action: PayloadAction<IMessage>) => {
      const newMessage = action.payload;
      console.log("addNewMessage Payload", newMessage);

      // Only add if it's for the current chat and doesn't already exist
      // if (state.currentChatId === newMessage.chatId) {
      // const exists = state.messages.some((msg) => msg._id === newMessage._id);
      // if (!exists) {
      state.messages.push(newMessage);
      state.totalMessages += 1;
      console.log("Newly Updated State", { messages: state.messages });

      // }
      // }
    },

    // Update typing status
    updateTypingStatus: (
      state,
      action: PayloadAction<{
        chatId: string;
        userId: string;
        username: string;
        isTyping: boolean;
      }>
    ) => {
      const { chatId, userId, username, isTyping } = action.payload;

      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }

      if (isTyping) {
        // Add user if not already typing
        const exists = state.typingUsers[chatId].some(
          (u) => u.userId === userId
        );
        if (!exists) {
          state.typingUsers[chatId].push({ userId, username });
        }
      } else {
        // Remove user from typing
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(
          (u) => u.userId !== userId
        );
      }
    },

    clearTypingUsers: (state, action: PayloadAction<string>) => {
      state.typingUsers[action.payload] = [];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMsgsByChatId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMsgsByChatId.fulfilled, (state, action) => {
        const {
          messages,
          page,
          totalPages,
          total: totalMessages,
        } = action.payload;

        if (page === 1) {
          state.messages = messages;
        } else {
          // Prepend older messages for infinite scroll
          state.messages = [...messages, ...state.messages];
        }

        state.page = page;
        state.totalPages = totalPages;
        state.totalMessages = totalMessages;
        state.hasMore = action.payload.hasMore;
        state.loading = false;
      })
      .addCase(fetchMsgsByChatId.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch messages";
        state.loading = false;
      });
  },
});

export const {
  resetMessages,
  setCurrentChatId,
  addNewMessage,
  updateTypingStatus,
  clearTypingUsers,
  clearMessageData,
} = messageSlice.actions;

export default messageSlice.reducer;
