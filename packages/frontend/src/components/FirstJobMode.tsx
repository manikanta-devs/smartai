/**
 * Feature 5: First Job Finder
 * Special mode only for freshers/students with 0 experience
 */

import React, { useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salaryRange?: string;
  applyUrl?: string;
}

interface FirstJobModeProps {
  allJobs: Job[];
  onGenerateCoverLetter?: (job: Job) => void;
  onApply?: (job: Job) => void;
}

export const FirstJobMode: React.FC<FirstJobModeProps> = ({
  allJobs,
  onGenerateCoverLetter,
  onApply,
}) => {
  const [showFresherOnly, setShowFresherOnly] = useState(true);

  // Filter fresher-friendly jobs
  const fresherJobs = allJobs.filter((job) => {
    const keywords = [
      "intern",
      "trainee",
      "junior",
      "entry",
      "fresher",
      "graduate",
      "apprentice",
    ];
    return keywords.some((k) => job.title.toLowerCase().includes(k));
  });

  const displayJobs = showFresherOnly ? fresherJobs : allJobs;

  return (
    <div className="space-y-6">
      {/* Special Banner */}
      <div className="relative overflow-hidden rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="text-4xl mb-2">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            First Job Mode — ON
          </h2>
          <p className="text-blue-200">
            Showing only fresher & internship opportunities — {fresherJobs.length}{" "}
            jobs found
          </p>
        </div>
      </div>

      {/* Tips Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: "📝", tip: "Apply to 10+ jobs daily" },
          { icon: "🎯", tip: "Highlight projects, not experience" },
          { icon: "💬", tip: "Customize each cover letter" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 flex items-center gap-2"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.tip}</span>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setShowFresherOnly(!showFresherOnly)}
        className={`px-4 py-2 rounded-lg text-sm transition ${
          showFresherOnly
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-300 border border-gray-700"
        }`}
      >
        {showFresherOnly ? "✓ Fresher Jobs Only" : "Show All Jobs"}
      </button>

      {/* Job Cards */}
      <div className="space-y-3">
        {displayJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No jobs matching your criteria</p>
          </div>
        ) : (
          displayJobs.map((job) => (
            <div
              key={job.id}
              className="bg-gray-900 border border-gray-700/50 rounded-lg p-4 hover:border-blue-500/30 transition"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400">
                    {job.company} • {job.location}
                  </p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                  Fresher OK ✓
                </span>
              </div>

              {/* Description snippet */}
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {job.description}
              </p>

              {/* Meta */}
              <div className="flex gap-2 text-xs text-gray-500 mb-4">
                {job.type && (
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {job.type}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {job.salaryRange}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onApply?.(job)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                >
                  Apply Now →
                </button>
                <button
                  onClick={() => onGenerateCoverLetter?.(job)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm font-semibold border border-gray-700 transition"
                >
                  ✍️ Cover Letter
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Motivation */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-4 text-center text-sm text-emerald-300">
        <Sparkles className="inline mr-2" size={16} />
        Every expert was once a beginner. Your first job is out there! 🚀
      </div>
    </div>
  );
};
