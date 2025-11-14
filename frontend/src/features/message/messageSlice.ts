import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { fetchMsgsByChatId } from "@/features/message/messageThunks.ts";
import type { IMessage } from "@/types/messageTypes.ts";

interface MessageState {
  messages: IMessage[];
  page: number;
  limit: number;
  totalPages: number;
  totalMessages: number;
  loading: boolean;
  error: string | null;
  currentChatId: string | null;
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
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
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
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMsgsByChatId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMsgsByChatId.fulfilled, (state, action) => {
        const { messages, page, totalPages, totalMessages } = action.payload;

        // On page = 1 (new chat loaded), replace
        if (page === 1) {
          state.messages = messages;
        } else {
          // For infinite scroll append older messages
          state.messages = [...state.messages, ...messages];
        }

        state.page = page;
        state.totalPages = totalPages;
        state.totalMessages = totalMessages;
        state.loading = false;
      })
      .addCase(fetchMsgsByChatId.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch messages";
        state.loading = false;
      });
  },
});

export const { resetMessages, setCurrentChatId } = messageSlice.actions;

export default messageSlice.reducer;
