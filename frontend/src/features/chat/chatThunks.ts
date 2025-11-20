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
