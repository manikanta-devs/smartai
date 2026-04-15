/**
 * Career Streak Routes
 * Daily gamification, tasks, and leaderboard
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/errors";
import { createSuccessResponse, createErrorResponse } from "../../common/schemas";
import {
  completeTask,
   getCareerStats,
  getDailyTasksStatus,
  getLeaderboard,
  DAILY_TASKS,
} from "../../services/careerStreak.service";

const router = Router();

/**
 * GET /api/streak/stats
 * Get user's career stats, streak, and daily tasks
 */
router.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await getCareerStats(req.user!.userId);

    return res.json(
      createSuccessResponse({
        stats,
      })
    );
  })
);

/**
 * GET /api/streak/tasks
 * Get today's tasks and completion status
 */
router.get(
  "/tasks",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const tasks = await getDailyTasksStatus(req.user!.userId);
    const totalPoints = tasks.reduce(
      (sum, t) => sum + (t.completed ? 0 : t.points),
      0
    );

    return res.json(
      createSuccessResponse({
        tasks,
        pointsAvailable: totalPoints,
        message: "Complete 5 tasks for maximum daily points",
      })
    );
  })
);

/**
 * POST /api/streak/tasks/:taskId/complete
 * Mark a task as completed
 */
router.post(
  "/tasks/:taskId/complete",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate task exists
    if (!DAILY_TASKS.find((t) => t.id === req.params.taskId)) {
      return res.status(400).json(
        createErrorResponse("Task not found", [{ field: "taskId", message: "Invalid task ID" }])
      );
    }

    const result = await completeTask(req.user!.userId, req.params.taskId);

    return res.json(
      createSuccessResponse({
        ...result,
        message: `✅ Task completed! +${result.pointsEarned} points earned`,
      })
    );
  })
);

/**
 * GET /api/streak/leaderboard
 * Top career builders by points
 */
router.get(
  "/leaderboard",
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const leaderboard = await getLeaderboard(limit);

    return res.json(
      createSuccessResponse({
        leaderboard,
        total: leaderboard.length,
      })
    );
  })
);

export default router;
