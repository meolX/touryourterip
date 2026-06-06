import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/tokens.js';
import { generateOTP, getOTPExpiry, isOTPExpired } from '../../utils/otp.js';

const SALT_ROUNDS = 12;

/**
 * Sanitize user object — strip sensitive fields before returning.
 */
const sanitizeUser = (user) => {
  const { password_hash, refreshToken, otp, otpExpiresAt, ...safeUser } = user;
  return safeUser;
};

/**
 * Generate access + refresh token pair and persist refresh token in DB.
 */
const generateTokens = async (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Persist refresh token in DB for validation on refresh
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
};

// ─── REGISTER ───────────────────────────────────────────

export const registerUser = async ({ name, email, phone, password, role }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw new ApiError(409, 'An account with this phone number already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password_hash,
      role: role || 'guest',
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── LOGIN ──────────────────────────────────────────────

export const loginUser = async ({ email, password }) => {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Your account has been deactivated. Contact support.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { updated_at: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── REFRESH TOKEN ──────────────────────────────────────

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find user and verify stored refresh token matches
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is invalid or has been revoked');
  }

  // Rotate: generate new token pair
  const { accessToken, refreshToken } = await generateTokens(user);

  return { accessToken, refreshToken };
};

// ─── LOGOUT ─────────────────────────────────────────────

export const logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

// ─── FORGOT PASSWORD (OTP) ─────────────────────────────

export const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Don't reveal whether email exists — return success either way
    return { message: 'If an account with that email exists, an OTP has been sent.' };
  }

  const otp = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otpExpiresAt },
  });

  // TODO: Send OTP via email (SendGrid) or SMS (Twilio)
  // For now, log to console in development
  console.log(`\n🔑 [DEV] OTP for ${email}: ${otp}\n`);

  return { message: 'If an account with that email exists, an OTP has been sent.' };
};

// ─── RESET PASSWORD ────────────────────────────────────

export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(400, 'Invalid email or OTP');
  }

  if (!user.otp || user.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  if (isOTPExpired(user.otpExpiresAt)) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      otp: null,
      otpExpiresAt: null,
      refreshToken: null, // Force re-login after password reset
    },
  });

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

// ─── CHANGE PASSWORD ───────────────────────────────────

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });

  return { message: 'Password changed successfully' };
};

// ─── GET CURRENT USER ──────────────────────────────────

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
};
