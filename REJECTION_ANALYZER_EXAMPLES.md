/**
 * Test Cases & Code Examples
 * Rejection Analyzer Feature
 */

// ============================================================================
// EXAMPLE 1: Test Case - Strong Match (High Success Rate)
// ============================================================================

const strongMatchTest = {
  name: "Strong Candidate Match",
  resume: `
    John Doe
    Senior Frontend Engineer | 5+ years
    
    SKILLS: React, TypeScript, Node.js, Docker, AWS, CI/CD
    EXPERIENCE: Built scalable React applications at FAANG companies
    CERTIFICATIONS: AWS Solutions Architect
  `,
  jobDescription: `
    Senior React Engineer - 3-5 years
    Required: React, TypeScript, Node.js
    Nice to have: Docker, AWS
    
    Build and maintain React applications at scale.
  `,
  expectedResult: {
    matchScore: "75-85",
    verdict: "Maybe or Selected",
    successChance: "70%+",
  },
};

// ============================================================================
// EXAMPLE 2: Test Case - Weak Match (Low Success Rate)
// ============================================================================

const weakMatchTest = {
  name: "Junior Applying for Senior Role",
  resume: `
    Jane Smith
    Junior Developer | 1 year
    
    SKILLS: HTML, CSS, JavaScript, jQuery
    EXPERIENCE: Built static websites
  `,
  jobDescription: `
    Senior Architect - 8+ years required
    Required: Kubernetes, Microservices, Cloud Native
    Must have: System Design, Architecture patterns
    
    Lead our infrastructure team of 10+ engineers.
  `,
  expectedResult: {
    matchScore: "15-25",
    verdict: "Not Selected",
    successChance: "5%",
    atsWouldReject: true,
  },
};

// ============================================================================
// EXAMPLE 3: API Test - Full Request & Response
// ============================================================================

const apiTest = {
  endpoint: "POST /api/analysis/rejection",
  headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR...",
    "Content-Type": "application/json",
  },
  request: {
    resumeText: "Jane Doe\nEmail: jane@example.com\n...",
    jobDescription: "We are looking for a Senior React Developer...",
  },
  response: {
    success: true,
    data: {
      analysis: {
        matchScore: 42,
        verdict: "Not Selected",
        verdictReason: "Missing several key technologies required",
        resumeStrengths: [
          "Has React experience",
          "Good communication skills",
        ],
        rejectionReasons: [
          {
            reason: "Missing TypeScript",
            severity: "critical",
            details: "Job mentions TypeScript in all 5 projects. Resume has zero.",
            fix: "Add TypeScript projects to experience section",
          },
          {
            reason: "No AWS/Cloud experience",
            severity: "high",
            details: "Requires AWS knowledge. Resume only mentions local development.",
            fix: "Add AWS project or course completion to skills",
          },
        ],
        keywordGaps: {
          inJD: [
            "TypeScript",
            "React",
            "Node.js",
            "AWS",
            "Docker",
            "CI/CD",
          ],
          inResume: ["React", "JavaScript", "Git"],
          missing: ["TypeScript", "AWS", "Docker", "CI/CD", "Node.js"],
        },
        experienceGap: {
          required: "5+ years",
          youHave: "2.5 years",
          verdict: "Under-qualified",
          advice: "You could apply anyway - many companies 70% match rule applies",
        },
        hiringSections: [
          {
            section: "Summary",
            jdExpects: "Senior engineer with leadership experience",
            resumeShows: "Mid-level engineer with project experience",
            status: "weak",
          },
          {
            section: "Experience",
            jdExpects: "Enterprise scale projects",
            resumeShows: "Startup and freelance projects",
            status: "mismatch",
          },
        ],
        atsWouldReject: true,
        atsReason: "Missing 5 of 8 critical keywords",
        options: {
          fixAndApply: {
            timeNeeded: "2 hours",
            scoreAfterFix: 72,
            successChance: "55%",
            quickFixes: [
              "Add TypeScript to skills",
              "Rewrite one project in TypeScript",
              "Add AWS to tools used",
            ],
          },
          upskillThenApply: {
            timeNeeded: "3 weeks",
            scoreAfterFix: 89,
            successChance: "82%",
            learnFirst: ["TypeScript Advanced", "AWS Fundamentals"],
          },
          applyToEasierRole: {
            suggestedRoles: [
              "Mid-level React Developer",
              "Full Stack Developer",
            ],
            reason: "Your 2.5 years matches better for these roles",
          },
        },
        rewrittenSummary:
          "Experienced React developer with 2.5 years building scalable web applications. Proficient in React, JavaScript, and AWS technologies. Seeking Senior Frontend role to lead architecture decisions.",
        motivationMessage:
          "You're closer than you think! Learning TypeScript and AWS in the next 3 weeks could make you highly competitive for this role. Don't hesitate to apply now - many teams appreciate continuous learners!",
      },
      timestamp: "2026-03-30T10:30:00Z",
      cached: false,
    },
  },
};

