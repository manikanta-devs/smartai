import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { parseResumeFile, extractResumeInfo } from "./resume.parser";
import { analyzeResumeWithAI } from "../../services/aiAnalyzer";
import { generateATSFriendlyResume, parseResumeToStructuredData } from "../../services/resumeService";
import { runAutomationForUser } from "../../services/automation.service";
import { getExtractedResumeData, validateExtractedData } from "../../services/resumeExtraction.service";
import { adjustResumeForJob } from "../../services/resumeAdjuster.service.free";

const normalizeResume = (resume: any) => {
  let parsedData: any = null;
  let analysisResult: any = null;

  try {
    parsedData = resume.parsedData ? JSON.parse(resume.parsedData) : null;
  } catch {
    parsedData = null;
  }

  try {
    analysisResult = resume.analysisResult ? JSON.parse(resume.analysisResult) : null;
  } catch {
    analysisResult = null;
  }

  return {
    ...resume,
    parsedData,
    analysisResult
  };
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["pdf", "docx", "doc", "txt"];
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (allowed.includes(ext || "")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

export const uploadResumeMiddleware = upload.single("file");

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    if (!req.file) {
      throw new HttpError(400, "No file uploaded");
    }

    const text = await parseResumeFile(req.file.buffer, req.file.originalname);
    const info = extractResumeInfo(text);
    const analysis = await analyzeResumeWithAI(text);

    let resume;

    try {
      resume = await prisma.resume.create({
        data: {
          userId: req.user.userId,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          text,
          parsedData: JSON.stringify(info),
          analysisResult: JSON.stringify(analysis),
          atsScore: analysis.atsScore,
          overallScore: analysis.overallScore,
          status: "COMPLETED"
        }
      });
    } catch (error) {
      console.error("Resume save failed:", error);
      throw error;
    }

    let automation = null;
    try {
      automation = await runAutomationForUser(req.user.userId, {
        resumeId: resume.id,
        mode: "upload"
      });
    } catch (error) {
      console.error("Automation run failed after upload:", error);
    }

    res.status(201).json({ success: true, data: { resume: normalizeResume(resume), automation } });
  } catch (error) {
    next(error);
  }
};

export const getUserResumes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: resumes.map(normalizeResume) });
  } catch (error) {
    next(error);
  }
};

export const getResumeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resume = await prisma.resume.findUniqueOrThrow({
      where: { id: req.params.id }
    });

    if (resume.userId !== req.user.userId) {
      throw new HttpError(403, "Forbidden");
    }

    res.json({ success: true, data: normalizeResume(resume) });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resume = await prisma.resume.findUniqueOrThrow({ where: { id: req.params.id } });
    if (resume.userId !== req.user.userId) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.resume.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (error) {
    next(error);
  }
};

export const downloadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resume = await prisma.resume.findUniqueOrThrow({
      where: { id: req.params.id }
    });

    if (resume.userId !== req.user.userId) {
      throw new HttpError(403, "Forbidden");
    }

    // Parse resume text into structured data
    const structuredData = parseResumeToStructuredData(resume.text);

    // Generate ATS-friendly HTML resume
    const htmlResume = generateATSFriendlyResume(structuredData);

    // Send as HTML response (can be saved as .html or converted to PDF)
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="Resume_ATS_Friendly.html"`);
    res.send(htmlResume);
  } catch (error) {
    next(error);
  }
};

export const getResumeAsHTML = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resume = await prisma.resume.findUniqueOrThrow({
      where: { id: req.params.id }
    });

    if (resume.userId !== req.user.userId) {
      throw new HttpError(403, "Forbidden");
    }

    // Parse resume text into structured data
    const structuredData = parseResumeToStructuredData(resume.text);

    // Generate ATS-friendly HTML resume
    const htmlResume = generateATSFriendlyResume(structuredData);

    res.setHeader("Content-Type", "text/html");
    res.send(htmlResume);
  } catch (error) {
    next(error);
  }
};

export const getExtractedData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const resume = await prisma.resume.findUniqueOrThrow({
      where: { id: req.params.id }
    });

    if (resume.userId !== req.user.userId) {
      throw new HttpError(403, "Forbidden");
    }

    const extracted = await getExtractedResumeData(resume.id);
    const validation = extracted ? validateExtractedData(extracted) : { isValid: false, missingFields: [], warnings: [] };

    res.json({
      success: true,
      data: {
        extracted,
        validation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust resume for a specific job
 * Analyzes job description and optimizes resume for maximum match
 */
export const adjustResumeForJobEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const { resumeId, jobDescription, jobTitle, company } = req.body;

    // Validate inputs
    if (!resumeId) throw new HttpError(400, "Missing resumeId (string)");
    if (!jobDescription) throw new HttpError(400, "Missing jobDescription (string)");
    if (!jobTitle) throw new HttpError(400, "Missing jobTitle (string)");
    if (!company) throw new HttpError(400, "Missing company (string)");

    // Get user's resume
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: req.user.userId
      }
    });

    if (!resume) {
      throw new HttpError(404, "Resume not found");
    }

    if (!resume.text) {
      throw new HttpError(400, "Resume has no text content");
    }

    // Adjust resume for job
    const adjustment = await adjustResumeForJob({
      resumeText: resume.text,
      jobDescription,
      jobTitle,
      company
    });

    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze resume content directly (without file upload)
 * Quick analysis endpoint for preview/testing
 */
export const analyzeResumeContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const { content, fileName } = req.body;

    if (!content || typeof content !== 'string') {
      throw new HttpError(400, "Resume content is required");
    }

    // Analyze without saving to database
    const analysis = await analyzeResumeWithAI(content);
    const info = extractResumeInfo(content);
    
    // Generate temporary ID for this analysis
    const tempResumeId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.status(200).json({
      success: true,
      data: {
        resumeId: tempResumeId,
        atsScore: analysis.atsScore,
        overallScore: analysis.overallScore,
        breakdown: analysis.breakdown,
        suggestions: analysis.suggestions,
        skills: info?.skills || [],
        keywordRecommendations: analysis.keywordRecommendations
      }
    });
  } catch (error) {
    next(error);
  }
};
