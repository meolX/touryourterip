import api from "@/lib/api";
import { ApiResponse, Notification } from "@/types";

export const notificationApi = {
  getAll: () =>
    api.get<ApiResponse<{ notifications: Notification[] }>>("/notifications"),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>("/notifications/unread"),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch("/notifications/read-all"),

  clearAll: () =>
    api.delete("/notifications/clear-all"),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};
