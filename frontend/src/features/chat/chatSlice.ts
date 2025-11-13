// src/features/chat/chatSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { ChatState } from "@/types/chatTypes";
import { fetchAllChats } from "@/features/chat/chatChunks.ts";

const initialState: ChatState = {
  chats: [],
  users: [],
  selectedChat: null,
  selectedUser: null,
  status: "idle",
  error: null,
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
      .addCase(fetchAllChats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllChats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.chats = action.payload; // set sorted chats
      })
      .addCase(fetchAllChats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedChat, setSelectedUser } = chatSlice.actions;
export default chatSlice.reducer;
