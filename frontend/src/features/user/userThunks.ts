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
    const { data } = await axiosInstance.get("/users/auth/me");
    return data.user;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch profile"
    );
  }
});

// export const updateUserProfile = createAsyncThunk<
//   UserProfile,
//   Partial<UserProfile>,
//   { rejectValue: string }
// >("user/updateProfile", async (updates, { rejectWithValue }) => {
//   try {
//     const { data } = await axiosInstance.put("/users/people/edit", updates);
//     return data.user;
//   } catch (err: any) {
//     return rejectWithValue(
//       err.response?.data?.message || "Failed to update profile"
//     );
//   }
// });

export const fetchAllUsers = createAsyncThunk<
  {
    users: User[];
    page: number;
    totalPages: number;
    hasMore: boolean;
    total: number;
    limit: number;
    remaining: number;
  },
  { page: number; limit: number }
>("users/fetchAllUsers", async ({ page, limit }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get("/users/people/all", {
      params: { page, limit },
    });

    const total = res.data.data.count;
    const remaining = Math.max(total - page * limit, 0);
    const hasMore = page * limit < total;

    return {
      users: res?.data?.data?.users,
      page,
      limit,
      total,
      hasMore,
      remaining,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch users"
    );
  }
});

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
