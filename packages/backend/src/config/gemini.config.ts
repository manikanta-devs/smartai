/**
 * Google Gemini AI Configuration
 * Used for: Resume analysis, Cover letter generation, Career coaching, Gap explanation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../common/utils/logger";

// Initialize Gemini AI
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  logger.warn("⚠️ GOOGLE_GEMINI_API_KEY not set - AI features will be limited");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Get Gemini model instance
 * Model: gemini-1.5-flash (fast, free tier friendly)
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are Career OS, an AI career coach helping Indian students build better resumes and find jobs.
You are:
- Encouraging but honest
- Focus on practical, actionable advice
- Always emphasize honesty over shortcuts
- Familiar with Indian job market (FAANG in Bangalore, startups in Pune, etc)
- Respectful of different backgrounds and experience levels

When analyzing resumes:
1. Give specific, fixable feedback
2. Highlight strengths first
3. Suggest improvements with examples
4. Consider their tech stack and experience level

When explaining gaps:
1. Suggest HONEST explanations
2. Give interview talking points
3. Never suggest lying
4. Provide ways to address concerns

When coaching interviews:
1. Ask what type of role/company
2. Practice common questions
3. Give feedback on answers
4. Share tips specific to company

Important: Always be supportive. Students are often anxious about their career.`
  });
}

/**
 * Analyze resume with AI
 */
export async function analyzeResumeWithAI(resumeText: string) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
Analyze this resume and provide:
1. ATS Score (0-100): How well formatted for applicant tracking systems
2. Key Strengths: What stands out
3. Issues: What needs fixing
4. Top 3 Improvements: What would have biggest impact
5. Estimated Experience Level: Entry/Junior/Mid/Senior
6. Weak Words/Phrases: Common resume mistakes this has
7. Missing Sections: What's needed
8. Comparable Roles: Types of jobs this person could apply to

Resume:
${resumeText}

Format as JSON with scores and actionable feedback.`);

    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    logger.error("Error analyzing resume with AI:", error);
    throw new Error("Failed to analyze resume with AI");
  }
}

/**
 * Generate cover letter with AI
 */
export async function generateCoverLetterWithAI(
  resume: string,
  jobDescription: string,
  companyName: string
) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
Generate a professional, personalized cover letter.

Company: ${companyName}
Job Description:
${jobDescription}

Resume:
${resume}

Requirements:
1. 3-4 paragraphs
2. Specific to company and role (not generic)
3. Show how resume skills match job requirements
4. Professional but not robotic tone
5. Include call to action

Format: Plain text, ready to send.`);

    return result.response.text();
  } catch (error) {
    logger.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Analyze rejection reasons
 */
export async function analyzeRejectionWithAI(
  resume: string,
  jobDescription: string
) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
Why might this person have been rejected for this job? Be honest but constructive.

Resume:
${resume}

Job Requirements:
${jobDescription}

Analyze:
1. Likely rejection reasons (ranked by probability)
2. Skills/experience gaps
3. Red flags (if any)
4. How to improve chances next time
5. Alternative roles this person might be better suited for

Return as JSON with constructive feedback - goal is to help them improve, not demoralize.`);

    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    logger.error("Error analyzing rejection:", error);
    throw new Error("Failed to analyze rejection");
  }
}

/**
 * Generate interview tips
 */
export async function generateInterviewTipsWithAI(
  role: string,
  company: string,
  resume: string
) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
Generate interview tips for this person applying to this role at this company.

Role: ${role}
Company: ${company}

Resume:
${resume}

Provide:
1. 5 Common questions + how to answer based on their experience
2. 3 Questions they should ask interviewer
3. 3 Company-specific insights
4. Tips for showing cultural fit
5. How to talk about their gaps/weaknesses
6. 48-hour prep checklist

Make it specific to their background, not generic advice.`);

    return result.response.text();
  } catch (error) {
    logger.error("Error generating interview tips:", error);
    throw new Error("Failed to generate interview tips");
  }
}

/**
 * Get career coaching response
 */
export async function getCareerCoachResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
) {
  try {
    const model = getGeminiModel();
    
    // Build conversation with history
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "model",
        parts: [{ text: msg.content }]
      })),
      {
        role: "user" as const,
        parts: [{ text: userMessage }]
      }
    ];

    const result = await model.generateContent({
      contents: messages
    });

    return result.response.text();
  } catch (error) {
    logger.error("Error getting career coach response:", error);
    throw new Error("Failed to get coaching response");
  }
}

/**
 * Get skill recommendations
 */
export async function getSkillRecommendationsWithAI(
  currentSkills: string[],
  targetRole: string,
  experience: number
) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(`
Recommend skills for this person based on their background and goals.

Current Skills: ${currentSkills.join(", ")}
Target Role: ${targetRole}
Years of Experience: ${experience}

Provide:
1. Top 3 must-have skills
2. Top 3 nice-to-have skills
3. 3 Courses/resources to learn these skills (free preferred)
4. Timeline to learn each
5. How these skills help with ${targetRole}
6. Skills that are becoming less relevant

Focus on practical, achievable recommendations for Indian learners.`);

    return result.response.text();
  } catch (error) {
    logger.error("Error getting skill recommendations:", error);
    throw new Error("Failed to get skill recommendations");
  }
}

export default genAI;
