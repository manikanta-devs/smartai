/**
 * Unified Schemas - Single Source of Truth for All Data Validation
 * Fixes: Field naming inconsistencies, type mismatches, missing validation
 */

import { z } from "zod";

// ============================================================================
// USER & PROFILE SCHEMAS
// ============================================================================

export const userProfileSchema = z.object({
  yearsExperience: z.number().min(0).max(70),
  currentRole: z.string().min(1, "Current role is required"),
  targetRoles: z.array(z.string()).min(1, "Must have at least one target role"),
  skills: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  summary: z.string().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ============================================================================
// JOB SCHEMAS
// ============================================================================

export const salaryRangeSchema = z
  .union([
    z.string().regex(/^\$[\d,]+\s*-\s*\$[\d,]+$/, 'Salary must be formatted as "$150K - $200K"'),
    z.number()
      .transform((val) => `$${Math.floor(val / 1000)}K`)
      .refine((val) => typeof val === "string", "Invalid salary format")
  ])
  .transform((val) => {
    // Normalize to string
    if (typeof val === "number") {
      return `$${Math.floor(val / 1000)}K`;
    }
    return val;
  });

export const jobSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Job title must be at least 3 characters"),
  company: z.string().min(1, "Company name is required"),
  description: z.string().min(100, "Job description must be at least 100 characters"),
  salary: salaryRangeSchema.optional(),
  requirements: z.array(z.string()).min(1, "Must have at least one requirement"),
  location: z.string().optional(),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Remote"]).optional(),
  postDate: z.date().optional(),
});

export type Job = z.infer<typeof jobSchema>;

// ============================================================================
// RESUME SCHEMAS
// ============================================================================

export const resumeUploadSchema = z.object({
  file: z.instanceof(Buffer),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be under 10MB"),
});

export type ResumeUpload = z.infer<typeof resumeUploadSchema>;

export const extractedResumeSchema = z.object({
  contactInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      description: z.string(),
    })
  ).optional(),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      graduationDate: z.string(),
    })
  ).optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

export type ExtractedResume = z.infer<typeof extractedResumeSchema>;

// ============================================================================
// ANALYSIS & SCORING SCHEMAS
// ============================================================================

export const atsScoreSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  suggestions: z.array(z.string()),
});

export type ATSScore = z.infer<typeof atsScoreSchema>;

export const jobMatchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  feedback: z.string(),
});

export type JobMatch = z.infer<typeof jobMatchSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    })
  ).optional(),
  timestamp: z.date().optional(),
});

export type APIResponse<T = any> = z.infer<typeof apiResponseSchema> & {
  data?: T;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return { success: false, errors };
}

export function createSuccessResponse<T>(data: T, timestamp = new Date()): APIResponse<T> {
  return {
    success: true,
    data,
    timestamp,
  };
}

export function createErrorResponse(message: string, errors?: Array<{ field: string; message: string }>, timestamp = new Date()): APIResponse {
  return {
    success: false,
    error: message,
    errors,
    timestamp,
  };
}
