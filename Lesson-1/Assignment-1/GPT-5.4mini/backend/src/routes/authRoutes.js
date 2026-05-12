import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authSchemas } from "../validations/schemas.js";

const router = Router();

router.post("/register", validate(authSchemas.register), register);
router.post("/login", validate(authSchemas.login), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", protect, me);

export default router;
