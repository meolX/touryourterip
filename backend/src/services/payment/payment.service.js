import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';
import getRazorpayInstance, { verifyPaymentSignature, verifyWebhookSignature } from '../../utils/razorpay.js';
import { createInternalNotification } from '../notification/notification.service.js';

// ─── CREATE RAZORPAY ORDER ─────────────────────────────
export const createOrder = async (userId, data) => {
  const { booking_id } = data;

  // 1. Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: booking_id },
    include: {
      payment: true,
      property: { select: { title: true } },
      room: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.guest_id !== userId) {
    throw new ApiError(403, 'You can only pay for your own bookings');
  }

  if (booking.status !== 'pending') {
    throw new ApiError(400, `Cannot create payment for booking with status: ${booking.status}`);
  }

  // 2. Check if payment already exists and is successful
  if (booking.payment && booking.payment.status === 'success') {
    throw new ApiError(409, 'Payment has already been completed for this booking');
  }

  // 3. Create Razorpay order
  const amountInPaise = Math.round(booking.total_amount * 100); // Razorpay expects paise

  const razorpayOrder = await getRazorpayInstance().orders.create({
    amount: amountInPaise,
    currency: booking.currency || 'INR',
    receipt: `tyt_${booking_id}`,
    notes: {
      booking_id,
      property: booking.property.title,
      room: booking.room.name,
      guest_id: userId,
    },
  });

  // 4. Create or update payment record in DB
  const paymentData = {
    booking_id,
    amount: booking.total_amount,
    currency: booking.currency || 'INR',
    status: 'pending',
    gateway_order_id: razorpayOrder.id,
  };

  let payment;
  if (booking.payment) {
    // Update existing failed/pending payment
    payment = await prisma.payment.update({
      where: { id: booking.payment.id },
      data: paymentData,
    });
  } else {
    payment = await prisma.payment.create({
      data: paymentData,
    });
  }

  return {
    payment_id: payment.id,
    razorpay_order_id: razorpayOrder.id,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: booking.currency || 'INR',
    booking: {
      id: booking.id,
      property: booking.property.title,
      room: booking.room.name,
      check_in: booking.check_in,
      check_out: booking.check_out,
      total_amount: booking.total_amount,
    },
  };
};

