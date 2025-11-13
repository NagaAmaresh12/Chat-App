import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type { AuthResponse } from "@/types/authTypes.ts";
import { setAccessToken, setRefreshToken } from "@/utils/tokenUtils";
import Cookies from "js-cookie";

interface SendOTPData {
  username: string;
  email: string;
}

interface VerifyOTPData {
  username: string;
  email: string;
  otp: string;
}

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

    // store tokens locally
    setAccessToken(data?.accessToken);
    if (data?.refreshToken) setRefreshToken(data?.refreshToken);

    // return data in correct AuthResponse shape
    return {
      id: data.id,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
      },
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "OTP verification failed"
    );
  }
});

export const rehydrateAuth = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/rehydrateAuth", async (_, { rejectWithValue }) => {
  try {
    // Call backend to get new accessToken and user info
    // Cookies.remove("accessToken");
    // Cookies.remove("refreshToken");

    const { data } = await axiosInstance.get("/users/auth/me", {
      withCredentials: true,
    });
    console.log(
      "============= Send a request for New TOKENS======================="
    );
    console.log({ data });
    console.log("====================================");
    return {
      id: data?.data?.id,
      user: {
        id: data?.data?.id,
        name: data?.data?.name,
        email: data?.data?.email,
      },
      accessToken: data?.data?.accessToken,
      refreshToken: data?.data?.refreshToken || null,
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to rehydrate"
    );
  }
});
