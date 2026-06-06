import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as mediaService from './media.service.js';

// ─── UPLOAD PHOTOS ─────────────────────────────────────
export const uploadPhotos = asyncHandler(async (req, res) => {
  const hostId = req.user.userId;
  const photos = await mediaService.uploadPhotos(hostId, req.body, req.files);

  res
    .status(201)
    .json(new ApiResponse(201, photos, `${photos.length} photo(s) uploaded successfully`));
});

// ─── GET PHOTOS FOR A PROPERTY ─────────────────────────
export const getPropertyPhotos = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const result = await mediaService.getPropertyPhotos(propertyId);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Property photos retrieved successfully'));
});

// ─── UPDATE PHOTO ──────────────────────────────────────
export const updatePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hostId = req.user.userId;
  const photo = await mediaService.updatePhoto(id, hostId, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, photo, 'Photo updated successfully'));
});

// ─── SET COVER PHOTO ───────────────────────────────────
export const setCoverPhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hostId = req.user.userId;
  const photo = await mediaService.setCoverPhoto(id, hostId);

  res
    .status(200)
    .json(new ApiResponse(200, photo, 'Cover photo updated successfully'));
});

// ─── DELETE PHOTO ──────────────────────────────────────
export const deletePhoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const result = await mediaService.deletePhoto(id, userId, role);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Photo deleted successfully'));
});

// ─── BULK DELETE ───────────────────────────────────────
export const deleteAllPropertyPhotos = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const hostId = req.user.userId;
  const result = await mediaService.deleteAllPropertyPhotos(propertyId, hostId);

  res
    .status(200)
    .json(new ApiResponse(200, result, `${result.deleted} photo(s) deleted successfully`));
});
