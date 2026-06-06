import { Router } from 'express';

const router = Router();

// TODO: Notification service — Email (SendGrid) + SMS (Twilio) + Push (FCM)
// GET  /              → List user notifications
// PATCH /:id/read     → Mark notification as read
// POST /send          → Send notification (admin)

export default router;
