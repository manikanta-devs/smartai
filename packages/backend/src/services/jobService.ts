import axios from "axios";

interface JobListing {
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

// JSearch API integration (covers LinkedIn, Indeed, etc.)
export const searchJobsJSearch = async (role: string, platforms: string[]): Promise<JobListing[]> => {
  try {
    const query = role.replace(/\s+/g, " ");
    
    // JSearch API endpoint that covers multiple job platforms
    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: `${query} jobs`,
        page: "1",
        num_pages: 1,
        date_posted: "month"
      },
      headers: {
        "x-rapidapi-key": process.env.JSEARCH_API_KEY || "demo",
        "x-rapidapi-host": "jsearch.p.rapidapi.com"
      }
    });

    if (!response.data.data) return [];

    return response.data.data.map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city || ""}, ${job.job_country || ""}`.trim(),
      description: job.job_description || "No description available",
      salary: job.job_salary_currency && job.job_min_salary 
        ? `${job.job_salary_currency} ${job.job_min_salary}-${job.job_max_salary}`
        : undefined,
      url: job.job_apply_link || job.job_google_link || "#",
      platform: job.job_source || "Job Portal",
      postedDate: job.job_posted_at_datetime_utc,
      jobType: job.job_employment_type
    }));
  } catch (error) {
    console.error("JSearch API error:", error);
    return [];
  }
};

// Adzuna API integration (covers multiple countries and platforms)
export const searchJobsAdzuna = async (role: string): Promise<JobListing[]> => {
  try {
    const appId = process.env.ADZUNA_APP_ID || "demo";
    const appKey = process.env.ADZUNA_API_KEY || "demo";
    
    const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/us/search/1`, {
      params: {
        app_id: appId,
        app_key: appKey,
        results_per_page: 20,
        what: role
      }
    });

    if (!response.data.results) return [];

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
    }));
  } catch (error) {
    console.error("Adzuna API error:", error);
    return [];
  }
};

// GitHub Jobs API (free, no auth needed - for tech roles)
export const searchJobsGithub = async (role: string): Promise<JobListing[]> => {
  try {
    const response = await axios.get("https://api.github.com/jobs", {
      params: {
        description: role,
        page: 1
      }
    });

    if (!response.data) return [];

    return response.data.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location || "Remote",
      description: job.description || "No description available",
      url: job.url,
      platform: "GitHub Jobs",
      postedDate: job.created_at,
      jobType: job.type
    }));
  } catch (error) {
    console.error("GitHub Jobs API error:", error);
    return [];
  }
};

// RemoteOK API (free jobs API)
export const searchJobsRemoteOK = async (role: string): Promise<JobListing[]> => {
  try {
    const response = await axios.get(`https://remoteok.io/api/remote-jobs/?search=${encodeURIComponent(role)}`);

    if (!response.data) return [];

    return response.data
      .filter((job: any) => job.id !== "api_documentation") // Filter out doc entry
      .slice(0, 20)
      .map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location || "Remote",
        description: job.description || "No description available",
        salary: job.salary || undefined,
        url: job.url,
        platform: "RemoteOK",
        postedDate: job.date_posted,
        jobType: "Remote"
      }));
  } catch (error) {
    console.error("RemoteOK API error:", error);
    return [];
  }
};

// Fetch jobs from multiple sources based on platform selection
export const fetchJobsFromPlatforms = async (role: string, platforms: string[]): Promise<JobListing[]> => {
  const allJobs: JobListing[] = [];

  // Map platform names to API functions
  const platfromMap: { [key: string]: () => Promise<JobListing[]> } = {
    linkedin: () => searchJobsJSearch(role, ["linkedin"]),
    indeed: () => searchJobsJSearch(role, ["indeed"]),
    glassdoor: () => searchJobsJSearch(role, ["glassdoor"]),
    monster: () => searchJobsJSearch(role, ["monster"]),
    dice: () => searchJobsJSearch(role, ["dice"]),
    builtin: () => searchJobsJSearch(role, ["builtin"]),
    github: () => searchJobsGithub(role),
    remoteok: () => searchJobsRemoteOK(role),
    adzuna: () => searchJobsAdzuna(role)
  };

  // Fetch from selected platforms
  for (const platform of platforms) {
    const fetcher = platfromMap[platform.toLowerCase()];
    if (fetcher) {
      try {
        const jobs = await fetcher();
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Error fetching from ${platform}:`, error);
      }
    }
  }

  // Remove duplicates by title + company
  const seen = new Set<string>();
  return allJobs.filter((job) => {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
