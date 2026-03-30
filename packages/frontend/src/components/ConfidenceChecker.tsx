/**
 * Feature 7: Confidence Checker
 * Analyzes resume language tone - NO API calls needed!
 * Pure JavaScript string matching for instant results
 */

import React, { useMemo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const WEAK_WORDS = [
  "helped",
  "assisted",
  "worked on",
  "tried to",
  "attempted",
  "was responsible for",
  "participated in",
  "involved in",
  "contributed to",
  "familiar with",
  "exposure to",
  "basic knowledge",
  "some experience",
  "sort of",
  "kind of",
  "maybe",
];

const STRONG_WORDS = [
  "led",
  "built",
  "created",
  "launched",
  "achieved",
  "delivered",
  "managed",
  "designed",
  "increased",
  "reduced",
  "improved",
  "drove",
  "spearheaded",
  "owned",
  "executed",
  "pioneered",
  "transformed",
];

const REPLACEMENTS: Record<string, string> = {
  helped: "led / drove / delivered",
  assisted: "supported / managed / executed",
  "worked on": "built / developed / created",
  "was responsible for": "owned / managed / led",
  "participated in": "contributed to / drove",
  "familiar with": "proficient in / skilled in",
  "involved in": "led / executed / delivered",
  "tried to": "← DELETE ENTIRELY",
  "contributed to": "led / built / delivered",
  "exposure to": "experienced in / skilled in",
  "some experience": "proficient in / skilled in",
  "basic knowledge": "solid understanding of",
};

interface ConfidenceCheckerProps {
  resumeText: string;
}

export const ConfidenceChecker: React.FC<ConfidenceCheckerProps> = ({
  resumeText,
}) => {
  const analysis = useMemo(() => {
    const text = resumeText.toLowerCase();

    // Find weak words
    const foundWeak = WEAK_WORDS.filter((word) => text.includes(word));

    // Find strong words
    const foundStrong = STRONG_WORDS.filter((word) => text.includes(word));

    // Calculate score
    const total = foundWeak.length + foundStrong.length;
    const confidenceScore =
      total === 0 ? 50 : Math.round((foundStrong.length / total) * 100);

    return {
      foundWeak,
      foundStrong,
      confidenceScore,
      total,
    };
  }, [resumeText]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
    if (score >= 50) return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" };
    return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Sounds Confident ✅";
    if (score >= 50) return "Sounds Average ⚠️";
    return "Sounds Weak ❌";
  };

  const colors = getScoreColor(analysis.confidenceScore);

  return (
    <div className="space-y-6">
      {/* Big Confidence Score */}
      <div
        className={`${colors.bg} border ${colors.border} rounded-lg p-6 text-center`}
      >
        <div className={`text-6xl font-black mb-2 ${colors.text}`}>
          {analysis.confidenceScore}%
        </div>
        <div className={`font-bold text-lg ${colors.text} mb-2`}>
          {getScoreLabel(analysis.confidenceScore)}
        </div>
        <div className="text-gray-400 text-sm">
          {analysis.foundStrong.length} strong words • {analysis.foundWeak.length}{" "}
          weak words found
        </div>
      </div>

      {/* Weak Words */}
      {analysis.foundWeak.length > 0 && (
        <div className="bg-gray-900 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-400 font-bold mb-3 flex items-center gap-2">
            <AlertCircle size={18} />
            🚨 Weak Words Found — Replace These:
          </div>

          <div className="space-y-2">
            {analysis.foundWeak.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                {/* Weak word */}
                <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                  "{word}"
                </div>

                <div className="text-gray-500">→</div>

                {/* Replacement */}
                <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold flex-1">
                  {REPLACEMENTS[word] || "Use stronger verb"}
                </div>

                {/* Copy button */}
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      REPLACEMENTS[word] || "Use stronger verb"
                    )
                  }
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-700 transition"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-gray-500 bg-red-500/5 p-2 rounded">
            💡 Replace all weak words can boost your callback rate by up to
            40%
          </div>
        </div>
      )}

      {/* Strong Words Found */}
      {analysis.foundStrong.length > 0 && (
        <div className="bg-gray-900 border border-emerald-500/30 rounded-lg p-4">
          <div className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} />
            ✅ Strong Words You Already Use:
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.foundStrong.map((word, i) => (
              <span
                key={i}
                className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm border border-emerald-500/30"
              >
                {word} ✓
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No words detected */}
      {analysis.total === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center text-blue-300">
          💭 Couldn't find strong or weak words in your resume.
          <br />
          Make sure you have job descriptions with action verbs!
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="font-bold text-white mb-2">💪 Power Words to Use:</div>
        <div className="text-sm text-gray-300">
          Replace weak language with: led, built, created, launched, achieved,
          delivered, managed, designed, increased, reduced, improved, drove,
          spearheaded, owned, executed
        </div>
      </div>
    </div>
  );
};
