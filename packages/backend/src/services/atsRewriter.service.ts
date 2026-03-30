/**
 * ATS Rewriter Service - Enterprise-grade resume optimization
 * Rewrites resumes for specific jobs with keyword matching & formatting
 */

import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";
import type { ExtractedResumeData } from "./resumeExtraction.service";

export interface ATSRewriteRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  targetRole?: string;
}

export interface ATSRewriteResult {
  htmlResume: string;
  plainTextResume: string;
  optimizedSummary: string;
  keywordMatches: string[];
  missingScoredKeywords: { keyword: string; score: number }[];
  atsScore: number;
  recommendations: string[];
}

export interface ATSOptimization {
  id: string;
  resumeId: string;
  jobId?: string;
  targetRole: string;
  optimizedhtml: string;
  optimizedText: string;
  keywordScore: number;
  formatScore: number;
  totalScore: number;
  matchedKeywords: string[];
  missingKeywords: { keyword: string; importance: "high" | "medium" | "low" }[];
  createdAt: Date;
}

// Common ATS keywords by role
const ROLE_KEYWORDS: Record<string, { keywords: string[]; weight: number }> = {
  "frontend engineer": {
    keywords: [
      "React",
      "Vue",
      "Angular",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "Tailwind",
      "Responsive Design",
      "Component Development",
      "State Management",
      "REST API",
      "GraphQL",
      "Performance Optimization",
      "Testing",
      "Jest",
      "Webpack",
      "Git"
    ],
    weight: 1.0
  },
  "backend engineer": {
    keywords: [
      "Node.js",
      "Express",
      "Python",
      "Django",
      "FastAPI",
      "Java",
      "Spring",
      "Go",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Microservices",
      "REST API",
      "GraphQL",
      "Database Design",
      "SQL",
      "Authentication",
      "API Development",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP"
    ],
    weight: 1.0
  },
  "full stack developer": {
    keywords: [
      "React",
      "Node.js",
      "TypeScript",
      "JavaScript",
      "PostgreSQL",
      "MongoDB",
      "REST API",
      "GraphQL",
      "Docker",
      "Kubernetes",
      "AWS",
      "Database Design",
      "Component Development",
      "Microservices",
      "CI/CD",
      "Testing",
      "Git",
      "Agile"
    ],
    weight: 1.0
  },
  "devops engineer": {
    keywords: [
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "CI/CD",
      "Jenkins",
      "GitLab",
      "Terraform",
      "Infrastructure as Code",
      "Linux",
      "Networking",
      "Monitoring",
      "Logging",
      "Prometheus",
      "ELK Stack",
      "Security",
      "Automation"
    ],
    weight: 1.0
  },
  "data scientist": {
    keywords: [
      "Python",
      "R",
      "Machine Learning",
      "Deep Learning",
      "TensorFlow",
      "PyTorch",
      "Pandas",
      "NumPy",
      "Scikit-learn",
      "Data Analysis",
      "Statistical Modeling",
      "SQL",
      "Big Data",
      "Spark",
      "Data Visualization",
      "Tableau",
      "Business Intelligence",
      "A/B Testing"
    ],
    weight: 1.0
  }
};

/**
 * FIXED: Helper functions for scoring
 */
function scoreFormatting(text: string): number {
  let score = 10;
  // Bullet points
  if (text.includes("•") || text.includes("-") || text.includes("*")) score += 10;
  // Proper spacing
  if (text.split("\n\n").length > 3) score += 10;
  // Section headers
  if (/\b(experience|education|skills|summary)\b/i.test(text)) score += 10;
  return Math.min(30, score);
}

function scoreStructure(extracted: ExtractedResumeData): number {
  let score = 10;
  if (extracted.contactInfo?.email) score += 10;
  if (extracted.experience && extracted.experience.length > 0) score += 10;
  if (extracted.education && extracted.education.length > 0) score += 10;
  if (extracted.skills && extracted.skills.length > 0) score += 5;
  return Math.min(30, score);
}

