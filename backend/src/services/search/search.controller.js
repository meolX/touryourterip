import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as searchService from './search.service.js';

// ─── SEARCH PROPERTIES ─────────────────────────────────
export const searchProperties = asyncHandler(async (req, res) => {
  const results = await searchService.searchProperties(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, results, 'Search results retrieved successfully'));
});

// ─── SUGGESTIONS ────────────────────────────────────────
export const getSuggestions = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const suggestions = await searchService.getSuggestions(q, limit);

  res
    .status(200)
    .json(new ApiResponse(200, suggestions, 'Suggestions retrieved successfully'));
});

// ─── NEARBY PROPERTIES ─────────────────────────────────
export const getNearbyProperties = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius, limit } = req.query;
  const nearby = await searchService.getNearbyProperties(
    Number(latitude),
    Number(longitude),
    Number(radius),
    Number(limit)
  );

  res
    .status(200)
    .json(new ApiResponse(200, nearby, 'Nearby properties retrieved successfully'));
});
