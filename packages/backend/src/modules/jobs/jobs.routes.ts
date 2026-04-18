import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { HttpError } from "../../common/middleware/error.middleware";
import { prisma } from "../../config/prisma";
import {
	getJobs,
	searchJobs,
	searchJobsByPayload,
	refreshJobs,
	getJobById,
	seedJobs,
	applyToJob,
	applyToExternalInternship,
	getUserApplications,
	studentSearch
} from "./jobs.controller";
import { getExtractedResumeData } from "../../services/resumeExtraction.service";
import { rewriteResumeForJob, scoreResumeAgainstJob } from "../../services/atsRewriter.service";
import { buildAutofillPackage, validateAutofillReadiness } from "../../services/formAutofill.service";
import { scoreJob, rankJobs, generateApplicationStrategy } from "../../services/jobFilter.service";
import { generateCoverLetter, scoreCoverLetterEffectiveness } from "../../services/coverLetterGenerator.service";
import { recordApplication, getApplicationStats, suggestFollowUpActions, generateApplicationReport } from "../../services/applicationTracking.service";
import { sendApplicationConfirmationEmail } from "../../services/applicationNotification.service";
import { logger } from "../../common/utils/logger";

const router = Router();

// ========== EXISTING ROUTES ==========
router.get("/seed", seedJobs);
router.post("/student-search", requireAuth, studentSearch);
router.get("/user/applications", requireAuth, getUserApplications);
router.post("/search", searchJobsByPayload);
router.post("/refresh", refreshJobs);
router.get("/search/:role", searchJobs);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.post("/:jobId/apply", requireAuth, applyToJob);
router.post("/apply-external-internship", requireAuth, applyToExternalInternship);

// ========== NEW ADVANCED ROUTES ==========

/**
 * POST /api/jobs/rewrite-resume
 * Generate ATS-optimized resume for specific job
 */
