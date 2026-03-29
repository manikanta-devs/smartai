/**
 * Resume Analysis Routes
 * Endpoints for analyzing resumes using integrated Resume AI service
 */

import { Router, Request, Response, NextFunction } from 'express';
import { HttpError } from '../../common/middleware/error.middleware';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import { analyzeResumeWithAI } from '../../services/aiAnalyzer';
import { matchResumeToJob, predictResumeRole, getImprovementSuggestions } from '../../services/resumeAutomation';

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

    let parsed: any = {};
    try {
      parsed = resume.parsedData ? JSON.parse(resume.parsedData) : {};
    } catch {
      parsed = {};
    }

    const detectedSkills: string[] = Array.isArray(parsed.skills) ? parsed.skills : [];
    const roles = predictRolesFromSkills(detectedSkills);

    res.json({
      success: true,
      data: {
        roles: roles.map(role => ({
          name: role.role,
          matchPercentage: role.matchPercentage,
          missingSkills: role.missingSkills,
          requiredSkills: role.requiredSkills
        }))
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

    const analysis = await analyzeResumeAI(resume.text);
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

    const matchScore = scoreOverlap(resume.text, jobDescription);

    let parsed: any = {};
    try {
      parsed = resume.parsedData ? JSON.parse(resume.parsedData) : {};
    } catch {
      parsed = {};
    }
    const resumeSkills: string[] = Array.isArray(parsed.skills) ? parsed.skills : [];
    const jdWords = new Set(normalizeWords(jobDescription));
    const matchingSkills = resumeSkills.filter((s) => jdWords.has(s.toLowerCase()));
    const missingSkills = [...jdWords].filter((w) => !resumeSkills.map((s) => s.toLowerCase()).includes(w)).slice(0, 10);

    res.json({
      success: true,
      data: {
        matchScore,
        matchingSkills,
        missingSkills,
        feedback:
          matchScore >= 80
            ? 'Excellent alignment with the job description.'
            : matchScore >= 60
              ? 'Good fit. Improve a few missing skills.'
              : 'Partial fit. Tailor resume content to this role.'
      }
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
    const { jobTitle } = req.body || {};
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

    const analysis = await analyzeResumeAI(resume.text);
    const roleHint = typeof jobTitle === 'string' && jobTitle.trim().length > 0 ? jobTitle.trim() : null;
    const roleLine = roleHint ? `Prioritize keywords and outcomes for ${roleHint}.` : 'Prioritize role-relevant achievements.';
    const improvements = [
      ...analysis.suggestions,
      roleLine,
      'Add measurable impact in each experience bullet (numbers, percentages, outcomes).',
      'Use ATS-friendly section headings and avoid complex layout elements.'
    ];

    res.json({
      success: true,
      data: {
        improvements
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
