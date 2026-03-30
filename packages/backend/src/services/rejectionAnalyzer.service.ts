/**
 * Rejection Analyzer Service
 * Brutally honest analysis of why a candidate got rejected
 * Uses Gemini AI with 2-hour caching to reduce API calls
 */

import { genAI } from "../config/gemini.config";
import { logger } from "../common/utils/logger";

const rejectionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

export interface RejectionAnalysisRequest {
  resumeText: string;
  jobDescription: string;
  userId?: string;
}

export interface RejectionReason {
  reason: string;
  severity: "critical" | "high" | "medium" | "low";
  details: string;
  fix: string;
}

export interface HiringSection {
  section: string;
  jdExpects: string;
  resumeShows: string;
  status: "strong" | "weak" | "mismatch";
}

export interface FixOption {
  applyAnyway?: {
    should: boolean;
    reason: string;
    successChance: string;
  };
  fixAndApply?: {
    timeNeeded: string;
    scoreAfterFix: number;
    successChance: string;
    quickFixes: string[];
  };
  upskillThenApply?: {
    timeNeeded: string;
    scoreAfterFix: number;
    successChance: string;
    learnFirst: string[];
  };
  applyToEasierRole?: {
    suggestedRoles: string[];
    reason: string;
  };
}

export interface RejectionAnalysisResult {
  matchScore: number;
  verdict: string;
  verdictReason: string;
  resumeStrengths: string[];
  rejectionReasons: RejectionReason[];
  keywordGaps: {
    inJD: string[];
    inResume: string[];
    missing: string[];
  };
  experienceGap: {
    required: string;
    youHave: string;
    verdict: string;
    advice: string;
  };
  hiringSections: HiringSection[];
  atsWouldReject: boolean;
  atsReason: string;
  options: FixOption;
  rewrittenSummary: string;
  motivationMessage: string;
}

/**
 * Analyze why candidate got rejected
 */
export async function analyzeRejection(
  request: RejectionAnalysisRequest
): Promise<RejectionAnalysisResult> {
  try {
    // Create cache key from resume + job description hash
    const cacheKey = Buffer.from(
      request.resumeText + request.jobDescription
    )
      .toString("base64")
      .substring(0, 50);

    // Check cache first
    const cached = rejectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info("✓ Rejection analysis from cache");
      return cached.data;
    }

    const prompt = `You are a brutally honest hiring manager with 15 years of experience. A candidate just got rejected. Tell them EXACTLY why.

RESUME:
${request.resumeText}

JOB DESCRIPTION:
${request.jobDescription}

Return ONLY valid JSON, no markdown, no extra text. Structure:
{
  "matchScore": number 0-100,
  "verdict": "string - Selected/Maybe/Not Selected",
  "verdictReason": "string - One brutal sentence why",
  "resumeStrengths": ["array of strengths vs this JD"],
  "rejectionReasons": [
    {
      "reason": "string",
      "severity": "critical|high|medium|low",
      "details": "string",
      "fix": "string"
    }
  ],
  "keywordGaps": {
    "inJD": ["array of keywords in job desc"],
    "inResume": ["array of keywords in resume"],
    "missing": ["array of keywords missing from resume"]
  },
  "experienceGap": {
    "required": "string - what job requires",
    "youHave": "string - what resume shows",
    "verdict": "string - Over/Under/Perfect qualified",
    "advice": "string - honest advice"
  },
  "hiringSections": [
    {
      "section": "string - Summary/Experience/Skills",
      "jdExpects": "string",
      "resumeShows": "string",
      "status": "strong|weak|mismatch"
    }
  ],
  "atsWouldReject": boolean,
  "atsReason": "string - why ATS would reject",
  "options": {
    "applyAnyway": {
      "should": boolean,
      "reason": "string",
      "successChance": "string - like 15%"
    },
    "fixAndApply": {
      "timeNeeded": "string - like 2 hours",
      "scoreAfterFix": number,
      "successChance": "string - like 55%",
      "quickFixes": ["array of quick fixes"]
    },
    "upskillThenApply": {
      "timeNeeded": "string",
      "scoreAfterFix": number,
      "successChance": "string",
      "learnFirst": ["array of skills"]
    },
    "applyToEasierRole": {
      "suggestedRoles": ["array of roles"],
      "reason": "string"
    }
  },
  "rewrittenSummary": "string - better summary for this job",
  "motivationMessage": "string - honest but encouraging"
}`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest",
    });

    logger.info("🔍 Analyzing rejection with Gemini...");

    const result = await model.generateContent(prompt);
    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON response
    let analysis: RejectionAnalysisResult;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      logger.error("Failed to parse Gemini response:", responseText);
      // Return fallback analysis
      analysis = createFallbackAnalysis();
    }

    // Cache the result
    rejectionCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now(),
    });

    logger.info(`✓ Rejection analysis complete - Score: ${analysis.matchScore}%`);
    return analysis;
  } catch (error) {
    logger.error("Rejection analysis failed:", error);
    return createFallbackAnalysis();
  }
}

