import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import {
  uploadResumeMiddleware,
  uploadResume,
  getUserResumes,
  getResumeById,
  deleteResume,
  downloadResume,
  getResumeAsHTML,
  getExtractedData,
  adjustResumeForJobEndpoint
} from "./resume.controller";

const router = Router();

router.post("/upload", requireAuth, uploadResumeMiddleware, uploadResume);
router.get("/", requireAuth, getUserResumes);
router.get("/:id/download", requireAuth, downloadResume);
router.get("/:id/preview", requireAuth, getResumeAsHTML);
router.get("/:id/extracted", requireAuth, getExtractedData);
router.post("/:id/adjust-for-job", requireAuth, adjustResumeForJobEndpoint);
router.get("/:id", requireAuth, getResumeById);
router.delete("/:id", requireAuth, deleteResume);

export default router;
