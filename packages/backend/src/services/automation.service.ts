import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";
import { env } from "../config/env";
import { fetchJobsFromPlatforms, type JobListing } from "./jobService";
import { matchResumeToJob, predictResumeRole, getImprovementSuggestions } from "./resumeAutomation";
import { generateATSFriendlyResume, parseResumeToStructuredData } from "./resumeService";
import { extractAndStoreResumeData } from "./resumeExtraction.service";
import scheduler from "./automationScheduler";

const DEFAULT_PLATFORMS = ["linkedin", "indeed", "github", "remoteok"];
const MAX_JOBS_TO_SCORE = 8;
const MAX_HISTORY = 12;

export interface AutomationMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  platform: string;
  url?: string;
  matchScore: number;
  feedback: string;
  matchingSkills: string[];
  missingSkills: string[];
}

export interface ResumeAgentPayload {
  atsFriendlyResumeHtml: string;
  autofill: {
    contactInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
    };
    summary: string;
    skills: string[];
    formValues: {
      name: string;
      email: string;
      phone: string;
      location: string;
      headline: string;
    };
    sectionsFound: string[];
  };
  jobComparison: {
    targetRole: string;
    bestMatchTitle: string;
    bestMatchCompany: string;
    matchScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    summary: string;
  };
  notification: {
    state: "ready" | "review";
    message: string;
    actions: string[];
  };
}

export interface AutomationReportPayload {
  id: string;
  userId: string;
  resumeId: string | null;
  mode: string;
  summary: string;
  newJobsCount: number;
  topMatches: AutomationMatch[];
  missingSkills: string[];
  generatedAt: string;
  agent?: ResumeAgentPayload;
}

