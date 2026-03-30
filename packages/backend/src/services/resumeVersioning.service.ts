/**
 * Resume Versioning Service - Store and manage multiple resume versions
 * Optimize different resumes for different target roles
 */

import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";

export interface ResumeVersion {
  id: string;
  resumeId: string;
  targetRole: string;
  version: number;
  optimizedText: string;
  optimizedHtml: string;
  atsScore: number;
  keywords: string[];
  createdAt: Date;
  isPrimary: boolean;
}

export interface ResumeVersionMetadata {
  resumeId: string;
  baseText: string;
  targetRole: string;
  versions: Array<{
    version: number;
    targetRole: string;
    atsScore: number;
    createdAt: Date;
  }>;
  total: number;
  primary: number;
}

/**
 * Create a new resume version for a specific role
 */
export async function createResumeVersion(
  resumeId: string,
  userId: string,
  targetRole: string,
  optimizedText: string,
  optimizedHtml: string,
  atsScore: number,
  keywords: string[]
): Promise<ResumeVersion | null> {
  try {
    // Get existing resume
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Count existing versions for this role
    const existingVersions = resume.parsedData
      ? JSON.parse(resume.parsedData).versions || []
      : [];
    const roleVersions = existingVersions.filter(
      (v: any) => v.targetRole === targetRole
    ).length;

    const versionNumber = roleVersions + 1;

    // Store version metadata in parsedData or create new field
    const versionData = {
      id: `${resumeId}-${targetRole}-v${versionNumber}`,
      resumeId,
      targetRole,
      version: versionNumber,
      optimizedText,
      optimizedHtml,
      atsScore,
      keywords,
      createdAt: new Date(),
      isPrimary: versionNumber === 1
    };

    logger.info(`Created resume version for ${targetRole}`, versionData);

    return versionData as ResumeVersion;
  } catch (error) {
    logger.error("Failed to create resume version:", error);
    return null;
  }
}

/**
 * Get all versions of a resume
 */
export async function getResumeVersions(
  resumeId: string,
  userId: string
): Promise<ResumeVersionMetadata | null> {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume) {
      return null;
    }

    const versions = resume.parsedData
      ? JSON.parse(resume.parsedData).versions || []
      : [];

    return {
      resumeId,
      baseText: resume.text,
      targetRole: "Multiple",
      versions: versions.map((v: any) => ({
        version: v.version,
        targetRole: v.targetRole,
        atsScore: v.atsScore,
        createdAt: v.createdAt
      })),
      total: versions.length,
      primary: versions.findIndex((v: any) => v.isPrimary) + 1
    };
  } catch (error) {
    logger.error("Failed to get resume versions:", error);
    return null;
  }
}

/**
 * Get specific resume version
 */
export async function getResumeVersion(
  resumeId: string,
  userId: string,
  targetRole: string
): Promise<ResumeVersion | null> {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume || !resume.parsedData) {
      return null;
    }

    const versions = JSON.parse(resume.parsedData).versions || [];
    const version = versions.find(
      (v: any) => v.targetRole === targetRole && v.isPrimary
    );

    return version || null;
  } catch (error) {
    logger.error("Failed to get resume version:", error);
    return null;
  }
}

/**
 * Set primary resume for a role
 */
export async function setPrimaryResumeVersion(
  resumeId: string,
  userId: string,
  targetRole: string
): Promise<boolean> {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume || !resume.parsedData) {
      return false;
    }

    const parsed = JSON.parse(resume.parsedData);
    const versions = parsed.versions || [];

    // Update primary flags
    versions.forEach((v: any) => {
      v.isPrimary = v.targetRole === targetRole ? true : false;
    });

    parsed.versions = versions;

    await prisma.resume.update({
      where: { id: resumeId },
      data: { parsedData: JSON.stringify(parsed) }
    });

    logger.info(`Set primary resume version for ${targetRole}`);
    return true;
  } catch (error) {
    logger.error("Failed to set primary resume version:", error);
    return false;
  }
}

/**
 * Delete a specific resume version
 */
