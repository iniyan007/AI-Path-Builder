const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'status_changed',
        'priority_changed',
        'assigned',
        'unassigned',
        'commented',
        'subtask_added',
        'subtask_completed',
        'attachment_added',
        'due_date_changed',
        'archived',
        'restored',
        'deleted',
      ],
      required: true,
    },
    changes: {
      field: String,
      from: mongoose.Schema.Types.Mixed,
      to: mongoose.Schema.Types.Mixed,
    },
    meta: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

activitySchema.index({ task: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
