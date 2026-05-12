import { Router } from "express";
import { createWorkspace, deleteWorkspace, inviteMember, listWorkspaces, members, updateWorkspace } from "../controllers/workspaceController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { workspaceSchemas } from "../validations/schemas.js";

const router = Router();

router.use(protect);
router.get("/", listWorkspaces);
router.post("/", validate(workspaceSchemas.upsert), createWorkspace);
router.put("/:id", validate(workspaceSchemas.id), updateWorkspace);
router.delete("/:id", validate(workspaceSchemas.id), deleteWorkspace);
router.post("/:id/invite", validate(workspaceSchemas.id), inviteMember);
router.get("/:id/members", validate(workspaceSchemas.id), members);

export default router;
