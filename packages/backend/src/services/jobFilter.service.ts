/**
 * Application Filtering & Scoring Service
 * Intelligently filters and ranks job opportunities
 */

export interface JobScore {
  jobId: string;
  title: string;
  company: string;
  score: number;
  breakdown: {
    roleMatch: number; // 0-30
    salaryMatch: number; // 0-20
    locationMatch: number; // 0-20
    experienceMatch: number; // 0-15
    skillsMatch: number; // 0-15
  };
  recommendation: "high" | "medium" | "low" | "skip";
  reasons: string[];
  redFlags: string[];
}

export interface JobFilterCriteria {
  minSalary?: number;
  maxCommute?: number; // km
  preferredLocations?: string[];
  remoteOnly?: boolean;
  minExperience?: number;
  requiredSkills?: string[];
  excludeCompanies?: string[];
  titleKeywords?: string[];
}

/**
 * Score a job opportunity
 */
export function scoreJob(
  job: {
    title: string;
    description: string;
    company: string;
    location?: string;
    salary?: string;
    url?: string;
  },
  userProfile: {
    targetRole: string;
    yearsExperience: number;
    skills: string[];
    preferredLocations?: string[];
    targetSalary?: number;
  }
): JobScore {
  let totalScore = 0;
  const breakdown = {
    roleMatch: 0,
    salaryMatch: 0,
    locationMatch: 0,
    experienceMatch: 0,
    skillsMatch: 0
  };

  const reasons: string[] = [];
  const redFlags: string[] = [];

  // 1. Role Match (0-30 points)
  const titleKeywords = [
    "senior",
    "lead",
    "principal",
    "manager",
    "architect",
    "staff",
    "junior",
    "mid",
    "mid-level"
  ];
  const roleLower = job.title.toLowerCase();
  const targetLower = userProfile.targetRole.toLowerCase();

  if (roleLower.includes(targetLower)) {
    breakdown.roleMatch = 30;
    reasons.push(`Exact role match: "${job.title}"`);
  } else if (
    targetLower.split(" ").some((word) => roleLower.includes(word)) ||
    roleLower.split(" ").some((word) => targetLower.includes(word))
  ) {
    breakdown.roleMatch = 20;
    reasons.push(`Related role: "${job.title}"`);
  } else {
    breakdown.roleMatch = 5;
  }
  totalScore += breakdown.roleMatch;

  // 2. Skills Match (0-15 points)
  const jobDescLower = job.description.toLowerCase();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  userProfile.skills.forEach((skill) => {
    if (jobDescLower.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const skillMatchPercentage = matchedSkills.length / userProfile.skills.length;
  breakdown.skillsMatch = Math.round(skillMatchPercentage * 15);
  totalScore += breakdown.skillsMatch;

  if (matchedSkills.length > 0) {
    reasons.push(`${matchedSkills.length}/${userProfile.skills.length} skills match`);
  }

  if (missingSkills.length > userProfile.skills.length * 0.5) {
    redFlags.push(
      `Missing key skills: ${missingSkills.slice(0, 3).join(", ")}`
    );
  }

  // 3. Experience Match (0-15 points)
  const expLower = job.description.toLowerCase();
  let requiredExp = 0;

  const expMatch = expLower.match(/(\d+)\s*[\+\-]?\s*years?/i);
  if (expMatch) {
    requiredExp = parseInt(expMatch[1]);
  }

  if (requiredExp <= userProfile.yearsExperience) {
    breakdown.experienceMatch = 15;
    reasons.push(`Experience match: ${userProfile.yearsExperience} years`);
  } else if (requiredExp <= userProfile.yearsExperience + 2) {
    breakdown.experienceMatch = 10;
    reasons.push(`Close experience level`);
  } else {
    breakdown.experienceMatch = 0;
    redFlags.push(`Requires ${requiredExp} years, you have ${userProfile.yearsExperience}`);
  }
  totalScore += breakdown.experienceMatch;

  // 4. Salary Match (0-20 points) - UPGRADED: Better parsing
  if (job.salary && userProfile.targetSalary) {
    let min = 0, max = 999999;
    
    if (typeof job.salary === 'number') {
      min = job.salary;
      max = job.salary;
    } else {
      const salaryStr = String(job.salary).toLowerCase();
      const nums = salaryStr.match(/\d+/g) || [];
      if (nums.length >= 1) {
        const scale = salaryStr.includes('k') ? 1000 : 1;
        min = parseInt(nums[0] || '0') * scale;
        max = nums.length >= 2 ? parseInt(nums[1] || nums[0] || '0') * scale : min;
      }
    }
    
    const target = userProfile.targetSalary * 1000;
    if (target >= min && target <= max) {
      breakdown.salaryMatch = 20;
      reasons.push(`Salary match: $${max / 1000}k`);
    } else if (target > max * 0.8 && target < max * 1.2) {
      breakdown.salaryMatch = 12;
      reasons.push(`Reasonable salary: $${max / 1000}k`);
    } else if (target > max) {
      breakdown.salaryMatch = 5;
    }
  }
  totalScore += breakdown.salaryMatch;

  // 5. Location Match (0-20 points)
  if (job.location && userProfile.preferredLocations) {
    const locLower = job.location.toLowerCase();
    if (
      locLower.includes("remote") ||
      userProfile.preferredLocations.some((loc) => locLower.includes(loc.toLowerCase()))
    ) {
      breakdown.locationMatch = 20;
      reasons.push(`Preferred location: ${job.location}`);
    } else if (userProfile.preferredLocations.length === 0) {
      breakdown.locationMatch = 15;
    }
  }
  totalScore += breakdown.locationMatch;

  // Red flags
  const redFlagPatterns = [
    { pattern: /unpaid|voluntary|volunteer/i, message: "Unpaid or volunteer position" },
    { pattern: /7\s*days?|24\/7|always on/i, message: "Always-on expectation" },
    { pattern: /contract\s+to\s+perm|temp|contract|temp-to-hire/i, message: "Contract position (might be temporary)" },
    { pattern: /equity|no salary|defer|sweat equity/i, message: "Equity-based or deferred compensation" }
  ];

  redFlagPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(job.description)) {
      redFlags.push(message);
    }
  });

  // Determine recommendation
  let recommendation: "high" | "medium" | "low" | "skip" = "medium";
  if (totalScore >= 80 && redFlags.length === 0) {
    recommendation = "high";
  } else if (totalScore >= 60 && redFlags.length <= 1) {
    recommendation = "medium";
  } else if (redFlags.length > 2) {
    recommendation = "skip";
  } else {
    recommendation = "low";
  }

  return {
    jobId: job.url || Math.random().toString(),
    title: job.title,
    company: job.company,
    score: totalScore,
    breakdown,
    recommendation,
    reasons,
    redFlags
  };
}

