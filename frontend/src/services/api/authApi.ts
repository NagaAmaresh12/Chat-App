import axiosInstance from "./axiosInstance";
import { AuthResponse } from "@/features/auth/authTypes";

const authApi = {
  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await axiosInstance.post("/users/auth/login", data);
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: { id: res.data.id, name: res.data.name, email: res.data.email },
    };
  },
};

export default authApi;