// ─── VERIFY PAYMENT ────────────────────────────────────
export const verifyPayment = async (userId, data) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  // 1. Find payment by gateway_order_id
  const payment = await prisma.payment.findFirst({
    where: { gateway_order_id: razorpay_order_id },
    include: {
      booking: {
        include: {
          property: { select: { title: true, host_id: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(404, 'Payment record not found for this order');
  }

  if (payment.booking.guest_id !== userId) {
    throw new ApiError(403, 'You can only verify your own payments');
  }

  if (payment.status === 'success') {
    throw new ApiError(409, 'Payment has already been verified');
  }

  // 2. Verify signature
  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    // Mark payment as failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    });

    throw new ApiError(400, 'Payment verification failed. Invalid signature.');
  }

  // 3. Fetch payment details from Razorpay for method info
  let paymentMethod = null;
  try {
    const rpPayment = await getRazorpayInstance().payments.fetch(razorpay_payment_id);
    const methodMap = {
      upi: 'upi',
      card: 'card',
      netbanking: 'netbanking',
      wallet: 'wallet',
    };
    paymentMethod = methodMap[rpPayment.method] || null;
  } catch {
    // Non-critical — continue without method info
  }

  // 4. Update payment + booking status in a transaction
  return await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        gateway_payment_id: razorpay_payment_id,
        method: paymentMethod,
        net_amount: payment.amount,
        paid_at: new Date(),
      },
    });

    // Confirm the booking
    await tx.booking.update({
      where: { id: payment.booking_id },
      data: { status: 'confirmed' },
    });

    // Send notifications (non-blocking)
    createInternalNotification({
      userId: payment.booking.guest_id,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of ₹${payment.amount} for ${payment.booking.property.title} has been confirmed.`,
      data: { booking_id: payment.booking_id, payment_id: payment.id },
    });

    createInternalNotification({
      userId: payment.booking.property.host_id,
      type: 'booking_confirmed',
      title: 'New Booking Confirmed',
      message: `A booking for ${payment.booking.property.title} has been confirmed with payment.`,
      data: { booking_id: payment.booking_id },
    });

    return {
      payment_id: updatedPayment.id,
      status: updatedPayment.status,
      method: updatedPayment.method,
      amount: updatedPayment.amount,
      paid_at: updatedPayment.paid_at,
      booking_status: 'confirmed',
    };
  });
};

// ─── INITIATE REFUND ───────────────────────────────────
export const initiateRefund = async (paymentId, userId, role, data) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          property: { select: { host_id: true, title: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  // Only admin, host of property, or the guest can initiate refund
  if (
    role !== 'admin' &&
    payment.booking.guest_id !== userId &&
    payment.booking.property.host_id !== userId
  ) {
    throw new ApiError(403, 'You are not authorized to initiate a refund');
  }

  if (payment.status !== 'success') {
    throw new ApiError(400, `Cannot refund a payment with status: ${payment.status}`);
  }

  if (payment.refund_id) {
    throw new ApiError(409, 'Refund has already been initiated for this payment');
  }

  // Calculate refund amount (full or partial)
  const refundAmount = data.amount
    ? Math.min(data.amount, payment.amount)
    : payment.amount;

  const refundAmountPaise = Math.round(refundAmount * 100);

  // Initiate Razorpay refund
  const razorpayRefund = await getRazorpayInstance().payments.refund(payment.gateway_payment_id, {
    amount: refundAmountPaise,
    notes: {
      reason: data.reason || 'Customer requested refund',
      booking_id: payment.booking_id,
      initiated_by: userId,
    },
  });

  // Update payment record
  return await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'refunded',
        refund_id: razorpayRefund.id,
        refunded_at: new Date(),
        net_amount: payment.amount - refundAmount,
      },
    });

    // Cancel booking if full refund
    if (refundAmount >= payment.amount) {
      await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: 'cancelled',
          cancellation_reason: data.reason || 'Refund processed',
          cancelled_at: new Date(),
        },
      });
    }

    // Notify guest
    createInternalNotification({
      userId: payment.booking.guest_id,
      type: 'payment_failed', // Reusing for refund — could add a refund type
      title: 'Refund Processed',
      message: `A refund of ₹${refundAmount} has been initiated for your booking at ${payment.booking.property.title}.`,
      data: { booking_id: payment.booking_id, refund_id: razorpayRefund.id },
    });

    return {
      payment_id: updatedPayment.id,
      refund_id: razorpayRefund.id,
      refund_amount: refundAmount,
      net_amount: updatedPayment.net_amount,
      status: updatedPayment.status,
      refunded_at: updatedPayment.refunded_at,
    };
  });
};

// ─── GET PAYMENT BY BOOKING ────────────────────────────
export const getPaymentByBooking = async (bookingId, userId, role) => {
  const payment = await prisma.payment.findUnique({
    where: { booking_id: bookingId },
    include: {
      booking: {
        select: {
          id: true,
          guest_id: true,
          status: true,
          total_amount: true,
          check_in: true,
          check_out: true,
          property: { select: { title: true, host_id: true } },
          room: { select: { name: true, room_type: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(404, 'Payment not found for this booking');
  }

  // Auth check
  if (
    role !== 'admin' &&
    payment.booking.guest_id !== userId &&
    payment.booking.property.host_id !== userId
  ) {
    throw new ApiError(403, 'You are not authorized to view this payment');
  }

  return {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    net_amount: payment.net_amount,
    status: payment.status,
    method: payment.method,
    gateway_order_id: payment.gateway_order_id,
    gateway_payment_id: payment.gateway_payment_id,
    paid_at: payment.paid_at,
    refund_id: payment.refund_id,
    refunded_at: payment.refunded_at,
    booking: payment.booking,
  };
};

// ─── RAZORPAY WEBHOOK HANDLER ──────────────────────────
export const handleWebhook = async (rawBody, signature) => {
  // 1. Verify webhook signature
  const isValid = verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event;

  // 2. Handle events
  switch (eventType) {
    case 'payment.captured': {
      const rpPayment = event.payload.payment.entity;
      const orderId = rpPayment.order_id;

      const payment = await prisma.payment.findFirst({
        where: { gateway_order_id: orderId },
      });

      if (payment && payment.status === 'pending') {
        const methodMap = {
          upi: 'upi',
          card: 'card',
          netbanking: 'netbanking',
          wallet: 'wallet',
        };

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'success',
              gateway_payment_id: rpPayment.id,
              method: methodMap[rpPayment.method] || null,
              net_amount: rpPayment.amount / 100,
              paid_at: new Date(),
            },
          });

          await tx.booking.update({
            where: { id: payment.booking_id },
            data: { status: 'confirmed' },
          });
        });
      }
      break;
    }

    case 'payment.failed': {
      const rpPayment = event.payload.payment.entity;
      const orderId = rpPayment.order_id;

      const payment = await prisma.payment.findFirst({
        where: { gateway_order_id: orderId },
      });

      if (payment && payment.status === 'pending') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });

        createInternalNotification({
          userId: (await prisma.booking.findUnique({ where: { id: payment.booking_id } })).guest_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          data: { booking_id: payment.booking_id },
        });
      }
      break;
    }

    case 'refund.processed': {
      const rpRefund = event.payload.refund.entity;
      const paymentId = rpRefund.payment_id;

      const payment = await prisma.payment.findFirst({
        where: { gateway_payment_id: paymentId },
      });

      if (payment && !payment.refund_id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refund_id: rpRefund.id,
            refunded_at: new Date(),
            net_amount: (payment.amount * 100 - rpRefund.amount) / 100,
          },
        });
      }
      break;
    }

    default:
      // Unhandled event — log and ignore
      console.log(`[WEBHOOK] Unhandled Razorpay event: ${eventType}`);
  }

  return { received: true, event: eventType };
};
