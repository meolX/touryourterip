import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory for Zod schema validation.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Request property to validate (default: 'body')
 *
 * Usage:
 *   validate(registerSchema)            → validates req.body
 *   validate(searchSchema, 'query')     → validates req.query
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ApiError(400, 'Validation failed', errors);
  }

  req[source] = result.data;
  next();
};

export default validate;
