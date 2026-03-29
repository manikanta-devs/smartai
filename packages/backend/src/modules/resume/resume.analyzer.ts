export const analyzeResumeAI = async (text: string) => {
  try {
    // Try to use FastAPI backend for real AI analysis
    const fastApiUrl = process.env.FAST_API_URL || "http://localhost:8000";
    
    const response = await fetch(`${fastApiUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        resume_text: text,
        user_input: "Analyze this resume"
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        atsScore: Math.round(data.ats_score || 0),
        overallScore: Math.round((data.ats_score || 0) * 0.95),
        breakdown: {
          contact: { 
            score: data.scores?.contact || 0, 
            max: 25, 
            feedback: data.feedback?.contact || "Contact information" 
          },
          experience: { 
            score: data.scores?.experience || 0, 
            max: 25, 
            feedback: data.feedback?.experience || "Work experience" 
          },
          education: { 
            score: data.scores?.education || 0, 
            max: 20, 
            feedback: data.feedback?.education || "Education" 
          },
          skills: { 
            score: data.scores?.skills || 0, 
            max: 20, 
            feedback: data.feedback?.skills || "Technical skills" 
          },
          formatting: { 
            score: data.scores?.formatting || 0, 
            max: 10, 
            feedback: data.feedback?.formatting || "Formatting and structure" 
          }
        },
        suggestions: data.suggestions || ["Add more details to improve your ATS score"],
        keywordRecommendations: data.recommended_keywords || ["Add relevant keywords", "Industry terms", "Action verbs"]
      };
    }
  } catch (error) {
    console.warn("FastAPI analysis failed, using fallback:", error);
  }

  // Fallback to local analysis if FastAPI is unavailable
  const wordCount = text.split(/\s+/).length;
  const hasContact = /email|phone|linkedin|github/i.test(text);
  const hasExperience = /experience|work|employment|position|role/i.test(text);
  const hasEducation = /education|degree|bachelor|master|university|college/i.test(text);
  const hasSkills = /skills|technical|proficient|expertise/i.test(text);

  const scores = {
    contact: hasContact ? 25 : 10,
    experience: hasExperience ? 25 : 10,
    education: hasEducation ? 20 : 5,
    skills: hasSkills ? 20 : 5,
    formatting: wordCount > 300 ? 10 : 5
  };

  const overallScore = Math.min(100, Object.values(scores).reduce((a, b) => a + b, 0));
  const atsScore = Math.min(100, Math.floor(overallScore * 0.9 + Math.random() * 10));

  return {
    overallScore,
    atsScore,
    breakdown: {
      contact: { score: scores.contact, max: 25, feedback: hasContact ? "✓ Contact info found" : "✗ Add email/phone" },
      experience: { score: scores.experience, max: 25, feedback: hasExperience ? "✓ Experience listed" : "✗ Add work history" },
      education: { score: scores.education, max: 20, feedback: hasEducation ? "✓ Education included" : "✗ Add education" },
      skills: { score: scores.skills, max: 20, feedback: hasSkills ? "✓ Skills section found" : "✗ Add skills" },
      formatting: { score: scores.formatting, max: 10, feedback: wordCount > 300 ? "✓ Good length" : "✗ Expand content" }
    },
    suggestions: [
      !hasContact && "Add a clear contact section with email, phone, and LinkedIn",
      !hasExperience && "Include specific work experience with achievements",
      !hasEducation && "Add education details and relevant degrees",
      !hasSkills && "Create a dedicated skills section",
      wordCount < 300 && "Expand your resume with more details and achievements",
      wordCount > 1000 && "Consider condensing content - keep it concise"
    ].filter(Boolean),
    keywordRecommendations: [
      "Achievement metrics",
      "Action verbs (Led, Developed, Implemented)",
      "Industry keywords",
      "Quantifiable results",
      "Relevant certifications"
    ]
  };
};
