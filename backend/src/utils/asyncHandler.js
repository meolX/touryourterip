/**
 * Wraps an async Express route handler to catch errors
 * and forward them to the global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
