import { Router } from 'express';
import express from 'express';
import * as paymentController from './payment.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/validate.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundSchema,
} from './payment.validator.js';

const router = Router();

// ─── Webhook (must be BEFORE express.json() — needs raw body) ─
// The raw body middleware is applied specifically to this route
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    req.rawBody = req.body.toString('utf-8');
    req.body = JSON.parse(req.rawBody);
    next();
  },
  paymentController.handleWebhook
);

// ─── Protected routes (authenticated users) ─────────────
router.use(authenticate);

// POST /api/v1/payments/create-order → Create Razorpay order for a booking
router.post(
  '/create-order',
  validate(createOrderSchema),
  paymentController.createOrder
);

// POST /api/v1/payments/verify → Verify payment signature after checkout
router.post(
  '/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

// POST /api/v1/payments/refund/:id → Initiate full/partial refund
router.post(
  '/refund/:id',
  validate(refundSchema),
  paymentController.initiateRefund
);

// GET /api/v1/payments/:bookingId → Get payment details by booking
router.get('/:bookingId', paymentController.getPaymentByBooking);

export default router;
