import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';

// ─── RECALCULATE PROPERTY RATINGS ──────────────────────
// Atomically recomputes rating_avg and review_count from
// all published reviews for a property. Called after every
// create, update, or delete operation on reviews.
const recalculatePropertyRatings = async (propertyId, tx = prisma) => {
  const aggregation = await tx.review.aggregate({
    where: { property_id: propertyId, is_published: true },
    _avg: { overall_rating: true },
    _count: { id: true },
  });

  await tx.property.update({
    where: { id: propertyId },
    data: {
      rating_avg: Math.round((aggregation._avg.overall_rating || 0) * 100) / 100,
      review_count: aggregation._count.id,
    },
  });
};

// ─── CREATE REVIEW ─────────────────────────────────────
export const createReview = async (guestId, data) => {
  const { booking_id, ...reviewData } = data;

  // 1. Verify the booking exists and belongs to this guest
  const booking = await prisma.booking.findUnique({
    where: { id: booking_id },
    include: { review: true },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.guest_id !== guestId) {
    throw new ApiError(403, 'You can only review your own bookings');
  }

  // 2. Only allow reviews for checked-out bookings
  if (booking.status !== 'checked_out') {
    throw new ApiError(400, 'Reviews can only be submitted for completed (checked_out) stays');
  }

  // 3. Prevent duplicate reviews
  if (booking.review) {
    throw new ApiError(409, 'You have already reviewed this booking');
  }

  // 4. Create review and recalculate ratings in a transaction
  return await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        booking_id,
        guest_id: guestId,
        property_id: booking.property_id,
        ...reviewData,
      },
      include: {
        guest: {
          select: { id: true, name: true },
        },
        property: {
          select: { id: true, title: true, city: true },
        },
      },
    });

    await recalculatePropertyRatings(booking.property_id, tx);

    return review;
  });
};

// ─── GET REVIEWS FOR A PROPERTY ────────────────────────
export const getPropertyReviews = async (propertyId, query = {}) => {
  // Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, rating_avg: true, review_count: true },
  });

  if (!property) {
    throw new ApiError(404, 'Property not found');
  }

  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  // Sort options
  const sortMap = {
    newest: { created_at: 'desc' },
    oldest: { created_at: 'asc' },
    highest: { overall_rating: 'desc' },
    lowest: { overall_rating: 'asc' },
  };
  const orderBy = sortMap[query.sort_by] || sortMap.newest;

  const where = {
    property_id: propertyId,
    is_published: true,
  };

  // Optional rating filter
  if (query.rating) {
    where.overall_rating = parseFloat(query.rating);
  }

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        overall_rating: true,
        cleanliness_rating: true,
        location_rating: true,
        service_rating: true,
        value_rating: true,
        comment: true,
        created_at: true,
        guest: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    summary: {
      rating_avg: property.rating_avg,
      review_count: property.review_count,
    },
    reviews,
    pagination: {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
};

// ─── GET REVIEW BY ID ──────────────────────────────────
export const getReviewById = async (reviewId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      guest: {
        select: { id: true, name: true },
      },
      property: {
        select: { id: true, title: true, city: true },
      },
      booking: {
        select: {
          id: true,
          check_in: true,
          check_out: true,
          nights: true,
          room: {
            select: { name: true, room_type: true },
          },
        },
      },
    },
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  return review;
};

// ─── UPDATE REVIEW ─────────────────────────────────────
export const updateReview = async (reviewId, guestId, data) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (review.guest_id !== guestId) {
    throw new ApiError(403, 'You can only edit your own reviews');
  }

  // Update review and recalculate property rating in a transaction
  return await prisma.$transaction(async (tx) => {
    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data,
      include: {
        guest: {
          select: { id: true, name: true },
        },
        property: {
          select: { id: true, title: true },
        },
      },
    });

    // Recalculate only if overall_rating changed
    if (data.overall_rating !== undefined) {
      await recalculatePropertyRatings(review.property_id, tx);
    }

    return updatedReview;
  });
};

// ─── DELETE REVIEW ─────────────────────────────────────
export const deleteReview = async (reviewId, userId, role) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  // Only the author or an admin can delete
  if (role !== 'admin' && review.guest_id !== userId) {
    throw new ApiError(403, 'You can only delete your own reviews');
  }

  return await prisma.$transaction(async (tx) => {
    await tx.review.delete({
      where: { id: reviewId },
    });

    await recalculatePropertyRatings(review.property_id, tx);

    return { deleted: true, id: reviewId };
  });
};

// ─── TOGGLE PUBLISH (admin moderation) ─────────────────
export const togglePublish = async (reviewId, isPublished) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data: { is_published: isPublished },
    });

    // Recalculate because publish/unpublish affects the average
    await recalculatePropertyRatings(review.property_id, tx);

    return updatedReview;
  });
};

// ─── GET MY REVIEWS (guest) ────────────────────────────
export const getMyReviews = async (guestId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: { guest_id: guestId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        overall_rating: true,
        cleanliness_rating: true,
        location_rating: true,
        service_rating: true,
        value_rating: true,
        comment: true,
        is_published: true,
        created_at: true,
        property: {
          select: { id: true, title: true, city: true, type: true },
        },
        booking: {
          select: { id: true, check_in: true, check_out: true },
        },
      },
    }),
    prisma.review.count({ where: { guest_id: guestId } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
};
