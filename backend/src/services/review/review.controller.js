import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as reviewService from './review.service.js';

// ─── CREATE REVIEW ─────────────────────────────────────
export const createReview = asyncHandler(async (req, res) => {
  const guestId = req.user.userId;
  const review = await reviewService.createReview(guestId, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, review, 'Review submitted successfully'));
});

// ─── GET REVIEWS FOR A PROPERTY ────────────────────────
export const getPropertyReviews = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const result = await reviewService.getPropertyReviews(propertyId, req.query);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Property reviews retrieved successfully'));
});

// ─── GET REVIEW BY ID ──────────────────────────────────
export const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await reviewService.getReviewById(id);

  res
    .status(200)
    .json(new ApiResponse(200, review, 'Review details retrieved'));
});

// ─── UPDATE REVIEW ─────────────────────────────────────
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const guestId = req.user.userId;
  const review = await reviewService.updateReview(id, guestId, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, review, 'Review updated successfully'));
});

// ─── DELETE REVIEW ─────────────────────────────────────
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const result = await reviewService.deleteReview(id, userId, role);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Review deleted successfully'));
});

// ─── TOGGLE PUBLISH (admin) ────────────────────────────
export const togglePublish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await reviewService.togglePublish(id, req.body.is_published);

  res
    .status(200)
    .json(new ApiResponse(200, review, `Review ${review.is_published ? 'published' : 'unpublished'} successfully`));
});

// ─── GET MY REVIEWS ────────────────────────────────────
export const getMyReviews = asyncHandler(async (req, res) => {
  const guestId = req.user.userId;
  const result = await reviewService.getMyReviews(guestId, req.query);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Your reviews retrieved successfully'));
});
