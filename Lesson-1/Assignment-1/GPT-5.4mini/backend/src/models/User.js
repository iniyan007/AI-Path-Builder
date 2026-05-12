import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "manager", "member"], default: "member" },
    avatarUrl: { type: String, default: "" },
    refreshTokens: [{ type: String, select: false }],
    workspaceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }]
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
