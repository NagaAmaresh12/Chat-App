import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice.ts";
import chatReducer from "@/features/chat/chatSlice.ts";
import userReducer from "@/features/user/userSlice.ts";

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  user: userReducer,
});

export default rootReducer;
