import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { HttpError } from "../../common/middleware/error.middleware";
import { asyncHandler, NotFoundError, ForbiddenError } from "../../common/utils/errors";
import { createSuccessResponse } from "../../common/schemas";
import { getAutomationReportHistory, getLatestAutomationReport, runAutomationForUser } from "../../services/automation.service";
import { prisma } from "../../config/prisma";

const router = Router();

// ============================================================================
// EXISTING ENDPOINTS (Keep these working)
// ============================================================================

router.get("/latest", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const report = await getLatestAutomationReport(req.user.userId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.get("/history", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const reports = await getAutomationReportHistory(req.user.userId);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

router.post("/run", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resumeId = typeof req.body?.resumeId === "string" ? req.body.resumeId : undefined;
    const report = await runAutomationForUser(req.user.userId, { resumeId, mode: "manual" });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// NEW AUTOMATION FEATURES (Free-tier automation)
// ============================================================================

/**
 * GET /api/automation/status
 * Check automation system status
 */
router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const enabled = process.env.AUTOMATION_ENABLED !== "false";

    return res.json(
      createSuccessResponse({
        enabled,
        features: [
          "Job Matching (every 6 hours)",
          "Resume Health Checks (daily)",
          "Skill Gap Analysis (weekly)",
          "Application Follow-ups (every 2 days)",
          "Trending Skills Update (weekly)"
        ],
        lastUpdate: new Date()
      })
    );
  })
);

/**
 * GET /api/automation/skill-gaps
 * Get user's skill gaps for their target roles
 */
router.get(
  "/skill-gaps",
  requireAuth,
  asyncHandler(async (req, res) => {
    const gaps = await prisma.skillGapAnalysis.findMany({
      where: {
        userId: req.user!.userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    }).catch(() => []);

    if (gaps.length === 0) {
      return res.json(
        createSuccessResponse({
          skills: [],
          message: "No skill gaps found. Keep your resume updated to track gaps."
        })
      );
    }

    // Group by target role
    const grouped = gaps.reduce(
      (acc: Record<string, any>, gap: any) => {
        const role = gap.targetRole || "Unknown";
        if (!acc[role]) {
          acc[role] = gap;
        }
        return acc;
      },
      {} as Record<string, typeof gaps[0]>
    );

    return res.json(
      createSuccessResponse({
        skillGaps: Object.values(grouped),
        summary: {
          totalRolesAnalyzed: Object.keys(grouped).length,
          averageGapPercentage: Math.round(
            Object.values(grouped).reduce((sum: number, g: any) => sum + (g.gapPercentage || 0), 0) /
              Object.keys(grouped).length
          ),
          topMissingSkills: Array.from(
            new Set(Object.values(grouped).flatMap((g: any) => {
              try {
                return JSON.parse(g.missingSkills || "[]");
              } catch {
                return [];
              }
            }))
          ).slice(0, 5)
        }
      })
    );
  })
);

/**
 * GET /api/automation/resume-alerts
 * Get resume health alerts
 */
router.get(
  "/resume-alerts",
  requireAuth,
  asyncHandler(async (req, res) => {
    const alerts = await prisma.resumeAlert.findMany({
      where: {
        userId: req.user!.userId,
        acknowledged: false
      },
      orderBy: {
        createdAt: "desc"
      }
    }).catch(() => []);

    return res.json(
      createSuccessResponse({
        alerts: alerts.map((alert: any) => ({
          id: alert.id,
          resumeId: alert.resumeId,
          issues: alert.issues,
          message: alert.message,
          createdAt: alert.createdAt,
          type: alert.type
        })),
        totalUnread: alerts.length
      })
    );
  })
);

/**
 * POST /api/automation/resume-alert/:alertId/acknowledge
 * Mark alert as acknowledged
 */
router.post(
  "/resume-alert/:alertId/acknowledge",
  requireAuth,
  asyncHandler(async (req, res) => {
    const alert = await prisma.resumeAlert.findUnique({
      where: { id: req.params.alertId }
    }).catch(() => null);

    if (!alert) {
      throw new NotFoundError("Alert", req.params.alertId);
    }

    if (alert.userId !== req.user!.userId) {
      throw new ForbiddenError("You can only acknowledge your own alerts");
    }

    const updated = await prisma.resumeAlert.update({
      where: { id: alert.id },
      data: { acknowledged: true }
    });

    return res.json(createSuccessResponse({ acknowledged: true }));
  })
);

/**
 * GET /api/automation/recommended-jobs
 * Get jobs recommended based on user's resume
 */
router.get(
  "/recommended-jobs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await prisma.resume.findFirst({
      where: {
        userId: req.user!.userId
      }
    }).catch(() => null);

    if (!resume) {
      return res.json(
        createSuccessResponse({
          jobs: [],
          message: "Upload a resume to get job recommendations"
        })
      );
    }

    // Get recommended jobs
    const recommendedJobs = await prisma.jobNotification.findMany({
      where: {
        userId: req.user!.userId,
        applied: false
      },
      orderBy: {
        matchScore: "desc"
      },
      take: 10
    }).catch(() => []);

    return res.json(
      createSuccessResponse({
        jobs: recommendedJobs.map((n: any) => ({
          id: n.jobId,
          title: n.jobTitle,
          company: n.company,
          salary: "N/A",
          matchScore: n.matchScore,
          location: "Remote",
          description: n.reason || "Matched based on your resume"
        })),
        totalRecommended: recommendedJobs.length
      })
    );
  })
);

