import { Router } from 'express';

const router = Router();

// TODO: Booking service — Reserve + Availability
// POST   /                  → Create booking
// GET    /                  → List bookings (guest/host)
// GET    /:id               → Get booking details
// PATCH  /:id/cancel        → Cancel booking
// PATCH  /:id/status        → Update booking status (host)
// GET    /availability/:roomId → Check room availability

export default router;
