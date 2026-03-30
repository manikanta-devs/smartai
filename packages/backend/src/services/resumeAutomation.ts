import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiApiKey = () => process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(getGeminiApiKey());

const jobMatchCache = new Map<string, { data: JobMatchResult; timestamp: number }>();
const CACHE_TTL = (parseInt(process.env.CACHE_TTL_MINUTES || "120") || 120) * 60 * 1000;

const isInvalidGeminiKeyError = (error: unknown) => {
  const apiError = error as { status?: number; errorDetails?: Array<{ reason?: string }>; message?: string };
  return (
    apiError?.status === 400 &&
    (apiError?.errorDetails?.some((detail) => detail.reason === "API_KEY_INVALID") ||
      /api key not valid|api_key_invalid/i.test(apiError?.message || ""))
  );
};

interface JobMatchResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  feedback: string;
  suggestedImprovements: string[];
}

interface MatchJobRequest {
  resumeText: string;
  jobDescription: string;
}

export const matchResumeToJob = async ({
  resumeText,
  jobDescription
}: MatchJobRequest): Promise<JobMatchResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackJobMatch(resumeText, jobDescription);
    }

    const cacheKey = Buffer.from(resumeText + jobDescription).toString("base64").substring(0, 50);
    const cached = jobMatchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("[Cache] Job match hit");
      return cached.data;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const matchPrompt = `Analyze how well this resume matches the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nRespond with ONLY this JSON (no markdown):\n{"matchScore": <0-100>, "matchingSkills": ["skill1"], "missingSkills": ["skill1"], "feedback": "<brief>", "suggestedImprovements": ["improvement1"]}`;

    const geminiResult = await model.generateContent(matchPrompt);
    const responseText = geminiResult.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const result: JobMatchResult = {
      matchScore: Math.min(100, Math.max(0, parsed.matchScore || 0)),
      matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      feedback: parsed.feedback || "Match analysis complete",
      suggestedImprovements: Array.isArray(parsed.suggestedImprovements) ? parsed.suggestedImprovements : []
    };

    jobMatchCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error("Job match failed:", error);
    }
    return fallbackJobMatch(resumeText, jobDescription);
  }
};

function fallbackJobMatch(resumeText: string, jobDescription: string): JobMatchResult {
  const resumeWords = resumeText.toLowerCase();
  const jobWords = jobDescription.toLowerCase();

  // Extract skills from job description
  const jobSkillKeywords = [
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "node",
    "express",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
    "sql",
    "mongodb",
    "postgresql",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "rest",
    "graphql",
    "leadership",
    "communication",
    "agile",
    "scrum"
  ];

  const matchingSkills = jobSkillKeywords.filter((skill) => resumeWords.includes(skill) && jobWords.includes(skill));

  const missingSkills = jobSkillKeywords.filter((skill) => !resumeWords.includes(skill) && jobWords.includes(skill));

  const matchScore = Math.min(100, Math.floor((matchingSkills.length / (matchingSkills.length + missingSkills.length)) * 100) || 0);

  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 5),
    missingSkills: missingSkills.slice(0, 5),
    feedback: `Your resume matches ${matchScore}% of the job requirements. You have ${matchingSkills.length} matching skills.`,
    suggestedImprovements: [
      missingSkills.length > 0
        ? `Learn or highlight experience with: ${missingSkills.slice(0, 2).join(", ")}`
        : "Your skills are well-aligned",
      "Add specific achievements related to the job requirements",
      "Quantify your impact with metrics and results"
    ]
  };
}

interface RolePredictionResult {
  roles: Array<{
    name: string;
    matchPercentage: number;
    requiredSkills: string[];
    missingSkills: string[];
  }>;
}

export const predictResumeRole = async (resumeText: string): Promise<RolePredictionResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackRolePrediction(resumeText);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const rolePrompt = `Based on this resume, predict 3-5 suitable job roles.\n\nResume:\n${resumeText}\n\nRespond with ONLY this JSON (no markdown):\n{"roles": [{"name": "Role", "matchPercentage": 0, "requiredSkills": [], "missingSkills": []}]}`;

    const result = await model.generateContent(rolePrompt);
    const responseText = result.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      roles: (Array.isArray(parsed.roles) ? parsed.roles : []).map((role: any) => ({
        name: role.name || "Unknown Role",
        matchPercentage: Math.min(100, Math.max(0, role.matchPercentage || 0)),
        requiredSkills: Array.isArray(role.requiredSkills) ? role.requiredSkills : [],
        missingSkills: Array.isArray(role.missingSkills) ? role.missingSkills : []
      }))
    };
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error("Role prediction failed:", error);
    }
    return fallbackRolePrediction(resumeText);
  }
};

