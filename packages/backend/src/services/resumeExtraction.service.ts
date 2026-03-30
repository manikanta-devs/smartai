/**
 * Resume data extraction service
 * Extracts structured data from resume text and stores it
 */

import { prisma } from "../config/prisma";
import { parseResumeToStructuredData } from "./resumeService";
import { logger } from "../common/utils/logger";

export interface ExtractedResumeData {
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

/**
 * Extract resume data from raw text and update Resume record
 */
export const extractAndStoreResumeData = async (
  resumeId: string,
  resumeText: string
): Promise<ExtractedResumeData | null> => {
  try {
    const extracted = parseResumeToStructuredData(resumeText);

    // Store extracted data on Resume record
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsedData: JSON.stringify(extracted)
      }
    });

    logger.info(`Extracted data for resume ${resumeId}`, { extracted });
    return extracted;
  } catch (error) {
    logger.error(`Failed to extract resume data for ${resumeId}:`, error);
    throw error;
  }
};

/**
 * Get extracted data for a resume
 */
export const getExtractedResumeData = async (
  resumeId: string
): Promise<ExtractedResumeData | null> => {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume) {
      return null;
    }

    if (resume.parsedData) {
      try {
        return JSON.parse(resume.parsedData);
      } catch {
        // If parsedData is corrupted, re-extract
        return await extractAndStoreResumeData(resumeId, resume.text);
      }
    }

    // If no parsedData exists, extract now
    return await extractAndStoreResumeData(resumeId, resume.text);
  } catch (error) {
    logger.error(`Failed to get extracted data for resume ${resumeId}:`, error);
    return null;
  }
};

/**
 * Extract specific field from resume (e.g., skills, experiences)
 */
export const extractResumeField = async (
  resumeId: string,
  field: keyof ExtractedResumeData
): Promise<any> => {
  try {
    const extracted = await getExtractedResumeData(resumeId);
    return extracted?.[field] || null;
  } catch (error) {
    logger.error(`Failed to extract field ${field} from resume ${resumeId}:`, error);
    return null;
  }
};

/**
 * Validate extracted resume data
 */
export const validateExtractedData = (data: ExtractedResumeData): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} => {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check contact info
  if (!data.contactInfo?.email) {
    missingFields.push("email");
  }
  if (!data.contactInfo?.name) {
    missingFields.push("name");
  }
  if (!data.contactInfo?.phone) {
    warnings.push("phone number not found");
  }

  // Check experience
  if (!data.experience || data.experience.length === 0) {
    warnings.push("no work experience found");
  }

  // Check education
  if (!data.education || data.education.length === 0) {
    warnings.push("no education found");
  }

  // Check skills
  if (!data.skills || data.skills.length === 0) {
    warnings.push("no skills found");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
};