/**
 * GET /api/automation/trending-skills
 * Get market trending skills
 */
router.get(
  "/trending-skills",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const trends = await prisma.trendingSkills.findMany({
      where: {
        category: { not: "" }
      },
      orderBy: {
        demandCount: "desc"
      },
      take: 20
    }).catch(() => []);

    return res.json(
      createSuccessResponse({
        skills: trends.map((t: any) => ({
          skill: t.skill,
          demandCount: t.demandCount,
          salaryAverage: t.salaryAverage,
          trend: t.trend
        })),
        month: currentMonth,
        totalSkills: trends.length,
        topSkills: trends.slice(0, 5).map((t: any) => t.skill)
      })
    );
  })
);

/**
 * GET /api/automation/stats
 * Get user's automation stats
 */
router.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Count various items
    const unresolvedAlerts = await prisma.resumeAlert.count({
      where: {
        userId: req.user!.userId,
        acknowledged: false
      }
    }).catch(() => 0);

    const skillGaps = await prisma.skillGapAnalysis.findMany({
      where: {
        userId: req.user!.userId
      }
    }).catch(() => []);

    const jobRecommendations = await prisma.jobNotification.count({
      where: {
        userId: req.user!.userId,
        notificationSent: false
      }
    }).catch(() => 0);

    const pendingFollowUps = await prisma.followUpReminder.count({
      where: {
        userId: req.user!.userId
      }
    }).catch(() => 0);

    // Calculate average skill gap %
    const avgGapPercentage = skillGaps.length > 0
      ? Math.round(skillGaps.reduce((sum: number, g: any) => sum + (Number(g.gapPercentage) || 0), 0) / skillGaps.length)
      : 0;

    return res.json(
      createSuccessResponse({
        stats: {
          unresolvedAlerts,
          skillGapsIdentified: skillGaps.length,
          recommendedJobs: jobRecommendations,
          pendingFollowUps,
          averageSkillGapPercentage: avgGapPercentage
        },
        recommendations: [
          unresolvedAlerts > 0 && "Address resume health alerts",
          avgGapPercentage > 40 && "Focus on high-demand skills",
          jobRecommendations > 0 && "Review recommended jobs",
          pendingFollowUps > 0 && "Follow up on applications"
        ].filter(Boolean),
        nextAutomationRun: {
          jobMatching: "Every 6 hours",
          resumeHealth: "Daily at 2:00 AM",
          skillGaps: "Mondays at 8:00 AM",
          trendingSkills: "Sundays at 3:00 AM"
        }
      })
    );
  })
);

export default router;

