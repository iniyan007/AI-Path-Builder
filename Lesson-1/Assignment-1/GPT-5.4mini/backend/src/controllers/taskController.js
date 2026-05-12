import Task from "../models/Task.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addActivity } from "../services/taskService.js";

function buildFilters(query) {
  const filters = { archivedAt: null };
  if (query.workspaceId) filters.workspace = query.workspaceId;
  if (query.projectId) filters.project = query.projectId;
  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.search) filters.$or = [
    { title: { $regex: query.search, $options: "i" } },
    { description: { $regex: query.search, $options: "i" } },
    { tags: { $in: [new RegExp(query.search, "i")] } }
  ];
  return filters;
}

export const listTasks = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const filters = buildFilters(req.query);
  const [items, total] = await Promise.all([
    Task.find(filters).sort("-createdAt").skip((page - 1) * limit).limit(limit).populate("assignee createdBy project workspace", "name email color"),
    Task.countDocuments(filters)
  ]);
  res.json({
    success: true,
    data: items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ...req.body,
    dueDate: req.body.dueDate || null,
    subtasks: req.body.subtasks || [],
    createdBy: req.user._id,
    activity: [{ actor: req.user._id, action: "created", meta: { title: req.body.title } }]
  });
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  const before = task.toObject();
  Object.assign(task, {
    title: req.body.title ?? task.title,
    description: req.body.description ?? task.description,
    status: req.body.status ?? task.status,
    priority: req.body.priority ?? task.priority,
    dueDate: req.body.dueDate ?? task.dueDate,
    project: req.body.projectId ?? req.body.project ?? task.project,
    assignee: req.body.assigneeId ?? req.body.assignee ?? task.assignee,
    tags: req.body.tags ?? task.tags,
    subtasks: req.body.subtasks ?? task.subtasks
  });
  task.activity.unshift({
    actor: req.user._id,
    action: "updated",
    meta: { beforeStatus: before.status, afterStatus: task.status }
  });
  await task.save();
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  task.archivedAt = new Date();
  task.activity.unshift({ actor: req.user._id, action: "archived" });
  await task.save();
  res.json({ success: true });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  task.status = req.body.status;
  task.activity.unshift({ actor: req.user._id, action: "status-changed", meta: { status: req.body.status } });
  await task.save();
  res.json({ success: true, data: task });
});

export const addSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  task.subtasks.push({ title: req.body.title, completed: false });
  task.activity.unshift({ actor: req.user._id, action: "subtask-added", meta: { title: req.body.title } });
  await task.save();
  res.status(201).json({ success: true, data: task });
});

export const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task not found", 404);
  task.comments.push({ author: req.user._id, text: req.body.text });
  task.activity.unshift({ actor: req.user._id, action: "comment-added" });
  await task.save();
  res.status(201).json({ success: true, data: task });
});

export const getActivity = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("activity.actor", "name email avatarUrl");
  if (!task) throw new AppError("Task not found", 404);
  res.json({ success: true, data: task.activity });
});

export const reorderTasks = asyncHandler(async (req, res) => {
  const updates = req.body.items || [];
  await Promise.all(updates.map(({ id, position }) => Task.findByIdAndUpdate(id, { position })));
  res.json({ success: true });
});
