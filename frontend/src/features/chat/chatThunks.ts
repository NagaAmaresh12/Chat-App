// src/features/chat/chatThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type { Chat } from "@/types/chatTypes";

// src/features/chat/chatThunks.ts
export const fetchChatsPage = createAsyncThunk<
  { chats: Chat[]; page: number; totalPages: number; hasMore: boolean },
  { page: number; limit: number }
>("chat/fetchChatsPage", async ({ page, limit }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/chats/common/all-chats", {
      params: { page, limit },
    });
    console.log("====================================");
    console.log({ chatRes: res, page, limit });
    console.log("====================================");
    return {
      chats: res.data.data.chats,
      page: res.data.data.page,
      hasMore: res.data.data.hasMore,
      totalPages: Math.ceil(res.data.data.count / limit),
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch chats"
    );
  }
});
