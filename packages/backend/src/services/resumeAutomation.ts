import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface JobMatchResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  feedback: string;
  suggestedImprovements: string[];
}

interface MatchJobRequest {
  resumeText: string;
  jobDescription: string;
}

export const matchResumeToJob = async ({
  resumeText,
  jobDescription
}: MatchJobRequest): Promise<JobMatchResult> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return fallbackJobMatch(resumeText, jobDescription);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const matchPrompt = `Analyze how well this resume matches the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Respond with ONLY this JSON (no markdown):
{
  "matchScore": <0-100>,
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "feedback": "<brief assessment>",
  "suggestedImprovements": ["improvement1", "improvement2"]
}`;

    const result = await model.generateContent(matchPrompt);
    const responseText = result.response.text();

    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/({[\s\S]*})/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      matchScore: Math.min(100, Math.max(0, parsed.matchScore || 0)),
      matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      feedback: parsed.feedback || "Match analysis complete",
      suggestedImprovements: Array.isArray(parsed.suggestedImprovements) ? parsed.suggestedImprovements : []
    };
  } catch (error) {
    console.error("Job match failed:", error);
    return fallbackJobMatch(resumeText, jobDescription);
  }
};

function fallbackJobMatch(resumeText: string, jobDescription: string): JobMatchResult {
  const resumeWords = resumeText.toLowerCase();
  const jobWords = jobDescription.toLowerCase();

  // Extract skills from job description
  const jobSkillKeywords = [
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "node",
    "express",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
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
    "graphql",
    "leadership",
    "communication",
    "agile",
    "scrum"
  ];

  const matchingSkills = jobSkillKeywords.filter((skill) => resumeWords.includes(skill) && jobWords.includes(skill));

  const missingSkills = jobSkillKeywords.filter((skill) => !resumeWords.includes(skill) && jobWords.includes(skill));

  const matchScore = Math.min(100, Math.floor((matchingSkills.length / (matchingSkills.length + missingSkills.length)) * 100) || 0);

  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 5),
    missingSkills: missingSkills.slice(0, 5),
    feedback: `Your resume matches ${matchScore}% of the job requirements. You have ${matchingSkills.length} matching skills.`,
    suggestedImprovements: [
      missingSkills.length > 0
        ? `Learn or highlight experience with: ${missingSkills.slice(0, 2).join(", ")}`
        : "Your skills are well-aligned",
      "Add specific achievements related to the job requirements",
      "Quantify your impact with metrics and results"
    ]
  };
}

interface RolePredictionResult {
  roles: Array<{
    name: string;
    matchPercentage: number;
    requiredSkills: string[];
    missingSkills: string[];
  }>;
}

export const predictResumeRole = async (resumeText: string): Promise<RolePredictionResult> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return fallbackRolePrediction(resumeText);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const rolePrompt = `Based on this resume, predict the most suitable job roles.

Resume:
${resumeText}

Respond with ONLY this JSON (no markdown):
{
  "roles": [
    {
      "name": "Role Name",
      "matchPercentage": <0-100>,
      "requiredSkills": ["skill1", "skill2"],
      "missingSkills": ["skill1"]
    }
  ]
}

Provide 3-5 role predictions sorted by match percentage (highest first).`;

    const result = await model.generateContent(rolePrompt);
    const responseText = result.response.text();

    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/({[\s\S]*})/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      roles: (Array.isArray(parsed.roles) ? parsed.roles : []).map((role: any) => ({
        name: role.name || "Unknown Role",
        matchPercentage: Math.min(100, Math.max(0, role.matchPercentage || 0)),
        requiredSkills: Array.isArray(role.requiredSkills) ? role.requiredSkills : [],
        missingSkills: Array.isArray(role.missingSkills) ? role.missingSkills : []
      }))
    };
  } catch (error) {
    console.error("Role prediction failed:", error);
    return fallbackRolePrediction(resumeText);
  }
};

