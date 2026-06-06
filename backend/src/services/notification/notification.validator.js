import { z } from 'zod';

const notificationTypes = [
  'booking_confirmed',
  'booking_cancelled',
  'booking_reminder',
  'payment_success',
  'payment_failed',
  'review_received',
  'property_approved',
  'property_suspended',
  'welcome',
  'general',
];

const notificationChannels = ['in_app', 'email', 'sms', 'push'];

// ─── Send Notification Schema (admin / internal) ───────
export const sendNotificationSchema = z.object({
  user_id: z
    .string({ required_error: 'User ID is required' })
    .uuid('Invalid User ID format'),

  type: z
    .enum(notificationTypes, {
      errorMap: () => ({
        message: `type must be one of: ${notificationTypes.join(', ')}`,
      }),
    })
    .default('general'),

  channel: z
    .enum(notificationChannels, {
      errorMap: () => ({
        message: `channel must be one of: ${notificationChannels.join(', ')}`,
      }),
    })
    .default('in_app'),

  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),

  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),

  data: z.record(z.any()).optional(),
});

// ─── Broadcast Schema (admin) ──────────────────────────
export const broadcastSchema = z.object({
  type: z
    .enum(notificationTypes, {
      errorMap: () => ({
        message: `type must be one of: ${notificationTypes.join(', ')}`,
      }),
    })
    .default('general'),

  channel: z
    .enum(notificationChannels, {
      errorMap: () => ({
        message: `channel must be one of: ${notificationChannels.join(', ')}`,
      }),
    })
    .default('in_app'),

  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),

  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),

  role: z
    .enum(['guest', 'host', 'admin'], {
      errorMap: () => ({ message: 'role must be one of: guest, host, admin' }),
    })
    .optional(),

  data: z.record(z.any()).optional(),
});
