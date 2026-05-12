const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit hit: ${req.ip} on ${req.path}`);
      res.status(options.statusCode).json(options.message);
    },
  });

// General API limiter
const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  200,
  'Too many requests. Please try again after 15 minutes.'
);

// Auth limiter (stricter)
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts. Please try again after 15 minutes.'
);

// Password reset limiter
const passwordLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many password reset attempts. Please try again after an hour.'
);

module.exports = { apiLimiter, authLimiter, passwordLimiter };
