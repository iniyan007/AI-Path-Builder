import { Router } from "express";
import { listNotifications, markAllRead, markRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/", listNotifications);
router.put("/mark-all-read", markAllRead);
router.put("/:id/read", markRead);

export default router;
