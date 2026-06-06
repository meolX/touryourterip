import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as paymentService from './payment.service.js';

// ─── CREATE RAZORPAY ORDER ─────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await paymentService.createOrder(userId, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, result, 'Razorpay order created successfully'));
});

// ─── VERIFY PAYMENT ────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await paymentService.verifyPayment(userId, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Payment verified and booking confirmed'));
});

// ─── INITIATE REFUND ───────────────────────────────────
export const initiateRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const result = await paymentService.initiateRefund(id, userId, role, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Refund initiated successfully'));
});

// ─── GET PAYMENT BY BOOKING ────────────────────────────
export const getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const result = await paymentService.getPaymentByBooking(bookingId, userId, role);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Payment details retrieved'));
});

// ─── RAZORPAY WEBHOOK ──────────────────────────────────
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentService.handleWebhook(req.rawBody, signature);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Webhook processed'));
});
