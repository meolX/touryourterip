import { Router } from 'express';
import * as reviewController from './review.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import validate from '../../middlewares/validate.js';
import {
  createReviewSchema,
  updateReviewSchema,
  togglePublishSchema,
} from './review.validator.js';

const router = Router();

// ─── Public routes ──────────────────────────────────────

// GET /api/v1/reviews/property/:propertyId  → List reviews for a property
router.get('/property/:propertyId', reviewController.getPropertyReviews);

// ─── Protected routes (authenticated users) ─────────────
router.use(authenticate);

// GET  /api/v1/reviews/me                   → Get my reviews (must be before /:id)
router.get('/me', reviewController.getMyReviews);

// POST /api/v1/reviews                      → Submit a review (guest, post-checkout)
router.post('/', validate(createReviewSchema), reviewController.createReview);

// GET    /api/v1/reviews/:id                → Get review details
router.get('/:id', reviewController.getReviewById);

// PATCH  /api/v1/reviews/:id                → Update own review
router.patch('/:id', validate(updateReviewSchema), reviewController.updateReview);

// DELETE /api/v1/reviews/:id                → Delete review (author or admin)
router.delete('/:id', reviewController.deleteReview);

// ─── Admin-only routes ──────────────────────────────────

// PATCH /api/v1/reviews/:id/publish         → Toggle review visibility
router.patch(
  '/:id/publish',
  authorize('admin'),
  validate(togglePublishSchema),
  reviewController.togglePublish
);

export default router;
