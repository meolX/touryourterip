import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory to restrict access to specific roles.
 * Usage: authorize('admin', 'host')
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required role(s): ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

export default authorize;