// ============================================================================
// EXAMPLE 4: Frontend Component Usage
// ============================================================================

const frontendUsageExample = `
import { RejectAnalyzer } from "@/components/RejectAnalyzer";
import { useState } from "react";

export function Dashboard() {
  const [resumeText, setResumeText] = useState(\`
    John Smith
    Senior Software Engineer | 5+ years
    
    EXPERIENCE:
    - Built React applications at Facebook (3 years)
    - Led team of 4 engineers
    - Mentored 2 junior developers
    
    SKILLS: React, TypeScript, Node.js, AWS, Docker
  \`);

  return (
    <div>
      <h1>My Dashboard</h1>
      
      {/* Use the analyzer anywhere */}
      <RejectAnalyzer resumeText={resumeText} />
    </div>
  );
}
`;

// ============================================================================
// EXAMPLE 5: Caching Behavior Test
// ============================================================================

const cachingTest = {
  description: "Same analysis called twice within 2 hours",
  step1: {
    time: "10:00:00",
    action: "User analyzes Resume A vs Job X",
    result: "API calls Gemini, returns analysis (5 seconds)",
    cacheKey: "abc123xyz",
  },
  step2: {
    time: "10:05:00",
    action: "Same user analyzes Resume A vs Job X again",
    result: "API returns cached result (50ms)",
    savings: "~4.95 seconds faster, $0.000015 saved",
  },
  step3: {
    time: "14:00:00",
    action: "User tries same analysis (4 hours later)",
    result: "Cache expired - new Gemini call",
    cacheKey: "still abc123xyz",
  },
};

// ============================================================================
// EXAMPLE 6: Error Handling
// ============================================================================

const errorHandlingExamples = {
  // Error 1: Resume too short
  error1: {
    status: 400,
    input: {
      resumeText: "Jane",
      jobDescription: "Senior Engineer",
    },
    response: {
      success: false,
      error: "Resume text must be at least 50 characters",
      details: {
        resumeText: "Resume text is required and must be substantial",
      },
    },
  },

  // Error 2: Job description missing
  error2: {
    status: 400,
    input: {
      resumeText: "Very long resume text here...",
      jobDescription: "Job",
    },
    response: {
      success: false,
      error: "Job description must be at least 50 characters",
      details: {
        jobDescription: "Job description is required and must be substantial",
      },
    },
  },

  // Error 3: Unauthorized (no token)
  error3: {
    status: 401,
    headers: {},
    response: {
      success: false,
      error: "Unauthorized",
    },
  },

  // Error 4: Gemini API fails (returns fallback)
  error4: {
    status: 200, // Still returns 200 with fallback
    response: {
      success: true,
      data: {
        analysis: {
          matchScore: 45,
          verdict: "Not Selected",
          // ... generic fallback analysis
        },
        warning: "Generated using fallback due to API error",
      },
    },
  },
};

