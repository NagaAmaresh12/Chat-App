// src/features/chat/chatThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type { Chat } from "@/types/chatTypes";

export const fetchAllChats = createAsyncThunk<Chat[], void>(
  "chat/fetchAllChats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/chats/common/all-chats");

      // sort pinned chats first (newest pinned on top)
      const chats: Chat[] = res.data.data.chats.sort((a: Chat, b: Chat) => {
        if (a.isPinned && b.isPinned) {
          // compare pinnedAt date/time
          return (
            new Date(b.pinnedAt || "").getTime() -
            new Date(a.pinnedAt || "").getTime()
          );
        } else if (a.isPinned) {
          return -1; // a pinned goes above
        } else if (b.isPinned) {
          return 1; // b pinned goes above
        }
        return 0; // otherwise, keep backend order
      });

      return chats;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch chats"
      );
    }
  }
);
