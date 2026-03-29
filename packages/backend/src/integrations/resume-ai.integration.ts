/**
 * Resume AI Integration Service
 * Handles communication with Python Resume AI service
 */

import axios from 'axios';
import { logger } from '../common/utils/logger';

const RESUME_AI_URL = process.env.RESUME_AI_URL || 'http://localhost:8502';

interface ResumeAnalysisRequest {
  resumeText: string;
  userId: string;
}

interface ResumeAnalysisResponse {
  score: number;
  sections: Record<string, any>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordAnalysis: Record<string, number>;
}

interface RoleMatchResponse {
  role: string;
  matchPercentage: number;
  missingSkills: string[];
  requiredSkills: string[];
}

interface ATSScoringResponse {
  atsScore: number;
  keywordScore: number;
  formatScore: number;
  sectionScore: number;
  recommendations: string[];
}

interface BrainAnalyzeResponse {
  profile: Record<string, any>;
  analysis: Record<string, any>;
  ats: Record<string, any>;
  target_role: string;
  role_predictions: Array<Record<string, any>>;
  skill_gap: Record<string, any>;
  missing_keywords: string[];
  coach_message: string;
  why_not_hired: Array<Record<string, any>>;
  courses: Record<string, any>;
  jobs: Array<Record<string, any>>;
  resume_rebuild: Record<string, any>;
}

/**
 * Analyze resume using Resume AI service
 */
export async function analyzeResume(
  resumeText: string,
  userId: string
): Promise<ResumeAnalysisResponse> {
  try {
    logger.info(`Analyzing resume for user ${userId}`);

    // Call Resume AI service
    const response = await axios.post(`${RESUME_AI_URL}/api/analyze`, {
      resumeText,
      userId
    }, {
      timeout: 30000
    });

    logger.info(`Resume analysis completed for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error(`Resume AI analysis failed: ${error.message}`);
    throw new Error('Failed to analyze resume. Please try again.');
  }
}

/**
 * Get role predictions for resume
 */
export async function predictRoles(
  resumeText: string,
  userId: string
): Promise<RoleMatchResponse[]> {
  try {
    logger.info(`Predicting roles for user ${userId}`);

    const response = await axios.post(`${RESUME_AI_URL}/api/predict-roles`, {
      resumeText,
      userId
    }, {
      timeout: 30000
    });

    logger.info(`Role prediction completed for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error(`Role prediction failed: ${error.message}`);
    throw new Error('Failed to predict roles. Please try again.');
  }
}

/**
 * Score resume for ATS compatibility
 */
export async function scoreATSCompatibility(
  resumeText: string,
  userId: string
): Promise<ATSScoringResponse> {
  try {
    logger.info(`Scoring ATS compatibility for user ${userId}`);

    const response = await axios.post(`${RESUME_AI_URL}/api/ats-score`, {
      resumeText,
      userId
    }, {
      timeout: 30000
    });

    logger.info(`ATS scoring completed for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error(`ATS scoring failed: ${error.message}`);
    throw new Error('Failed to score ATS compatibility. Please try again.');
  }
}

/**
 * Match resume to job description
 */
export async function matchResumeToJob(
  resumeText: string,
  jobDescription: string,
  userId: string
): Promise<any> {
  try {
    logger.info(`Matching resume to job for user ${userId}`);

    const response = await axios.post(`${RESUME_AI_URL}/api/match-job`, {
      resumeText,
      jobDescription,
      userId
    }, {
      timeout: 30000
    });

    logger.info(`Job matching completed for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error(`Job matching failed: ${error.message}`);
    throw new Error('Failed to match resume to job. Please try again.');
  }
}

/**
 * Generate resume improvement suggestions
 */
export async function generateImprovements(
  resumeText: string,
  userId: string
): Promise<string[]> {
  try {
    logger.info(`Generating improvements for user ${userId}`);

    const response = await axios.post(`${RESUME_AI_URL}/api/improvements`, {
      resumeText,
      userId
    }, {
      timeout: 30000
    });

    logger.info(`Improvements generated for user ${userId}`);
    return response.data.improvements;
  } catch (error: any) {
    logger.error(`Improvement generation failed: ${error.message}`);
    throw new Error('Failed to generate improvements. Please try again.');
  }
}

/**
 * Unified AI Brain analysis
 */
export async function analyzeWithBrain(
  resumeText: string,
  userId: string,
  location?: string
): Promise<BrainAnalyzeResponse> {
  try {
    logger.info(`Running AI Brain analysis for user ${userId}`);

    const response = await axios.post(
      `${RESUME_AI_URL}/api/brain-analyze`,
      {
        resumeText,
        userId,
        location: location || ''
      },
      {
        timeout: 45000
      }
    );

    logger.info(`AI Brain analysis completed for user ${userId}`);
    return response.data;
  } catch (error: any) {
    logger.error(`AI Brain analysis failed: ${error.message}`);
    throw new Error('Failed to run AI Brain analysis. Please try again.');
  }
}

/**
 * Health check for Resume AI service
 */
export async function checkHealthStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${RESUME_AI_URL}/api/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('Resume AI service is not available');
    return false;
  }
}

export default {
  analyzeResume,
  predictRoles,
  scoreATSCompatibility,
  matchResumeToJob,
  generateImprovements,
  analyzeWithBrain,
  checkHealthStatus
};
