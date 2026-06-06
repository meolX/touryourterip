import { Router } from 'express';

const router = Router();

// TODO: Payment service — Razorpay integration
// POST   /create-order     → Create Razorpay order
// POST   /verify            → Verify payment signature
// POST   /refund/:id        → Initiate refund
// GET    /:bookingId        → Get payment details
// POST   /webhook           → Razorpay webhook handler

export default router;
