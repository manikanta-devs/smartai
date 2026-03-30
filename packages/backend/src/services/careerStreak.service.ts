/**
 * Career Streak Service
 * Daily gamification system for user retention
 */

import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";

export const DAILY_TASKS = [
  {
    id: "apply",
    title: "Apply to 1 job today",
    points: 20,
    description: "Find and apply to a relevant job",
  },
  {
    id: "resume",
    title: "Improve 1 resume bullet",
    points: 10,
    description: "Enhance a resume section or fix wording",
  },
  {
    id: "interview",
    title: "Practice 1 interview question",
    points: 30,
    description: "Answer a mock interview question or record yourself",
  },
  {
    id: "research",
    title: "Research 1 target company",
    points: 10,
    description: "Learn about a company you want to join",
  },
  {
    id: "skill",
    title: "Update skill on LinkedIn",
    points: 5,
    description: "Add or endorse a skill",
  },
];

export const LEVEL_THRESHOLDS = [
  { level: "Job Seeker", min: 0, max: 100 },
  { level: "Career Builder", min: 101, max: 500 },
  { level: "Interview Ready", min: 501, max: 1000 },
  { level: "Offer Hunter", min: 1001, max: 2000 },
  { level: "Career Master", min: 2001, max: 999999 },
];

/**
 * Get or create user streak
 */
export async function getOrCreateStreak(userId: string) {
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
    include: {
      badges: true,
    },
  });

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        level: "Job Seeker",
      },
      include: {
        badges: true,
      },
    });
  }

  return streak;
}

/**
 * Check and update daily streak
 */
export async function updateDailyStreak(userId: string) {
  const streak = await getOrCreateStreak(userId);

  const now = new Date();
  const lastActivityDate = streak.lastActivity
    ? new Date(streak.lastActivity)
    : null;

  const isToday =
    lastActivityDate &&
    lastActivityDate.getDate() === now.getDate() &&
    lastActivityDate.getMonth() === now.getMonth() &&
    lastActivityDate.getFullYear() === now.getFullYear();

  const isYesterday =
    lastActivityDate &&
    lastActivityDate.getDate() === now.getDate() - 1 &&
    lastActivityDate.getMonth() === now.getMonth() &&
    lastActivityDate.getFullYear() === now.getFullYear();

  let newStreak = streak.currentStreak;

  if (!lastActivityDate) {
    // First activity
    newStreak = 1;
  } else if (isYesterday) {
    // Streak continues
    newStreak = streak.currentStreak + 1;
  } else if (!isToday) {
    // Streak broken
    newStreak = 1;
  }

  // Update streak record
  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivity: now,
    },
    include: {
      badges: true,
    },
  });

  // Check for streak milestones
  await checkStreakMilestones(userId, newStreak, updated.totalPoints);

  return updated;
}

/**
 * Add points for completing a daily task
 */
export async function completeTask(userId: string, taskId: string) {
  const task = DAILY_TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");

  // Check if task already completed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedToday = await prisma.dailyTask.findFirst({
    where: {
      userId,
      taskId,
      completedAt: {
        gte: today,
      },
    },
  });

  if (completedToday) {
    throw new Error("Task already completed today");
  }

  // Record task completion
  await prisma.dailyTask.create({
    data: {
      userId,
      taskId,
      points: task.points,
      completedAt: new Date(),
    },
  });

  // Add bonus for streak
  const streak = await updateDailyStreak(userId);
  const bonusPoints = Math.floor(streak.currentStreak / 7) * 5; // 5 bonus every 7 days

  // Update total points and level
  const newTotal = streak.totalPoints + task.points + bonusPoints;
  const newLevel = LEVEL_THRESHOLDS.find(
    (l) => newTotal >= l.min && newTotal <= l.max
  );

  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      totalPoints: newTotal,
      level: newLevel?.level || "Job Seeker",
    },
    include: {
      badges: true,
    },
  });

  logger.info(
    `✓ Task completed: ${taskId} (+${task.points + bonusPoints} points) for ${userId}`
  );

  return {
    pointsEarned: task.points + bonusPoints,
    streak: updated.currentStreak,
    level: updated.level,
    totalPoints: updated.totalPoints,
  };
}

