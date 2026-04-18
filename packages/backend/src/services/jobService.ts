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
const AGGREGATOR_CACHE_TTL_MS = 3 * 60 * 1000;
const aggregatorCache = new Map<string, { expiresAt: number; value: JobListing[] }>();

const INDIA_CITIES = ["hyderabad", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "chennai"];
const NON_INDIA_LOCATION_HINTS = ["usa", "united states", "uk", "united kingdom", "canada", "australia", "europe", "singapore"];

const isIndiaLocation = (location?: string) => {
  const lower = (location || "").toLowerCase();
  if (!lower) return true;
  if (NON_INDIA_LOCATION_HINTS.some((hint) => lower.includes(hint))) return false;
  if (lower.includes("india") || lower.includes("remote")) return true;
  return INDIA_CITIES.some((city) => lower.includes(city));
};

const isRealApplyLink = (url?: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes("example.com")) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const looksLikeInternship = (job: Partial<JobListing>) => {
  const text = `${job.title || ""} ${job.description || ""} ${job.jobType || ""}`.toLowerCase();
  return text.includes("intern") || text.includes("internship") || text.includes("trainee");
};

const normalizeJob = (input: Partial<JobListing> & { title?: string; company?: string; location?: string; url?: string }): JobListing | null => {
  const title = (input.title || "").trim();
  const company = (input.company || "Unknown Company").trim();
  const location = (input.location || "India").trim();
  const url = (input.url || "").trim();
  const description = (input.description || "No description provided").trim();

  if (!title || !isIndiaLocation(location) || !isRealApplyLink(url)) return null;

  const type = looksLikeInternship(input) ? "Internship" : "Job";
  return {
    id: input.id || `${company.toLowerCase().replace(/\s+/g, "-")}-${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    company,
    location,
    description,
    salary: input.salary,
    url,
    platform: input.platform || "Web",
    postedDate: input.postedDate,
    jobType: type
  };
};

const dedupeJobs = (jobs: JobListing[]) => {
  const seen = new Set<string>();
  const output: JobListing[] = [];
  for (const job of jobs) {
    const key = `${job.title}|${job.company}|${job.location}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(job);
  }
  return output;
};

const parseDate = (value?: string) => {
  if (!value) return 0;
  const d = new Date(value);
  const ts = d.getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const searchGoogleJobsViaSerpApi = async (role: string): Promise<JobListing[]> => {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_jobs",
        q: `${role} in India`,
        hl: "en",
        gl: "in",
        api_key: key
      },
      timeout: 5000
    });

    const rows = Array.isArray(response.data?.jobs_results) ? response.data.jobs_results : [];
    return rows
      .map((job: any) => normalizeJob({
        id: job.job_id,
        title: job.title,
        company: job.company_name,
        location: job.location || "India",
        description: job.description,
        url: job.related_links?.[0]?.link || job.share_link,
        salary: job.detected_extensions?.salary,
        postedDate: job.detected_extensions?.posted_at,
        platform: "Google Jobs"
      }))
      .filter((job: JobListing | null): job is JobListing => Boolean(job));
  } catch {
    return [];
  }
};

const searchRapidApiJobs = async (role: string): Promise<JobListing[]> => {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  try {
    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: `${role} in India`,
        num_pages: 1,
        page: 1
      },
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "jsearch.p.rapidapi.com"
      },
      timeout: 6000
    });

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    return rows
      .map((job: any) => normalizeJob({
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: `${job.job_city || ""} ${job.job_country || ""}`.trim() || "India",
        description: job.job_description,
        salary: job.job_salary,
        url: job.job_apply_link,
        postedDate: job.job_posted_at_datetime_utc,
        platform: "RapidAPI"
      }))
      .filter((job: JobListing | null): job is JobListing => Boolean(job));
  } catch {
    return [];
  }
};

const searchArbeitnow = async (role: string): Promise<JobListing[]> => {
  try {
    const response = await axios.get("https://www.arbeitnow.com/api/job-board-api", {
      timeout: 5000
    });
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    return rows
      .filter((job: any) => {
        const text = `${job?.title || ""} ${job?.description || ""}`.toLowerCase();
        return text.includes(role.toLowerCase());
      })
      .map((job: any) => normalizeJob({
        id: job.slug,
        title: job.title,
        company: job.company_name,
        location: Array.isArray(job.location) ? job.location.join(", ") : (job.location || "India"),
        description: job.description,
        url: job.url,
        postedDate: job.created_at,
        platform: "Arbeitnow",
        jobType: job.remote ? "Remote" : undefined
      }))
      .filter((job: JobListing | null): job is JobListing => Boolean(job));
  } catch {
    return [];
  }
};

const searchRemotiveApi = async (role: string): Promise<JobListing[]> => {
  try {
    const response = await axios.get("https://remotive.com/api/remote-jobs", {
      params: { search: role },
      timeout: 5000
    });

    const rows = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
    return rows
      .slice(0, 120)
      .map((job: any) => normalizeJob({
        id: String(job.id || ""),
        title: job.title,
        company: job.company_name || "Unknown Company",
        location: (job.candidate_required_location || "Remote India").toString(),
        description: (job.description || "").toString().replace(/<[^>]+>/g, " ").trim(),
        url: job.url,
        postedDate: job.publication_date,
        platform: "Remotive",
        jobType: job.job_type
      }))
      .filter((job: JobListing | null): job is JobListing => Boolean(job));
  } catch {
    return [];
  }
};

const searchInternships = async (role: string): Promise<JobListing[]> => {
  const query = `${role} internship`;
  const [adzunaInterns, remote] = await Promise.all([
    searchJobsAdzuna(query),
    searchJobsRemoteOK(query)
  ]);

  return [...adzunaInterns, ...remote]
    .map((job) => normalizeJob({ ...job, jobType: "Internship" }))
    .filter((job: JobListing | null): job is JobListing => Boolean(job));
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

export const aggregateIndiaJobs = async (role: string): Promise<JobListing[]> => {
  const normalizedRole = role.trim().toLowerCase() || "software engineer";
  const cacheKey = `agg:${normalizedRole}`;
  const cached = aggregatorCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const providers = [
    searchGoogleJobsViaSerpApi(role),
    searchRapidApiJobs(role),
    searchArbeitnow(role),
    searchRemotiveApi(role),
    searchJobsAdzuna(role),
    searchJobsRemoteOK(role),
    searchInternships(role)
  ];

  const settled = await Promise.allSettled(providers);
  const combined: JobListing[] = [];
  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      combined.push(...entry.value);
    }
  }

  const clean = dedupeJobs(
    combined.filter((job) => isIndiaLocation(job.location) && isRealApplyLink(job.url))
  ).sort((a, b) => parseDate(b.postedDate) - parseDate(a.postedDate));

  aggregatorCache.set(cacheKey, {
    expiresAt: Date.now() + AGGREGATOR_CACHE_TTL_MS,
    value: clean
  });

  return clean;
};