function scoreContent(resumeText: string, jobDesc: string): number {
  let score = 10;
  const lowerResume = resumeText.toLowerCase();
  const lowerJob = jobDesc.toLowerCase();
  
  // Check for quantified achievements
  if (/\d+%|\$\d+|increased|improved|decreased|grew/i.test(resumeText)) score += 10;
  // Check for action verbs
  if (/led|managed|developed|designed|built|created|implemented/i.test(resumeText)) score += 10;
  // Check for industry match
  const jobWords = lowerJob.split(/\s+/).filter(w => w.length > 4);
  const matchedWords = jobWords.filter(w => lowerResume.includes(w)).length;
  if (matchedWords > jobWords.length * 0.2) score += 10;
  return Math.min(30, score);
}

/**
 * Extract keywords from job description
 */
export function extractJobKeywords(jobDescription: string): {
  keywords: string[];
  critical: string[];
  nice_to_have: string[];
} {
  const lower = jobDescription.toLowerCase();
  const lines = jobDescription.split("\n");

  // Basic keyword extraction
  const allKeywords: string[] = [];
  const critical: string[] = [];
  const nice_to_have: string[] = [];

  // Look for required section
  const requiredMatch = jobDescription.match(
    /(?:required|must have|necessary|required skills|technical requirements?)([\s\S]{0,1000}?)(?:\n\n|nice to have|preferred|$)/i
  );
  if (requiredMatch) {
    const requiredText = requiredMatch[1];
    const techs = [
      "JavaScript",
      "TypeScript",
      "React",
      "Vue",
      "Angular",
      "Node.js",
      "Express",
      "Python",
      "Django",
      "FastAPI",
      "Java",
      "Spring",
      "Go",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "GraphQL",
      "REST",
      "Microservices",
      "CI/CD",
      "Git",
      "Linux",
      "SQL",
      "API",
      "JSON",
      "XML",
      "HTML",
      "CSS",
      "Agile",
      "Scrum",
      "JIRA"
    ];

    techs.forEach((tech) => {
      if (requiredText.toLowerCase().includes(tech.toLowerCase())) {
        critical.push(tech);
      }
    });
  }

  // Look for nice-to-have section
  const niceMatch = jobDescription.match(
    /(?:nice to have|preferred|optional|beneficial)([\s\S]{0,500}?)(?:\n\n|$)/i
  );
  if (niceMatch) {
    const niceText = niceMatch[1];
    const techs = [
      "JavaScript",
      "TypeScript",
      "React",
      "Vue",
      "Angular",
      "Node.js",
      "AWS",
      "Docker",
      "GraphQL"
    ];

    techs.forEach((tech) => {
      if (niceText.toLowerCase().includes(tech.toLowerCase())) {
        nice_to_have.push(tech);
      }
    });
  }

  return {
    keywords: Array.from(new Set([...critical, ...nice_to_have])),
    critical,
    nice_to_have
  };
}

/**
 * Generate ATS-optimized summary
 */
export function generateATSSummary(
  extracted: ExtractedResumeData,
  jobDescription?: string,
  targetRole?: string
): string {
  const existing = extracted.summary || "";
  const keywords = jobDescription ? extractJobKeywords(jobDescription) : { keywords: [], critical: [], nice_to_have: [] };
  const roleKeywords =
    (targetRole &&
      ROLE_KEYWORDS[targetRole.toLowerCase()]?.keywords.slice(0, 3)) ||
    [];

  // Build quantified summary with keywords
  let summary = existing;

  // Add missing quantifiers if not present
  if (existing && !existing.match(/\d+\+?\s*years?/i)) {
    summary = `Experienced ${targetRole || "Software"} Professional with proven expertise in ${[...roleKeywords].slice(0, 3).join(", ")}. ${existing}`;
  }

  // Add specific achievements
  if (extracted.experience && extracted.experience.length > 0) {
    const latestRole = extracted.experience[0];
    if (!summary.includes("%") && !summary.includes("$")) {
      summary += ` Delivered scalable solutions and led technical initiatives resulting in measurable business impact.`;
    }
  }

  // Add keywords naturally
  const uniqueKeywords = Array.from(
    new Set([
      ...(keywords.critical || []).slice(0, 3),
      ...roleKeywords.slice(0, 2)
    ])
  );

  if (uniqueKeywords.length > 0 && !summary.match(new RegExp(uniqueKeywords[0], "i"))) {
    summary += ` Proficient in ${uniqueKeywords.join(", ")}.`;
  }

  return summary.substring(0, 250); // LinkedIn limit
}

