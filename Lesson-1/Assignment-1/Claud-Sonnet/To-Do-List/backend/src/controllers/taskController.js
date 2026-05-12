const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const { asyncHandler, AppError, paginate, buildPaginationMeta } = require('../utils/helpers');

const logActivity = async (taskId, userId, action, changes = null) => {
  try {
    await Activity.create({ task: taskId, user: userId, action, ...(changes && { changes }) });
  } catch (e) {}
};

const notify = async (recipient, sender, type, title, message, data = {}) => {
  try {
    if (recipient.toString() === sender.toString()) return;
    await Notification.create({ recipient, sender, type, title, message, data });
  } catch (e) {}
};

const getTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, project, assignee, tags, search, dueDate, isArchived = 'false', sortBy = 'order', sortOrder = 'asc' } = req.query;
  if (!req.query.workspace) return res.status(400).json({ success: false, message: 'workspace query param required' });

  const filter = { workspace: req.query.workspace, isArchived: isArchived === 'true' };
  if (status) filter.status = { $in: status.split(',') };
  if (priority) filter.priority = { $in: priority.split(',') };
  if (project) filter.project = project;
  if (assignee) filter.assignees = assignee;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (dueDate === 'overdue') filter.dueDate = { $lt: new Date() };
  if (dueDate === 'today') {
    const s = new Date(); s.setHours(0,0,0,0);
    const e = new Date(); e.setHours(23,59,59,999);
    filter.dueDate = { $gte: s, $lte: e };
  }
  if (search) filter.$text = { $search: search };

  const { skip } = paginate(null, page, limit);
  const lim = parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(lim)
      .populate('createdBy', 'name avatar email')
      .populate('assignees', 'name avatar email')
      .populate('project', 'name color icon')
      .lean({ virtuals: true }),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: tasks, pagination: buildPaginationMeta(total, page, lim) });
});

const createTask = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.body.project);
  if (!project) return next(new AppError('Project not found', 404));

  const task = await Task.create({ ...req.body, workspace: project.workspace, createdBy: req.user._id });
  await task.populate([
    { path: 'createdBy', select: 'name avatar email' },
    { path: 'assignees', select: 'name avatar email' },
    { path: 'project', select: 'name color icon' },
  ]);
  await logActivity(task._id, req.user._id, 'created');

  if (task.assignees?.length) {
    task.assignees.forEach((a) => notify(a._id, req.user._id, 'task_assigned', 'New task assigned', `${req.user.name} assigned you to "${task.title}"`, { taskId: task._id }));
  }

  res.status(201).json({ success: true, data: task });
});

const getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'name avatar email')
    .populate('assignees', 'name avatar email')
    .populate('project', 'name color icon')
    .populate('comments.author', 'name avatar')
    .lean({ virtuals: true });
  if (!task) return next(new AppError('Task not found', 404));
  res.status(200).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));

  const oldStatus = task.status;
  Object.assign(task, req.body);
  await task.save();
  await task.populate([{ path: 'createdBy', select: 'name avatar email' }, { path: 'assignees', select: 'name avatar email' }, { path: 'project', select: 'name color icon' }]);

  if (oldStatus !== task.status) {
    await logActivity(task._id, req.user._id, 'status_changed', { field: 'status', from: oldStatus, to: task.status });
  } else {
    await logActivity(task._id, req.user._id, 'updated');
  }

  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  task.isArchived = true;
  await task.save();
  await logActivity(task._id, req.user._id, 'archived');
  res.status(200).json({ success: true, message: 'Task archived' });
});

const permanentDeleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  res.status(200).json({ success: true, message: 'Task permanently deleted' });
});

const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.id,
    { status, ...(status === 'done' ? { completedAt: new Date() } : { completedAt: null }) },
    { new: true, runValidators: true }
  ).populate('assignees createdBy', 'name avatar email');
  if (!task) return next(new AppError('Task not found', 404));
  await logActivity(task._id, req.user._id, 'status_changed', { field: 'status', to: status });
  res.status(200).json({ success: true, data: task });
});

const addSubtask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  task.subtasks.push({ ...req.body, order: task.subtasks.length });
  await task.save();
  await logActivity(task._id, req.user._id, 'subtask_added');
  res.status(201).json({ success: true, data: task.subtasks[task.subtasks.length - 1] });
});

const updateSubtask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) return next(new AppError('Subtask not found', 404));
  if (req.body.isCompleted && !subtask.isCompleted) subtask.completedAt = new Date();
  Object.assign(subtask, req.body);
  await task.save();
  res.status(200).json({ success: true, data: subtask });
});

const deleteSubtask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  task.subtasks.id(req.params.subtaskId).deleteOne();
  await task.save();
  res.status(200).json({ success: true, message: 'Subtask removed' });
});

const addComment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  task.comments.push({ ...req.body, author: req.user._id });
  await task.save();
  await task.populate('comments.author', 'name avatar email');
  await logActivity(task._id, req.user._id, 'commented');
  res.status(201).json({ success: true, data: task.comments[task.comments.length - 1] });
});

const deleteComment = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));
  const comment = task.comments.id(req.params.commentId);
  if (!comment) return next(new AppError('Comment not found', 404));
  if (comment.author.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  comment.deleteOne();
  await task.save();
  res.status(200).json({ success: true, message: 'Comment deleted' });
});

const getTaskActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ task: req.params.id })
    .populate('user', 'name avatar').sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, data: activities });
});

const reorderTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  const bulkOps = tasks.map(({ id, order, status }) => ({
    updateOne: { filter: { _id: id }, update: { order, ...(status && { status }) } },
  }));
  await Task.bulkWrite(bulkOps);
  res.status(200).json({ success: true, message: 'Tasks reordered' });
});

module.exports = {
  getTasks, createTask, getTask, updateTask, deleteTask, permanentDeleteTask,
  updateTaskStatus, addSubtask, updateSubtask, deleteSubtask,
  addComment, deleteComment, getTaskActivity, reorderTasks,
};
