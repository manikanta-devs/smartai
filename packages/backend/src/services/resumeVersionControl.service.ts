/**
 * Resume Version Control Service
 * Like Git for resumes - save, compare, restore versions
 */

import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";

export interface ResumeVersionDiff {
  type: "added" | "removed" | "modified";
  line: number;
  content: string;
  oldContent?: string;
}

/**
 * Calculate diff between two resume versions
 */
export function calculateDiff(
  oldText: string,
  newText: string
): ResumeVersionDiff[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const diffs: ResumeVersionDiff[] = [];

  // Simple diff: find added/removed/modified lines
  const maxLength = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLength; i++) {
    const oldLine = oldLines[i] || "";
    const newLine = newLines[i] || "";

    if (oldLine !== newLine) {
      if (!oldLine) {
        diffs.push({
          type: "added",
          line: i + 1,
          content: newLine,
        });
      } else if (!newLine) {
        diffs.push({
          type: "removed",
          line: i + 1,
          content: oldLine,
        });
      } else {
        diffs.push({
          type: "modified",
          line: i + 1,
          content: newLine,
          oldContent: oldLine,
        });
      }
    }
  }

  return diffs.slice(0, 20); // Return top 20 changes
}

/**
 * Save a new resume version
 */
export async function saveResumeVersion(
  resumeId: string,
  userId: string,
  versionName: string,
  content: string,
  atsScore: number,
  overallScore: number
) {
  // Get previous version to calculate diff
  const previousVersion = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
  });

  const changes =previousVersion
    ? calculateDiff(previousVersion.content, content)
    : [];

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId,
      userId,
      versionName,
      content,
      atsScore,
      overallScore,
      changes: JSON.stringify(changes),
    },
  });

  logger.info(
    `✓ Resume version saved: ${versionName} (Score: ${overallScore}%)`
  );

  return version;
}

/**
 * Get all versions for a resume
 */
export async function getResumeVersions(resumeId: string) {
  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      versionName: true,
      atsScore: true,
      overallScore: true,
      createdAt: true,
      isActive: true,
    },
  });

  // Add score changes
  const versionsWithChanges = versions.map((v: any, i: number) => ({
    ...v,
    scoreChange: i > 0 ? v.overallScore - versions[i - 1].overallScore : 0,
  }));

  return versionsWithChanges;
}

/**
 * Restore a specific version
 */
export async function restoreResumeVersion(
  versionId: string,
  userId: string
) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Create new version marking it as restored
  const restored = await prisma.resumeVersion.create({
    data: {
      resumeId: version.resumeId,
      userId,
      versionName: `${version.versionName} (Restored)`,
      content: version.content,
      atsScore: version.atsScore,
      overallScore: version.overallScore,
      changes: "",
      isActive: true,
    },
  });

  // Update resume with restored scores
  await prisma.resume.update({
    where: { id: version.resumeId },
    data: {
      atsScore: version.atsScore,
      overallScore: version.overallScore,
    },
  });

  logger.info(`✓ Resume version restored: ${version.versionName}`);

  return restored;
}

/**
 * Compare two versions side-by-side
 */
export async function compareVersions(versionId1: string, versionId2: string) {
  const [v1, v2] = await Promise.all([
    prisma.resumeVersion.findUnique({ where: { id: versionId1 } }),
    prisma.resumeVersion.findUnique({ where: { id: versionId2 } }),
  ]);

  if (!v1 || !v2) {
    throw new Error("Version not found");
  }

  const diffs = calculateDiff(v1.content, v2.content);

  return {
    version1: {
      id: v1.id,
      name: v1.versionName,
      score: v1.overallScore,
      createdAt: v1.createdAt,
    },
    version2: {
      id: v2.id,
      name: v2.versionName,
      score: v2.overallScore,
      createdAt: v2.createdAt,
    },
    diffs,
    scoreImprovement: v2.overallScore - v1.overallScore,
  };
}

/**
 * Get best performing version
 */
export async function getBestVersion(resumeId: string) {
  const best = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { overallScore: "desc" },
  });

  return best;
}

/**
 * Delete a version
 */
export async function deleteVersion(versionId: string, userId: string) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.resumeVersion.delete({
    where: { id: versionId },
  });

  logger.info(`✓ Resume version deleted: ${version.versionName}`);
}
