import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { getProfile, updateProfile, getUserStats } from "./users.controller";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/stats", requireAuth, getUserStats);

export default router;
