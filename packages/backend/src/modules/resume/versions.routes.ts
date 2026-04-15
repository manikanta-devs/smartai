/**
 * Resume Version Control Routes
 * Version management like Git for resumes
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/errors";
import { createSuccessResponse, createErrorResponse } from "../../common/schemas";
import {
  saveResumeVersion,
  getResumeVersions,
  restoreResumeVersion,
  compareVersions,
  getBestVersion,
  deleteVersion,
} from "../../services/resumeVersionControl.service";

const router = Router();

/**
 * POST /api/resumes/:resumeId/versions
 * Save a new resume version
 */
router.post(
  "/:resumeId/versions",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { versionName, content, atsScore = 0, overallScore = 0 } = req.body;

    if (!versionName || !content) {
      return res.status(400).json(
        createErrorResponse("Version name and content are required")
      );
    }

    const version = await saveResumeVersion(
      req.params.resumeId,
      req.user!.userId,
      versionName,
      content,
      atsScore,
      overallScore
    );

    return res.json(
      createSuccessResponse({
        version,
        message: "Resume version saved successfully",
      })
    );
  })
);

/**
 * GET /api/resumes/:resumeId/versions
 * List all versions for a resume
 */
router.get(
  "/:resumeId/versions",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const versions = await getResumeVersions(req.params.resumeId);

    // Find best version
    const best = await getBestVersion(req.params.resumeId);

    return res.json(
      createSuccessResponse({
        versions,
        bestVersion: best
          ? {
              id: best.id,
              name: best.versionName,
              score: best.overallScore,
            }
          : null,
        total: versions.length,
      })
    );
  })
);

/**
 * POST /api/resumes/:resumeId/versions/:versionId/restore
 * Restore a specific version
 */
router.post(
  "/:resumeId/versions/:versionId/restore",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const restored = await restoreResumeVersion(
      req.params.versionId,
      req.user!.userId
    );

    return res.json(
      createSuccessResponse({
        restored,
        message: `Version "${restored.versionName}" restored successfully`,
      })
    );
  })
);

/**
 * GET /api/resumes/:resumeId/versions/compare
 * Compare two versions side-by-side
 * Query: ?v1=id1&v2=id2
 */
router.get(
  "/:resumeId/versions/compare",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { v1, v2 } = req.query;

    if (!v1 || !v2) {
      return res.status(400).json(
        createErrorResponse("Both version IDs required (v1 and v2)")
      );
    }

    const comparison = await compareVersions(v1 as string, v2 as string);

    return res.json(createSuccessResponse(comparison));
  })
);

/**
 * DELETE /api/resumes/:resumeId/versions/:versionId
 * Delete a version
 */
router.delete(
  "/:resumeId/versions/:versionId",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await deleteVersion(req.params.versionId, req.user!.userId);

    return res.json(
      createSuccessResponse({
        deleted: true,
      })
    );
  })
);

export default router;
