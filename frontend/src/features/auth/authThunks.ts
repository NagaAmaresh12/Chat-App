import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type {
  AuthResponse,
  SendOTPData,
  VerifyOTPData,
} from "@/types/authTypes.ts";
import { clearTokens } from "@/utils/tokenUtils.ts";
import { toast } from "sonner";
import { clearUserData } from "@/features/user/userSlice.ts";
import type { UserProfile } from "@/types/userTypes.ts";
import { clearChatData } from "@/features/chat/chatSlice.ts";
import { clearAuthStateData } from "@/features/auth/authSlice.ts";
import { clearMessageData } from "@/features/message/messageSlice.ts";
import { success } from "zod";

/**
 * 🔹 Send OTP
 */
export const sendOTP = createAsyncThunk<
  { message: string },
  SendOTPData,
  { rejectValue: string }
>("auth/sendOTP", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/users/auth/login", payload);
    console.log("====================================");
    console.log("User login response", { res });
    if (res?.data?.status == "success") {
      // toast.success(`${res?.data?.message}`);
      console.log("OTP Sent Successful !!");
    } else {
      toast.error("error");
    }
    console.log("====================================");
    return res.data; // expected: { message: "OTP sent successfully" }
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to send OTP");
  }
});

/**
 * 🔹 Verify OTP
 */
export const verifyOTP = createAsyncThunk<
  AuthResponse, // expected type
  VerifyOTPData,
  { rejectValue: string }
>("auth/verifyOTP", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post("/users/auth/verify-otp", payload);
    console.log({ res });

    const data = res.data.data; // <- your real data is inside `data`
    console.log("====================================");
    console.log({ data });
    console.log("====================================");
    // store tokens locally

    // return data in correct AuthResponse shape
    return {
      id: data.id,
      username: data.name, // FIX
      email: data.email, // FIX
      bio: data.bio || null,
      isOnline: data.isOnline || false,
      avatar: data.avatar || "",
    } satisfies AuthResponse;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "OTP verification failed"
    );
  }
});

// No payload needed for logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/users/auth/logout");
      // Call backend first

      if (res.data.status == "success") {
        // After successful logout → clear frontend state
        clearTokens();
        clearUserData();
        clearChatData();
        clearAuthStateData();
        clearMessageData();
      }
      if (res.data.status !== "success") {
        return rejectWithValue(res.data.message || "Logout failed");
      }

      return;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get("/users/auth/me");
    console.log("userData at fetchUserProfile", { data });

    return data?.data;
  } catch (err: any) {
    toast.message("Please Login!!!");
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch profile"
    );
  }
});