function fallbackRolePrediction(resumeText: string): RolePredictionResult {
  const resumeWords = resumeText.toLowerCase();

  const roleProfiles: Record<string, { keywords: string[]; skills: string[] }> = {
    "Frontend Engineer": {
      keywords: ["react", "vue", "angular", "javascript", "typescript", "css", "html"],
      skills: ["React", "TypeScript", "UI/UX", "Responsive Design"]
    },
    "Backend Engineer": {
      keywords: ["node", "express", "python", "java", "api", "database", "sql", "mongodb"],
      skills: ["Node.js", "Database Design", "API Development", "Backend Systems"]
    },
    "Full Stack Developer": {
      keywords: ["react", "node", "javascript", "database", "full stack", "web"],
      skills: ["React", "Node.js", "Database", "Full Stack Development"]
    },
    "DevOps Engineer": {
      keywords: ["docker", "kubernetes", "aws", "ci/cd", "devops", "infrastructure"],
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD Pipelines"]
    },
    "Data Engineer": {
      keywords: ["python", "sql", "data", "analytics", "etl", "spark"],
      skills: ["Python", "SQL", "Data Processing", "Analytics"]
    }
  };

  const roleMatches = Object.entries(roleProfiles).map(([roleName, profile]) => {
    const matchingKeywords = profile.keywords.filter((keyword) => resumeWords.includes(keyword));
    const matchPercentage = Math.min(100, Math.floor((matchingKeywords.length / profile.keywords.length) * 100));

    return {
      name: roleName,
      matchPercentage,
      requiredSkills: profile.skills,
      missingSkills: profile.keywords.filter((keyword) => !resumeWords.includes(keyword)).slice(0, 2)
    };
  });

  return {
    roles: roleMatches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3)
  };
}

interface ImprovementResult {
  improvements: string[];
  prioritized: Array<{
    priority: "high" | "medium" | "low";
    suggestion: string;
    impact: string;
  }>;
}

export const getImprovementSuggestions = async (
  resumeText: string,
  targetRole?: string,
  focus?: string
): Promise<ImprovementResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackImprovements(resumeText, targetRole, focus);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const improvementPrompt = `Generate resume improvements${targetRole ? ` for a ${targetRole} role` : ""}.\n\nResume:\n${resumeText}\n\nRespond with ONLY JSON (no markdown):\n{"improvements": [], "prioritized": [{"priority": "high", "suggestion": "", "impact": ""}]}`;

    const result = await model.generateContent(improvementPrompt);
    const responseText = result.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 10) : [],
      prioritized: (Array.isArray(parsed.prioritized) ? parsed.prioritized : []).map((item: any) => ({
        priority: (['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium') as 'high' | 'medium' | 'low',
        suggestion: item.suggestion || '',
        impact: item.impact || ''
      }))
    };
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error('Improvement suggestions failed:', error);
    }
    return fallbackImprovements(resumeText, targetRole, focus);
  }
};

function fallbackImprovements(resumeText: string, targetRole?: string, focus?: string): ImprovementResult {
  const improvements = [
    'Add specific metrics and percentages to quantify achievements',
    'Include action verbs (Led, Developed, Implemented) to start bullet points',
    'Highlight relevant certifications and continuous learning',
    `${targetRole ? `Emphasize experience relevant to ${targetRole} roles` : 'Align experience with target role'}`,
    'Maintain consistent formatting and clear section hierarchy',
    'Remove generic descriptions - be specific about your impact',
    'Include a professional summary tailored to your target role',
    'Add links to projects, GitHub, or portfolio if applicable'
  ];

  if (focus) {
    improvements.splice(4, 0, `Focus on: ${focus}`);
  }

  const prioritized: ImprovementResult['prioritized'] = [
    {
      priority: 'high',
      suggestion: 'Quantify all achievements with numbers',
      impact: 'ATS systems better recognize your impact'
    },
    {
      priority: 'high',
      suggestion: 'Use role-specific keywords throughout',
      impact: 'Higher match percentage with job descriptions'
    },
    {
      priority: 'medium',
      suggestion: 'Add a professional summary',
      impact: 'Gives hiring managers quick overview of fit'
    },
    {
      priority: 'medium',
      suggestion: 'Group related skills and tools together',
      impact: 'Improves readability and ATS parsing'
    }
  ];

  if (focus) {
    prioritized.unshift({
      priority: 'high',
      suggestion: focus,
      impact: 'Directly addresses the clicked resume issue'
    });
  }

  return {
    improvements,
    prioritized
  };
}

interface CoverLetterResult {
  subjectLine: string;
  greeting: string;
  coverLetter: string;
  highlights: string[];
  closing: string;
}

