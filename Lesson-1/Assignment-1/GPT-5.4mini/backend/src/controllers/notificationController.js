import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort("-createdAt").limit(50);
  res.json({ success: true, data: notifications });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new AppError("Notification not found", 404);
  notification.readAt = new Date();
  await notification.save();
  res.json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ success: true });
});
