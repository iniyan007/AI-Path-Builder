import { Router } from "express";
import { overview, productivity } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.get("/overview", overview);
router.get("/productivity", productivity);

export default router;
