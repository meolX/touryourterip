import api from "@/lib/api";
import { ApiResponse, Booking } from "@/types";

export const bookingApi = {
  create: (data: {
    property_id: string;
    room_id: string;
    check_in: string;
    check_out: string;
    guests_count: number;
  }) => api.post<ApiResponse<{ booking: Booking }>>("/bookings", data),

  getAll: () =>
    api.get<ApiResponse<{ bookings: Booking[] }>>("/bookings"),

  getById: (id: string) =>
    api.get<ApiResponse<{ booking: Booking }>>(`/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),

  checkAvailability: (roomId: string, params: { check_in: string; check_out: string }) =>
    api.get(`/bookings/availability/${roomId}`, { params }),
};
