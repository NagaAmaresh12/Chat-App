import axiosInstance from "@/lib/axios.ts";
import type { IPaginatedMessageResponse } from "@/types/messageTypes.ts";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const uploadFileThunk = createAsyncThunk(
  "message/uploadFile",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      console.log("====================================");
      console.log("Request Comes till messageThunks");

      console.log({ formData });
      console.log("====================================");
      const res = await axiosInstance.post("/sockets/files/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; // expected { url, fileType, size }
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const fetchMsgsByChatId = createAsyncThunk<
  IPaginatedMessageResponse,
  { chatId: string; page?: number; limit?: number; chatType: string }
>(
  "messages/fetchByChatId",
  async ({ chatId, page = 1, limit = 20, chatType }) => {
    const response = await axiosInstance.post(`/messages/msg/v1/chatId`, {
      chatId,
      page,
      limit,
      chatType,
    });
    console.log("====================================");
    console.log({ responseFromMsg: response.data.data });
    console.log("====================================");
    return response.data.data; // contains: { messages, page, totalPages, ... }
  }
);