// ============================================================================
// EXAMPLE 7: Analytics / Tracking
// ============================================================================

const analyticsExample = `
// Track user behavior after analysis
const trackAnalysis = (result: RejectionAnalysisResult) => {
  analytics.track("Rejection Analysis", {
    matchScore: result.matchScore,
    verdict: result.verdict,
    severeGapCount: result.rejectionReasons.filter(
      r => r.severity === "critical"
    ).length,
    userAction: trackUserAction(), // apply/upskill/easier_role
    timestamp: new Date(),
  });
};

// Track which fix option selected
const trackFixSelection = (option: string) => {
  analytics.track("Analysis Action Selected", {
    action: option, // "fix_apply", "upskill", "easier_role"
    timestamp: new Date(),
  });
};
`;

// ============================================================================
// EXAMPLE 8: Integration with Other Features
// ============================================================================

const integrationExamples = {
  withResumeParsing: `
    // Auto-fill rejection analyzer from parsed resume
    import { parseResume } from "@/services/parser";
    import { RejectAnalyzer } from "@/components/RejectAnalyzer";

    const pdf = await uploadResume(file);
    const parsed = await parseResume(pdf);
    
    return <RejectAnalyzer resumeText={parsed.fullText} />
  `,

  withATSAnalyzer: `
    // Show ATS score + rejection analysis together
    const atsScore = calculateATSScore(resumeText);
    const rejection = await analyzeRejection(resumeText, jobDesc);
    
    // ATS score predicts if bot rejects, rejection analysis shows why
  `,

  withJobMatcher: `
    // For each matched job, show rejection likelihood
    const rejectAnalysis = await analyzeRejection(
      userResume,
      matchedJob.description
    );
    
    if (rejectAnalysis.matchScore < 50) {
      alert("This job may not be right fit - see why");
    }
  `,

  withCoverLetterGenerator: `
    // Use rewritten summary in cover letter
    const analysis = await analyzeRejection(...);
    const coverLetter = await generateCoverLetter(
      analysis.rewrittenSummary,
      jobDescription
    );
  `,
};

// ============================================================================
// EXAMPLE 9: Quick Analysis (Heuristic Only)
// ============================================================================

const quickAnalysisExample = {
  endpoint: "POST /api/analysis/rejection/quick",
  description: "Faster analysis without Gemini (heuristic keywords only)",
  request: {
    resumeText: "Jane Doe...React...JavaScript...Git",
    jobDescription: "We need...TypeScript...React...AWS...Docker...",
  },
  response: {
    success: true,
    data: {
      analysis: {
        matchScore: 40,
        verdict: "Not Selected",
        verdictReason: "Your resume matches 40% of job requirements.",
        keywordGaps: {
          inJD: [
            "TypeScript",
            "React",
            "AWS",
            "Docker",
            "REST APIs",
            "PostgreSQL",
          ],
          inResume: ["JavaScript", "React", "Git"],
          missing: ["TypeScript", "AWS", "Docker", "REST APIs", "PostgreSQL"],
        },
      },
      method: "quick_heuristic",
      timestamp: "2026-03-30T10:30:00Z",
    },
  },
};

// ============================================================================
// EXAMPLE 10: Performance Metrics
// ============================================================================

const performanceMetrics = {
  "API Response Time (Gemini)": "2-5 seconds",
  "API Response Time (Quick)": "<500ms",
  "Cache Hit Time": "50-100ms",
  "Database Queries": 0,
  "External API Calls": 1,
  "Component Render Time": "<100ms",
  "Bundle Size (Component)": "~15KB",
  "Bundle Size (Service)": "~5KB",
};

// ============================================================================
// Export for testing
// ============================================================================

export {
  strongMatchTest,
  weakMatchTest,
  apiTest,
  cachingTest,
  errorHandlingExamples,
  performanceMetrics,
};
