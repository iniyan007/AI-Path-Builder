import Project from "../models/Project.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    workspace: req.query.workspaceId,
    archivedAt: null
  }).sort("-createdAt");
  res.json({ success: true, data: projects });
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);
  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project not found", 404);
  Object.assign(project, req.body);
  await project.save();
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project not found", 404);
  project.archivedAt = new Date();
  await project.save();
  res.json({ success: true });
});