/**
 * FIXED: Score resume against job requirements with proper keyword matching
 */
export function scoreResumeAgainstJob(
  resumeText: string,
  jobDescription: string,
  extracted?: ExtractedResumeData
): {
  overallScore: number;
  keywordScore: number;
  formatScore: number;
  matchedKeywords: string[];
  missingCritical: string[];
  recommendations: string[];
} {
  const jobKeywords = extractJobKeywords(jobDescription);
  const resumeLower = resumeText.toLowerCase();

  let keywordMatches = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  // FIXED: Score keyword matches - now actually works!
  jobKeywords.critical.forEach((keyword) => {
    // Case-insensitive exact word boundary search
    const pattern = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
    if (pattern.test(resumeLower)) {
      keywordMatches += 2;
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  jobKeywords.nice_to_have.forEach((keyword) => {
    const pattern = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
    if (pattern.test(resumeLower)) {
      keywordMatches += 1;
      matched.push(keyword);
    }
  });

  // Format scoring
  const formatScore = scoreFormatting(resumeText);
  
  // Keyword score (0-40 points)
  const maxKeywordScore = (jobKeywords.critical.length * 2) + (jobKeywords.nice_to_have.length * 1);
  const keywordScore = Math.min(40, Math.round((keywordMatches / (maxKeywordScore || 1)) * 40));

  // Structure score (0-30 points)
  const structureScore = extracted ? scoreStructure(extracted) : 20;

  // Content score (0-30 points)
  const contentScore = scoreContent(resumeText, jobDescription);

  // Overall score
  const overallScore = keywordScore + structureScore + contentScore;

  // Generate recommendations
  const recommendations: string[] = [];
  if (matched.length < jobKeywords.critical.length / 2) {
    recommendations.push(`Add missing critical keywords: ${missing.slice(0, 3).join(", ")}`);
  }
  if (formatScore < 20) {
    recommendations.push("Improve formatting: use consistent bullet points and clear sections");
  }
  if (!resumeLower.includes("achievement") && !resumeLower.includes("result")) {
    recommendations.push("Include quantified achievements (e.g., '25% efficiency improvement')");
  }

  return {
    overallScore,
    keywordScore,
    formatScore,
    matchedKeywords: [...new Set(matched)],
    missingCritical: missing.slice(0, 5),
    recommendations
  };
}

/**
 * Rewrite resume for specific job
 */
export async function rewriteResumeForJob(
  request: ATSRewriteRequest,
  extracted: ExtractedResumeData
): Promise<ATSRewriteResult> {
  try {
    logger.info("Starting ATS rewrite", { jobTitle: request.jobTitle });

    // Extract job keywords
    const jobKeywords = extractJobKeywords(request.jobDescription);
    const score = scoreResumeAgainstJob(
      request.resumeText,
      request.jobDescription,
      extracted
    );

    // Generate optimized summary
    const optimizedSummary = generateATSSummary(
      extracted,
      request.jobDescription,
      request.targetRole
    );

    // Reorder skills to match job requirements
    const optimizedSkills = [
      ...jobKeywords.critical.filter((k) =>
        extracted.skills?.some((s) => s.toLowerCase().includes(k.toLowerCase()))
      ),
      ...(extracted.skills || []).filter(
        (s) => !jobKeywords.critical.some((k) => s.toLowerCase().includes(k.toLowerCase()))
      )
    ].slice(0, 15);

    // Build optimized HTML
    const htmlResume = buildOptimizedHTML(
      {
        ...extracted,
        summary: optimizedSummary,
        skills: optimizedSkills
      },
      jobKeywords.critical
    );

    // Build plain text version
    const plainTextResume = htmlToPlainText(htmlResume);

    return {
      htmlResume,
      plainTextResume,
      optimizedSummary,
      keywordMatches: score.matchedKeywords,
      missingScoredKeywords: score.missingCritical.map((k) => ({
        keyword: k,
        score: 0
      })),
      atsScore: score.overallScore,
      recommendations: score.recommendations
    };
  } catch (error) {
    logger.error("ATS rewrite failed:", error);
    throw error;
  }
}

/**
 * Build optimized HTML for ATS systems
 */
function buildOptimizedHTML(
  data: ExtractedResumeData & { summary?: string },
  priorityKeywords: string[]
): string {
  const contact = data.contactInfo || {};

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #000; 
               background: #fff; padding: 40px; max-width: 850px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; 
                  padding-bottom: 10px; }
        .name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .contact-info { font-size: 11px; margin-bottom: 5px; line-height: 1.4; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase;
                         margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
        .entry { margin-bottom: 12px; }
        .entry-header { font-weight: bold; margin-bottom: 2px; }
        .entry-subheader { font-size: 11px; margin-bottom: 2px; color: #333; }
        .entry-description { font-size: 11px; line-height: 1.5; margin-top: 2px; }
        .skills-list { font-size: 11px; line-height: 1.6; }
        .skill-item { display: inline-block; margin-right: 15px; margin-bottom: 5px; }
        .keyword { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${contact.name || "Your Name"}</div>
        <div class="contact-info">
            ${contact.email ? `${contact.email}` : ""} 
            ${contact.phone ? `| ${contact.phone}` : ""}
            ${contact.location ? `| ${contact.location}` : ""}
            ${contact.linkedin ? `| LinkedIn: ${contact.linkedin}` : ""}
        </div>
    </div>

    ${
      data.summary
        ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p style="font-size: 11px; line-height: 1.5;">${data.summary}</p>
    </div>
    `
        : ""
    }

    ${
      (data.skills && data.skills.length > 0) || priorityKeywords.length > 0
        ? `
    <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="skills-list">
            ${priorityKeywords.map((k) => `<div class="skill-item"><span class="keyword">${k}</span></div>`).join("")}
            ${(data.skills || [])
              .slice(0, 15 - priorityKeywords.length)
              .map((s) => `<div class="skill-item">${s}</div>`)
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    ${
      data.experience && data.experience.length > 0
        ? `
    <div class="section">
        <div class="section-title">Professional Experience</div>
        ${data.experience
          .map(
            (job) => `
            <div class="entry">
                <div class="entry-header">${job.position}</div>
                <div class="entry-subheader">${job.company} | ${job.startDate} - ${job.endDate}</div>
                <div class="entry-description">${job.description}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      data.education && data.education.length > 0
        ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${data.education
          .map(
            (edu) => `
            <div class="entry">
                <div class="entry-header">${edu.degree} in ${edu.field}</div>
                <div class="entry-subheader">${edu.school} | ${edu.graduationDate}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }

    ${
      data.certifications && data.certifications.length > 0
        ? `
    <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications
          .map(
            (cert) => `
            <div class="entry">
                <div class="entry-header">${cert.name}</div>
                <div class="entry-subheader">${cert.issuer} | ${cert.date}</div>
            </div>
        `
          )
          .join("")}
    </div>
    `
        : ""
    }
</body>
</html>`;
}

/**
 * Convert HTML to plain text (ATS-friendly)
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n\n+/g, "\n");
}

/**
 * Store ATS optimization in database
 */
export async function storeATSOptimization(
  resumeId: string,
  jobId: string | undefined,
  targetRole: string,
  result: ATSRewriteResult
): Promise<void> {
  try {
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        // Store as JSON if needed, or create new table
        analysisResult: JSON.stringify({
          atsScore: result.atsScore,
          recommendations: result.recommendations
        })
      }
    });

    logger.info(`ATS optimization stored for resume ${resumeId}`);
  } catch (error) {
    logger.error("Failed to store ATS optimization:", error);
  }
}