function fallbackRolePrediction(resumeText: string): RolePredictionResult {
  const resumeWords = resumeText.toLowerCase();

  const roleProfiles: Record<string, { keywords: string[]; skills: string[] }> = {
    "Frontend Engineer": {
      keywords: ["react", "vue", "angular", "javascript", "typescript", "css", "html"],
      skills: ["React", "TypeScript", "UI/UX", "Responsive Design"]
    },
    "Backend Engineer": {
      keywords: ["node", "express", "python", "java", "api", "database", "sql", "mongodb"],
      skills: ["Node.js", "Database Design", "API Development", "Backend Systems"]
    },
    "Full Stack Developer": {
      keywords: ["react", "node", "javascript", "database", "full stack", "web"],
      skills: ["React", "Node.js", "Database", "Full Stack Development"]
    },
    "DevOps Engineer": {
      keywords: ["docker", "kubernetes", "aws", "ci/cd", "devops", "infrastructure"],
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD Pipelines"]
    },
    "Data Engineer": {
      keywords: ["python", "sql", "data", "analytics", "etl", "spark"],
      skills: ["Python", "SQL", "Data Processing", "Analytics"]
    }
  };

  const roleMatches = Object.entries(roleProfiles).map(([roleName, profile]) => {
    const matchingKeywords = profile.keywords.filter((keyword) => resumeWords.includes(keyword));
    const matchPercentage = Math.min(100, Math.floor((matchingKeywords.length / profile.keywords.length) * 100));

    return {
      name: roleName,
      matchPercentage,
      requiredSkills: profile.skills,
      missingSkills: profile.keywords.filter((keyword) => !resumeWords.includes(keyword)).slice(0, 2)
    };
  });

  return {
    roles: roleMatches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3)
  };
}

interface ImprovementResult {
  improvements: string[];
  prioritized: Array<{
    priority: "high" | "medium" | "low";
    suggestion: string;
    impact: string;
  }>;
}

export const getImprovementSuggestions = async (
  resumeText: string,
  targetRole?: string
): Promise<ImprovementResult> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return fallbackImprovements(resumeText, targetRole);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const improvementPrompt = `Generate specific resume improvement suggestions${targetRole ? ` for a ${targetRole} role` : ""}.

Resume:
${resumeText}

Respond with ONLY this JSON (no markdown):
{
  "improvements": ["suggestion1", "suggestion2"],
  "prioritized": [
    {
      "priority": "high|medium|low",
      "suggestion": "specific action",
      "impact": "expected outcome"
    }
  ]
}

Focus on: quantifiable achievements, ATS optimization, relevant keywords, clear formatting.`;

    const result = await model.generateContent(improvementPrompt);
    const responseText = result.response.text();

    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/({[\s\S]*})/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 10) : [],
      prioritized: (Array.isArray(parsed.prioritized) ? parsed.prioritized : []).map((item: any) => ({
        priority: (["high", "medium", "low"].includes(item.priority) ? item.priority : "medium") as "high" | "medium" | "low",
        suggestion: item.suggestion || "",
        impact: item.impact || ""
      }))
    };
  } catch (error) {
    console.error("Improvement suggestions failed:", error);
    return fallbackImprovements(resumeText, targetRole);
  }
};

function fallbackImprovements(resumeText: string, targetRole?: string): ImprovementResult {
  return {
    improvements: [
      "Add specific metrics and percentages to quantify achievements",
      "Include action verbs (Led, Developed, Implemented) to start bullet points",
      "Highlight relevant certifications and continuous learning",
      `${targetRole ? `Emphasize experience relevant to ${targetRole} roles` : "Align experience with target role"}`,
      "Maintain consistent formatting and clear section hierarchy",
      "Remove generic descriptions - be specific about your impact",
      "Include a professional summary tailored to your target role",
      "Add links to projects, GitHub, or portfolio if applicable"
    ],
    prioritized: [
      {
        priority: "high",
        suggestion: "Quantify all achievements with numbers",
        impact: "ATS systems better recognize your impact"
      },
      {
        priority: "high",
        suggestion: "Use role-specific keywords throughout",
        impact: "Higher match percentage with job descriptions"
      },
      {
        priority: "medium",
        suggestion: "Add a professional summary",
        impact: "Gives hiring managers quick overview of fit"
      },
      {
        priority: "medium",
        suggestion: "Include relevant certifications",
        impact: "Demonstrates ongoing professional development"
      }
    ]
  };
}
