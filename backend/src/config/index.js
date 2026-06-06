import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'tyt_access_secret_change_me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'tyt_refresh_secret_change_me',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  // Cookies
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // OTP
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_AUTH: 10,
  RATE_LIMIT_MAX_API: 100,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Media
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5 MB

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Elasticsearch
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
  ELASTICSEARCH_INDEX_PREFIX: process.env.ELASTICSEARCH_INDEX_PREFIX || 'tyt',

  // Google Maps (Geocoding)
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,

  // SendGrid Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'no-reply@touryourtrip.com',

  // Twilio SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Firebase Admin
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
};

export default config;