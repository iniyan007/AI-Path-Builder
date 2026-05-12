import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#38bdf8" },
    description: { type: String, default: "" },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
