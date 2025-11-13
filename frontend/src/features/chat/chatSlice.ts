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
  totalPages: 1,
  hasMore: true,
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
        console.log("====================================");
        console.log({ chatAction: action });
        console.log("====================================");
        state.status = "succeeded";
        state.chats = action.payload.chats;
        state.page = action.payload.page;
        // state.totalPages = action.payload.totalPages;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchChatsPage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedChat, setSelectedUser } = chatSlice.actions;
export default chatSlice.reducer;
