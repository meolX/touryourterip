import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { apiLimiter } from './src/middlewares/rateLimiter.js';
import errorHandler from './src/middlewares/errorHandler.js';
import config from './src/config/index.js';

// ─── Service route imports ─────────────────────────────
import authRoutes from './src/services/user/auth.routes.js';
import propertyRoutes from './src/services/property/property.routes.js';
import bookingRoutes from './src/services/booking/booking.routes.js';
import searchRoutes from './src/services/search/search.routes.js';
import reviewRoutes from './src/services/review/review.routes.js';
import mediaRoutes from './src/services/media/media.routes.js';
import notificationRoutes from './src/services/notification/notification.routes.js';
import paymentRoutes from './src/services/payment/payment.routes.js';

dotenv.config();

const app = express();

// ─── Global Middleware ──────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(apiLimiter);

// ─── Health Check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TourYourTrip API',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes (v1) ───────────────────────────────────
// User service — Auth
app.use('/api/v1/auth', authRoutes);

// Property service
app.use('/api/v1/properties', propertyRoutes);

// Booking service
app.use('/api/v1/bookings', bookingRoutes);

// Search service
app.use('/api/v1/search', searchRoutes);

// Review service
app.use('/api/v1/reviews', reviewRoutes);

// Media service
app.use('/api/v1/media', mediaRoutes);

// Notification service
app.use('/api/v1/notifications', notificationRoutes);

// Payment service
app.use('/api/v1/payments', paymentRoutes);

// ─── 404 Handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────
app.use(errorHandler);

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`\n🚀 TourYourTrip API Server`);
  console.log(`   Environment : ${config.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/health`);
  console.log(`   Auth API    : http://localhost:${PORT}/api/v1/auth\n`);
});

export default app;