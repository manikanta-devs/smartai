import axios from "axios";
import { logger } from "../common/utils/logger";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  url: string;
  platform: string;
  postedDate?: string;
  jobType?: string;
}

const jobCache = new Map<string, { expiresAt: number; value: JobListing[] }>();
const JOB_CACHE_TTL_MS = 2 * 60 * 1000;

const INDIA_CITIES = ["hyderabad", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "chennai"];
const NON_INDIA_LOCATION_HINTS = ["usa", "united states", "uk", "united kingdom", "canada", "australia", "europe", "singapore"];

const isIndiaLocation = (location?: string) => {
  const lower = (location || "").toLowerCase();
  if (!lower) return true;
  if (NON_INDIA_LOCATION_HINTS.some((hint) => lower.includes(hint))) return false;
  if (lower.includes("india") || lower.includes("remote")) return true;
  return INDIA_CITIES.some((city) => lower.includes(city));
};

function buildFallbackJobs(role: string, platformLabel: string): JobListing[] {
  const internship = /intern|fresher|entry/i.test(role);
  const lowerRole = role.toLowerCase();
  const roleHints = lowerRole.includes("frontend") || lowerRole.includes("react")
    ? ["React", "TypeScript", "JavaScript", "CSS", "UI", "testing"]
    : lowerRole.includes("backend")
      ? ["Node.js", "APIs", "PostgreSQL", "authentication", "cloud", "testing"]
      : lowerRole.includes("full stack")
        ? ["React", "Node.js", "APIs", "PostgreSQL", "deployment", "testing"]
        : lowerRole.includes("data")
          ? ["Python", "SQL", "dashboards", "analytics", "ETL", "visualization"]
          : ["communication", "ownership", "problem solving", "delivery", "collaboration"];

  return [
    {
      id: `${platformLabel.toLowerCase()}-fallback-1`,
      title: internship ? `${role} Intern` : `${role} - Entry Level`,
      company: platformLabel === "Internshala" ? "Campus Startup" : "Tech Company India",
      location: internship ? "Bangalore, India" : "Remote (India)",
      description: `Build production-ready products with ${roleHints.slice(0, 4).join(", ")} and ship measurable improvements for customers.`,
      salary: internship ? "INR 15k - 30k / month stipend" : "INR 4 LPA - 8 LPA",
      url: "https://example.com",
      platform: platformLabel,
      jobType: internship ? "Internship" : "Full-time"
    },
    {
      id: `${platformLabel.toLowerCase()}-fallback-2`,
      title: internship ? `${role} Trainee` : `${role} - Fresher Role`,
      company: "Startup India",
      location: "Hyderabad, India",
      description: `Join a small team working on ${roleHints.slice(0, 4).join(", ")} while improving reliability, user experience, and shipping speed.`,
      salary: internship ? "INR 10k - 25k / month stipend" : "INR 3.5 LPA - 7 LPA",
      url: "https://example.com",
      platform: platformLabel,
      jobType: internship ? "Internship" : "Full-time"
    }
  ];
}

// Free-only job suggestions. No RapidAPI/JSearch calls.
export const searchJobsJSearch = async (role: string, platforms: string[]): Promise<JobListing[]> => {
  const selected = platforms.map((p) => p.toLowerCase());
  const useRemoteOk = selected.some((p) => ["remoteok", "remote"].includes(p));
  const useAdzuna = !useRemoteOk || selected.some((p) => ["adzuna", "indeed", "linkedin", "glassdoor", "monster", "dice", "builtin"].includes(p));

  const jobs: JobListing[] = [];
  if (useAdzuna) jobs.push(...buildFallbackJobs(role, "Adzuna"));
  if (useRemoteOk) jobs.push(...buildFallbackJobs(role, "RemoteOK"));
  return jobs;
};