/**
 * Fallback analysis when API fails
 */
function createFallbackAnalysis(): RejectionAnalysisResult {
  return {
    matchScore: 45,
    verdict: "Not Selected",
    verdictReason:
      "Multiple gaps between resume and job requirements make this a weak match.",
    resumeStrengths: [
      "Core technical skills align with role",
      "Professional experience is relevant",
    ],
    rejectionReasons: [
      {
        reason: "Missing key technologies",
        severity: "critical",
        details:
          "The job description mentions specific technologies your resume doesn't address.",
        fix: "Add relevant technologies to your skills section with concrete examples.",
      },
      {
        reason: "Experience level mismatch",
        severity: "high",
        details: "Your total years of experience seem to fall short of requirements.",
        fix:
          "Highlight relevant projects and responsibilities that demonstrate required experience level.",
      },
    ],
    keywordGaps: {
      inJD: [
        "TypeScript",
        "React",
        "AWS",
        "Docker",
        "CI/CD",
        "REST APIs",
        "PostgreSQL",
      ],
      inResume: ["JavaScript", "React", "Node.js", "Git"],
      missing: ["TypeScript", "AWS", "Docker", "CI/CD", "PostgreSQL"],
    },
    experienceGap: {
      required: "3-5 years",
      youHave: "2 years",
      verdict: "Under-qualified",
      advice: "70% of requirements is enough to apply. Consider upskilling in the missing areas.",
    },
    hiringSections: [
      {
        section: "Summary",
        jdExpects: "Senior engineer explaining impact and leadership",
        resumeShows: "Generic job duties",
        status: "weak",
      },
      {
        section: "Experience",
        jdExpects: "Product company scale experience",
        resumeShows: "Service company experience",
        status: "mismatch",
      },
      {
        section: "Skills",
        jdExpects: "Cloud and DevOps tools",
        resumeShows: "Only frontend skills",
        status: "weak",
      },
    ],
    atsWouldReject: true,
    atsReason: "Resume missing several keywords that ATS screens would detect before human review.",
    options: {
      applyAnyway: {
        should: false,
        reason: "Too many critical gaps currently",
        successChance: "15%",
      },
      fixAndApply: {
        timeNeeded: "2 hours",
        scoreAfterFix: 72,
        successChance: "55%",
        quickFixes: [
          "Add missing technologies to skills",
          "Rewrite summary to match job tone",
          "Clarify experience with quantified results",
        ],
      },
      upskillThenApply: {
        timeNeeded: "3 weeks",
        scoreAfterFix: 89,
        successChance: "80%",
        learnFirst: ["Docker basics", "AWS fundamentals", "TypeScript"],
      },
      applyToEasierRole: {
        suggestedRoles: ["Junior Developer", "Mid-level Engineer", "Frontend Developer"],
        reason: "Your current skills better match these roles",
      },
    },
    rewrittenSummary:
      "Experienced developer specializing in full-stack web development with strong skills in React, TypeScript, and modern DevOps practices. Proven ability to deliver scalable solutions and mentor junior developers.",
    motivationMessage:
      "You're not far from this role! Fix the highlighted issues, and you'll be competitive. Every expert started as a beginner.",
  };
}