router.post("/rewrite-resume", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { resumeId, jobDescription, jobTitle, targetRole } = req.body;

		if (!resumeId || !jobDescription) {
			throw new HttpError(400, "resumeId and jobDescription are required");
		}

		// Get resume
		const resume = await prisma.resume.findFirst({
			where: { id: resumeId, userId: req.user.userId }
		});

		if (!resume) {
			throw new HttpError(404, "Resume not found");
		}

		// Get extracted data
		const extracted = await getExtractedResumeData(resumeId);
		if (!extracted) {
			throw new HttpError(400, "Could not extract resume data - ensure resume was uploaded");
		}

		// Rewrite resume
		const rewriteResult = await rewriteResumeForJob(
			{
				resumeText: resume.text,
				jobDescription,
				jobTitle,
				targetRole
			},
			extracted
		);

		// Score the rewrite
		const score = scoreResumeAgainstJob(rewriteResult.plainTextResume, jobDescription);

		res.json({
			success: true,
			data: {
				htmlResume: rewriteResult.htmlResume,
				plainTextResume: rewriteResult.plainTextResume,
				atsScore: rewriteResult.atsScore,
				recommendations: rewriteResult.recommendations,
				keywordMatches: rewriteResult.keywordMatches,
				missingKeywords: rewriteResult.missingScoredKeywords,
				optimizationDetails: {
					optimizedSummary: rewriteResult.optimizedSummary,
					score
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/autofill-package
 * Generate form autofill package for job application
 */
router.post("/autofill-package", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { resumeId, jobUrl, formHtml } = req.body;

		if (!resumeId || !jobUrl || !formHtml) {
			throw new HttpError(400, "resumeId, jobUrl, and formHtml are required");
		}

		// Get extracted data
		const extracted = await getExtractedResumeData(resumeId);
		if (!extracted) {
			throw new HttpError(400, "Could not extract resume data");
		}

		// Generate autofill package
		const autofillPackage = buildAutofillPackage(
			{
				name: extracted.contactInfo?.name,
				email: extracted.contactInfo?.email,
				phone: extracted.contactInfo?.phone,
				location: extracted.contactInfo?.location,
				summary: extracted.summary,
				skills: extracted.skills,
				experience: extracted.experience,
				education: extracted.education
			},
			formHtml,
			jobUrl
		);

		// Validate readiness
		const validation = validateAutofillReadiness(
			{
				name: extracted.contactInfo?.name,
				email: extracted.contactInfo?.email,
				phone: extracted.contactInfo?.phone,
				location: extracted.contactInfo?.location
			},
			["name", "email", "phone"]
		);

		res.json({
			success: true,
			data: {
				autofillPackage,
				validation,
				readiness: {
					isReady: validation.isReady,
					completeness: validation.readinessScore,
					missingFields: validation.missingFields
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/score-job
 * Score a job opportunity based on user profile
 */
router.post("/score-job", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { job, userProfile } = req.body;

		// Validate job object
		if (!job) {
			throw new HttpError(400, "Missing required field: job (object with title, description, company, etc)");
		}
		if (!job.title) throw new HttpError(400, "Missing job.title (string)");
		if (!job.description) throw new HttpError(400, "Missing job.description (string)");
		if (!job.company) throw new HttpError(400, "Missing job.company (string)");

		// Validate userProfile
		if (!userProfile) {
			throw new HttpError(400, "Missing required field: userProfile (object with targetRole, yearsExperience, skills)");
		}
		if (!userProfile.targetRole) throw new HttpError(400, "Missing userProfile.targetRole (string)");
		if (typeof userProfile.yearsExperience !== 'number') throw new HttpError(400, "Missing userProfile.yearsExperience (number)");
		if (!Array.isArray(userProfile.skills)) throw new HttpError(400, "Missing userProfile.skills (array of strings)");

		// Handle salary type - convert number to string
		if (job.salary && typeof job.salary === 'number') {
			job.salary = `$${job.salary}K`;
		}

		const score = scoreJob(job, userProfile);

		res.json({
			success: true,
			data: score
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/rank-jobs
 * Score and rank multiple job opportunities
 */
router.post("/rank-jobs", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { jobs, userProfile } = req.body;

		if (!jobs || !userProfile) {
			throw new HttpError(400, "jobs and userProfile are required");
		}

		// Score each job
		const scoredJobs = jobs.map((job: any) => scoreJob(job, userProfile));

		// Rank jobs
		const rankedJobs = rankJobs(scoredJobs);

		// Generate strategy
		const strategy = generateApplicationStrategy(rankedJobs);

		res.json({
			success: true,
			data: {
				ranked: rankedJobs,
				strategy
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/generate-cover-letter
 * Generate personalized cover letter for job
 */
router.post("/generate-cover-letter", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { jobTitle, companyName, jobDescription, candidateBackground, hiringManager, tone, length } = req.body;

		if (!jobTitle || !companyName || !jobDescription || !candidateBackground) {
			throw new HttpError(400, "All fields are required");
		}

		const letter = await generateCoverLetter(
			{
				candidateName: candidateBackground.name || "Hiring Manager",
				jobTitle,
				companyName,
				jobDescription,
				candidateBackground,
				tone: tone || "balanced",
				length: length || "medium"
			}
		);

		// Score the letter
		const effectiveness = letter ? scoreCoverLetterEffectiveness(letter.letter, jobDescription) : 0;

		res.json({
			success: true,
			data: {
				letter: letter?.letter || "",
				sections: letter?.sections || { opening: "", background: "", skills: "", motivation: "", closing: "" },
				effectiveness,
				customizationScore: letter?.customizationScore || 0,
				keywords: letter?.keywords || []
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/applications/record
 * Record a new job application
 */
router.post("/applications/record", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { jobId, jobTitle, company, jobUrl, atsScore, salaryExpected, location, type, description } = req.body;

		if (!jobId || !jobTitle || !company) {
			throw new HttpError(400, "jobId, jobTitle, and company are required");
		}

		const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
		if (!existingJob) {
			await prisma.job.create({
				data: {
					id: jobId,
					title: jobTitle,
					company,
					location: (location || "India").toString(),
					description: (description || "External application").toString(),
					requirements: JSON.stringify(["internship", "entry-level"]),
					salary: salaryExpected ? String(salaryExpected) : "",
					type: (type || "Internship").toString(),
					url: jobUrl ? String(jobUrl) : ""
				}
			});
		}

		const application = await recordApplication(req.user.userId, {
			jobId,
			jobTitle,
			company,
			jobUrl,
			atsScore,
			salaryExpected
		});

		if (!application) {
			throw new HttpError(500, "Failed to record application");
		}

		const user = await prisma.user.findUnique({
			where: { id: req.user.userId },
			select: { email: true, firstName: true, lastName: true }
		});

		await prisma.jobNotification.create({
			data: {
				userId: req.user.userId,
				jobId,
				jobTitle,
				company,
				matchScore: typeof atsScore === "number" ? atsScore : 75,
				reason: "manual_apply",
				notificationSent: true,
				sentAt: new Date(),
				clickedAt: new Date(),
				applied: true
			}
		});

		let mailStatus: { sent: boolean; skipped: boolean } = { sent: false, skipped: true };
		if (user?.email) {
			mailStatus = await sendApplicationConfirmationEmail({
				to: user.email,
				userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
				jobTitle,
				company,
				location: location || "India",
				jobUrl,
				applicationId: application.id
			});
		}

		res.json({
			success: true,
			data: {
				...application,
				notification: {
					emailSent: mailStatus.sent,
					emailSkipped: mailStatus.skipped
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * GET /api/jobs/applications/stats
 * Get application pipeline statistics
 */
router.get("/applications/stats", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const stats = await getApplicationStats(req.user.userId);

		res.json({
			success: true,
			data: stats
		});
	} catch (error) {
		next(error);
	}
});

/**
 * GET /api/jobs/applications/report
 * Get personalized application progress report
 */
router.get("/applications/report", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const report = await generateApplicationReport(req.user.userId);

		res.json({
			success: true,
			data: report
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/applications/:applicationId/follow-up-suggestions
 * Get suggested follow-up actions for an application
 */
router.post("/applications/:applicationId/follow-up-suggestions", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { application } = req.body;

		if (!application) {
			throw new HttpError(400, "application is required");
		}

		const suggestions = suggestFollowUpActions(application);

		res.json({
			success: true,
			data: {
				suggestions
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/score
 * Score a resume against a job description
 * Direct endpoint for resume-job matching
 */
router.post("/score", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { resumeText, jobDescription } = req.body;

		if (!resumeText || typeof resumeText !== 'string') {
			throw new HttpError(400, "resumeText is required (string)");
		}
		if (!jobDescription || typeof jobDescription !== 'string') {
			throw new HttpError(400, "jobDescription is required (string)");
		}

		// Score the resume against the job
		const score = scoreResumeAgainstJob(resumeText, jobDescription);

		res.json({
			success: true,
			data: {
				overallScore: score.overallScore,
				keywordScore: score.keywordScore,
				formatScore: score.formatScore,
				matchedKeywords: score.matchedKeywords || [],
				missingCritical: score.missingCritical || [],
				recommendations: score.recommendations || []
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/cover-letter
 * Generate a cover letter for a specific job
 */
router.post("/cover-letter", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user) throw new HttpError(401, "Unauthorized");

		const { resumeText, jobDescription, company, position } = req.body;

		if (!resumeText) throw new HttpError(400, "resumeText is required");
		if (!jobDescription) throw new HttpError(400, "jobDescription is required");
		if (!company) throw new HttpError(400, "company is required");
		if (!position) throw new HttpError(400, "position is required");

		const letter = await generateCoverLetter({
			candidateName: "Applicant",
			jobTitle: position,
			companyName: company,
			jobDescription,
			candidateBackground: {
				summary: resumeText,
				yearsExperience: 0,
				topSkills: [],
				achievements: []
			},
			tone: "balanced"
		});

		res.json({
			success: true,
			data: {
				coverLetter: letter?.letter || "Cover letter could not be generated",
				effectiveness: letter ? 75 : 0
			}
		});
	} catch (error) {
		next(error);
	}
});

/**
 * POST /api/jobs/applications
 * Record an application submission
 */
router.post("/applications", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.user || !req.user.id) throw new HttpError(401, "Unauthorized");

		const { jobId, jobTitle, company, resumeId, coverLetter, customAnswers, status } = req.body;

		if (!jobId) throw new HttpError(400, "jobId is required");
		if (!jobTitle) throw new HttpError(400, "jobTitle is required");
		if (!company) throw new HttpError(400, "company is required");

		// Get or create the job in our database
		let job = await prisma.job.findUnique({ where: { id: jobId } });
		
		if (!job) {
			job = await prisma.job.create({
				data: {
					id: jobId,
					title: jobTitle,
					company: company,
					description: "",
					requirements: "",
					url: "",
					location: "",
					salary: "",
					type: "FULLTIME"
				}
			});
		}

		// Record the application
		const application = await prisma.application.create({
			data: {
				userId: req.user.id!,
				jobId: jobId,
				jobTitle: jobTitle,
				company: company,
				status: status || "APPLIED",
				resumeVersionUsed: resumeId || "",
				notes: coverLetter || customAnswers ? `Cover Letter:\n${coverLetter}\n\nAnswers:\n${customAnswers}` : undefined,
				appliedAt: new Date()
			},
			include: {
				user: { select: { id: true, email: true } },
				job: true
			}
		});

		// Record this with applicationTracking service if available
		try {
			await recordApplication(req.user.id!, {
				jobId: jobId,
				jobTitle: jobTitle,
				company: company,
				resumeVersionUsed: resumeId,
				jobUrl: ""
			});
		} catch (error) {
			logger.warn("Could not record application tracking data:", error);
		}

		res.json({
			success: true,
			data: {
				applicationId: application.id,
				jobTitle: application.jobTitle,
				company: application.company,
				status: application.status,
				appliedAt: application.appliedAt,
				message: `Successfully applied to ${company}!`
			}
		});
	} catch (error) {
		next(error);
	}
});

export default router;
