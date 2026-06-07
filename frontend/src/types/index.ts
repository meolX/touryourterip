export type Role = "guest" | "host" | "admin";
export type PropertyType = "hotel" | "pg" | "villa" | "resort";
export type PropertyStatus = "active" | "inactive" | "suspended";
export type RoomType = "single" | "double" | "deluxe" | "suite" | "dormitory";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  room_id?: string;
  url: string;
  caption?: string;
  is_cover: boolean;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  room_type: RoomType;
  max_guests: number;
  bed_count: number;
  price_per_night: number;
  total_units: number;
  has_ac: boolean;
  has_wifi: boolean;
  has_tv: boolean;
  is_active: boolean;
  photos?: PropertyPhoto[];
}

export interface Property {
  id: string;
  host_id: string;
  type: PropertyType;
  title: string;
  description?: string;
  address_line1: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  amenities?: Record<string, boolean>;
  house_rules?: string;
  base_price_per_night: number;
  currency: string;
  status: PropertyStatus;
  rating_avg?: number;
  review_count: number;
  created_at: string;
  photos?: PropertyPhoto[];
  rooms?: Room[];
  host?: User;
}

export interface Booking {
  id: string;
  guest_id: string;
  property_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  room_price: number;
  taxes: number;
  total_amount: number;
  currency: string;
  status: BookingStatus;
  cancellation_reason?: string;
  booked_at: string;
  property?: Property;
  room?: Room;
  payment?: Payment;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  paid_at?: string;
}

export interface Review {
  id: string;
  booking_id: string;
  guest_id: string;
  property_id: string;
  overall_rating: number;
  cleanliness_rating?: number;
  location_rating?: number;
  service_rating?: number;
  value_rating?: number;
  comment?: string;
  is_published: boolean;
  created_at: string;
  guest?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
