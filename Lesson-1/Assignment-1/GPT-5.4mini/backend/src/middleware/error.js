import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export function notFound(_req, _res, next) {
  next(new AppError("Route not found", 404));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  logger.error(err);
  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    details: err.details || null
  });
}
