import { createSlice } from "@reduxjs/toolkit";
import {
  rehydrateAuth,
  sendOTP,
  verifyOTP,
} from "@/features/auth/authThunks.ts";
import type { AuthState } from "@/types/authTypes";
import Cookies from "js-cookie";
const initialState: AuthState = {
  id: null,
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.id = null;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    },
    isLoading: (state) => {
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Send OTP
      .addCase(sendOTP?.pending, (state) => {
        state.status = "loading";
      })
      .addCase(sendOTP?.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(sendOTP?.rejected, (state, action) => {
        state.status = "failed";
        state.error = action?.payload || "Failed to send OTP";
      })

      // 🔹 Verify OTP
      .addCase(verifyOTP?.pending, (state) => {
        state.status = "loading";
      })
      .addCase(verifyOTP?.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.id = action?.payload?.id;
        state.user = action?.payload?.user; // ✅ FIXED
        state.accessToken = action?.payload?.accessToken;
        state.refreshToken = action?.payload?.refreshToken || null;
      })

      .addCase(verifyOTP?.rejected, (state, action) => {
        state.status = "failed";
        state.error = action?.payload || "Failed to verify OTP";
      })
      // 🔹 Rehydrate Auth
      .addCase(rehydrateAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        console.log({ action });

        state.status = "succeeded";
        state.id = action?.payload.id;
        state.user = action?.payload.user;
        state.accessToken = action?.payload.accessToken;
        state.refreshToken = action?.payload.refreshToken || null;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.status = "failed";
        state.id = null;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

export const { logout, isLoading } = authSlice.actions;
export default authSlice.reducer;
