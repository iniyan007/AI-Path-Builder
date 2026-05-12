import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }]
  }).sort("-createdAt");
  res.json({ success: true, data: workspaces });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.create({
    name: req.body.name,
    description: req.body.description || "",
    owner: req.user._id,
    inviteCode: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    members: [{ user: req.user._id, role: "admin" }]
  });
  req.user.workspaceIds.push(workspace._id);
  await req.user.save();
  res.status(201).json({ success: true, data: workspace });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Forbidden", 403);
  workspace.name = req.body.name ?? workspace.name;
  workspace.description = req.body.description ?? workspace.description;
  await workspace.save();
  res.json({ success: true, data: workspace });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Forbidden", 403);
  await workspace.deleteOne();
  res.json({ success: true });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Forbidden", 403);
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError("User not found", 404);
  const exists = workspace.members.some((member) => member.user.toString() === user._id.toString());
  if (!exists) {
    workspace.members.push({ user: user._id, role: req.body.role || "member" });
    user.workspaceIds.push(workspace._id);
    await Promise.all([workspace.save(), user.save()]);
  }
  res.json({ success: true, data: workspace });
});

export const members = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id).populate("members.user", "name email avatarUrl role");
  if (!workspace) throw new AppError("Workspace not found", 404);
  res.json({ success: true, data: workspace.members });
});
