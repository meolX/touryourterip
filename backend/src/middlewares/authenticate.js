import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to verify JWT access token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Access token is missing');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token has expired');
    }
    throw new ApiError(401, 'Invalid access token');
  }
});

export default authenticate;