/**
 * Filter jobs by criteria
 */
export function filterJobsByCriteria(
  jobs: Array<{
    title: string;
    description: string;
    company: string;
    location?: string;
    salary?: string;
    url?: string;
  }>,
  criteria: JobFilterCriteria
): Array<{
  title: string;
  description: string;
  company: string;
  location?: string;
  salary?: string;
  url?: string;
  passedFilters: boolean;
  failureReasons: string[];
}> {
  return jobs.map((job) => {
    const failureReasons: string[] = [];

    // Check salary
    if (criteria.minSalary && job.salary) {
      const salaryMatch = job.salary.match(/\$(\d+)/);
      if (salaryMatch) {
        const jobMinSalary = parseInt(salaryMatch[1]) * 1000;
        if (jobMinSalary < criteria.minSalary) {
          failureReasons.push(`Salary below minimum: $${jobMinSalary}`);
        }
      }
    }

    // Check location
    if (criteria.remoteOnly) {
      if (job.location && !job.location.toLowerCase().includes("remote")) {
        failureReasons.push("Not remote");
      }
    }

    if (criteria.preferredLocations && job.location) {
      const matchesLocation = criteria.preferredLocations.some((loc) =>
        job.location!.toLowerCase().includes(loc.toLowerCase())
      );
      if (!matchesLocation && !job.location.toLowerCase().includes("remote")) {
        failureReasons.push(
          `Not in preferred locations: ${criteria.preferredLocations.join(", ")}`
        );
      }
    }

    // Check excluded companies
    if (criteria.excludeCompanies) {
      if (
        criteria.excludeCompanies.some((company) =>
          job.company.toLowerCase().includes(company.toLowerCase())
        )
      ) {
        failureReasons.push("Company in exclude list");
      }
    }

    // Check required skills
    if (criteria.requiredSkills) {
      const descLower = job.description.toLowerCase();
      const missingSkills = criteria.requiredSkills.filter(
        (skill) => !descLower.includes(skill.toLowerCase())
      );
      if (missingSkills.length > 0) {
        failureReasons.push(
          `Missing required skills: ${missingSkills.slice(0, 2).join(", ")}`
        );
      }
    }

    return {
      ...job,
      passedFilters: failureReasons.length === 0,
      failureReasons
    };
  });
}

