import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { aggregateIndiaJobs, fetchJobsFromPlatforms } from "../../services/jobService";
import { getExtractedResumeData } from "../../services/resumeExtraction.service";
import { getGeminiModel } from "../../config/gemini.config";
import { sendApplicationConfirmationEmail } from "../../services/applicationNotification.service";

const MOCK_JOBS = [
  {
    title: "Senior Frontend Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    description: "Build scalable web applications with React and TypeScript",
    requirements: ["React", "TypeScript", "Node.js"],
    salary: "$150K - $200K",
    type: "Full-time",
    postedDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    description: "Create innovative products with modern tech stack",
    requirements: ["JavaScript", "Python", "PostgreSQL"],
    salary: "$120K - $160K",
    type: "Full-time",
    postedDate: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    title: "Backend Engineer",
    company: "CloudServices",
    location: "New York, NY",
    description: "Design scalable backend systems",
    requirements: ["Node.js", "Docker", "AWS"],
    salary: "$130K - $180K",
    type: "Full-time",
    postedDate: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    title: "DevOps Engineer",
    company: "InfraCo",
    location: "Austin, TX",
    description: "Build and maintain infrastructure",
    requirements: ["Kubernetes", "Terraform", "AWS"],
    salary: "$140K - $190K",
    type: "Full-time",
    postedDate: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    title: "Data Scientist",
    company: "DataAI",
    location: "Boston, MA",
    description: "Develop ML models and analytics",
    requirements: ["Python", "Machine Learning", "SQL"],
    salary: "$160K - $210K",
    type: "Full-time",
    postedDate: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
  }
];

const INDIA_CITIES = ["hyderabad", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "chennai"] as const;
const NON_INDIA_LOCATION_HINTS = ["usa", "united states", "uk", "united kingdom", "canada", "europe", "australia", "singapore"];
const CACHE_TTL_MS = 2 * 60 * 1000;
const studentSearchCache = new Map<string, { expiresAt: number; payload: any }>();

type StudentMode = "jobs" | "internships";

type AIResumeProfile = {
  skills: string[];
  level: "fresher" | "junior" | "mid" | "senior";
  preferred_roles: string[];
  experienceYears: number;
  projects: string[];
  education: string[];
  objective?: string;
};

type MatchedJob = {
  id: string;
  title: string;
  company: string;
  platform: string;
  location: string;
  salary?: string;
  url: string;
  applyLink: string;
  description: string;
  type: "Job" | "Internship";
  matchScore: number;
  scoreBreakdown: {
    skillsMatch: number;
    roleMatch: number;
    experienceMatch: number;
    locationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  improvementSuggestion: string;
  whyMatched: string[];
  postedDate?: string;
  mode: StudentMode;
};

const SKILL_KEYWORDS = [
  "react", "node", "node.js", "javascript", "typescript", "python", "java", "sql", "mongodb", "postgresql",
  "aws", "docker", "kubernetes", "html", "css", "tailwind", "express", "next.js", "data analysis", "power bi",
  "excel", "machine learning", "figma", "ui", "ux", "testing", "api", "git"
];

const ROLE_SKILL_MAP: Record<string, string[]> = {
  "Full Stack Developer": ["react", "node", "javascript", "sql", "api"],
  "Frontend Developer": ["react", "javascript", "typescript", "html", "css"],
  "Backend Developer": ["node", "express", "sql", "api", "docker"],
  "Data Analyst": ["sql", "python", "excel", "power bi", "data analysis"],
  "Software Engineer": ["javascript", "python", "java", "sql", "git"]
};

const normalizeSkills = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));

