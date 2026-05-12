import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
    type: { type: String, enum: ["task", "project", "workspace", "system"], default: "task" }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
