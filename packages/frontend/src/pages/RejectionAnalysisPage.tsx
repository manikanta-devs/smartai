import { useState } from "react";
import { RejectAnalyzer } from "../components/RejectAnalyzer";

export const RejectionAnalysisPage = () => {
  const [resumeText, setResumeText] = useState(`
John Smith
Email: john@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced React developer with 2 years of experience building interactive web applications. Skilled in JavaScript, React, and modern development practices with strong problem-solving abilities.

EXPERIENCE
Frontend Developer | Tech Startup Inc | Jan 2022 - Present
- Built and maintained React applications used by 1000+ users
- Implemented responsive UI components using React and CSS
- Collaborated with backend team to integrate REST APIs
- Improved page load time by 30% through code optimization

Junior Developer | Digital Agency | Jun 2021 - Dec 2021
- Developed website components using HTML, CSS, and JavaScript
- Fixed bugs and maintained existing codebase
- Participated in daily stand-ups and sprint planning

SKILLS
Languages: JavaScript, HTML, CSS
Frameworks: React, Node.js
Tools: Git, VS Code
Methods: Agile, REST APIs

EDUCATION
Bachelor of Science in Computer Science | State University | 2021
`);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f0919 100%)",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1 style={{ color: "white", fontSize: "32px", marginBottom: "8px" }}>
            🔥 "Why You Got Rejected" Analyzer
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Get brutally honest AI feedback on why you didn't get the job
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Resume Input */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "white", marginBottom: "12px" }}>
              📄 Your Resume
            </h3>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              style={{
                width: "100%",
                height: "300px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "12px",
                color: "white",
                fontSize: "12px",
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px" }}>
              Paste your resume here. The analyzer will compare it to job descriptions.
            </p>
          </div>

          {/* Analyzer */}
          <div>
            <RejectAnalyzer resumeText={resumeText} />
          </div>
        </div>

        {/* Info Section */}
        <div
          style={{
            marginTop: "40px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
          }}
        >
          <h3 style={{ marginBottom: "12px" }}>💡 How It Works</h3>
          <ul
            style={{
              color: "#e2e8f0",
              lineHeight: "1.8",
              paddingLeft: "24px",
            }}
          >
            <li>1. Paste your resume in the left panel</li>
            <li>2. Paste the job description in the analyzer</li>
            <li>3. AI will analyze why you got rejected + give exact reasons</li>
            <li>4. Get 4 options to fix it: Quick fixes, upskill, apply to easier roles</li>
            <li>5. Use AI rewritten summary to improve your resume</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
