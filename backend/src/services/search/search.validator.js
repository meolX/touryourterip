import { z } from 'zod';

// ─── Helper: coerce string → number (for query params) ──
const coerceInt = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be an integer`)
    .positive(`${label} must be positive`);

const coerceFloat = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .nonnegative(`${label} must be non-negative`);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ─── Search Properties Schema ───────────────────────────
export const searchPropertiesSchema = z
  .object({
    // Location filters
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1).optional(),

    // Geo filters (lat/lng + radius in km)
    latitude: coerceFloat('latitude').optional(),
    longitude: coerceFloat('longitude').optional(),
    radius: coerceFloat('radius').default(10), // default 10 km

    // Date availability
    check_in: dateString.optional(),
    check_out: dateString.optional(),

    // Guest capacity
    guests: coerceInt('guests').optional(),

    // Price range (per night)
    min_price: coerceFloat('min_price').optional(),
    max_price: coerceFloat('max_price').optional(),

    // Property type
    type: z
      .enum(['hotel', 'pg', 'villa', 'resort'], {
        errorMap: () => ({
          message: 'type must be one of: hotel, pg, villa, resort',
        }),
      })
      .optional(),

    // Room amenities
    has_ac: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    has_wifi: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),

    // Rating
    min_rating: coerceFloat('min_rating').optional(),

    // Sorting
    sort_by: z
      .enum(['price', 'rating', 'reviews', 'newest'], {
        errorMap: () => ({
          message: 'sort_by must be one of: price, rating, reviews, newest',
        }),
      })
      .default('newest'),
    sort_order: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'sort_order must be asc or desc' }),
      })
      .default('desc'),

    // Pagination
    page: coerceInt('page').default(1),
    limit: coerceInt('limit').max(50, 'Limit cannot exceed 50').default(10),
  })
  .refine(
    (data) => {
      if (data.min_price !== undefined && data.max_price !== undefined) {
        return data.min_price <= data.max_price;
      }
      return true;
    },
    { message: 'min_price must be less than or equal to max_price', path: ['min_price'] }
  )
  .refine(
    (data) => {
      if (data.check_in && data.check_out) {
        return new Date(data.check_in) < new Date(data.check_out);
      }
      return true;
    },
    { message: 'check_in must be before check_out', path: ['check_in'] }
  );

// ─── Suggestions Schema ────────────────────────────────
export const suggestionsSchema = z.object({
  q: z
    .string({ required_error: 'Search query (q) is required' })
    .trim()
    .min(2, 'Query must be at least 2 characters'),
  limit: coerceInt('limit').max(20, 'Limit cannot exceed 20').default(5),
});

// ─── Nearby Properties Schema ──────────────────────────
export const nearbySchema = z.object({
  latitude: coerceFloat('latitude'),
  longitude: coerceFloat('longitude'),
  radius: coerceFloat('radius').max(100, 'Radius cannot exceed 100 km').default(10),
  limit: coerceInt('limit').max(50, 'Limit cannot exceed 50').default(10),
});
