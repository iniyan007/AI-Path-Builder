const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const { asyncHandler, AppError, paginate, buildPaginationMeta } = require('../utils/helpers');

const getProjects = asyncHandler(async (req, res) => {
  const { workspace, page = 1, limit = 20, isArchived = 'false' } = req.query;
  if (!workspace) return res.status(400).json({ success: false, message: 'workspace query param required' });
  const { skip } = paginate(null, page, limit);
  const filter = { workspace, isArchived: isArchived === 'true' };
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
      .populate('owner', 'name avatar email').populate('members.user', 'name avatar email').populate('taskCount'),
    Project.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, data: projects, pagination: buildPaginationMeta(total, page, limit) });
});

const createProject = asyncHandler(async (req, res, next) => {
  const ws = await Workspace.findById(req.body.workspace);
  if (!ws) return next(new AppError('Workspace not found', 404));
  const isMember = ws.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) return next(new AppError('Not a workspace member', 403));

  const project = await Project.create({ ...req.body, owner: req.user._id });
  await project.populate('owner', 'name avatar email');
  res.status(201).json({ success: true, data: project });
});

const getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name avatar email').populate('members.user', 'name avatar email');
  if (!project) return next(new AppError('Project not found', 404));
  res.status(200).json({ success: true, data: project });
});

const updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  if (project.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  const allowed = ['name', 'description', 'color', 'icon', 'status', 'priority', 'startDate', 'dueDate'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) project[f] = req.body[f]; });
  await project.save();
  res.status(200).json({ success: true, data: project });
});

const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  if (project.owner.toString() !== req.user._id.toString()) return next(new AppError('Not authorized', 403));
  project.isArchived = true;
  await project.save();
  res.status(200).json({ success: true, message: 'Project archived' });
});

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };
