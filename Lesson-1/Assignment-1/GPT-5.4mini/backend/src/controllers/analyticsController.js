import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const overview = asyncHandler(async (req, res) => {
  const workspaceId = req.query.workspaceId;
  const base = workspaceId ? { workspace: workspaceId, archivedAt: null } : { archivedAt: null };
  const [todo, inProgress, review, done, total] = await Promise.all([
    Task.countDocuments({ ...base, status: "todo" }),
    Task.countDocuments({ ...base, status: "in-progress" }),
    Task.countDocuments({ ...base, status: "review" }),
    Task.countDocuments({ ...base, status: "done" }),
    Task.countDocuments(base)
  ]);
  res.json({ success: true, data: { todo, inProgress, review, done, total } });
});

export const productivity = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await Task.find({ updatedAt: { $gte: since }, archivedAt: null }).sort("updatedAt");
  res.json({
    success: true,
    data: items.map((task) => ({
      day: task.updatedAt.toISOString().slice(0, 10),
      status: task.status,
      title: task.title
    }))
  });
});
