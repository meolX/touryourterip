import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Get all dates between checkIn and checkOut (exclusive of checkOut date itself).
 */
const getDatesInRange = (checkInStr, checkOutStr) => {
  const dates = [];
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);

  // Normalize to UTC midnight to avoid local timezone shifts
  const currentDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const stopDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (currentDate < stopDate) {
    dates.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return dates;
};

/**
 * Validate check-in and check-out dates.
 */
const validateDates = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid check-in or check-out date format');
  }

  if (start < today) {
    throw new ApiError(400, 'Check-in date cannot be in the past');
  }

  if (end <= start) {
    throw new ApiError(400, 'Check-out date must be after check-in date');
  }

  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return { start, end, nights };
};

// ─── CREATE BOOKING ────────────────────────────────────
export const createBooking = async (guestId, data) => {
  const { room_id, check_in, check_out, guests_count } = data;

  const { start, end, nights } = validateDates(check_in, check_out);

  // 1. Fetch Room and Property details
  const room = await prisma.room.findUnique({
    where: { id: room_id },
    include: { property: true },
  });

  if (!room || !room.is_active) {
    throw new ApiError(404, 'Room type is not available or inactive');
  }

  if (room.property.status !== 'active') {
    throw new ApiError(400, 'This property is not currently active');
  }

  if (guests_count > room.max_guests) {
    throw new ApiError(400, `Guest count exceeds maximum allowed for this room (${room.max_guests})`);
  }

  // 2. Check availability & calculate price in a transaction
  return await prisma.$transaction(async (tx) => {
    // Get list of dates we need to book
    const dates = getDatesInRange(check_in, check_out);

    // Fetch all overlapping bookings (status is confirmed, pending, checked_in)
    const overlappingBookings = await tx.booking.findMany({
      where: {
        room_id,
        status: { in: ['pending', 'confirmed', 'checked_in'] },
        AND: [
          { check_in: { lt: end } },
          { check_out: { gt: start } },
        ],
      },
    });

    // Check availability for each night in the range
    for (const date of dates) {
      // Find bookings active on this specific date
      const activeBookingsForDate = overlappingBookings.filter((b) => {
        const bIn = new Date(b.check_in);
        const bOut = new Date(b.check_out);
        return date >= bIn && date < bOut;
      });

      if (activeBookingsForDate.length >= room.total_units) {
        throw new ApiError(400, `Room type is fully booked on ${date.toISOString().split('T')[0]}`);
      }

      // Check if host has manually blocked this date in the availability table
      const availabilityOverride = await tx.availability.findUnique({
        where: {
          room_id_date: {
            room_id,
            date,
          },
        },
      });

      if (availabilityOverride && availabilityOverride.is_blocked) {
        throw new ApiError(400, `Room type is blocked for bookings on ${date.toISOString().split('T')[0]}`);
      }
    }

    // 3. Compute price overrides
    let totalRoomPrice = 0;
    const availabilityOverrides = await tx.availability.findMany({
      where: {
        room_id,
        date: { gte: start, lt: end },
      },
    });

    for (const date of dates) {
      const override = availabilityOverrides.find(
        (o) => o.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );
      totalRoomPrice += override && override.price_override ? override.price_override : room.price_per_night;
    }

    const taxes = Math.round(totalRoomPrice * 0.18 * 100) / 100; // 18% GST/taxes
    const total_amount = totalRoomPrice + taxes;

    // 4. Create booking
    const booking = await tx.booking.create({
      data: {
        guest_id: guestId,
        property_id: room.property_id,
        room_id,
        check_in: start,
        check_out: end,
        nights,
        guests_count,
        room_price: totalRoomPrice,
        taxes,
        total_amount,
        currency: 'INR',
        status: 'pending',
      },
      include: {
        room: {
          select: {
            name: true,
            room_type: true,
          },
        },
        property: {
          select: {
            title: true,
            city: true,
          },
        },
      },
    });

    return booking;
  });
};

