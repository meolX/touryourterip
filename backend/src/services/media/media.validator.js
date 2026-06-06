import { z } from 'zod';

// ─── Upload Photos Schema (validated on req.body after multer) ─
export const uploadPhotosSchema = z.object({
  property_id: z
    .string({ required_error: 'Property ID is required' })
    .uuid('Invalid Property ID format'),

  room_id: z
    .string()
    .uuid('Invalid Room ID format')
    .optional(),

  caption: z
    .string()
    .trim()
    .max(200, 'Caption cannot exceed 200 characters')
    .optional(),

  is_cover: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .default('false'),
});

// ─── Update Photo Schema ───────────────────────────────
export const updatePhotoSchema = z
  .object({
    caption: z
      .string()
      .trim()
      .max(200, 'Caption cannot exceed 200 characters')
      .optional(),

    is_cover: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field (caption or is_cover) must be provided' }
  );

// ─── Reorder Photos Schema ─────────────────────────────
export const reorderPhotosSchema = z.object({
  photo_ids: z
    .array(
      z.string().uuid('Each photo ID must be a valid UUID'),
      { required_error: 'photo_ids array is required' }
    )
    .min(1, 'At least one photo ID is required'),
});
