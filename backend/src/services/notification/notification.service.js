import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';

// ─── SEND NOTIFICATION (single user) ───────────────────
export const sendNotification = async (data) => {
  const { user_id, type, channel, title, message, data: payload } = data;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: { id: true, is_active: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.is_active) {
    throw new ApiError(400, 'Cannot send notification to inactive user');
  }

  const notification = await prisma.notification.create({
    data: {
      user_id,
      type: type || 'general',
      channel: channel || 'in_app',
      title,
      message,
      data: payload || null,
    },
    select: {
      id: true,
      type: true,
      channel: true,
      title: true,
      message: true,
      data: true,
      is_read: true,
      created_at: true,
    },
  });

  return notification;
};

// ─── SEND INTERNAL NOTIFICATION (called by other services) ─
// Lightweight wrapper — no user existence check for performance.
// Use when the caller already knows the user_id is valid.
export const createInternalNotification = async ({
  userId,
  type = 'general',
  channel = 'in_app',
  title,
  message,
  data = null,
}) => {
  try {
    return await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        channel,
        title,
        message,
        data,
      },
    });
  } catch (err) {
    // Silently log — internal notifications should never break the caller
    console.error(`[NOTIFICATION] Failed to create notification for user ${userId}:`, err.message);
    return null;
  }
};

// ─── BROADCAST (send to all users or a role group) ─────
export const broadcastNotification = async (data) => {
  const { type, channel, title, message, role, data: payload } = data;

  // Build user filter
  const userWhere = { is_active: true };
  if (role) {
    userWhere.role = role;
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });

  if (users.length === 0) {
    throw new ApiError(404, 'No active users found matching the criteria');
  }

  // Batch create notifications
  const notificationData = users.map((user) => ({
    user_id: user.id,
    type: type || 'general',
    channel: channel || 'in_app',
    title,
    message,
    data: payload || null,
  }));

  const result = await prisma.notification.createMany({
    data: notificationData,
  });

  return {
    sent: result.count,
    role: role || 'all',
  };
};

// ─── GET USER NOTIFICATIONS ────────────────────────────
export const getUserNotifications = async (userId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  // Filter options
  const where = { user_id: userId };

  if (query.is_read === 'true') {
    where.is_read = true;
  } else if (query.is_read === 'false') {
    where.is_read = false;
  }

  if (query.type) {
    where.type = query.type;
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        message: true,
        data: true,
        is_read: true,
        read_at: true,
        created_at: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { user_id: userId, is_read: false },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    unread_count: unreadCount,
    notifications,
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

// ─── MARK AS READ (single) ────────────────────────────
export const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.user_id !== userId) {
    throw new ApiError(403, 'You can only manage your own notifications');
  }

  if (notification.is_read) {
    return notification; // Already read, return as-is
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      is_read: true,
      read_at: new Date(),
    },
    select: {
      id: true,
      is_read: true,
      read_at: true,
    },
  });
};

// ─── MARK ALL AS READ ──────────────────────────────────
export const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return { marked_read: result.count };
};

// ─── DELETE NOTIFICATION ───────────────────────────────
export const deleteNotification = async (notificationId, userId, role) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (role !== 'admin' && notification.user_id !== userId) {
    throw new ApiError(403, 'You can only delete your own notifications');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return { deleted: true, id: notificationId };
};

// ─── CLEAR ALL NOTIFICATIONS ───────────────────────────
export const clearAllNotifications = async (userId) => {
  const result = await prisma.notification.deleteMany({
    where: { user_id: userId },
  });

  return { deleted: result.count };
};

// ─── GET UNREAD COUNT ──────────────────────────────────
export const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });

  return { unread_count: count };
};
