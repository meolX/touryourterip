import { z } from 'zod';

// ─── Create Property Schema ─────────────────────────────
export const createPropertySchema = z.object({
  type: z.enum(['hotel', 'pg', 'villa', 'resort'], {
    errorMap: () => ({ message: 'Type must be one of: hotel, pg, villa, resort' }),
  }),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be at most 150 characters'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional(),
  address_line1: z.string({ required_error: 'Address line 1 is required' }).trim().min(5, 'Address is too short'),
  city: z.string({ required_error: 'City is required' }).trim().min(2, 'City is too short'),
  state: z.string({ required_error: 'State is required' }).trim().min(2, 'State is too short'),
  country: z.string({ required_error: 'Country is required' }).trim().min(2, 'Country is too short'),
  pincode: z.string({ required_error: 'Pincode is required' }).regex(/^\d{5,10}$/, 'Pincode must be between 5 to 10 digits'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenities: z.array(z.string()).optional(),
  house_rules: z.string().trim().max(500, 'House rules cannot exceed 500 characters').optional(),
  base_price_per_night: z.number({ required_error: 'Base price per night is required' }).nonnegative('Price cannot be negative'),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code (e.g., INR)').optional().default('INR'),
});

// ─── Update Property Schema ─────────────────────────────
export const updatePropertySchema = createPropertySchema.partial().omit({ type: true });

// ─── Create Room Schema ─────────────────────────────────
export const createRoomSchema = z.object({
  room_type: z.enum(['single', 'double', 'deluxe', 'suite', 'dormitory'], {
    errorMap: () => ({ message: 'Room type must be one of: single, double, deluxe, suite, dormitory' }),
  }),
  bed_count: z.number({ required_error: 'Bed count is required' }).int().positive('Bed count must be at least 1'),
  price_per_night: z.number({ required_error: 'Price per night is required' }).nonnegative('Price cannot be negative'),
  total_ac: z.boolean().optional().default(false),
  total_wifi: z.boolean().optional().default(false),
  total_tv: z.boolean().optional().default(false),
});

// ─── Update Room Schema ─────────────────────────────────
export const updateRoomSchema = createRoomSchema.partial();

// ─── Add Photo Schema ───────────────────────────────────
export const addPhotoSchema = z.object({
  url: z.string({ required_error: 'Photo URL is required' }).url('Invalid photo URL'),
  caption: z.string().trim().max(150, 'Caption is too long').optional(),
  is_cover: z.boolean().optional().default(false),
  room_id: z.string().uuid('Invalid Room ID format').optional(),
});
