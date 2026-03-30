/**
 * Jobs API Routes
 * GET /api/jobs - Get all jobs with filters
 * GET /api/jobs/:id - Get single job
 * POST /api/applications - Apply to job
 * GET /api/applications - Get user's applications
 * PATCH /api/applications/:id - Update application status
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth as authenticateToken } from '../common/middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/jobs
 * Get jobs with filtering, sorting, and pagination
 * Query params: search, location, type, salary_min, salary_max, source, page, limit
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      location = '',
      type = '', // 'Full-time', 'Internship', 'Part-time'
      source = '', // 'naukri', 'indeed', 'linkedin', etc
      page = 1,
      limit = 20,
    } = req.query;

    const where: any = {};

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filter by location
    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    // Filter by type
    if (type) {
      where.type = { contains: type as string, mode: 'insensitive' };
    }

    // Filter by source
    if (source) {
      where.source = source as string;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.job.count({ where });

    // Get paginated jobs (newest first)
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip,
    });

    res.json({
      success: true,
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

/**
 * GET /api/jobs/:id
 * Get single job details
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        applications: {
          select: {
            id: true,
            userId: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

/**
 * POST /api/applications
 * Apply to a job
 * Body: { jobId, message, expectedSalary? }
 */
router.post('/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { jobId, message, expectedSalary } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID required' });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Check if already applied
    const existingApp = await prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existingApp) {
      return res
        .status(400)
        .json({ success: false, error: 'Already applied to this job' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        status: 'APPLIED',
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        salaryExpected: expectedSalary,
        notes: message || '',
        appliedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: `✅ Applied to ${job.title} at ${job.company}!`,
      application,
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ success: false, error: 'Failed to apply to job' });
  }
});

/**
 * GET /api/applications
 * Get user's applications with status tracking
 * Query: status (APPLIED, SHORTLISTED, INTERVIEW, OFFER, REJECTED)
 */
router.get('/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status as string;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Get total
    const total = await prisma.application.count({ where });

    // Get applications
    const applications = await prisma.application.findMany({
      where,
      include: {
        job: true,
        interviews: { orderBy: { scheduledAt: 'desc' } },
        followUps: { orderBy: { dueAt: 'asc' } },
      },
      orderBy: { appliedAt: 'desc' },
      take: limitNum,
      skip,
    });

    // Calculate stats
    const stats = await prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const statsSummary = {
      total,
      applied: stats.find((s: any) => s.status === 'APPLIED')?._count || 0,
      shortlisted: stats.find((s: any) => s.status === 'SHORTLISTED')?._count || 0,
      interviews: stats.find((s: any) => s.status === 'INTERVIEW')?._count || 0,
      offers: stats.find((s: any) => s.status === 'OFFER')?._count || 0,
      rejected: stats.find((s: any) => s.status === 'REJECTED')?._count || 0,
    };

    res.json({
      success: true,
      applications,
      stats: statsSummary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch applications' });
  }
});

/**
 * PATCH /api/applications/:id
 * Update application status
 * Body: { status, notes? }
 */
router.patch(
  '/applications/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { status, notes } = req.body;

      // Verify ownership
      const app = await prisma.application.findFirst({
        where: { id, userId },
      });

      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // Update
      const updated = await prisma.application.update({
        where: { id },
        data: {
          status: status || app.status,
          notes: notes || app.notes,
          lastUpdateAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `✅ Updated to ${updated.status}`,
        application: updated,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      res
        .status(500)
        .json({ success: false, error: 'Failed to update application' });
    }
  }
);

/**
 * DELETE /api/applications/:id
 * Withdraw application
 */
router.delete(
  '/applications/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const app = await prisma.application.findFirst({
        where: { id, userId },
      });

      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      await prisma.application.delete({ where: { id } });

      res.json({ success: true, message: 'Application withdrawn' });
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({ success: false, error: 'Failed to withdraw application' });
    }
  }
);

/**
 * GET /api/applications/stats/summary
 * Get quick stats for dashboard
 */
router.get(
  '/applications/stats/summary',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const [total, applied, shortlisted, interviews, offers, rejected] =
        await Promise.all([
          prisma.application.count({ where: { userId } }),
          prisma.application.count({
            where: { userId, status: 'APPLIED' },
          }),
          prisma.application.count({
            where: { userId, status: 'SHORTLISTED' },
          }),
          prisma.application.count({
            where: { userId, status: 'INTERVIEW' },
          }),
          prisma.application.count({
            where: { userId, status: 'OFFER' },
          }),
          prisma.application.count({
            where: { userId, status: 'REJECTED' },
          }),
        ]);

      const stats = {
        total,
        applied,
        shortlisted,
        interviews,
        offers,
        rejected,
        conversionRate:
          total > 0 ? ((shortlisted + interviews + offers) / total * 100).toFixed(1) : 0,
      };

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  }
);

export default router;
