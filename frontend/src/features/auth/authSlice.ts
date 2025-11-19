// ============================================================
// UPDATED authSlice.ts - Add resetOtpState reducer
// ============================================================

import { createSlice } from "@reduxjs/toolkit";
import {
  rehydrateAuth,
  sendOTP,
  verifyOTP,
} from "@/features/auth/authThunks.ts";
import type { AuthState } from "@/types/authTypes";
import Cookies from "js-cookie";
import { toast } from "sonner";

const initialState: AuthState = {
  id: null,
  user: null,
  otpSent: false,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // logout: (state) => {
    //   state.id = null;
    //   state.user = null;
    //   state.accessToken = null;
    //   state.refreshToken = null;
    //   state.otpSent = false;
    //   state.status = "idle";
    //   state.error = null;
    //   Cookies.remove("accessToken");
    //   Cookies.remove("refreshToken");
    // },

    setOtpSent: (state) => {
      state.otpSent = true;
    },

    // ✅ NEW: Reset OTP state (for back button)
    resetOtpState: (state) => {
      state.otpSent = false;
      state.status = "idle";
      state.error = null;
    },

    isLoading: (state) => {
      state.status = "loading";
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.status = "succeeded";
        state.otpSent = true;
        state.error = null;
        toast.success("OTP sent successfully!");
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.status = "failed";
        state.otpSent = false;

        const errorMessage = (action.payload as string) || "Failed to send OTP";
        state.error = errorMessage;

        if (action.error.message === "Rejected") {
          toast.error(errorMessage);
        } else {
          toast.error("Failed to send OTP. Please try again.");
        }
      })

      // 🔹 Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        // state.otpSent = false; // Reset after successful verification
        state.id = action.payload?.id;
        toast.success("Logged In Successfully !!!");
        // state.user = action.payload?.user;
        // state.accessToken = action.payload?.accessToken;
        // state.refreshToken = action.payload?.refreshToken || null;

        // toast.success("Login successful!");
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.status = "failed";

        const errorMessage =
          (action.payload as string) || "Failed to verify OTP";
        state.error = errorMessage;

        toast.error(errorMessage || "Failed to Login. Please Try again ...");
      })

      // 🔹 Rehydrate Auth
      .addCase(rehydrateAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.id = action.payload.id;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || null;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.status = "failed";
        state.id = null;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.otpSent = false;
      });
  },
});

export const { logout, isLoading, setOtpSent, resetOtpState } =
  authSlice.actions;
export default authSlice.reducer;