export const generateCoverLetter = async (
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<CoverLetterResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackCoverLetter(resumeText, jobTitle, jobDescription);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Write a cover letter based on this resume${jobTitle ? ` for the ${jobTitle} role` : ""}.\n\nResume:\n${resumeText}\n\nRespond with ONLY JSON (no markdown):\n{"subjectLine": "", "greeting": "", "coverLetter": "", "highlights": [], "closing": ""}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      subjectLine: parsed.subjectLine || `Application for ${jobTitle || "the role"}`,
      greeting: parsed.greeting || "Dear Hiring Team,",
      coverLetter: parsed.coverLetter || fallbackCoverLetter(resumeText, jobTitle, jobDescription).coverLetter,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : [],
      closing: parsed.closing || "Sincerely,"
    };
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error("Cover letter generation failed:", error);
    }
    return fallbackCoverLetter(resumeText, jobTitle, jobDescription);
  }
};

function fallbackCoverLetter(resumeText: string, jobTitle?: string, jobDescription?: string): CoverLetterResult {
  const isFrontend = /react|typescript|javascript|ui|frontend/i.test(`${resumeText} ${jobTitle || ""} ${jobDescription || ""}`);
  const role = jobTitle || (isFrontend ? "Frontend Engineer" : "the role");
  const keywords = ["impact", "ownership", "collaboration", "quality"].filter((word) => new RegExp(word, "i").test(resumeText));

  return {
    subjectLine: `Application for ${role}`,
    greeting: "Dear Hiring Team,",
    coverLetter: [
      `I’m excited to apply for the ${role} position.`,
      `My background includes building practical products, shipping features, and learning quickly in fast-moving environments.`,
      jobDescription ? `This role stood out because it aligns with the skills and responsibilities described in the posting.` : `I believe my experience and mindset would make me a strong contributor to your team.`,
      `I’d welcome the chance to discuss how I can help your team deliver strong results.`
    ].join(" "),
    highlights: [
      "Tailor this letter to one specific job",
      keywords.length > 0 ? `Emphasize: ${keywords.slice(0, 3).join(", ")}` : "Add 1-2 concrete achievements",
      "Keep it to one page and stay specific"
    ],
    closing: "Sincerely,"
  };
}

interface InterviewPrepResult {
  role: string;
  questions: string[];
  suggestedPoints: string[];
  strengths: string[];
  watchOuts: string[];
  tips: string[];
}

export const generateInterviewPrep = async (
  resumeText: string,
  role?: string,
  jobDescription?: string
): Promise<InterviewPrepResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackInterviewPrep(resumeText, role, jobDescription);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Generate interview prep for this resume${role ? ` targeting ${role}` : ""}.\n\nResume:\n${resumeText}\n\nRespond with ONLY JSON (no markdown):\n{"role": "", "questions": [], "suggestedPoints": [], "strengths": [], "watchOuts": [], "tips": []}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      role: parsed.role || role || "Interview Role",
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 8) : [],
      suggestedPoints: Array.isArray(parsed.suggestedPoints) ? parsed.suggestedPoints.slice(0, 8) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      watchOuts: Array.isArray(parsed.watchOuts) ? parsed.watchOuts.slice(0, 5) : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : []
    };
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error("Interview prep generation failed:", error);
    }
    return fallbackInterviewPrep(resumeText, role, jobDescription);
  }
};

function fallbackInterviewPrep(resumeText: string, role?: string, jobDescription?: string): InterviewPrepResult {
  const resumeHints = [
    /react|typescript|javascript/i.test(resumeText) ? "frontend delivery" : null,
    /node|express|api|backend/i.test(resumeText) ? "backend systems" : null,
    /sql|postgres|database/i.test(resumeText) ? "data modeling" : null,
    /lead|manage|led|owned/i.test(resumeText) ? "ownership and leadership" : null
  ].filter(Boolean) as string[];

  return {
    role: role || "target role",
    questions: [
      "Tell me about a project you shipped end-to-end.",
      "What was the hardest bug or tradeoff you handled?",
      "How do you prioritize when requirements change?",
      "Why are you interested in this role?",
      "What would you improve in your most recent project?"
    ],
    suggestedPoints: [
      "Describe the problem, action, and measurable result.",
      resumeHints.length > 0 ? `Highlight ${resumeHints[0]}` : "Explain your strongest technical area.",
      jobDescription ? "Use examples that mirror the job description language." : "Tie answers back to business impact."
    ],
    strengths: resumeHints.length > 0 ? resumeHints : ["clear communication", "learning speed", "practical execution"],
    watchOuts: [
      "Avoid vague answers without examples.",
      "Don’t overstate experience you can’t defend.",
      "Be ready to explain gaps or transitions cleanly."
    ],
    tips: [
      "Prepare a 60-second intro.",
      "Keep 2-3 project stories ready.",
      "Practice STAR format for behavioral questions.",
      "Ask about team expectations and success metrics."
    ]
  };
}

