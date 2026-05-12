import { Router } from "express";
import { addComment, addSubtask, createTask, deleteTask, getActivity, listTasks, reorderTasks, updateStatus, updateTask } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { taskSchemas } from "../validations/schemas.js";

const router = Router();

router.use(protect);
router.get("/", validate(taskSchemas.list), listTasks);
router.post("/", validate(taskSchemas.upsert), createTask);
router.put("/reorder", reorderTasks);
router.put("/:id/status", validate(taskSchemas.id), updateStatus);
router.post("/:id/subtasks", validate(taskSchemas.id), addSubtask);
router.post("/:id/comments", validate(taskSchemas.id), addComment);
router.get("/:id/activity", validate(taskSchemas.id), getActivity);
router.put("/:id", validate(taskSchemas.id), updateTask);
router.delete("/:id", validate(taskSchemas.id), deleteTask);

export default router;
