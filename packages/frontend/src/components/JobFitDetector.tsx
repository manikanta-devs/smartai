/**
 * Feature 3: Job Fit Detector
 * AI reads resume and shows top 5 job roles user is already qualified for
 */

import React, { useState } from "react";
import { Target, TrendingUp } from "lucide-react";

interface JobFit {
  role: string;
  matchPercent: number;
  reasons: string[];
  gap: string;
  salaryRange: string;
  jobsAvailable: string;
}

interface JobFitDetectorProps {
  resumeText: string;
}

export const JobFitDetector: React.FC<JobFitDetectorProps> = ({ resumeText }) => {
  const [fits, setFits] = useState<JobFit[]>([]);
  const [loading, setLoading] = useState(false);

  const buildFallbackFits = (): JobFit[] => {
    const lower = resumeText.toLowerCase();
    const roles: Array<{ role: string; skills: string[]; gap: string; salaryRange: string; jobsAvailable: string }> = [
      { role: "Frontend Developer", skills: ["react", "javascript", "typescript", "css"], gap: "Missing backend knowledge", salaryRange: "$70K-$95K", jobsAvailable: "Very High" },
      { role: "Backend Developer", skills: ["node", "express", "api", "database"], gap: "Missing cloud deployment", salaryRange: "$80K-$110K", jobsAvailable: "High" },
      { role: "Full Stack Developer", skills: ["react", "node", "api", "database"], gap: "Missing system design", salaryRange: "$90K-$130K", jobsAvailable: "High" },
      { role: "Data Analyst", skills: ["python", "sql", "excel", "dashboard"], gap: "Missing advanced analytics", salaryRange: "$65K-$90K", jobsAvailable: "High" },
      { role: "QA Engineer", skills: ["testing", "automation", "selenium", "jest"], gap: "Missing test automation", salaryRange: "$60K-$85K", jobsAvailable: "Medium" },
    ];

    return roles
      .map((role) => {
        const matched = role.skills.filter((skill) => lower.includes(skill));
        const matchPercent = Math.min(95, 30 + matched.length * 15);
        return {
          role: role.role,
          matchPercent,
          reasons: matched.length > 0 ? [`Has ${matched.join(", ")}`] : ["Transferable skills and project experience"],
          gap: role.gap,
          salaryRange: role.salaryRange,
          jobsAvailable: role.jobsAvailable,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 5);
  };

  const detectJobFits = async () => {
    setLoading(true);
    try {
      const prompt = `Read this resume carefully.
Tell me the top 5 job roles this person
can apply to RIGHT NOW with their
CURRENT skills.
        
Return ONLY valid JSON:
{"fits": [{"role": "...", "matchPercent": 87, "reasons": [...], "gap": "...", "salaryRange": "...", "jobsAvailable": "..."}]}
        
Resume: ${resumeText}`;

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
      setFits(parsed.fits || []);
    } catch (error) {
      console.error("Error detecting job fits:", error);
      setFits(buildFallbackFits());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={detectJobFits}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "🎯 What Jobs Qualify Me?"}
      </button>

      {fits.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <Target size={20} />
            You Qualify For These Jobs RIGHT NOW
          </h3>
          <p className="text-sm text-gray-400">
            Based on your current skills — no extra learning needed
          </p>

          {fits.map((fit, i) => (
            <div
              key={i}
              className={`bg-gray-900 rounded-lg p-4 border ${
                i === 0 ? "border-blue-500/50" : "border-gray-700/50"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  {i === 0 && (
                    <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full mr-2 mb-2">
                      Best Match
                    </span>
                  )}
                  <div className="text-lg font-bold text-white">{fit.role}</div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{fit.matchPercent}%</div>
              </div>

              {/* Reasons */}
              <div className="mb-3 space-y-1">
                {fit.reasons.map((reason, j) => (
                  <div key={j} className="text-sm text-gray-300">
                    ✅ {reason}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full border border-amber-500/20">
                  ⚠️ {fit.gap}
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20">
                  💰 {fit.salaryRange}
                </span>
                <span className="text-xs bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20">
                  <TrendingUp size={12} className="inline mr-1" />
                  {fit.jobsAvailable}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
