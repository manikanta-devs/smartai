/**
 * Feature 4: Gap Explainer
 * Detects employment gaps and generates professional explanations
 */

import React, { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
}

interface GapExplanation {
  reason: string;
  shortAnswer: string;
  coverLetterLine: string;
  tone: string;
}

interface GapExplainerProps {
  resumeText: string;
}

interface GapData {
  jobs: Job[];
  userContext: string;
}

export const GapExplainer: React.FC<GapExplainerProps> = ({ resumeText }) => {
  const [explanations, setExplanations] = useState<GapExplanation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const buildFallbackExplanations = (): GapExplanation[] => {
    const lower = resumeText.toLowerCase();
    const hasEducation = lower.includes("study") || lower.includes("learn") || lower.includes("course") || lower.includes("certification");
    const hasFreelance = lower.includes("freelance") || lower.includes("contract") || lower.includes("project");

    if (hasFreelance) {
      return [
        {
          reason: "Freelance and project work",
          shortAnswer: "I spent that period doing freelance and project-based work to broaden my experience.",
          coverLetterLine: "During this period, I completed freelance and project work that strengthened my practical skills.",
          tone: "confident",
        },
      ];
    }

    if (hasEducation) {
      return [
        {
          reason: "Upskilling and learning",
          shortAnswer: "I used that time to upskill through courses and hands-on practice so I could come back stronger.",
          coverLetterLine: "I focused on structured learning and practical practice during this period to improve my job readiness.",
          tone: "confident",
        },
      ];
    }

    return [
      {
        reason: "Personal development",
        shortAnswer: "I used that period for personal development and career preparation so I could return with a stronger focus.",
        coverLetterLine: "I took time for personal development and focused preparation before re-entering the job market.",
        tone: "confident",
      },
    ];
  };

  const explainGaps = async () => {
    setLoading(true);
    try {
      const prompt = `This person has employment gaps in their resume.
Their background: ${resumeText}
        
Write 3 SHORT professional explanations
for gaps that sound honest and positive.
        
Return ONLY valid JSON:
{"explanations": [{"reason": "...", "shortAnswer": "...", "coverLetterLine": "...", "tone": "confident"}]}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": import.meta.env.VITE_GEMINI_API_KEY || "",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      setExplanations(parsed.explanations || []);
    } catch (error) {
      console.error("Error explaining gaps:", error);
      setExplanations(buildFallbackExplanations());
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={explainGaps}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "💬 Generate Gap Explanations"}
      </button>

      {explanations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2 text-pink-400">
            <MessageCircle size={20} />
            Career Gap Explanations
          </h3>

          {explanations.map((exp, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-pink-500/30 rounded-lg p-4 space-y-3"
            >
              <div className="text-pink-400 font-bold">Option {i + 1}: {exp.reason}</div>

              {/* Interview answer */}
              <div>
                <div className="text-xs text-gray-400 mb-2">🎤 In Interview say:</div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-gray-200 italic mb-2">
                  "{exp.shortAnswer}"
                </div>
                <button
                  onClick={() => handleCopy(exp.shortAnswer, `interview-${i}`)}
                  className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  {copied === `interview-${i}` ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Cover letter */}
              {exp.coverLetterLine && (
                <div>
                  <div className="text-xs text-gray-400 mb-2">📝 For Cover Letter:</div>
                  <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 text-gray-200 italic mb-2">
                    "{exp.coverLetterLine}"
                  </div>
                  <button
                    onClick={() => handleCopy(exp.coverLetterLine, `cover-${i}`)}
                    className="text-xs bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 px-3 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    {copied === `cover-${i}` ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
