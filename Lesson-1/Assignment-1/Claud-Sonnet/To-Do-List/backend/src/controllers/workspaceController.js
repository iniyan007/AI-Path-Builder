const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/helpers');
const { sendWorkspaceInviteEmail } = require('../utils/email');
const { generateRandomToken } = require('../utils/tokens');
const crypto = require('crypto');

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({ 'members.user': req.user._id })
    .populate('owner', 'name avatar email')
    .populate('members.user', 'name avatar email')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: workspaces });
});

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.create({
    ...req.body,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });
  await workspace.populate('owner', 'name avatar email');
  res.status(201).json({ success: true, data: workspace });
});

const getWorkspace = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.id)
    .populate('owner', 'name avatar email')
    .populate('members.user', 'name avatar email');
  if (!workspace) return next(new AppError('Workspace not found', 404));
  const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
  if (!isMember) return next(new AppError('Not authorized', 403));
  res.status(200).json({ success: true, data: workspace });
});

const updateWorkspace = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) return next(new AppError('Workspace not found', 404));
  if (workspace.owner.toString() !== req.user._id.toString()) return next(new AppError('Only the owner can update', 403));
  const allowed = ['name', 'description', 'color', 'icon', 'settings'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) workspace[f] = req.body[f]; });
  await workspace.save();
  res.status(200).json({ success: true, data: workspace });
});

const deleteWorkspace = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) return next(new AppError('Workspace not found', 404));
  if (workspace.owner.toString() !== req.user._id.toString()) return next(new AppError('Only the owner can delete', 403));
  if (workspace.isDefault) return next(new AppError('Cannot delete default workspace', 400));
  await workspace.deleteOne();
  res.status(200).json({ success: true, message: 'Workspace deleted' });
});

const inviteMember = asyncHandler(async (req, res, next) => {
  const { email, role = 'member' } = req.body;
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  const inviterMember = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!inviterMember || !['admin', 'manager'].includes(inviterMember.role)) {
    return next(new AppError('Not authorized to invite members', 403));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const alreadyMember = workspace.members.some((m) => m.user.toString() === existingUser._id.toString());
    if (alreadyMember) return next(new AppError('User is already a member', 409));
  }

  const token = generateRandomToken();
  workspace.invitations.push({ email, role, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), invitedBy: req.user._id });
  await workspace.save();

  const inviteUrl = `${process.env.CLIENT_URL}/invite/${token}`;
  await sendWorkspaceInviteEmail(email, req.user, workspace, inviteUrl).catch(() => {});

  res.status(200).json({ success: true, message: `Invitation sent to ${email}` });
});

const acceptInvite = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const workspace = await Workspace.findOne({ 'invitations.token': token });
  if (!workspace) return next(new AppError('Invalid or expired invitation', 400));

  const invitation = workspace.invitations.find((i) => i.token === token);
  if (!invitation || invitation.expiresAt < new Date()) return next(new AppError('Invitation expired', 400));
  if (invitation.email !== req.user.email) return next(new AppError('This invitation is for a different email', 403));

  workspace.members.push({ user: req.user._id, role: invitation.role });
  workspace.invitations = workspace.invitations.filter((i) => i.token !== token);
  await workspace.save();

  res.status(200).json({ success: true, message: 'Joined workspace successfully', data: workspace });
});

const removeMember = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) return next(new AppError('Workspace not found', 404));
  if (workspace.owner.toString() !== req.user._id.toString()) return next(new AppError('Only owner can remove members', 403));
  workspace.members = workspace.members.filter((m) => m.user.toString() !== req.params.userId);
  await workspace.save();
  res.status(200).json({ success: true, message: 'Member removed' });
});

const updateMemberRole = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) return next(new AppError('Workspace not found', 404));
  if (workspace.owner.toString() !== req.user._id.toString()) return next(new AppError('Only owner can change roles', 403));
  const member = workspace.members.find((m) => m.user.toString() === req.params.userId);
  if (!member) return next(new AppError('Member not found', 404));
  member.role = req.body.role;
  await workspace.save();
  res.status(200).json({ success: true, data: workspace });
});

module.exports = { getWorkspaces, createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace, inviteMember, acceptInvite, removeMember, updateMemberRole };
