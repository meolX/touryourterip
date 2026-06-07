import api from "@/lib/api";
import { ApiResponse, Property, Room, PropertyPhoto } from "@/types";

export const propertyApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<{ properties: Property[]; total: number }>>("/properties", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ property: Property }>>(`/properties/${id}`),

  getRooms: (id: string) =>
    api.get<ApiResponse<{ rooms: Room[] }>>(`/properties/${id}/rooms`),

  create: (data: Partial<Property>) =>
    api.post<ApiResponse<{ property: Property }>>("/properties", data),

  update: (id: string, data: Partial<Property>) =>
    api.patch<ApiResponse<{ property: Property }>>(`/properties/${id}`, data),

  delete: (id: string) => api.delete(`/properties/${id}`),

  addRoom: (propertyId: string, data: Partial<Room>) =>
    api.post<ApiResponse<{ room: Room }>>(`/properties/${propertyId}/rooms`, data),

  addPhoto: (propertyId: string, data: Partial<PropertyPhoto>) =>
    api.post<ApiResponse<{ photo: PropertyPhoto }>>(`/properties/${propertyId}/photos`, data),

  setCoverPhoto: (propertyId: string, photoId: string) =>
    api.patch(`/properties/${propertyId}/photos/${photoId}/cover`),

  deletePhoto: (propertyId: string, photoId: string) =>
    api.delete(`/properties/${propertyId}/photos/${photoId}`),
};