/**
 * Rank and sort jobs by score
 */
export function rankJobs(
  scoredJobs: JobScore[],
  weights?: {
    roleMatch?: number;
    salaryMatch?: number;
    skillsMatch?: number;
    experienceMatch?: number;
    locationMatch?: number;
  }
): JobScore[] {
  const defaultWeights = {
    roleMatch: 1.5,
    salaryMatch: 1.0,
    skillsMatch: 1.2,
    experienceMatch: 1.0,
    locationMatch: 0.8,
    ...weights
  };

  return scoredJobs
    .map((job) => {
      const weightedScore =
        job.breakdown.roleMatch * defaultWeights.roleMatch +
        job.breakdown.salaryMatch * defaultWeights.salaryMatch +
        job.breakdown.skillsMatch * defaultWeights.skillsMatch +
        job.breakdown.experienceMatch * defaultWeights.experienceMatch +
        job.breakdown.locationMatch * defaultWeights.locationMatch;

      return {
        ...job,
        score: Math.round(weightedScore)
      };
    })
    .sort((a, b) => {
      // Prioritize high recommendations
      const recOrder = { high: 0, medium: 1, low: 2, skip: 3 };
      if (recOrder[a.recommendation] !== recOrder[b.recommendation]) {
        return recOrder[a.recommendation] - recOrder[b.recommendation];
      }
      // Then by score
      return b.score - a.score;
    });
}

/**
 * Generate application strategy
 */
export function generateApplicationStrategy(
  rankedJobs: JobScore[],
  applicationsPerDay: number = 3
): {
  dailyTarget: number;
  schedule: JobScore[][];
  expectedOutcomes: {
    totalJobs: number;
    daysToComplete: number;
    expectedInterviews: number;
    expectedOffers: number;
  };
} {
  const highPriority = rankedJobs.filter((j) => j.recommendation === "high");
  const mediumPriority = rankedJobs.filter((j) => j.recommendation === "medium");
  const lowPriority = rankedJobs.filter((j) => j.recommendation === "low");

  // Build schedule
  const schedule: JobScore[][] = [];
  let dayQueue: JobScore[] = [];

  [...highPriority, ...mediumPriority, ...lowPriority].forEach((job) => {
    dayQueue.push(job);
    if (dayQueue.length >= applicationsPerDay) {
      schedule.push([...dayQueue]);
      dayQueue = [];
    }
  });

  if (dayQueue.length > 0) {
    schedule.push(dayQueue);
  }

  // Statistical predictions (conservative)
  const totalJobs = rankedJobs.length;
  const daysToComplete = Math.ceil(totalJobs / applicationsPerDay);
  const applicationRate = 0.05; // 5% callback rate
  const interviewToOfferRate = 0.25; // 25% of interviews convert to offers

  return {
    dailyTarget: applicationsPerDay,
    schedule,
    expectedOutcomes: {
      totalJobs,
      daysToComplete,
      expectedInterviews: Math.ceil(totalJobs * applicationRate),
      expectedOffers: Math.ceil(totalJobs * applicationRate * interviewToOfferRate)
    }
  };
}
