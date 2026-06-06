import { Router } from 'express';
import * as mediaController from './media.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import validate from '../../middlewares/validate.js';
import upload from '../../middlewares/upload.js';
import { uploadPhotosSchema, updatePhotoSchema } from './media.validator.js';

const router = Router();

// ─── Public routes ──────────────────────────────────────

// GET /api/v1/media/property/:propertyId → List all photos for a property
router.get('/property/:propertyId', mediaController.getPropertyPhotos);

// ─── Protected routes (host / admin) ────────────────────
router.use(authenticate);

// POST /api/v1/media/upload → Upload photos (multipart/form-data)
//   - multer processes files first, then Zod validates body fields
router.post(
  '/upload',
  authorize('host', 'admin'),
  upload.array('photos', 10),
  validate(uploadPhotosSchema),
  mediaController.uploadPhotos
);

// PATCH /api/v1/media/:id → Update photo caption / cover flag
router.patch(
  '/:id',
  authorize('host', 'admin'),
  validate(updatePhotoSchema),
  mediaController.updatePhoto
);

// PATCH /api/v1/media/:id/cover → Set as cover photo
router.patch(
  '/:id/cover',
  authorize('host', 'admin'),
  mediaController.setCoverPhoto
);

// DELETE /api/v1/media/:id → Delete a single photo
router.delete(
  '/:id',
  authorize('host', 'admin'),
  mediaController.deletePhoto
);

// DELETE /api/v1/media/property/:propertyId/all → Bulk delete all photos
router.delete(
  '/property/:propertyId/all',
  authorize('host', 'admin'),
  mediaController.deleteAllPropertyPhotos
);

export default router;
