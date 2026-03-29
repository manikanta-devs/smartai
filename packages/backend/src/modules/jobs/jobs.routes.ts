import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { getJobs, searchJobs, getJobById, seedJobs, applyToJob, getUserApplications } from "./jobs.controller";

const router = Router();

router.get("/seed", seedJobs);
router.get("/user/applications", requireAuth, getUserApplications);
router.get("/search/:role", searchJobs);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/:jobId/apply", requireAuth, applyToJob);

export default router;