const stripCodeFence = (text: string) => text.replace(/^```json\s*/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

const extractSkillsFromText = (text: string) => {
  const normalized = text.toLowerCase();
  return SKILL_KEYWORDS.filter((keyword) => normalized.includes(keyword));
};

const inferModeFromJob = (job: { title?: string; description?: string; type?: string; platform?: string }): StudentMode => {
  const text = `${job.title || ""} ${job.description || ""} ${job.type || ""} ${job.platform || ""}`.toLowerCase();
  return text.includes("intern") || text.includes("trainee") ? "internships" : "jobs";
};

const isIndiaLocation = (location: string) => {
  const lower = location.toLowerCase();
  if (NON_INDIA_LOCATION_HINTS.some((hint) => lower.includes(hint))) {
    return false;
  }
  if (lower.includes("india") || lower.includes("remote")) {
    return true;
  }
  return INDIA_CITIES.some((city) => lower.includes(city));
};

const isIndiaRemote = (location: string) => {
  const lower = location.toLowerCase();
  return lower.includes("remote") && !NON_INDIA_LOCATION_HINTS.some((hint) => lower.includes(hint));
};

const suggestRolesFromSkills = (skills: string[]) => {
  const skillSet = new Set(skills);
  return Object.entries(ROLE_SKILL_MAP)
    .map(([role, roleSkills]) => {
      const matched = roleSkills.filter((skill) => skillSet.has(skill));
      const score = Math.round((matched.length / roleSkills.length) * 100);
      return { role, score, matchedSkills: matched, missingSkills: roleSkills.filter((skill) => !skillSet.has(skill)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const buildLearningSuggestions = (missingSkillGroups: string[]) => {
  const unique = Array.from(new Set(missingSkillGroups)).slice(0, 6);
  return unique.map((skill) => `Learn ${skill} with beginner projects and interview-focused practice`);
};

const buildFallbackSuggestions = (inputRole: string, mode: StudentMode) => {
  const roleText = inputRole || "software engineer";
  return {
    similarRoles: [
      roleText,
      `${roleText} intern`,
      "Frontend Developer",
      "Data Analyst"
    ],
    internshipSuggestions: [
      "Apply on Internshala for fresher-friendly roles",
      "Prioritize 3-6 month internships with PPO mention"
    ],
    upskillingSuggestions: [
      "Build 2 resume-ready projects focused on your target role",
      "Strengthen SQL + JavaScript + communication for fresher interviews"
    ],
    mode
  };
};

const buildSearchCacheKey = (userId: string, body: any) => {
  const normalized = {
    role: (body.role || "").toLowerCase().trim(),
    page: Number(body.page || 1),
    limit: Number(body.limit || 10)
  };

  return `${userId}:${JSON.stringify(normalized)}`;
};

const inferExperienceLevel = (experienceYears: number): AIResumeProfile["level"] => {
  if (experienceYears <= 1) return "fresher";
  if (experienceYears <= 3) return "junior";
  if (experienceYears <= 6) return "mid";
  return "senior";
};

const estimateExperienceYearsFromText = (text: string) => {
  const match = text.toLowerCase().match(/(\d+)\+?\s+years?/);
  if (!match) return 0;
  return Math.min(20, Math.max(0, Number(match[1]) || 0));
};

const roleTokenSimilarity = (inputRole: string, jobTitle: string) => {
  const inputTokens = new Set(inputRole.toLowerCase().split(/\s+/).filter(Boolean));
  const titleTokens = new Set(jobTitle.toLowerCase().split(/\s+/).filter(Boolean));
  if (inputTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of inputTokens) {
    if (titleTokens.has(token)) overlap += 1;
  }
  return Math.round((overlap / inputTokens.size) * 100);
};

const buildResumeProfile = async (resumeText: string, fallbackSkills: string[], fallbackObjective?: string): Promise<AIResumeProfile> => {
  const defaultProfile: AIResumeProfile = {
    skills: normalizeSkills(fallbackSkills),
    level: "fresher",
    preferred_roles: [],
    experienceYears: 0,
    projects: [],
    education: [],
    objective: fallbackObjective || ""
  };

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return defaultProfile;
  }

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`Parse the resume and return JSON only with this schema:
{
  "skills": string[],
  "level": "fresher" | "junior" | "mid" | "senior",
  "preferred_roles": string[],
  "experienceYears": number,
  "projects": string[],
  "education": string[],
  "objective": string
}

Rules:
- Keep only factual extraction from resume text.
- If unknown, use empty arrays/empty string.
- Ensure level aligns with experienceYears.

Resume text:\n${resumeText.slice(0, 12000)}
`);

    const raw = stripCodeFence(result.response.text());
    const parsed = JSON.parse(raw);

    const profile: AIResumeProfile = {
      skills: normalizeSkills(Array.isArray(parsed?.skills) ? parsed.skills.map(String) : defaultProfile.skills),
      level: ["fresher", "junior", "mid", "senior"].includes(parsed?.level) ? parsed.level : inferExperienceLevel(Number(parsed?.experienceYears) || 0),
      preferred_roles: Array.isArray(parsed?.preferred_roles) ? parsed.preferred_roles.map(String).slice(0, 5) : [],
      experienceYears: Math.max(0, Number(parsed?.experienceYears) || 0),
      projects: Array.isArray(parsed?.projects) ? parsed.projects.map(String).slice(0, 8) : [],
      education: Array.isArray(parsed?.education) ? parsed.education.map(String).slice(0, 6) : [],
      objective: typeof parsed?.objective === "string" ? parsed.objective : defaultProfile.objective
    };

    if (profile.skills.length === 0 && defaultProfile.skills.length > 0) {
      profile.skills = defaultProfile.skills;
    }

    if (!profile.objective && defaultProfile.objective) {
      profile.objective = defaultProfile.objective;
    }

    return profile;
  } catch {
    return defaultProfile;
  }
};

const formatFallbackJobs = () =>
  MOCK_JOBS.map((job, index) => ({
    id: `fallback-${index + 1}`,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requirements: job.requirements,
    salary: job.salary,
    type: job.type,
    postedDate: job.postedDate,
    platform: "SmartAI",
    url: null,
    createdAt: job.postedDate
  }));

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, location } = req.query;

    let jobs: any[] = [];

    try {
      jobs = await prisma.job.findMany({
        take: 50,
        orderBy: { createdAt: "desc" }
      });
    } catch (dbError) {
      console.error("Job query failed, using fallback jobs:", dbError);
      jobs = [];
    }

    if (jobs.length === 0) {
      jobs = formatFallbackJobs();
    }

    // Filter by search and location if provided
    if (search) {
      const q = (search as string).toLowerCase();
      jobs = jobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)
      );
    }

    if (location) {
      const q = (location as string).toLowerCase();
      jobs = jobs.filter((j: any) => j.location.toLowerCase().includes(q));
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

export const searchJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const { platforms } = req.query;

    if (!role) {
      throw new HttpError(400, "Job role is required");
    }

    // Get platforms from query params
    const selectedPlatforms = platforms 
      ? (platforms as string).split(",").map(p => p.trim())
      : ["linkedin", "indeed", "github", "remoteok"];

    console.log(`Fetching jobs for role: ${role}, platforms: ${selectedPlatforms.join(", ")}`);

    // Fetch from real job APIs
    const jobs = await fetchJobsFromPlatforms(role, selectedPlatforms);

    // If no jobs found from APIs, fall back to mock jobs filtered from database
    if (jobs.length === 0) {
      let dbJobs: any[] = [];

      try {
        dbJobs = await prisma.job.findMany({
          take: 50,
          orderBy: { createdAt: "desc" }
        });
      } catch (dbError) {
        console.error("Job search DB fallback failed, using static fallback jobs:", dbError);
      }

      if (dbJobs.length === 0) {
        dbJobs = formatFallbackJobs();
      }

      const q = role.toLowerCase();
      const filtered = dbJobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );

      if (filtered.length > 0) {
        return res.json({ success: true, data: filtered });
      }

      const staticRoleMatches = formatFallbackJobs().filter(
        (j: any) =>
          j.title.toLowerCase().includes(role.toLowerCase()) ||
          j.description.toLowerCase().includes(role.toLowerCase())
      );

      if (staticRoleMatches.length > 0) {
        return res.json({ success: true, data: staticRoleMatches });
      }

      // Return info message if nothing found
      return res.json({
        success: true,
        data: [],
        message: "No jobs found. Try a different role or check your API keys for LinkedIn, Indeed, etc."
      });
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

// Backward-compatible search endpoint for clients posting job search payloads.
export const searchJobsByPayload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, role, location, platforms } = req.body || {};
    const queryRole = (keywords || role || "software engineer").toString().trim();

    const selectedPlatforms = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ["linkedin", "indeed", "github", "remoteok"];

    const jobs = await fetchJobsFromPlatforms(queryRole, selectedPlatforms);

    const normalized = location
      ? jobs.filter((j: any) => (j.location || "").toLowerCase().includes(location.toString().toLowerCase()))
      : jobs;

    res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    next(error);
  }
};

// Alias endpoint used by older UI to refresh jobs list.
export const refreshJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keywords, location, platforms } = req.body || {};
    const queryRole = (keywords || "software engineer").toString().trim();

    const selectedPlatforms = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ["linkedin", "indeed", "github", "remoteok"];

    const jobs = await fetchJobsFromPlatforms(queryRole, selectedPlatforms);
    const normalized = location
      ? jobs.filter((j: any) => (j.location || "").toLowerCase().includes(location.toString().toLowerCase()))
      : jobs;

    res.json({
      success: true,
      jobs: normalized,
      count: normalized.length
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findUniqueOrThrow({ where: { id: req.params.id } });
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export const seedJobs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.job.count();
    if (existing > 0) {
      return res.json({ success: true, data: { message: "Jobs already seeded" } });
    }

    const created = await prisma.job.createMany({
      data: MOCK_JOBS.map((job) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: JSON.stringify(job.requirements),
        salary: job.salary,
        type: job.type
      }))
    });

    res.json({ success: true, data: { seeded: created.count } });
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId }
    });

    if (!job) {
      throw new HttpError(404, "Job not found");
    }

    const existing = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId: req.params.jobId
        }
      }
    });

    if (existing) {
      throw new HttpError(409, "Already applied");
    }

    const application = await prisma.application.create({
      data: {
        userId: req.user.userId,
        jobId: req.params.jobId,
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        status: "APPLIED"
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, firstName: true, lastName: true }
    });

    await prisma.jobNotification.create({
      data: {
        userId: req.user.userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        matchScore: 75,
        reason: "manual_apply",
        notificationSent: true,
        sentAt: new Date(),
        clickedAt: new Date(),
        applied: true
      }
    });

    let mailStatus: { sent: boolean; skipped: boolean } = { sent: false, skipped: true };
    if (user?.email) {
      mailStatus = await sendApplicationConfirmationEmail({
        to: user.email,
        userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        jobUrl: job.url,
        applicationId: application.id
      });
    }

    res.json({
      success: true,
      data: {
        ...application,
        notification: {
          emailSent: mailStatus.sent,
          emailSkipped: mailStatus.skipped
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const applyToExternalInternship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const title = (req.body?.title || "").toString().trim();
    const company = (req.body?.company || "").toString().trim();
    const location = (req.body?.location || "India").toString().trim();
    const description = (req.body?.description || "External internship application").toString().trim();
    const applyLink = (req.body?.applyLink || "").toString().trim();

    if (!title || !company || !applyLink) {
      throw new HttpError(400, "title, company, and applyLink are required");
    }

    const lowerLink = applyLink.toLowerCase();
    if (!/^https?:\/\//i.test(applyLink) || lowerLink.includes("example.com")) {
      throw new HttpError(400, "applyLink must be a real external URL");
    }

    if (!isIndiaLocation(location)) {
      throw new HttpError(400, "Only India internships are supported");
    }

    let job = await prisma.job.findFirst({
      where: {
        title,
        company,
        url: applyLink
      }
    });

    if (!job) {
      job = await prisma.job.create({
        data: {
          title,
          company,
          location,
          description,
          requirements: JSON.stringify(["internship", "entry-level"]),
          salary: (req.body?.salary || "").toString().trim() || null,
          type: "Internship",
          url: applyLink
        }
      });
    }

    const existing = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId: job.id
        }
      }
    });

    if (existing) {
      throw new HttpError(409, "Already applied to this internship");
    }

    const application = await prisma.application.create({
      data: {
        userId: req.user.userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        status: "APPLIED"
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, firstName: true, lastName: true }
    });

    await prisma.jobNotification.create({
      data: {
        userId: req.user.userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        matchScore: 80,
        reason: "external_internship_apply",
        notificationSent: true,
        sentAt: new Date(),
        clickedAt: new Date(),
        applied: true
      }
    });

    let mailStatus: { sent: boolean; skipped: boolean } = { sent: false, skipped: true };
    if (user?.email) {
      mailStatus = await sendApplicationConfirmationEmail({
        to: user.email,
        userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        jobUrl: job.url,
        applicationId: application.id
      });
    }

    res.status(201).json({
      success: true,
      data: {
        application,
        internship: {
          id: job.id,
          title: job.title,
          company: job.company,
          applyLink: job.url
        },
        notification: {
          emailSent: mailStatus.sent,
          emailSkipped: mailStatus.skipped
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const applications = await prisma.application.findMany({
      where: { userId: req.user.userId },
      include: { job: true },
      orderBy: { appliedAt: "desc" }
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

export const studentSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const userId = req.user.userId;
    const role = (req.body?.role || "Software Engineer").toString().trim();
    const page = Math.max(1, Number(req.body?.page || 1));
    const limit = Math.min(20, Math.max(5, Number(req.body?.limit || 10)));
    const location = "India";

    const cacheKey = buildSearchCacheKey(userId, { role, page, limit });
    const cacheEntry = studentSearchCache.get(cacheKey);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      return res.json({ success: true, data: cacheEntry.payload });
    }

    const latestResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const extracted = latestResume ? await getExtractedResumeData(latestResume.id) : null;
    const resumeSkills = normalizeSkills([
      ...(extracted?.skills || []),
      ...((extracted?.certifications || []).map((cert) => cert.name || "")),
      ...extractSkillsFromText(latestResume?.text || "")
    ]);

    const objectiveText = extracted?.summary || "";
    const resumeProfile = await buildResumeProfile(latestResume?.text || "", resumeSkills, objectiveText);
    const suggestedRoles = suggestRolesFromSkills(resumeProfile.skills);
    const queryRole = role || resumeProfile.preferred_roles[0] || suggestedRoles[0]?.role || "Software Engineer";

    const aggregated = await aggregateIndiaJobs(queryRole);

    const rankedJobs: MatchedJob[] = aggregated
      .map((job) => {
        const mode: StudentMode = inferModeFromJob({
          title: job.title,
          description: job.description,
          type: job.jobType,
          platform: job.platform
        });
        const jobText = `${job.title} ${job.description} ${job.jobType || ""}`;
        const requiredSkills = normalizeSkills(extractSkillsFromText(jobText));
        const matchedSkills = requiredSkills.filter((skill) => resumeProfile.skills.includes(skill));
        const missingSkills = requiredSkills.filter((skill) => !resumeProfile.skills.includes(skill));

        const skillsMatch = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 55;
        const roleMatch = roleTokenSimilarity(queryRole, job.title);
        const jobRequiredExperience = estimateExperienceYearsFromText(jobText);
        const experienceGap = Math.abs((resumeProfile.experienceYears || 0) - jobRequiredExperience);
        const experienceMatch = Math.max(0, 100 - Math.min(80, experienceGap * 18));
        const locationMatch = isIndiaLocation(job.location || "") ? 100 : 0;

        const formulaScore =
          skillsMatch * 0.5 +
          roleMatch * 0.2 +
          experienceMatch * 0.2 +
          locationMatch * 0.1;

        const internshipBoost = resumeProfile.level === "fresher" && mode === "internships" ? 8 : 0;
        const matchScore = Math.min(100, Math.max(0, Math.round(formulaScore + internshipBoost)));

        const improvementSuggestion = missingSkills.length > 0
          ? `Learn ${missingSkills.slice(0, 2).join(" and ")} to improve match.`
          : "Strong alignment. Improve projects and interview readiness for faster shortlisting.";

        const whyMatched = [
          matchedSkills.length > 0 ? `${matchedSkills.length} skills matched` : "Role alignment detected",
          mode === "internships" ? "Internship opportunity included" : "Job opportunity included",
          "Location validated for India-only search"
        ];

        return {
          id: job.id,
          title: job.title,
          company: job.company,
          platform: job.platform,
          location: job.location || "India",
          salary: job.salary,
          url: job.url,
          applyLink: job.url,
          description: job.description,
          type: mode === "internships" ? "Internship" : "Job",
          matchScore,
          scoreBreakdown: {
            skillsMatch,
            roleMatch,
            experienceMatch,
            locationMatch
          },
          matchedSkills,
          missingSkills,
          improvementSuggestion,
          whyMatched,
          postedDate: job.postedDate,
          mode
        } satisfies MatchedJob;
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const bTime = b.postedDate ? new Date(b.postedDate).getTime() : 0;
        const aTime = a.postedDate ? new Date(a.postedDate).getTime() : 0;
        return bTime - aTime;
      });

    const start = (page - 1) * limit;
    const paginated = rankedJobs.slice(start, start + limit);
    const hasMore = start + limit < rankedJobs.length;

    const topMissingSkills = rankedJobs.flatMap((job) => job.missingSkills).slice(0, 10);
    const learningSuggestions = buildLearningSuggestions(topMissingSkills);

    const payload = {
      context: {
        userType: "Indian student",
        location,
        mode: "mixed",
        city: null,
        remoteOnly: false,
        queryRole,
        objective: resumeProfile.objective || objectiveText || null,
        profile: {
          skills: resumeProfile.skills,
          level: resumeProfile.level,
          preferred_roles: resumeProfile.preferred_roles
        }
      },
      jobs: paginated,
      pagination: {
        page,
        limit,
        total: rankedJobs.length,
        hasMore
      },
      recommended: {
        roles: suggestedRoles,
        skillsToLearnNext: learningSuggestions
      },
      fallback: rankedJobs.length === 0 ? buildFallbackSuggestions(queryRole, "jobs") : null
    };

    studentSearchCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload
    });

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};
