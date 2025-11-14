// src/features/chat/chatSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { ChatState } from "@/types/chatTypes.ts";
import { fetchChatsPage } from "@/features/chat/chatThunks.ts";
const initialState: ChatState = {
  chats: [],
  users: [],
  selectedChat: null,
  selectedUser: null,
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
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
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

export const { setSelectedChat, setSelectedUser } = chatSlice.actions;
export default chatSlice.reducer;
