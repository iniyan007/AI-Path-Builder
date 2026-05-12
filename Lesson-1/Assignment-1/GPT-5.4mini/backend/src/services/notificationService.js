import Notification from "../models/Notification.js";

export async function createNotification({ user, workspace, title, message, type = "task" }) {
  return Notification.create({ user, workspace, title, message, type });
}
