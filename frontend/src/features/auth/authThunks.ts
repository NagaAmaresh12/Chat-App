import { createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "@/services/api/authApi";
import type { AuthResponse } from "./authTypes";

export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});
