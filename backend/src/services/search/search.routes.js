import { Router } from 'express';
import * as searchController from './search.controller.js';
import validate from '../../middlewares/validate.js';
import {
  searchPropertiesSchema,
  suggestionsSchema,
  nearbySchema,
} from './search.validator.js';

const router = Router();

// ─── All search routes are public (no auth required) ────

// GET /api/v1/search/properties?city=Goa&type=hotel&min_price=1000&...
router.get(
  '/properties',
  validate(searchPropertiesSchema, 'query'),
  searchController.searchProperties
);

// GET /api/v1/search/suggestions?q=go&limit=5
router.get(
  '/suggestions',
  validate(suggestionsSchema, 'query'),
  searchController.getSuggestions
);

// GET /api/v1/search/nearby?latitude=15.4909&longitude=73.8278&radius=10
router.get(
  '/nearby',
  validate(nearbySchema, 'query'),
  searchController.getNearbyProperties
);

export default router;
