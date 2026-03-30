import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { fetchJobsFromPlatforms } from "../../services/jobService";

const MOCK_JOBS = [
  {
    title: "Senior Frontend Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    description: "Build scalable web applications with React and TypeScript",
    requirements: ["React", "TypeScript", "Node.js"],
    salary: "$150K - $200K",
    type: "Full-time"
  },
  {
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    description: "Create innovative products with modern tech stack",
    requirements: ["JavaScript", "Python", "PostgreSQL"],
    salary: "$120K - $160K",
    type: "Full-time"
  },
  {
    title: "Backend Engineer",
    company: "CloudServices",
    location: "New York, NY",
    description: "Design scalable backend systems",
    requirements: ["Node.js", "Docker", "AWS"],
    salary: "$130K - $180K",
    type: "Full-time"
  },
  {
    title: "DevOps Engineer",
    company: "InfraCo",
    location: "Austin, TX",
    description: "Build and maintain infrastructure",
    requirements: ["Kubernetes", "Terraform", "AWS"],
    salary: "$140K - $190K",
    type: "Full-time"
  },
  {
    title: "Data Scientist",
    company: "DataAI",
    location: "Boston, MA",
    description: "Develop ML models and analytics",
    requirements: ["Python", "Machine Learning", "SQL"],
    salary: "$160K - $210K",
    type: "Full-time"
  }
];

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, location } = req.query;

    let jobs = await prisma.job.findMany({
      take: 50,
      orderBy: { createdAt: "desc" }
    });

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
      const dbJobs = await prisma.job.findMany({
        take: 50,
        orderBy: { createdAt: "desc" }
      });

      const q = role.toLowerCase();
      const filtered = dbJobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );

      if (filtered.length > 0) {
        return res.json({ success: true, data: filtered });
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

    res.json({ success: true, data: application });
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