interface SalaryInsightsResult {
  role: string;
  location: string;
  experienceLevel: string;
  salaryRange: string;
  factors: string[];
  negotiationTips: string[];
}

export const getSalaryInsights = async (
  resumeText: string,
  role?: string,
  location?: string
): Promise<SalaryInsightsResult> => {
  const inferredRole = role || inferRoleFromResume(resumeText);
  const inferredLevel = inferExperienceLevel(resumeText, inferredRole);
  const inferredLocation = location || inferLocationFromText(resumeText) || "Remote";

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey === "demo" || apiKey.startsWith("your-")) {
      return fallbackSalaryInsights(inferredRole, inferredLevel, inferredLocation, resumeText);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Estimate salary expectations from this resume.\n\nResume:\n${resumeText}\n\nTarget role: ${inferredRole}\nExperience level: ${inferredLevel}\nLocation: ${inferredLocation}\n\nRespond with ONLY JSON (no markdown):\n{"role": "", "location": "", "experienceLevel": "", "salaryRange": "", "factors": [], "negotiationTips": []}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      role: parsed.role || inferredRole,
      location: parsed.location || inferredLocation,
      experienceLevel: parsed.experienceLevel || inferredLevel,
      salaryRange: parsed.salaryRange || fallbackSalaryInsights(inferredRole, inferredLevel, inferredLocation, resumeText).salaryRange,
      factors: Array.isArray(parsed.factors) && parsed.factors.length > 0 ? parsed.factors.slice(0, 5) : fallbackSalaryInsights(inferredRole, inferredLevel, inferredLocation, resumeText).factors,
      negotiationTips: Array.isArray(parsed.negotiationTips) && parsed.negotiationTips.length > 0 ? parsed.negotiationTips.slice(0, 5) : fallbackSalaryInsights(inferredRole, inferredLevel, inferredLocation, resumeText).negotiationTips
    };
  } catch (error) {
    if (!isInvalidGeminiKeyError(error)) {
      console.error("Salary insights generation failed:", error);
    }
    return fallbackSalaryInsights(inferredRole, inferredLevel, inferredLocation, resumeText);
  }
};

function inferRoleFromResume(resumeText: string): string {
  if (/react|typescript|javascript|frontend/i.test(resumeText)) return "Frontend Engineer";
  if (/node|express|api|backend/i.test(resumeText)) return "Backend Engineer";
  if (/full stack|fullstack/i.test(resumeText)) return "Full Stack Engineer";
  if (/data|python|sql|analytics/i.test(resumeText)) return "Data Analyst";
  if (/product manager|product/i.test(resumeText)) return "Product Manager";
  return "Software Engineer";
}

function inferExperienceLevel(resumeText: string, role?: string): string {
  const text = `${resumeText} ${role || ""}`.toLowerCase();
  if (/senior|lead|staff|principal|manager/.test(text)) return "Senior";
  if (/mid|intermediate|2\+|3\+|4\+|5\+/.test(text)) return "Mid-level";
  return "Entry-level";
}

function inferLocationFromText(resumeText: string): string | null {
  if (/remote/i.test(resumeText)) return "Remote";
  if (/bangalore|bengaluru/i.test(resumeText)) return "Bengaluru";
  if (/mumbai/i.test(resumeText)) return "Mumbai";
  if (/delhi|new delhi/i.test(resumeText)) return "Delhi NCR";
  if (/san francisco|new york|seattle/i.test(resumeText)) return "US Metro";
  return null;
}

function fallbackSalaryInsights(role: string, experienceLevel: string, location: string, resumeText: string): SalaryInsightsResult {
  const isIndia = /bangalore|bengaluru|mumbai|delhi|india/i.test(location) || /inr|lpa/i.test(resumeText);
  const salaryBands = isIndia
    ? {
        "Entry-level": "₹6-12 LPA",
        "Mid-level": "₹12-24 LPA",
        "Senior": "₹24-45+ LPA"
      }
    : {
        "Entry-level": "$70k-$95k",
        "Mid-level": "$95k-$140k",
        "Senior": "$140k-$220k+"
      };

  return {
    role,
    location,
    experienceLevel,
    salaryRange: salaryBands[experienceLevel as keyof typeof salaryBands] || salaryBands["Mid-level"],
    factors: [
      "Experience level and scope of ownership",
      "Stack depth and production impact",
      "Location / remote vs on-site",
      "Company stage and funding",
      "Interview strength and specialization"
    ],
    negotiationTips: [
      "Anchor on market range, not your last salary.",
      "Ask about base, bonus, equity, and benefits separately.",
      "Use your strongest project outcomes as leverage.",
      "Request the band before giving a hard number if possible."
    ]
  };
}
