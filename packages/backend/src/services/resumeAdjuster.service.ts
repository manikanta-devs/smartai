export { adjustResumeForJob } from "./resumeAdjuster.service.free";

function extractExperienceSection(resumeText: string): string {
  // Find "Experience" or "Work Experience" section
  const expRegex = /(?:experience|work experience|professional experience)([\s\S]*?)(?=(?:education|skills|projects|certification|$))/i;
  const match = resumeText.match(expRegex);
  return match ? match[1].trim() : resumeText.substring(0, 500);
}

function extractSkillsFromResume(resumeText: string): string[] {
  const skillsRegex = /(?:skills|technical skills|core competencies)([\s\S]*?)(?=(?:experience|education|projects|$))/i;
  const match = resumeText.match(skillsRegex);

  if (!match) return [];

  const skillsSection = match[1];
  // Split by common delimiters
  const skills = skillsSection
    .split(/[,•\n\-|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 50)
    .slice(0, 30);

  return skills;
}
