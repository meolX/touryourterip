import api from "@/lib/api";

export const searchApi = {
  properties: (params: {
    city?: string;
    type?: string;
    min_price?: number;
    max_price?: number;
    check_in?: string;
    check_out?: string;
    guests?: number;
    page?: number;
    limit?: number;
  }) => api.get("/search/properties", { params }),

  suggestions: (q: string, limit = 5) =>
    api.get("/search/suggestions", { params: { q, limit } }),

  nearby: (latitude: number, longitude: number, radius = 10) =>
    api.get("/search/nearby", { params: { latitude, longitude, radius } }),
};
