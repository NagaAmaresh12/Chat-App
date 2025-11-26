import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/redux/rootReducer.ts";

export const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
