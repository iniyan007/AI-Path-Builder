const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    invitations: [
      {
        email: String,
        role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
        token: String,
        expiresAt: Date,
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '🏢',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    settings: {
      allowMemberInvite: { type: Boolean, default: false },
      defaultTaskPriority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
