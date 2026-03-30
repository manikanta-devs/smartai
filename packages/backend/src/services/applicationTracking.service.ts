/**
 * Application Tracking Service - Track, manage, and follow up on job applications
 * Create an application pipeline with status tracking
 */

import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";

export type ApplicationStatus = "APPLIED" | "VIEWED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED" | "ARCHIVED";
export type InterviewType = "phone" | "video" | "technical" | "panel" | "onsite" | "final";

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  notes: string;
  resumeVersionUsed?: string;
  atsScore?: number;
  salaryExpected?: string;
  interviews: Interview[];
  followUps: FollowUp[];
  outcome?: "offer" | "rejected" | "pending";
  feedback?: string;
  lastUpdateAt: Date;
}

export interface Interview {
  id: string;
  type: InterviewType;
  scheduledAt?: Date;
  completedAt?: Date;
  notes?: string;
  interviewerName?: string;
  feedback?: string;
  score?: number; // 0-10
  prepMaterialUrl?: string;
}

export interface FollowUp {
  id: string;
  dueAt: Date;
  type: "email" | "linkedin" | "phone" | "application_check";
  message?: string;
  status: "PENDING" | "COMPLETED";
  completedAt?: Date;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface ApplicationStats {
  totalApplications: number;
  statusBreakdown: Record<ApplicationStatus, number>;
  averageTimeToResponse: number; // days
  interviewRate: number; // percentage
  offerRate: number; // percentage
  recentActivity: JobApplication[];
  upcomingFollowUps: FollowUp[];
}

/**
 * FIXED: Create a new application record with full validation
 */
export async function recordApplication(
  userId: string,
  jobData: {
    jobId: string;
    jobTitle: string;
    company: string;
    jobUrl?: string;
    resumeVersionUsed?: string;
    atsScore?: number;
    salaryExpected?: string;
  }
): Promise<JobApplication | null> {
  try {
    // Validate input
    if (!userId || !jobData.jobId || !jobData.jobTitle || !jobData.company) {
      logger.error("Invalid application data:", jobData);
      throw new Error("Missing required fields: userId, jobId, jobTitle, company");
    }

    const app = await prisma.application.create({
      data: {
        userId,
        jobId: jobData.jobId,
        jobTitle: jobData.jobTitle,
        company: jobData.company,
        jobUrl: jobData.jobUrl || null,
        status: "APPLIED",
        resumeVersionUsed: jobData.resumeVersionUsed || null,
        atsScore: jobData.atsScore || null,
        salaryExpected: jobData.salaryExpected || null,
        appliedAt: new Date()
      },
      include: {
        interviews: true,
        followUps: true
      }
    });

    logger.info("Application recorded:", { applicationId: app.id, company: app.company });
    return app as JobApplication | null;
  } catch (error) {
    logger.error("Error recording application:", error);
    throw new Error(`Failed to record application: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<JobApplication | null> {
  try {
    const app = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        firstInteractionAt: status !== "APPLIED" ? new Date() : undefined,
        lastUpdateAt: new Date()
      },
      include: {
        interviews: true,
        followUps: true
      }
    });

    return toPrismaToApplication(app);
  } catch (error) {
    logger.error("Error updating application status:", error);
    return null;
  }
}

/**
 * Schedule interview for an application
 */
export async function scheduleInterview(
  applicationId: string,
  interviewData: {
    type: InterviewType;
    scheduledAt: Date;
    interviewerName?: string;
    interviewerEmail?: string;
    prepMaterialUrl?: string;
  }
): Promise<Interview | null> {
  try {
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        type: interviewData.type,
        scheduledAt: interviewData.scheduledAt,
        interviewerName: interviewData.interviewerName,
        interviewerEmail: interviewData.interviewerEmail,
        prepMaterialUrl: interviewData.prepMaterialUrl
      }
    });

    // Update application status to INTERVIEWING if not already
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "INTERVIEWING",
        firstInteractionAt: new Date()
      }
    });

    return toPrismaToInterview(interview);
  } catch (error) {
    logger.error("Error scheduling interview:", error);
    return null;
  }
}

/**
 * Record interview result
 */
export async function recordInterviewResult(
  interviewId: string,
  result: {
    feedback: string;
    score: number; // 0-10
    notes?: string;
  }
): Promise<Interview | null> {
  try {
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        completedAt: new Date(),
        feedback: result.feedback,
        score: result.score,
        notes: result.notes
      }
    });

    return toPrismaToInterview(interview);
  } catch (error) {
    logger.error("Error recording interview result:", error);
    return null;
  }
}

/**
 * Schedule follow-up action for an application
 */
export async function scheduleFollowUp(
  applicationId: string,
  followUpData: {
    type: "email" | "linkedin" | "phone" | "application_check";
    dueAt: Date;
    message?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
  }
): Promise<FollowUp | null> {
  try {
    const followUp = await prisma.followUp.create({
      data: {
        applicationId,
        type: followUpData.type,
        dueAt: followUpData.dueAt,
        message: followUpData.message,
        priority: followUpData.priority || "MEDIUM",
        status: "PENDING"
      }
    });

    return toPrismaToFollowUp(followUp);
  } catch (error) {
    logger.error("Error scheduling follow-up:", error);
    return null;
  }
}

/**
 * Mark follow-up as completed
 */
export async function completeFollowUp(
  followUpId: string,
  result?: string
): Promise<FollowUp | null> {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    return toPrismaToFollowUp(followUp);
  } catch (error) {
    logger.error("Error completing follow-up:", error);
    return null;
  }
}

/**
 * Get user's applications with optional filters
 */
export async function getUserApplications(
  userId: string,
  filters?: {
    status?: ApplicationStatus;
    company?: string;
    minAtsScore?: number;
  }
): Promise<JobApplication[]> {
  try {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.company) where.company = { contains: filters.company };
    if (filters?.minAtsScore) where.atsScore = { gte: filters.minAtsScore };

    const apps = await prisma.application.findMany({
      where,
      include: {
        interviews: true,
        followUps: true
      },
      orderBy: { appliedAt: "desc" }
    });

    return apps.map(toPrismaToApplication);
  } catch (error) {
    logger.error("Error fetching user applications:", error);
    return [];
  }
}

/**
 * Get application statistics for dashboard
 */
export async function getApplicationStats(userId: string): Promise<ApplicationStats | null> {
  try {
    const apps = await prisma.application.findMany({
      where: { userId },
      include: {
        interviews: true,
        followUps: true
      }
    });

    const total = apps.length;
    const statusBreakdown: Record<ApplicationStatus, number> = {
      APPLIED: 0,
      VIEWED: 0,
      SHORTLISTED: 0,
      INTERVIEWING: 0,
      OFFERED: 0,
      REJECTED: 0,
      ARCHIVED: 0
    };

    let interviewCount = 0;
    let offerCount = 0;
    let totalResponseTime = 0;
    let respondedCount = 0;

    apps.forEach((app: any) => {
      statusBreakdown[app.status as ApplicationStatus]++;

      if (app.interviews.length > 0) {
        interviewCount++;
      }
      if (app.status === "OFFERED") {
        offerCount++;
      }
      if (app.firstInteractionAt) {
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        totalResponseTime += daysSince;
        respondedCount++;
      }
    });

    const upcomingFollowUps = await prisma.followUp.findMany({
      where: {
        application: { userId },
        status: "PENDING",
        dueAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      orderBy: { dueAt: "asc" }
    });

    return {
      totalApplications: total,
      statusBreakdown,
      averageTimeToResponse: respondedCount > 0 ? Math.round(totalResponseTime / respondedCount) : 0,
      interviewRate: total > 0 ? Math.round((interviewCount / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offerCount / total) * 100) : 0,
      recentActivity: apps.slice(0, 5).map(toPrismaToApplication),
      upcomingFollowUps: upcomingFollowUps.map(toPrismaToFollowUp)
    };
  } catch (error) {
    logger.error("Error fetching application stats:", error);
    return null;
  }
}

/**
 * Get suggested follow-up actions for an application
 */
export function suggestFollowUpActions(application: JobApplication): Array<{
  type: "email" | "linkedin" | "phone" | "application_check";
  daysAfterApply: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  message: string;
}> {
  const daysSinceApply = Math.floor(
    (new Date().getTime() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const suggestions: Array<{
    type: "email" | "linkedin" | "phone" | "application_check";
    daysAfterApply: number;
    priority: "LOW" | "MEDIUM" | "HIGH";
    message: string;
  }> = [];

  // Immediate follow-up: Connect on LinkedIn
  if (daysSinceApply <= 1) {
    suggestions.push({
      type: "linkedin",
      daysAfterApply: 0,
      priority: "HIGH",
      message: `Connect with hiring manager from ${application.company} to increase visibility`
    });
  }

  // 5 days: Email follow-up
  if (daysSinceApply >= 5 && daysSinceApply < 6) {
    suggestions.push({
      type: "email",
      daysAfterApply: 5,
      priority: "HIGH",
      message: `Send follow-up email to ${application.company} about your ${application.jobTitle} application`
    });
  }

  // 10 days: Check application status
  if (daysSinceApply >= 10 && daysSinceApply < 11) {
    suggestions.push({
      type: "application_check",
      daysAfterApply: 10,
      priority: "MEDIUM",
      message: `Check application status on company website or portal`
    });
  }

  // 14 days: Phone follow-up
  if (daysSinceApply >= 14 && daysSinceApply < 15) {
    suggestions.push({
      type: "phone",
      daysAfterApply: 14,
      priority: "MEDIUM",
      message: `Call company to inquire about your application status`
    });
  }

  // Before interviews: Prep reminder
  if (application.interviews.length > 0) {
    const nextInterview = application.interviews
      .filter((i) => i.scheduledAt && new Date(i.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];

    if (nextInterview) {
      const daysTillInterview = Math.floor(
        (new Date(nextInterview.scheduledAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysTillInterview === 2) {
        suggestions.push({
          type: "application_check",
          daysAfterApply: daysSinceApply + 2,
          priority: "HIGH",
          message: `Prepare for ${nextInterview.type} interview at ${application.company} (${nextInterview.scheduledAt})`
        });
      }
    }
  }

  return suggestions;
}

/**
 * Generate personalized application progress report
 */
export async function generateApplicationReport(userId: string): Promise<{
  summary: string;
  stats: ApplicationStats | null;
  nextSteps: string[];
  encouragement: string;
}> {
  const stats = await getApplicationStats(userId);

  if (!stats) {
    return {
      summary: "Unable to generate report",
      stats: null,
      nextSteps: [],
      encouragement: "Keep applying! Every application brings you closer to your goal."
    };
  }

  const summary =
    `You've applied to ${stats.totalApplications} positions. ` +
    `${stats.interviewRate}% have resulted in interviews, and ${stats.offerRate}% have resulted in offers. ` +
    `Average response time: ${stats.averageTimeToResponse} days.`;

  const nextSteps: string[] = [];

  if (stats.statusBreakdown.APPLIED > 0) {
    nextSteps.push(`Follow up on ${stats.statusBreakdown.APPLIED} pending applications`);
  }
  if (stats.upcomingFollowUps.length > 0) {
    nextSteps.push(`Complete ${stats.upcomingFollowUps.length} scheduled follow-ups`);
  }
  if (stats.interviewRate < 10) {
    nextSteps.push(`Optimize your resume and cover letters to improve interview rate`);
  }
  if (stats.statusBreakdown.INTERVIEWING === 0 && stats.totalApplications > 10) {
    nextSteps.push(`Focus on companies and roles that closely match your background`);
  }

  const encouragement =
    stats.offerRate > 0
      ? `Great progress! You have ${stats.statusBreakdown.OFFERED} offer(s). Keep going!`
      : stats.interviewRate > 0
        ? `You're getting interviews! Keep practicing your interview skills.`
        : `Every application is a step forward. Keep applying consistently!`;

  return {
    summary,
    stats,
    nextSteps: nextSteps.length > 0 ? nextSteps : ["Keep applying to relevant positions"],
    encouragement
  };
}

// ===== HELPER FUNCTIONS =====

function toPrismaToApplication(prismaApp: any): JobApplication {
  return {
    id: prismaApp.id,
    userId: prismaApp.userId,
    jobId: prismaApp.jobId,
    jobTitle: prismaApp.jobTitle,
    company: prismaApp.company,
    jobUrl: prismaApp.jobUrl || undefined,
    status: prismaApp.status as ApplicationStatus,
    appliedAt: new Date(prismaApp.appliedAt),
    notes: prismaApp.notes || "",
    resumeVersionUsed: prismaApp.resumeVersionUsed || undefined,
    atsScore: prismaApp.atsScore || undefined,
    salaryExpected: prismaApp.salaryExpected || undefined,
    interviews: (prismaApp.interviews || []).map(toPrismaToInterview),
    followUps: (prismaApp.followUps || []).map(toPrismaToFollowUp),
    lastUpdateAt: new Date(prismaApp.lastUpdateAt)
  };
}

function toPrismaToInterview(prismaInterview: any): Interview {
  return {
    id: prismaInterview.id,
    type: prismaInterview.type as InterviewType,
    scheduledAt: prismaInterview.scheduledAt ? new Date(prismaInterview.scheduledAt) : undefined,
    completedAt: prismaInterview.completedAt ? new Date(prismaInterview.completedAt) : undefined,
    notes: prismaInterview.notes || undefined,
    interviewerName: prismaInterview.interviewerName || undefined,
    feedback: prismaInterview.feedback || undefined,
    score: prismaInterview.score || undefined,
    prepMaterialUrl: prismaInterview.prepMaterialUrl || undefined
  };
}

function toPrismaToFollowUp(prismaFollowUp: any): FollowUp {
  return {
    id: prismaFollowUp.id,
    dueAt: new Date(prismaFollowUp.dueAt),
    type: prismaFollowUp.type as "email" | "linkedin" | "phone" | "application_check",
    message: prismaFollowUp.message || undefined,
    status: prismaFollowUp.status as "PENDING" | "COMPLETED",
    completedAt: prismaFollowUp.completedAt ? new Date(prismaFollowUp.completedAt) : undefined,
    priority: prismaFollowUp.priority as "LOW" | "MEDIUM" | "HIGH"
  };
}
