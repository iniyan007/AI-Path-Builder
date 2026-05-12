import { AppError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

export async function protect(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new AppError("Not authenticated", 401));
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-password -refreshTokens");
    if (!user) return next(new AppError("User not found", 401));
    req.user = user;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}
