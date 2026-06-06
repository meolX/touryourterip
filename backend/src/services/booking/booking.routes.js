import { Router } from 'express';
import * as bookingController from './booking.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/validate.js';
import {
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
} from './booking.validator.js';

const router = Router();

// ─── Public routes ──────────────────────────────────────
router.get('/availability/:roomId', bookingController.checkAvailability);

// ─── Protected routes (All users can manage bookings) ────
router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);
router.patch('/:id/status', validate(updateBookingStatusSchema), bookingController.updateBookingStatus);

export default router;
