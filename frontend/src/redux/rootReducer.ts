import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice.ts";
import chatReducer from "@/features/chat/chatSlice.ts";
import userReducer from "@/features/user/userSlice.ts";
import messageReducer from "@/features/message/messageSlice.ts";

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  user: userReducer,
  message: messageReducer,
});

export default rootReducer;
