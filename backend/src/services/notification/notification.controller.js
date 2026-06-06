import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as notificationService from './notification.service.js';

// ─── GET USER NOTIFICATIONS ────────────────────────────
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await notificationService.getUserNotifications(userId, req.query);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
});

// ─── GET UNREAD COUNT ──────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await notificationService.getUnreadCount(userId);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Unread count retrieved'));
});

// ─── MARK AS READ (single) ────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const result = await notificationService.markAsRead(id, userId);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Notification marked as read'));
});

// ─── MARK ALL AS READ ──────────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await notificationService.markAllAsRead(userId);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'All notifications marked as read'));
});

// ─── DELETE NOTIFICATION ───────────────────────────────
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const result = await notificationService.deleteNotification(id, userId, role);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Notification deleted successfully'));
});

// ─── CLEAR ALL NOTIFICATIONS ───────────────────────────
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const result = await notificationService.clearAllNotifications(userId);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'All notifications cleared'));
});

// ─── SEND NOTIFICATION (admin) ─────────────────────────
export const sendNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.sendNotification(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, notification, 'Notification sent successfully'));
});

// ─── BROADCAST (admin) ─────────────────────────────────
export const broadcastNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.broadcastNotification(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, result, `Notification broadcast to ${result.sent} user(s)`));
});
