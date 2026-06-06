import { Router } from 'express';
import * as propertyController from './property.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import validate from '../../middlewares/validate.js';
import {
  createPropertySchema,
  updatePropertySchema,
  createRoomSchema,
  updateRoomSchema,
  addPhotoSchema,
} from './property.validator.js';

const router = Router();

// ─── Public routes ──────────────────────────────────────
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);
router.get('/:id/rooms', propertyController.getRooms);

// ─── Protected routes (Requires host or admin) ──────────
router.use(authenticate, authorize('host', 'admin'));

// Property management
router.post('/', validate(createPropertySchema), propertyController.createProperty);
router.patch('/:id', validate(updatePropertySchema), propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

// Room management
router.post('/:id/rooms', validate(createRoomSchema), propertyController.addRoom);
router.patch('/:id/rooms/:roomId', validate(updateRoomSchema), propertyController.updateRoom);
router.delete('/:id/rooms/:roomId', propertyController.deleteRoom);

// Photo management
router.post('/:id/photos', validate(addPhotoSchema), propertyController.addPhoto);
router.delete('/:id/photos/:photoId', propertyController.deletePhoto);
router.patch('/:id/photos/:photoId/cover', propertyController.setCoverPhoto);

export default router;
