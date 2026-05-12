import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "manager", "member"], default: "member" }
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [workspaceMemberSchema],
    inviteCode: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);
