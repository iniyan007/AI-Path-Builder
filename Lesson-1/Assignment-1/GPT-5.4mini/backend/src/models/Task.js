import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["todo", "in-progress", "review", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    dueDate: { type: Date, default: null },
    tags: [{ type: String, trim: true }],
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    activity: [activitySchema],
    archivedAt: { type: Date, default: null },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
