/**
 * Feature 6: Job Match Meter
 * Paste job description and see live animated match meter
 */

import React, { useState } from "react";
import { Zap } from "lucide-react";

interface MatchResult {
  matchScore: number;
  verdict: string;
  foundKeywords: string[];
  missingKeywords: string[];
  strongPoints: string[];
  weakPoints: string[];
  applyAdvice: string;
}

interface JobMatchMeterProps {
  resumeText: string;
}

export const JobMatchMeter: React.FC<JobMatchMeterProps> = ({ resumeText }) => {
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const getMeterColor = (score: number) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const analyzeLocally = (): MatchResult => {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    const keywords = ["react", "typescript", "javascript", "node", "python", "sql", "aws", "docker", "testing", "api"];
    const foundKeywords = keywords.filter((keyword) => resumeLower.includes(keyword) && jobLower.includes(keyword));
    const missingKeywords = keywords.filter((keyword) => jobLower.includes(keyword) && !resumeLower.includes(keyword));
    const score = Math.max(20, Math.min(95, 45 + foundKeywords.length * 10 - missingKeywords.length * 5));

    return {
      matchScore: score,
      verdict: score >= 80 ? "Strong Match" : score >= 60 ? "Decent Match" : "Needs Work",
      foundKeywords: foundKeywords.length > 0 ? foundKeywords : ["Core experience", "Transferable skills"],
      missingKeywords: missingKeywords.length > 0 ? missingKeywords : ["No major gaps detected"],
      strongPoints: foundKeywords.length > 0 ? [`Matches ${foundKeywords.join(", ")}`] : ["Relevant project and work experience"],
      weakPoints: missingKeywords.length > 0 ? [`Add evidence for ${missingKeywords.slice(0, 2).join(", ")}`] : ["Tailor wording to the job description"],
      applyAdvice: score >= 60 ? "Apply and tailor the resume to this role." : "Apply only if you can add a few tailored examples.",
    };
  };

  const analyzeMatch = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true);

    try {
      const prompt = `Compare this resume to this exact job description.
        
Resume Extract: ${resumeText.substring(0, 1000)}
        
Job Description: ${jobDesc}
        
Score the match (0-100) based on:
- Required skills match
- Experience level match
- Keywords overlap
        
Return ONLY valid JSON:
{"matchScore": 72, "verdict": "Good Match", "foundKeywords": [...], "missingKeywords": [...], "strongPoints": [...], "weakPoints": [...], "applyAdvice": "..."}`;

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
      setResult(parsed);
    } catch (error) {
      console.error("Error analyzing match:", error);
      setResult(analyzeLocally());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-700/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" />
          Resume vs Job Matcher
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Paste any job description — see your match instantly
        </p>

        {/* Input */}
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          placeholder="Paste job description here..."
          className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 mb-3"
        />

        {/* Analyze Button */}
        <button
          onClick={analyzeMatch}
          disabled={!jobDesc || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Analyzing..." : "Check My Match →"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <div className="space-y-4">
          {/* BIG ANIMATED METER */}
          <div className="bg-gray-900 border border-gray-700/50 rounded-lg p-6 text-center">
            <p className="text-xs text-gray-400 mb-3">YOUR MATCH SCORE</p>

            {/* Meter bar */}
            <div className="bg-gray-800 rounded-full h-6 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-1500 ease-out"
                style={{
                  width: `${result.matchScore}%`,
                  background: `linear-gradient(90deg, ${getMeterColor(
                    result.matchScore
                  )}, ${getMeterColor(result.matchScore)}aa)`,
                  boxShadow: `0 0 20px ${getMeterColor(result.matchScore)}66`,
                }}
              />
            </div>

            <div
              className="text-5xl font-black mb-2"
              style={{ color: getMeterColor(result.matchScore) }}
            >
              {result.matchScore}%
            </div>
            <div
              className="font-bold text-lg"
              style={{ color: getMeterColor(result.matchScore) }}
            >
              {result.verdict}
            </div>
          </div>

          {/* Keywords grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Found */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="text-emerald-400 font-bold text-sm mb-2">✅ You Have</div>
              <div className="flex flex-wrap gap-1">
                {result.foundKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-400 font-bold text-sm mb-2">❌ Missing</div>
              <div className="flex flex-wrap gap-1">
                {result.missingKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Points */}
          {result.strongPoints.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 font-bold text-sm mb-2">💪 Strengths</div>
              <ul className="space-y-1">
                {result.strongPoints.map((p, i) => (
                  <li key={i} className="text-sm text-green-300">
                    ✓ {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.weakPoints.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="text-amber-400 font-bold text-sm mb-2">
                ⚠️ Gaps
              </div>
              <ul className="space-y-1">
                {result.weakPoints.map((p, i) => (
                  <li key={i} className="text-sm text-amber-300">
                    • {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Advice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center text-blue-300">
            🤖 AI Says: {result.applyAdvice}
          </div>
        </div>
      )}
    </div>
  );
};
