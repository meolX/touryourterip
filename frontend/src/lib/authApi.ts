import api from "@/lib/api";
import { ApiResponse, User } from "@/types";

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get<ApiResponse<{ user: User }>>("/auth/me"),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post("/auth/reset-password", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch("/auth/change-password", data),
};
