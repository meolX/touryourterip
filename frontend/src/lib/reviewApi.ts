import api from "@/lib/api";
import { ApiResponse, Review } from "@/types";

export const reviewApi = {
  getByProperty: (propertyId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ reviews: Review[]; total: number }>>(
      `/reviews/property/${propertyId}`,
      { params }
    ),

  getMyReviews: () =>
    api.get<ApiResponse<{ reviews: Review[] }>>("/reviews/me"),

  create: (data: {
    booking_id: string;
    overall_rating: number;
    cleanliness_rating?: number;
    location_rating?: number;
    service_rating?: number;
    value_rating?: number;
    comment?: string;
  }) => api.post<ApiResponse<{ review: Review }>>("/reviews", data),

  update: (id: string, data: Partial<Review>) =>
    api.patch<ApiResponse<{ review: Review }>>(`/reviews/${id}`, data),

  delete: (id: string) => api.delete(`/reviews/${id}`),
};
