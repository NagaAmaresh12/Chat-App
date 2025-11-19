import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserProfile,
  // updateUserProfile,
  fetchAllUsers,
  editProfile,
} from "@/features/user/userThunks.ts";
import type { UserState } from "@/types/userTypes.ts";

const initialState: UserState = {
  currentUser: null, // Logged-in user's data
  allUsers: [], // For global users or contacts
  status: "idle",
  error: null,
  page: 0,
  limit: 0,
  hasMore: false,
  total: 0,
  remaining: 0,
  totalPages: 0,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.currentUser = null;
      state.allUsers = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch current user
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        console.log("fetchUserProfile action at userSlice", {
          payload: action.payload,
        });

        state.status = "succeeded";
        state.currentUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch user profile";
      })

      // // 🔹 Update profile
      // .addCase(updateUserProfile.pending, (state) => {
      //   state.status = "loading";
      // })
      // .addCase(updateUserProfile.fulfilled, (state, action) => {
      //   state.status = "succeeded";
      //   state.currentUser = action.payload;
      // })
      // .addCase(updateUserProfile.rejected, (state, action) => {
      //   state.status = "failed";
      //   state.error = action.payload || "Failed to update user profile";
      // })

      // 🔹 Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        console.log({ action });

        state.status = "succeeded";
        state.allUsers = action.payload.users; // ✅ fixed
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch users";
      })
      .addCase(editProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(editProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log({ payload: action.payload });
        //         payload: {
        //   avatar: "https://res.cloudinary.com/dalu4afte/image/upload/v1763048063/mucchatlu_chat_uploads/yoai2lr6tdbn8m15afgw.jpg";
        //   bio: "All i need is Chat☕ and Sunchine🌞";
        //   email: "nagaamareshkanne@gmail.com";
        //   id: "69108a65e3094e719b5a04f4";
        //   isOnline: true;
        //   username: "Naga Amaresh..";
        // }
        state.currentUser = action.payload; // ✅ fixed
      })
      .addCase(editProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to update profile";
      });
  },
});

export const { clearUserData } = userSlice.actions;
export default userSlice.reducer;
