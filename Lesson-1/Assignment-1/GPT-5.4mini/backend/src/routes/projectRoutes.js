import { Router } from "express";
import { createProject, deleteProject, listProjects, updateProject } from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { projectSchemas } from "../validations/schemas.js";

const router = Router();

router.use(protect);
router.get("/", listProjects);
router.post("/", validate(projectSchemas.upsert), createProject);
router.put("/:id", validate(projectSchemas.id), updateProject);
router.delete("/:id", validate(projectSchemas.id), deleteProject);

export default router;