let schedulerHandle: NodeJS.Timeout | null = null;
let initialTimer: NodeJS.Timeout | null = null;
let schedulerBusy = false;
const automationTable = prisma as typeof prisma & {
  automationReport: {
    create: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
};

function normalizeJobDescription(job: JobListing) {
  const parts = [job.title, job.company, job.location, job.description, job.platform, job.jobType, job.salary].filter(Boolean);
  return parts.join("\n");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function buildResumeAgentPayload(resumeText: string, targetRole: string, topMatch?: AutomationMatch, improvementHints: string[] = []): ResumeAgentPayload {
  const structured = parseResumeToStructuredData(resumeText);
  const contactInfo = structured.contactInfo || {};
  const skills = uniqueStrings([...(structured.skills || []), ...(topMatch?.matchingSkills || [])]).slice(0, 12);
  const summary = structured.summary || `ATS-friendly resume optimized for ${targetRole}.`;
  const atsFriendlyResumeHtml = generateATSFriendlyResume({
    contactInfo,
    summary,
    skills
  });

  const missingSkills = uniqueStrings([...(topMatch?.missingSkills || []), ...improvementHints]).slice(0, 8);
  const sectionsFound = uniqueStrings([
    contactInfo.name ? "contact" : "",
    structured.summary ? "summary" : "",
    skills.length ? "skills" : ""
  ]).filter(Boolean);

  return {
    atsFriendlyResumeHtml,
    autofill: {
      contactInfo,
      summary,
      skills,
      formValues: {
        name: contactInfo.name || "",
        email: contactInfo.email || "",
        phone: contactInfo.phone || "",
        location: contactInfo.location || "",
        headline: targetRole
      },
      sectionsFound
    },
    jobComparison: {
      targetRole,
      bestMatchTitle: topMatch?.title || targetRole,
      bestMatchCompany: topMatch?.company || "Target role",
      matchScore: topMatch?.matchScore || 0,
      matchingSkills: topMatch?.matchingSkills || [],
      missingSkills,
      summary: topMatch
        ? topMatch.feedback
        : `The automation agent prepared an ATS draft and autofill profile for ${targetRole}.`
    },
    notification: {
      state: topMatch && topMatch.matchScore >= 70 ? "ready" : "review",
      message: topMatch
        ? `Resume is ${topMatch.matchScore}% aligned with ${topMatch.title}.`
        : `Resume uploaded. The automation agent prepared ATS, autofill, and matching outputs.`,
      actions: missingSkills.length > 0
        ? [`Review ${missingSkills[0]}`, "Open ATS draft", "Run another match"]
        : ["Open ATS draft", "Submit when ready"]
    }
  };
}

function serializeReport(report: any): AutomationReportPayload {
  return {
    id: report.id,
    userId: report.userId,
    resumeId: report.resumeId,
    mode: report.mode,
    summary: report.summary,
    newJobsCount: report.newJobsCount,
    topMatches: JSON.parse(report.topMatchesJson || "[]"),
    missingSkills: JSON.parse(report.missingSkillsJson || "[]"),
    generatedAt: report.generatedAt.toISOString(),
    agent: report.agentPayloadJson ? JSON.parse(report.agentPayloadJson) : undefined
  };
}

async function buildAutomationReport(userId: string, mode = "manual", resumeId?: string) {
  const resume = resumeId
    ? await prisma.resume.findFirst({ where: { id: resumeId, userId } })
    : await prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });

  if (!resume) {
    throw new Error("No resume found for automation");
  }

  // Extract resume data if not already done
  const extractedData = await extractAndStoreResumeData(resume.id, resume.text);

  const roles = await predictResumeRole(resume.text);
  const targetRole = roles.roles?.[0]?.name || "Software Engineer";
  const jobs = await fetchJobsFromPlatforms(targetRole, DEFAULT_PLATFORMS);
  const scoredJobs = await Promise.all(
    jobs.slice(0, MAX_JOBS_TO_SCORE).map(async (job) => {
      const match = await matchResumeToJob({
        resumeText: resume.text,
        jobDescription: normalizeJobDescription(job)
      });

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        platform: job.platform,
        url: job.url,
        matchScore: match.matchScore,
        feedback: match.feedback,
        matchingSkills: match.matchingSkills,
        missingSkills: match.missingSkills
      } satisfies AutomationMatch;
    })
  );

  scoredJobs.sort((left, right) => right.matchScore - left.matchScore);
  const topMatches = scoredJobs.slice(0, 5);
  const missingSkills = uniqueStrings(topMatches.flatMap((item) => item.missingSkills));

  const improvements = await getImprovementSuggestions(resume.text, targetRole, missingSkills[0]);
  const agent = buildResumeAgentPayload(resume.text, targetRole, topMatches[0], improvements.prioritized.map((item) => item.suggestion));
  const summary = topMatches.length > 0
    ? `Found ${jobs.length} fresh jobs for ${targetRole}. Best match: ${topMatches[0].title} at ${topMatches[0].company} (${topMatches[0].matchScore}%).`
    : `Found ${jobs.length} fresh jobs for ${targetRole}, but no strong match yet.`;

  const report = await automationTable.automationReport.create({
    data: {
      userId,
      resumeId: resume.id,
      mode,
      summary,
      newJobsCount: jobs.length,
      topMatchesJson: JSON.stringify(topMatches),
      missingSkillsJson: JSON.stringify(uniqueStrings([...missingSkills, ...improvements.prioritized.map((item) => item.suggestion)])),
      extractedDataJson: JSON.stringify(extractedData),
      agentPayloadJson: JSON.stringify(agent),
      generatedAt: new Date()
    }
  });

  return serializeReport(report);
}

export async function runAutomationForUser(userId: string, options?: { resumeId?: string; mode?: string }) {
  return buildAutomationReport(userId, options?.mode || "manual", options?.resumeId);
}

export async function runAutomationForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const reports: AutomationReportPayload[] = [];

  for (const user of users) {
    try {
      const report = await buildAutomationReport(user.id, "scheduled");
      reports.push(report);
    } catch (error) {
      logger.warn(`Automation skipped for user ${user.id}`, error);
    }
  }

  return reports;
}

export async function getLatestAutomationReport(userId: string) {
  const report = await automationTable.automationReport.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" }
  });

  return report ? serializeReport(report) : null;
}

export async function getAutomationReportHistory(userId: string) {
  const reports = await automationTable.automationReport.findMany({
    where: { userId },
    orderBy: { generatedAt: "desc" },
    take: MAX_HISTORY
  });

  return reports.map(serializeReport);
}

export function startAutomationScheduler() {
  if (!env.AUTOMATION_ENABLED || process.env.NODE_ENV === "test") {
    return;
  }

  // Use the new cron-based scheduler with 5 background jobs
  scheduler.start().catch(error => {
    logger.error("Failed to start automation scheduler", error);
  });
}
