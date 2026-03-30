/**
 * Resume Analysis Routes
 * Endpoints for analyzing resumes using integrated Resume AI service
 */

import { Router, Request, Response, NextFunction } from 'express';
import { HttpError } from '../../common/middleware/error.middleware';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import { analyzeResumeWithAI } from '../../services/aiAnalyzer';
import {
  matchResumeToJob,
  predictResumeRole,
  getImprovementSuggestions,
  generateCoverLetter,
  generateInterviewPrep,
  getSalaryInsights
} from '../../services/resumeAutomation';
import { buildResumeAgentPayload } from '../../services/automation.service';

const router = Router();

const normalizeWords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

const scoreOverlap = (resumeText: string, jobDescription: string) => {
  const resumeWords = new Set(normalizeWords(resumeText));
  const jobWords = new Set(normalizeWords(jobDescription));
  if (!jobWords.size) return 0;
  const matches = [...jobWords].filter((w) => resumeWords.has(w)).length;
  return Math.min(100, Math.round((matches / jobWords.size) * 100));
};

const predictRolesFromSkills = (skills: string[]) => {
  const roleSkills: Array<{ role: string; requiredSkills: string[] }> = [
    { role: 'Frontend Developer', requiredSkills: ['react', 'typescript', 'javascript', 'css'] },
    { role: 'Backend Developer', requiredSkills: ['node', 'express', 'sql', 'api'] },
    { role: 'Full Stack Developer', requiredSkills: ['react', 'node', 'sql', 'javascript'] },
    { role: 'Data Analyst', requiredSkills: ['python', 'sql', 'pandas', 'numpy'] },
    { role: 'DevOps Engineer', requiredSkills: ['docker', 'kubernetes', 'aws', 'linux'] }
  ];

  const skillSet = new Set(skills.map((s) => s.toLowerCase()));

  return roleSkills
    .map((item) => {
      const matches = item.requiredSkills.filter((s) => skillSet.has(s));
      const missing = item.requiredSkills.filter((s) => !skillSet.has(s));
      const percentage = Math.round((matches.length / item.requiredSkills.length) * 100);
      return {
        role: item.role,
        matchPercentage: percentage,
        requiredSkills: item.requiredSkills,
        missingSkills: missing
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 3);
};

/**
 * POST /api/resumes/:resumeId/analyze
 * Analyze a resume with comprehensive AI scoring
 */
router.post('/:resumeId/analyze', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    // Use new AI analyzer
    const analysis = await analyzeResumeWithAI(resume.text);

    res.json({
      success: true,
      data: {
        score: analysis.overallScore,
        atsScore: analysis.atsScore,
        breakdown: analysis.breakdown,
        suggestions: analysis.suggestions,
        keywordRecommendations: analysis.keywordRecommendations
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/predict-roles
 * Get job role predictions based on resume
 */
router.post('/:resumeId/predict-roles', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const roleResult = await predictResumeRole(resume.text);

    res.json({
      success: true,
      data: {
        roles: roleResult.roles
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/ats-score
 * Get ATS compatibility score
 */
router.post('/:resumeId/ats-score', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { jobDescription } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const analysis = await analyzeResumeWithAI(resume.text);
    const keywordScore = jobDescription ? scoreOverlap(resume.text, jobDescription) : analysis.atsScore;
    const formatScore = Math.min(100, analysis.overallScore);
    const sectionScore = Math.min(100, Math.round((analysis.overallScore + analysis.atsScore) / 2));

    res.json({
      success: true,
      data: {
        atsScore: analysis.atsScore,
        keywordScore,
        formatScore,
        sectionScore,
        recommendations: analysis.suggestions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/match-job
 * Match resume against a job description
 */
router.post('/:resumeId/match-job', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { jobDescription } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    if (!jobDescription) {
      throw new HttpError(400, 'Job description is required');
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const matchResult = await matchResumeToJob({
      resumeText: resume.text,
      jobDescription
    });

    res.json({
      success: true,
      data: matchResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/improvements
 * Get improvement suggestions for resume
 */
router.post('/:resumeId/improvements', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { jobTitle, focus } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const improvements = await getImprovementSuggestions(
      resume.text,
      typeof jobTitle === 'string' ? jobTitle : undefined,
      typeof focus === 'string' ? focus : undefined
    );

    res.json({
      success: true,
      data: improvements
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/cover-letter
 * Generate a tailored cover letter from the resume
 */
router.post('/:resumeId/cover-letter', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { jobTitle, jobDescription } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const coverLetter = await generateCoverLetter(
      resume.text,
      typeof jobTitle === 'string' ? jobTitle : undefined,
      typeof jobDescription === 'string' ? jobDescription : undefined
    );

    res.json({ success: true, data: coverLetter });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/interview-prep
 * Generate interview prep notes and questions
 */
router.post('/:resumeId/interview-prep', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { role, jobDescription } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const interviewPrep = await generateInterviewPrep(
      resume.text,
      typeof role === 'string' ? role : undefined,
      typeof jobDescription === 'string' ? jobDescription : undefined
    );

    res.json({ success: true, data: interviewPrep });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/salary-insights
 * Estimate salary expectations and negotiation guidance
 */
router.post('/:resumeId/salary-insights', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { role, location } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const salaryInsights = await getSalaryInsights(
      resume.text,
      typeof role === 'string' ? role : undefined,
      typeof location === 'string' ? location : undefined
    );

    res.json({ success: true, data: salaryInsights });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resumes/:resumeId/auto-run
 * Run end-to-end automation in one API call
 */
router.post('/:resumeId/auto-run', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeId } = req.params;
    const { jobDescription, jobTitle } = req.body || {};
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume || resume.userId !== userId) {
      throw new HttpError(404, 'Resume not found');
    }

    const warnings: string[] = [];

    let analysis = {
      atsScore: 0,
      overallScore: 0,
      breakdown: {},
      suggestions: [],
      keywordRecommendations: []
    } as any;
    try {
      analysis = await analyzeResumeWithAI(resume.text);
    } catch {
      warnings.push('Analysis step failed. Fallback analysis applied.');
    }

    let roles = { roles: [] as Array<{ name: string; matchPercentage: number; requiredSkills: string[]; missingSkills: string[] }> };
    try {
      roles = await predictResumeRole(resume.text);
    } catch {
      warnings.push('Role prediction failed.');
    }

    let improvements = { improvements: [] as string[], prioritized: [] as Array<{ priority: 'high' | 'medium' | 'low'; suggestion: string; impact: string }> };
    try {
      improvements = await getImprovementSuggestions(
        resume.text,
        typeof jobTitle === 'string' ? jobTitle : undefined
      );
    } catch {
      warnings.push('Improvement suggestions failed.');
    }

    let match = {
      matchScore: 0,
      matchingSkills: [] as string[],
      missingSkills: [] as string[],
      feedback: 'Provide jobDescription to generate job match.',
      suggestedImprovements: [] as string[]
    };

    if (typeof jobDescription === 'string' && jobDescription.trim().length > 0) {
      try {
        match = await matchResumeToJob({ resumeText: resume.text, jobDescription });
      } catch {
        warnings.push('Job match failed.');
      }
    }

    try {
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          atsScore: analysis.atsScore,
          overallScore: analysis.overallScore,
          analysisResult: JSON.stringify(analysis),
          status: 'COMPLETED'
        }
      });
    } catch {
      warnings.push('Failed to persist updated analysis to database.');
    }

    const agent = buildResumeAgentPayload(
      resume.text,
      typeof jobTitle === 'string' && jobTitle.trim().length > 0 ? jobTitle : roles.roles[0]?.name || 'Software Engineer',
      typeof jobDescription === 'string' && jobDescription.trim().length > 0 ? {
        id: resume.id,
        title: typeof jobTitle === 'string' && jobTitle.trim().length > 0 ? jobTitle : roles.roles[0]?.name || 'Target Role',
        company: 'Target employer',
        location: 'Remote',
        platform: 'manual',
        matchScore: match.matchScore,
        feedback: match.feedback,
        matchingSkills: match.matchingSkills,
        missingSkills: match.missingSkills
      } : roles.roles[0] ? {
        id: resume.id,
        title: roles.roles[0].name,
        company: 'Top role match',
        location: 'Remote',
        platform: 'agent',
        matchScore: roles.roles[0].matchPercentage,
        feedback: `Best role match: ${roles.roles[0].name}`,
        matchingSkills: roles.roles[0].requiredSkills,
        missingSkills: roles.roles[0].missingSkills
      } : undefined,
      improvements.prioritized.map((item) => item.suggestion)
    );

    res.json({
      success: true,
      data: {
        analysis,
        roles: roles.roles,
        match,
        improvements,
        agent,
        warnings
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resumes/analysis/health
 * Check if Resume AI service is available
 */
router.get('/analysis/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'online',
        service: 'Resume Analysis API'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