// ─── GET BOOKINGS ──────────────────────────────────────
export const getBookings = async (userId, role, status) => {
  const where = {
    ...(status && { status }),
    ...(role === 'guest' && { guest_id: userId }),
    ...(role === 'host' && { property: { host_id: userId } }),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      room: {
        select: {
          name: true,
          room_type: true,
        },
      },
      property: {
        select: {
          title: true,
          city: true,
        },
      },
      guest: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { booked_at: 'desc' },
  });

  return bookings;
};

// ─── GET BOOKING BY ID ──────────────────────────────────
export const getBookingById = async (bookingId, userId, role) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: true,
      property: true,
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Auth check: Admin, Guest who booked, or Host of property
  if (
    role !== 'admin' &&
    booking.guest_id !== userId &&
    booking.property.host_id !== userId
  ) {
    throw new ApiError(403, 'Access denied. You are not authorized to view this booking.');
  }

  return booking;
};

// ─── CANCEL BOOKING ────────────────────────────────────
export const cancelBooking = async (bookingId, userId, role, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Auth check: Admin, Guest who booked, or Host of property
  if (
    role !== 'admin' &&
    booking.guest_id !== userId &&
    booking.property.host_id !== userId
  ) {
    throw new ApiError(403, 'Access denied. You are not authorized to cancel this booking.');
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel booking with current status: ${booking.status}`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancellation_reason: data.cancellation_reason || 'Cancelled by user',
      cancelled_at: new Date(),
    },
  });

  return updatedBooking;
};

// ─── UPDATE BOOKING STATUS ─────────────────────────────
export const updateBookingStatus = async (bookingId, hostId, role, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Auth check: Only Host of property or Admin
  if (role !== 'admin' && booking.property.host_id !== hostId) {
    throw new ApiError(403, 'Access denied. Only the property host or admin can update booking status.');
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: data.status,
      ...(data.status === 'cancelled' && {
        cancellation_reason: data.cancellation_reason || 'Cancelled by host/admin',
        cancelled_at: new Date(),
      }),
    },
  });

  return updatedBooking;
};

// ─── QUERY AVAILABILITY ────────────────────────────────
export const checkAvailability = async (roomId, checkIn, checkOut) => {
  const { start, end, nights } = validateDates(checkIn, checkOut);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room || !room.is_active) {
    throw new ApiError(404, 'Room type not found or inactive');
  }

  const dates = getDatesInRange(checkIn, checkOut);

  // Fetch all overlapping bookings
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      room_id: roomId,
      status: { in: ['pending', 'confirmed', 'checked_in'] },
      AND: [
        { check_in: { lt: end } },
        { check_out: { gt: start } },
      ],
    },
  });

  let available = true;
  const priceDetails = [];
  let totalRoomPrice = 0;

  // Fetch all overrides
  const availabilityOverrides = await prisma.availability.findMany({
    where: {
      room_id: roomId,
      date: { gte: start, lt: end },
    },
  });

  for (const date of dates) {
    const formattedDate = date.toISOString().split('T')[0];

    // Overlapping bookings for this date
    const activeBookingsForDate = overlappingBookings.filter((b) => {
      const bIn = new Date(b.check_in);
      const bOut = new Date(b.check_out);
      return date >= bIn && date < bOut;
    });

    const isBlocked = availabilityOverrides.some(
      (o) => o.date.toISOString().split('T')[0] === formattedDate && o.is_blocked
    );

    const override = availabilityOverrides.find(
      (o) => o.date.toISOString().split('T')[0] === formattedDate
    );

    const dailyPrice = override && override.price_override ? override.price_override : room.price_per_night;
    totalRoomPrice += dailyPrice;

    const remainingUnits = room.total_units - activeBookingsForDate.length;

    if (remainingUnits <= 0 || isBlocked) {
      available = false;
    }

    priceDetails.push({
      date: formattedDate,
      price: dailyPrice,
      available_units: Math.max(0, remainingUnits),
      blocked: isBlocked,
    });
  }

  const taxes = Math.round(totalRoomPrice * 0.18 * 100) / 100;
  const total_amount = totalRoomPrice + taxes;

  return {
    available,
    nights,
    room_price: totalRoomPrice,
    taxes,
    total_amount,
    currency: 'INR',
    calendar: priceDetails,
  };
};
