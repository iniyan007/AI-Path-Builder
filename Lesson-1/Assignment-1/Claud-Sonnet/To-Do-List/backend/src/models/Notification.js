const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_completed',
        'task_due_soon',
        'task_overdue',
        'comment_added',
        'mentioned',
        'workspace_invite',
        'project_added',
        'task_status_changed',
        'subtask_completed',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
      link: String,
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