/**
 * Get user's daily tasks status for today
 */
export async function getDailyTasksStatus(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedTasks = await prisma.dailyTask.findMany({
    where: {
      userId,
      completedAt: {
        gte: today,
      },
    },
  });

  const completedIds = completedTasks.map((t) => t.taskId);

  return DAILY_TASKS.map((task) => ({
    ...task,
    completed: completedIds.includes(task.id),
  }));
}

/**
 * Check for milestone badges
 */
async function checkStreakMilestones(
  userId: string,
  currentStreak: number,
  totalPoints: number
) {
  const badges = [];

  // Streak milestones
  if (currentStreak === 7) {
    badges.push({
      name: "7-Day Warrior",
      description: "Maintained a 7-day activity streak",
      icon: "🔥",
    });
  } else if (currentStreak === 30) {
    badges.push({
      name: "Month Master",
      description: "30-day consecutive activity streak",
      icon: "🏆",
    });
  } else if (currentStreak === 100) {
    badges.push({
      name: "Century Club",
      description: "100-day streak - incredible dedication",
      icon: "💯",
    });
  }

  // Points milestones
  if (totalPoints === 500) {
    badges.push({
      name: "Fast Starter",
      description: "Earned 500 career points",
      icon: "⚡",
    });
  } else if (totalPoints === 1000) {
    badges.push({
      name: "Career Climber",
      description: "Reached 1000 career points",
      icon: "📈",
    });
  }

  // Save new badges
  const streak = await prisma.userStreak.findUnique({
    where: { userId }
  });
  
  if (!streak) return;
  
  for (const badge of badges) {
    const existsng = await prisma.badge.findFirst({
      where: {
        streakId: streak.id,
        name: badge.name,
      },
    });

    if (!existsng) {
      await prisma.badge.create({
        data: {
          streakId: streak.id,
          ...badge,
        },
      });

      logger.info(`🏅 Badge earned: ${badge.name} for ${userId}`);
    }
  }
}

/**
 * Get user's career stats
 */
export async function getCareerStats(userId: string) {
  const streak = await getOrCreateStreak(userId);
  const todayTasks = await getDailyTasksStatus(userId);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const pointsAvailable = todayTasks.reduce(
    (sum, t) => sum + (t.completed ? 0 : t.points),
    0
  );

  // Find next level
  const currentLevel = LEVEL_THRESHOLDS.find(
    (l) =>
      streak.totalPoints >= l.min &&
      streak.totalPoints <= l.max
  );
  const nextLevel = LEVEL_THRESHOLDS[
    LEVEL_THRESHOLDS.indexOf(currentLevel!) + 1
  ];

  const progressToNext = nextLevel
    ? Math.round(
        ((streak.totalPoints - currentLevel!.min) /
          (nextLevel.min - currentLevel!.min)) *
          100
      )
    : 100;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalPoints: streak.totalPoints,
    level: streak.level,
    badges: streak.badges,
    dailyTasks: {
      tasks: todayTasks,
      completed: completedToday,
      total: DAILY_TASKS.length,
      pointsAvailable,
    },
    levelProgress: {
      current: currentLevel?.level,
      next: nextLevel?.level,
      percentToNext: progressToNext,
    },
  };
}

/**
 * Get leaderboard (top users by streak)
 */
export async function getLeaderboard(limit: number = 10) {
  const topUsers = await prisma.userStreak.findMany({
    orderBy: { totalPoints: "desc" },
    take: limit,
    select: {
      userId: true,
      currentStreak: true,
      totalPoints: true,
      level: true,
    },
  });

  return topUsers;
}
