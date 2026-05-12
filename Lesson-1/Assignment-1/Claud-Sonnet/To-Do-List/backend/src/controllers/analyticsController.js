const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../utils/helpers');

const getOverview = asyncHandler(async (req, res) => {
  const { workspace } = req.query;
  if (!workspace) return res.status(400).json({ success: false, message: 'workspace required' });

  const [total, byStatus, byPriority, overdue, completedThisWeek, totalProjects] = await Promise.all([
    Task.countDocuments({ workspace, isArchived: false }),
    Task.aggregate([{ $match: { workspace: require('mongoose').Types.ObjectId.createFromHexString(workspace), isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { workspace: require('mongoose').Types.ObjectId.createFromHexString(workspace), isArchived: false } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments({ workspace, isArchived: false, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
    Task.countDocuments({ workspace, status: 'done', completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Project.countDocuments({ workspace, isArchived: false }),
  ]);

  const statusMap = { todo: 0, in_progress: 0, review: 0, done: 0 };
  byStatus.forEach((s) => { statusMap[s._id] = s.count; });
  const priorityMap = { low: 0, medium: 0, high: 0, critical: 0 };
  byPriority.forEach((p) => { priorityMap[p._id] = p.count; });

  res.status(200).json({
    success: true,
    data: {
      total, overdue, completedThisWeek, totalProjects,
      completionRate: total > 0 ? Math.round((statusMap.done / total) * 100) : 0,
      byStatus: statusMap,
      byPriority: priorityMap,
    },
  });
});

const getProductivity = asyncHandler(async (req, res) => {
  const { workspace, days = 14 } = req.query;
  if (!workspace) return res.status(400).json({ success: false, message: 'workspace required' });

  const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
  const mongoose = require('mongoose');

  const [created, completed] = await Promise.all([
    Task.aggregate([
      { $match: { workspace: mongoose.Types.ObjectId.createFromHexString(workspace), createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Task.aggregate([
      { $match: { workspace: mongoose.Types.ObjectId.createFromHexString(workspace), status: 'done', completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Build a unified date-keyed result
  const dateMap = {};
  const cursor = new Date(since);
  while (cursor <= new Date()) {
    const key = cursor.toISOString().slice(0, 10);
    dateMap[key] = { date: key, created: 0, completed: 0 };
    cursor.setDate(cursor.getDate() + 1);
  }
  created.forEach((d) => { if (dateMap[d._id]) dateMap[d._id].created = d.count; });
  completed.forEach((d) => { if (dateMap[d._id]) dateMap[d._id].completed = d.count; });

  res.status(200).json({ success: true, data: Object.values(dateMap) });
});

const getTeamStats = asyncHandler(async (req, res) => {
  const { workspace } = req.query;
  if (!workspace) return res.status(400).json({ success: false, message: 'workspace required' });
  const mongoose = require('mongoose');

  const stats = await Task.aggregate([
    { $match: { workspace: mongoose.Types.ObjectId.createFromHexString(workspace), isArchived: false } },
    { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$assignees', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { total: 1, done: 1, 'user.name': 1, 'user.avatar': 1, 'user.email': 1 } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({ success: true, data: stats });
});

module.exports = { getOverview, getProductivity, getTeamStats };
