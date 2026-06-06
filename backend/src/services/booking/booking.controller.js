import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as bookingService from './booking.service.js';

// ─── CREATE BOOKING ────────────────────────────────────
export const createBooking = asyncHandler(async (req, res) => {
  const guestId = req.user.userId;
  const booking = await bookingService.createBooking(guestId, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, booking, 'Booking created successfully'));
});

// ─── GET BOOKINGS ──────────────────────────────────────
export const getBookings = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { status } = req.query;

  const bookings = await bookingService.getBookings(userId, role, status);

  res
    .status(200)
    .json(new ApiResponse(200, bookings, 'Bookings retrieved successfully'));
});

// ─── GET BOOKING BY ID ──────────────────────────────────
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  const booking = await bookingService.getBookingById(id, userId, role);

  res
    .status(200)
    .json(new ApiResponse(200, booking, 'Booking details retrieved'));
});

// ─── CANCEL BOOKING ────────────────────────────────────
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  const booking = await bookingService.cancelBooking(id, userId, role, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, booking, 'Booking cancelled successfully'));
});

// ─── UPDATE BOOKING STATUS ─────────────────────────────
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hostId = req.user.userId;
  const role = req.user.role;

  const booking = await bookingService.updateBookingStatus(id, hostId, role, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, booking, 'Booking status updated successfully'));
});

// ─── CHECK AVAILABILITY ────────────────────────────────
export const checkAvailability = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { check_in, check_out } = req.query;

  const availability = await bookingService.checkAvailability(roomId, check_in, check_out);

  res
    .status(200)
    .json(new ApiResponse(200, availability, 'Availability details retrieved'));
});
