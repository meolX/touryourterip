import { z } from 'zod';

// ─── Rating field helper (1.0 – 5.0, half-step precision) ─
const ratingField = (label) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .min(1, `${label} must be at least 1`)
    .max(5, `${label} cannot exceed 5`)
    .multipleOf(0.5, `${label} must be in 0.5 increments (e.g. 3.5, 4.0)`);

// ─── Create Review Schema ──────────────────────────────
export const createReviewSchema = z.object({
  booking_id: z
    .string({ required_error: 'Booking ID is required' })
    .uuid('Invalid Booking ID format'),

  overall_rating: ratingField('overall_rating'),

  cleanliness_rating: ratingField('cleanliness_rating').optional(),
  location_rating: ratingField('location_rating').optional(),
  service_rating: ratingField('service_rating').optional(),
  value_rating: ratingField('value_rating').optional(),

  comment: z
    .string()
    .trim()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .optional(),
});

// ─── Update Review Schema ──────────────────────────────
export const updateReviewSchema = z
  .object({
    overall_rating: ratingField('overall_rating').optional(),
    cleanliness_rating: ratingField('cleanliness_rating').optional(),
    location_rating: ratingField('location_rating').optional(),
    service_rating: ratingField('service_rating').optional(),
    value_rating: ratingField('value_rating').optional(),

    comment: z
      .string()
      .trim()
      .min(10, 'Comment must be at least 10 characters')
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  );

// ─── Toggle Publish Schema (admin) ─────────────────────
export const togglePublishSchema = z.object({
  is_published: z.boolean({ required_error: 'is_published (true/false) is required' }),
});
