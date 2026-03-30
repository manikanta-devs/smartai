/**
 * Rejection Analyzer Routes
 * Endpoint for analyzing why candidate got rejected
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/errors";
import { createSuccessResponse, createErrorResponse } from "../../common/schemas";
import { analyzeRejection } from "../../services/rejectionAnalyzer.service";

const router = Router();

/**
 * POST /api/analysis/rejection
 * Analyze why candidate got rejected from a job
 * 
 * Request body:
 * {
 *   "resumeText": "string - full resume text",
 *   "jobDescription": "string - full job description"
 * }
 */
router.post(
  "/rejection",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { resumeText, jobDescription } = req.body;

    // Validate inputs
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return res.status(400).json(
        createErrorResponse("Resume text must be at least 50 characters")
      );
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return res.status(400).json(
        createErrorResponse("Job description must be at least 50 characters")
      );
    }

    // Analyze rejection
    const analysis = await analyzeRejection({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      userId: req.user?.id,
    });

    return res.json(
      createSuccessResponse({
        analysis,
        timestamp: new Date(),
        cached: false,
      })
    );
  })
);

/**
 * POST /api/analysis/rejection/quick
 * Quick rejection analysis (without full Gemini call - uses heuristics)
 */
router.post(
  "/rejection/quick",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json(
        createErrorResponse("Resume text and job description are required")
      );
    }

    // Extract keywords from job description
    const jdKeywords = extractKeywords(jobDescription);

    // Extract keywords from resume
    const resumeKeywords = extractKeywords(resumeText);

    // Find missing keywords
    const missingKeywords = jdKeywords.filter(
      (k) => !resumeKeywords.includes(k.toLowerCase())
    );

    // Calculate match score
    const matchScore = Math.max(
      20,
      Math.round(((jdKeywords.length - missingKeywords.length) / jdKeywords.length) * 100)
    );

    return res.json(
      createSuccessResponse({
        analysis: {
          matchScore,
          verdict: matchScore >= 70 ? "Selected" : matchScore >= 50 ? "Maybe" : "Not Selected",
          verdictReason: `Your resume matches ${matchScore}% of job requirements.`,
          keywordGaps: {
            inJD: jdKeywords,
            inResume: resumeKeywords.filter((k) => jdKeywords.includes(k)),
            missing: missingKeywords,
          },
        },
        method: "quick_heuristic",
        timestamp: new Date(),
      })
    );
  })
);

/**
 * Helper: Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Common job keywords to look for
  const commonKeywords = [
    // Languages
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "go",
    "rust",
    "ruby",
    "php",

    // Frontend
    "react",
    "vue",
    "angular",
    "svelte",
    "html",
    "css",
    "tailwind",
    "bootstrap",

    // Backend
    "node.js",
    "express",
    "fastapi",
    "django",
    "spring",
    "nest.js",

    // Databases
    "postgresql",
    "mongodb",
    "mysql",
    "redis",
    "elasticsearch",
    "cassandra",

    // Cloud & DevOps
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "terraform",
    "jenkins",
    "gitlab-ci",
    "ci/cd",
    "devops",

    // Tools & Platforms
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "jira",
    "confluence",
    "slack",
    "figma",
    "webpack",
    "vite",

    // Soft skills
    "leadership",
    "communication",
    "teamwork",
    "project management",
    "agile",
    "scrum",
    "kanban",
    "mentoring",
    "problem-solving",

    // Experience levels
    "junior",
    "senior",
    "lead",
    "principal",
    "staff",
  ];

  const lowerText = text.toLowerCase();
  return commonKeywords.filter((keyword) => {
    // Use word boundary regex for better matching
    const regex = new RegExp(`\\b${keyword}\\b`);
    return regex.test(lowerText);
  });
}

export default router;
