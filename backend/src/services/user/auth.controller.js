import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import config from '../../config/index.js';
import * as authService from './auth.service.js';

// ─── Cookie options for refresh token ───────────────────
const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: config.COOKIE_MAX_AGE,
  path: '/',
};

// ─── REGISTER ───────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);

  res
    .status(201)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(201, { user, accessToken }, 'User registered successfully'));
});

// ─── LOGIN ──────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  res
    .status(200)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user, accessToken }, 'Login successful'));
});

// ─── REFRESH TOKEN ──────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  // Try cookie first, then body
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(incomingToken);

  res
    .status(200)
    .cookie('refreshToken', newRefreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, 'Token refreshed successfully'));
});

// ─── LOGOUT ─────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.userId);

  res
    .status(200)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

// ─── FORGOT PASSWORD ───────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── RESET PASSWORD ────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── CHANGE PASSWORD ───────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.userId, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── GET CURRENT USER ──────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  res
    .status(200)
    .json(new ApiResponse(200, { user }, 'User profile retrieved'));
});
