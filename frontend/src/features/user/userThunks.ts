import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios.ts";
import type { UserProfile } from "@/types/userTypes.ts";
import type { User } from "@/types/authTypes.ts";

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>("user/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get("/users/me");
    return data.user;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch profile"
    );
  }
});

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  Partial<UserProfile>,
  { rejectValue: string }
>("user/updateProfile", async (updates, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.put("/users/update", updates);
    return data.user;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update profile"
    );
  }
});

export const fetchAllUsers = createAsyncThunk<User[]>(
  "users/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/people/all");
      console.log({ dataNew: data });

      return data.data; // ✅ return only the array
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// src/features/auth/authThunks.ts

interface EditProfilePayload {
  userId: string;
  name?: string;
  bio?: string;
  email?: string;
  avatar?: string; // if updating avatar
}

export const editProfile = createAsyncThunk<
  User, // return type
  EditProfilePayload, // input payload
  { rejectValue: string }
>("auth/editProfile", async (payload, { rejectWithValue }) => {
  try {
    const { userId, ...data } = payload;
    const res = await axiosInstance.patch(`/users/people/edit/${userId}`, data);

    // Assuming API returns updated user object in res.data
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to update profile"
    );
  }
});
