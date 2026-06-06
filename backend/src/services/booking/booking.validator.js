import { z } from 'zod';

// ─── Create Booking Schema ──────────────────────────────
export const createBookingSchema = z.object({
  room_id: z.string({ required_error: 'Room ID is required' }).uuid('Invalid Room ID format'),
  check_in: z
    .string({ required_error: 'Check-in date is required' })
    .datetime({ message: 'Check-in must be a valid ISO-8601 datetime string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be in YYYY-MM-DD format')),
  check_out: z
    .string({ required_error: 'Check-out date is required' })
    .datetime({ message: 'Check-out must be a valid ISO-8601 datetime string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be in YYYY-MM-DD format')),
  guests_count: z
    .number({ required_error: 'Guest count is required' })
    .int()
    .positive('Guest count must be at least 1'),
});

// ─── Cancel Booking Schema ──────────────────────────────
export const cancelBookingSchema = z.object({
  cancellation_reason: z
    .string()
    .trim()
    .max(250, 'Cancellation reason cannot exceed 250 characters')
    .optional(),
});

// ─── Update Booking Status Schema ───────────────────────
export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show'], {
    errorMap: () => ({
      message: 'Status must be one of: pending, confirmed, cancelled, checked_in, checked_out, no_show',
    }),
  }),
  cancellation_reason: z
    .string()
    .trim()
    .max(250, 'Cancellation reason cannot exceed 250 characters')
    .optional(),
});
