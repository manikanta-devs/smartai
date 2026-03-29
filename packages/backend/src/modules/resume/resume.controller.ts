import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { parseResumeFile, extractResumeInfo } from "./resume.parser";
import { analyzeResumeWithAI } from "../../services/aiAnalyzer";
import { generateATSFriendlyResume, parseResumeToStructuredData } from "../../services/resumeService";

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
    if (!req.file || !req.user) {
      throw new HttpError(400, "No file or user");
    }

    const text = await parseResumeFile(req.file.buffer, req.file.originalname);
    const info = extractResumeInfo(text);
    const analysis = await analyzeResumeWithAI(text);

    const resume = await prisma.resume.create({
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

    res.status(201).json({ success: true, data: resume });
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