export async function deleteResumeVersion(
  resumeId: string,
  userId: string,
  targetRole: string
): Promise<boolean> {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume || !resume.parsedData) {
      return false;
    }

    const parsed = JSON.parse(resume.parsedData);
    const versions = parsed.versions || [];

    // Can't delete primary version
    const versionIndex = versions.findIndex((v: any) => v.targetRole === targetRole);
    if (versionIndex === -1) {
      return false;
    }

    if (versions[versionIndex].isPrimary) {
      throw new Error("Cannot delete primary resume version");
    }

    versions.splice(versionIndex, 1);
    parsed.versions = versions;

    await prisma.resume.update({
      where: { id: resumeId },
      data: { parsedData: JSON.stringify(parsed) }
    });

    logger.info(`Deleted resume version for ${targetRole}`);
    return true;
  } catch (error) {
    logger.error("Failed to delete resume version:", error);
    return false;
  }
}

/**
 * Compare two resume versions
 */
export function compareResumeVersions(
  version1: ResumeVersion,
  version2: ResumeVersion
): {
  differences: string[];
  atsImprovement: number;
  keywordGains: string[];
  keywordLosses: string[];
} {
  const differences: string[] = [];
  const atsImprovement = version2.atsScore - version1.atsScore;

  // Compare keywords
  const set1 = new Set(version1.keywords);
  const set2 = new Set(version2.keywords);

  const keywordGains = Array.from(set2).filter((k) => !set1.has(k));
  const keywordLosses = Array.from(set1).filter((k) => !set2.has(k));

  if (atsImprovement > 0) {
    differences.push(`ATS Score improved by ${atsImprovement} points`);
  } else if (atsImprovement < 0) {
    differences.push(`ATS Score decreased by ${Math.abs(atsImprovement)} points`);
  }

  if (keywordGains.length > 0) {
    differences.push(
      `Added ${keywordGains.length} new keywords: ${keywordGains.slice(0, 3).join(", ")}`
    );
  }

  if (keywordLosses.length > 0) {
    differences.push(
      `Removed ${keywordLosses.length} keywords: ${keywordLosses.slice(0, 3).join(", ")}`
    );
  }

  return {
    differences,
    atsImprovement,
    keywordGains,
    keywordLosses
  };
}

/**
 * Suggest next resume version to create
 */
export async function suggestNextVersion(
  resumeId: string,
  userId: string,
  appliedJobs: Array<{ targetRole: string; atsScore: number }>
): Promise<{ suggestedRole: string; reason: string; expectedImprovement: number } | null> {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });

    if (!resume || !resume.parsedData) {
      return null;
    }

    const parsed = JSON.parse(resume.parsedData);
    const existingVersions = parsed.versions || [];

    // Find role with most applications but lowest ATS score
    const roleStats: Record<string, { count: number; avgScore: number }> = {};

    appliedJobs.forEach((job) => {
      if (!roleStats[job.targetRole]) {
        roleStats[job.targetRole] = { count: 0, avgScore: 0 };
      }
      roleStats[job.targetRole].count += 1;
      roleStats[job.targetRole].avgScore += job.atsScore;
    });

    Object.keys(roleStats).forEach((role) => {
      roleStats[role].avgScore /= roleStats[role].count;
    });

    // Find role with most applications but no version
    let suggestedRole = "";
    let maxApplications = 0;

    Object.entries(roleStats).forEach(([role, stats]) => {
      const hasVersion = existingVersions.some((v: any) => v.targetRole === role);
      if (!hasVersion && stats.count > maxApplications) {
        suggestedRole = role;
        maxApplications = stats.count;
      }
    });

    if (!suggestedRole) {
      // Find lowest performing existing version
      const lowestPerforming = existingVersions.reduce((min: any, v: any) =>
        v.atsScore < min.atsScore ? v : min
      );

      suggestedRole = lowestPerforming.targetRole;
    }

    const expectedImprovement = roleStats[suggestedRole]
      ? Math.round(100 - roleStats[suggestedRole].avgScore)
      : 15;

    return {
      suggestedRole,
      reason:
        maxApplications > 0
          ? `${maxApplications} applications for ${suggestedRole} but no optimized version`
          : `Optimize for frequently applied role`,
      expectedImprovement
    };
  } catch (error) {
    logger.error("Failed to suggest next version:", error);
    return null;
  }
}
