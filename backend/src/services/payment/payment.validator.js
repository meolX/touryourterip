import { z } from 'zod';

// ─── Create Order Schema ───────────────────────────────
export const createOrderSchema = z.object({
  booking_id: z
    .string({ required_error: 'Booking ID is required' })
    .uuid('Invalid Booking ID format'),
});

// ─── Verify Payment Schema ─────────────────────────────
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z
    .string({ required_error: 'Razorpay Order ID is required' })
    .min(1, 'Razorpay Order ID cannot be empty'),

  razorpay_payment_id: z
    .string({ required_error: 'Razorpay Payment ID is required' })
    .min(1, 'Razorpay Payment ID cannot be empty'),

  razorpay_signature: z
    .string({ required_error: 'Razorpay Signature is required' })
    .min(1, 'Razorpay Signature cannot be empty'),
});

// ─── Refund Schema ─────────────────────────────────────
export const refundSchema = z.object({
  amount: z
    .number()
    .positive('Refund amount must be positive')
    .optional(), // If omitted, full refund

  reason: z
    .string()
    .trim()
    .max(250, 'Reason cannot exceed 250 characters')
    .optional(),
});