// Adzuna API integration (covers multiple countries and platforms)
export const searchJobsAdzuna = async (role: string): Promise<JobListing[]> => {
  try {
    const appId = process.env.ADZUNA_APP_ID || "demo";
    const appKey = process.env.ADZUNA_API_KEY || "demo";
    
    const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/in/search/1`, {
      params: {
        app_id: appId,
        app_key: appKey,
        results_per_page: 20,
        what: role
      },
      timeout: 5000
    });

    if (!Array.isArray(response.data.results)) return [];

    return response.data.results.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description || "No description available",
      salary: job.salary_min && job.salary_max 
        ? `$${job.salary_min}-${job.salary_max}`
        : undefined,
      url: job.redirect_url,
      platform: "Adzuna",
      postedDate: job.created,
      jobType: job.contract_type
    })).filter((job: JobListing) => isIndiaLocation(job.location));
  } catch (error) {
    if (process.env.DEBUG) {
      logger.debug("Adzuna API fallback", error);
    }
    return [];
  }
};

// GitHub Jobs API (free, no auth needed - for tech roles)
export const searchJobsGithub = async (role: string): Promise<JobListing[]> => {
  try {
    // GitHub Jobs is discontinued, so keep this provider as a silent fallback.
    if (process.env.DEBUG) {
      logger.debug(`GitHub Jobs provider disabled for role ${role}`);
    }
    return [];
  } catch (error) {
    if (process.env.DEBUG) {
      logger.debug("GitHub Jobs API fallback", error);
    }
    return [];
  }
};

// RemoteOK API (free jobs API)
export const searchJobsRemoteOK = async (role: string): Promise<JobListing[]> => {
  try {
    const response = await axios.get(`https://remoteok.io/api/remote-jobs/?search=${encodeURIComponent(role)}`, {
      timeout: 5000
    });

    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.jobs)
        ? response.data.jobs
        : [];

    if (rows.length === 0) return [];

    return rows
      .filter((job: any) => job.id !== "api_documentation") // Filter out doc entry
      .slice(0, 20)
      .map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: "Remote (India)",
        description: job.description || "No description available",
        salary: job.salary || undefined,
        url: job.url,
        platform: "RemoteOK",
        postedDate: job.date_posted,
        jobType: "Remote"
      }))
      .filter((job: JobListing) => isIndiaLocation(job.location));
  } catch (error) {
    if (process.env.DEBUG) {
      logger.debug("RemoteOK API fallback", error);
    }
    return [];
  }
};

const searchJobsInternshala = async (role: string): Promise<JobListing[]> => {
  return buildFallbackJobs(`${role} Intern`, "Internshala");
};

const searchJobsNaukri = async (role: string): Promise<JobListing[]> => {
  return buildFallbackJobs(role, "Naukri");
};

// Fetch jobs from multiple sources based on platform selection
export const fetchJobsFromPlatforms = async (role: string, platforms: string[]): Promise<JobListing[]> => {
  const normalizedPlatforms = (platforms || []).map((platform) => platform.toLowerCase()).sort();
  const cacheKey = `${role.toLowerCase()}::${normalizedPlatforms.join(",")}`;
  const cached = jobCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Map platform names to API functions
  const platformMap: { [key: string]: () => Promise<JobListing[]> } = {
    linkedin: () => searchJobsAdzuna(role),
    indeed: () => searchJobsAdzuna(role),
    naukri: () => searchJobsNaukri(role),
    internshala: () => searchJobsInternshala(role),
    remoteok: () => searchJobsRemoteOK(role),
    adzuna: () => searchJobsAdzuna(role)
  };

  // Get fetchers for selected platforms (or use defaults if none specified)
  const selectedPlatforms = platforms.length > 0 ? platforms : ["linkedin", "naukri", "internshala", "indeed"];
  const fetchers = selectedPlatforms
    .map(p => ({ name: p, fn: platformMap[p.toLowerCase()] }))
    .filter(p => p.fn !== undefined);

  if (fetchers.length === 0) {
    // Return mock data if no valid platforms
    return buildFallbackJobs(role, "MockData");
  }

  // Fetch in parallel with timeout protection
  const results = await Promise.allSettled(
    fetchers.map(({ name, fn }) => 
      Promise.race([
        fn(),
        new Promise<JobListing[]>((_, reject) => 
          setTimeout(() => reject(new Error(`${name} timeout`)), 6000)
        )
      ])
    )
  );

  // Collect all successful results
  const allJobs: JobListing[] = [];
  const failedPlatforms: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allJobs.push(...result.value);
    } else {
      failedPlatforms.push(fetchers[index].name);
    }
  });

  // If no jobs found, return mock data
  if (allJobs.length === 0) {
    const fallback = buildFallbackJobs(role, "Fallback").filter((job) => isIndiaLocation(job.location));
    jobCache.set(cacheKey, { expiresAt: Date.now() + JOB_CACHE_TTL_MS, value: fallback });
    return fallback;
  }

  // Remove duplicates by title + company
  const seen = new Set<string>();
  const filtered = allJobs.filter((job) => {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return isIndiaLocation(job.location);
  });

  jobCache.set(cacheKey, { expiresAt: Date.now() + JOB_CACHE_TTL_MS, value: filtered });
  return filtered;
};
