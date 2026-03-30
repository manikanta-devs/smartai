/**
 * Feature 2: Quick Wins
 * Shows 3 super easy fixes users can do in under 2 minutes each
 */

import React, { useState } from "react";
import { Zap } from "lucide-react";

interface Win {
  title: string;
  why: string;
  how: string;
  time: string;
  points: number;
}

interface QuickWinsProps {
  resumeText: string;
}

export const QuickWins: React.FC<QuickWinsProps> = ({ resumeText }) => {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(false);

  const buildFallbackWins = (): Win[] => {
    const lower = resumeText.toLowerCase();
    const wins: Win[] = [];

    if (!lower.includes("linkedin")) {
      wins.push({
        title: "Add LinkedIn URL",
        why: "Boosts recruiter trust and discoverability",
        how: "Place your LinkedIn profile beside your email at the top",
        time: "30 seconds",
        points: 5,
      });
    }

    if (!lower.match(/\b(\+?\d{10}|\d{3}[- ]\d{3}[- ]\d{4})\b/) && !lower.includes("phone")) {
      wins.push({
        title: "Add contact number",
        why: "Recruiters need a direct way to reach you",
        how: "Put your phone number in the header of the resume",
        time: "30 seconds",
        points: 5,
      });
    }

    if (!lower.includes("objective") && !lower.includes("summary")) {
      wins.push({
        title: "Add a short summary",
        why: "Gives ATS and recruiters a quick role match",
        how: "Write 2 lines highlighting role, skills, and experience",
        time: "2 minutes",
        points: 10,
      });
    }

    return wins.slice(0, 3);
  };

  const getQuickWins = async () => {
    setLoading(true);
    try {
      setWins(buildFallbackWins());
    } catch (error) {
      console.error("Error getting quick wins:", error);
      // Fallback wins
      setWins(buildFallbackWins());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={getQuickWins}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "⚡ Find My Quick Wins"}
      </button>

      {wins.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-400">
            <Zap size={20} />
            Quick Wins — Under 2 Minutes Each
          </h3>

          {wins.map((win, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-4"
            >
              {/* Left: Number */}
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                {i + 1}
              </div>

              {/* Middle: Text */}
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">{win.title}</div>
                <div className="text-sm text-gray-400">{win.how}</div>
              </div>

              {/* Right: Stats */}
              <div className="text-right flex-shrink-0">
                <div className="text-emerald-400 font-bold">+{win.points} pts</div>
                <div className="text-xs text-gray-500">⏱ {win.time}</div>
              </div>
            </div>
          ))}

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center text-sm text-emerald-300">
            💡 Applying all 3 can boost your score by {wins.reduce((s, w) => s + w.points, 0)}
            + points!
          </div>
        </div>
      )}
    </div>
  );
};
