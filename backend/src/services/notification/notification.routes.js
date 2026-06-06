import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorize from '../../middlewares/authorize.js';
import validate from '../../middlewares/validate.js';
import {
  sendNotificationSchema,
  broadcastSchema,
} from './notification.validator.js';

const router = Router();

// ─── All notification routes require authentication ─────
router.use(authenticate);

// ─── User routes ────────────────────────────────────────

// GET  /api/v1/notifications             → List my notifications
router.get('/', notificationController.getUserNotifications);

// GET  /api/v1/notifications/unread      → Get unread count
router.get('/unread', notificationController.getUnreadCount);

// PATCH /api/v1/notifications/read-all   → Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// DELETE /api/v1/notifications/clear-all → Clear all notifications
router.delete('/clear-all', notificationController.clearAllNotifications);

// PATCH /api/v1/notifications/:id/read   → Mark single as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/v1/notifications/:id       → Delete single notification
router.delete('/:id', notificationController.deleteNotification);

// ─── Admin-only routes ──────────────────────────────────

// POST /api/v1/notifications/send        → Send to specific user
router.post(
  '/send',
  authorize('admin'),
  validate(sendNotificationSchema),
  notificationController.sendNotification
);

// POST /api/v1/notifications/broadcast   → Broadcast to role group
router.post(
  '/broadcast',
  authorize('admin'),
  validate(broadcastSchema),
  notificationController.broadcastNotification
);

export default router;
