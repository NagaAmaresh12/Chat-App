// ============================================================
// UPDATED authSlice.ts - Add resetOtpState reducer
// ============================================================

import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserProfile,
  sendOTP,
  verifyOTP,
} from "@/features/auth/authThunks.ts";
import type { AuthState } from "@/types/authTypes.ts";
import { toast } from "sonner";

const initialState: AuthState = {
  id: null,
  username: null,
  email: "",
  avatar: "",
  bio: null,
  isOnline: null,
  otpSent: false,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setOtpSent: (state) => {
      state.otpSent = true;
    },
    clearAuthStateData: (state) => {
      state.id = null;
      state.username = null;
      state.email = null;
      state.bio = null;
      state.isOnline = null;
      state.avatar = null;
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
        const { id, username, email, bio, isOnline, avatar } = action.payload;
        console.log({ id, username, email, bio, isOnline, avatar });

        state.error = null;
        state.id = id;
        state.username = username;
        state.email = email;
        state.bio = bio;
        state.isOnline = isOnline as string;
        state.avatar = avatar as string;

        toast.success("Logged In Successfully !!!");
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.status = "failed";

        const errorMessage =
          (action.payload as string) || "Failed to verify OTP";
        state.error = errorMessage;

        toast.error(errorMessage || "Failed to Login. Please Try again ...");
      })
      // 🔹 Fetch current user
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        console.log("fetchUserProfile action at userSlice", {
          payload: action.payload,
        });
        const id = action.payload.id;
        const email = action.payload.email;
        const username = action.payload.username;
        const bio = action.payload.bio as string;
        const isOnline = action.payload.isOnline as string;
        const avatar = action.payload.avatar as string;
        state.status = "succeeded";
        state.id = id;
        state.username = username;
        state.email = email;
        state.bio = bio;
        state.isOnline = isOnline;
        state.avatar = avatar;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch user profile";
      });
  },
});

export const { isLoading, setOtpSent, resetOtpState, clearAuthStateData } =
  authSlice.actions;
export default authSlice.reducer;
