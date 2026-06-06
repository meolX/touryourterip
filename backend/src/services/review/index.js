import { Router } from 'express';

const router = Router();

// TODO: Review service — Ratings + Moderation
// POST   /              → Create review (guest, post-checkout)
// GET    /property/:id  → List reviews for a property
// GET    /:id           → Get review details
// DELETE /:id           → Delete review (admin moderation)

export default router;
