// Local-only analysis helpers. No external AI calls.

interface ResumeAnalysis {
  atsScore: number;
  overallScore: number;
  breakdown: {
    contact: { score: number; max: number; feedback: string };
    experience: { score: number; max: number; feedback: string };
    education: { score: number; max: number; feedback: string };
    skills: { score: number; max: number; feedback: string };
    formatting: { score: number; max: number; feedback: string };
  };
  suggestions: string[];
  keywordRecommendations: string[];
}

export const analyzeResumeWithAI = async (resumeText: string): Promise<ResumeAnalysis> => {
  return fallbackAnalysis(resumeText);
};

function fallbackAnalysis(text: string): ResumeAnalysis {
  // Comprehensive fallback analysis
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const hasEmail = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+?1?\s?[-.\(]?\d{3}[-.\)]?\s?\d{3}[-.\s]?\d{4})|(\(\d{3}\)\s*\d{3}[-.\s]*\d{4})/.test(text);
  const hasLinkedIn = /linkedin\.com|linkedin/i.test(text);
  const hasLocation = /(new york|los angeles|chicago|houston|phoenix|new jersey|london|bangalore|mumbai|delhi|remote|hybrid)/i.test(text);

  const hasExperience = /\b(experience|work|employment|position|role|led|managed|developed)\b/i.test(text);
  const hasMetrics = /\b(\d+%|increased|decreased|improved|saved|generated|reduced)\b/i.test(text);
  const hasAchievements = /(award|achievement|recognition|promoted|led|managed|directed|oversaw)/i.test(text);

  const hasDegree = /(bachelor|master|phd|associate|degree|diploma|certificate|b\.s\.|b\.a\.|m\.s\.|m\.b\.a\.)/i.test(text);
  const hasUniversity = /(university|college|institute|school|academy)/i.test(text);

  const hasSkillsSection = /skills?:|technical skills?:|expertise:/i.test(text);
  const commonTechSkills = [
    "javascript",
    "typescript",
    "react",
    "node",
    "express",
    "python",
    "java",
    "c\+\+",
    "c#",
    "sql",
    "mongodb",
    "postgresql",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "rest",
    "graphql"
  ];
  const skillsFound = commonTechSkills.filter((skill) => new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i").test(text));

  const wordCount = text.split(/\s+/).length;
  const hasClearSections = /summary|objective|experience|education|skills|projects|certifications/i.test(text);
  const paragraphCount = text.split(/\n\n+/).length;

  // Calculate scores
  const contactScore =
    (hasEmail ? 10 : 0) + (hasPhone ? 8 : 0) + (hasLinkedIn ? 4 : 0) + (hasLocation ? 3 : 0);

  const experienceScore =
    (hasExperience ? 15 : 5) + (hasMetrics ? 5 : 0) + (hasAchievements ? 5 : 0);

  const educationScore = (hasDegree ? 15 : 5) + (hasUniversity ? 10 : 0);

  const skillsScore = (hasSkillsSection ? 10 : 5) + Math.min(15, skillsFound.length * 2);

  const formattingScore =
    (wordCount > 300 && wordCount < 1000 ? 10 : wordCount > 1000 ? 5 : 2) +
    (hasClearSections ? 10 : 0) +
    (paragraphCount > 5 ? 5 : 0);

  const atsScore = Math.min(
    100,
    contactScore +
      Math.min(25, experienceScore) +
      Math.min(25, educationScore) +
      Math.min(25, skillsScore) * 0.8 +
      formattingScore
  );

  const overallScore = Math.min(100, Math.floor((atsScore * 0.7 + (skillsFound.length * 3 + 20) * 0.3)));

  // Generate suggestions
  const suggestions: string[] = [];
  if (!hasEmail || !hasPhone) suggestions.push("Add clear contact information including email and phone number");
  if (!hasLinkedIn) suggestions.push("Include your LinkedIn profile URL for better professional visibility");
  if (!hasExperience) suggestions.push("Add a dedicated work experience section with specific roles and responsibilities");
  if (!hasMetrics && hasExperience) suggestions.push("Quantify your achievements with numbers, percentages, and measurable results");
  if (!hasDegree) suggestions.push("Include your educational background and degree information");
  if (skillsFound.length < 5) suggestions.push("Add more technical skills - employers look for specific proficiencies");
  if (wordCount < 300) suggestions.push("Expand your resume with more details and accomplishments");
  if (wordCount > 1000) suggestions.push("Consider condensing your resume - aim for 500-750 words");
  if (!hasClearSections) suggestions.push("Use clear section headers (Summary, Experience, Education, Skills)");

  // Extract keywords found
  const extractedKeywords = [
    ...skillsFound.slice(0, 3),
    hasMetrics ? "Quantifiable metrics" : null,
    hasAchievements ? "Leadership/achievements" : null,
    hasClearSections ? "Professional structure" : null,
    wordCount > 400 ? "Comprehensive content" : null
  ].filter(Boolean) as string[];

  const recommendedKeywords = [
    "Achievement metrics",
    "Action verbs (Led, Developed, Implemented)",
    ...extractedKeywords.slice(0, 3),
    "Industry keywords",
    "Quantifiable results",
    "Relevant certifications"
  ].slice(0, 10);

  return {
    atsScore: Math.min(100, atsScore),
    overallScore: Math.min(100, overallScore),
    breakdown: {
      contact: {
        score: Math.min(25, contactScore),
        max: 25,
        feedback: contactScore > 15 ? "✓ Complete contact information" : "✗ Add more contact details"
      },
      experience: {
        score: Math.min(25, experienceScore),
        max: 25,
        feedback: experienceScore > 15 ? "✓ Strong experience section" : "✗ Expand work history with achievements"
      },
      education: {
        score: Math.min(25, educationScore),
        max: 25,
        feedback: educationScore > 15 ? "✓ Education details included" : "✗ Add educational background"
      },
      skills: {
        score: Math.min(25, skillsScore),
        max: 25,
        feedback: skillsScore > 15 ? `✓ ${skillsFound.length} technical skills detected` : "✗ Add more technical skills"
      },
      formatting: {
        score: Math.min(25, formattingScore),
        max: 25,
        feedback: formattingScore > 15 ? "✓ Well-structured format" : "✗ Improve formatting and organization"
      }
    },
    suggestions: suggestions.slice(0, 5),
    keywordRecommendations: recommendedKeywords
  };
}
