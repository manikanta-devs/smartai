/**
 * Features Hub - Unified Dashboard
 * All 7 beginner-friendly features in one place
 * Tab navigation for easy access
 */

import React, { useState } from "react";
import { Share2, Zap, Briefcase, AlertCircle, GraduationCap, Gauge, Smile } from "lucide-react";
import { ShareCard } from "./ShareCard";
import { QuickWins } from "./QuickWins";
import { JobFitDetector } from "./JobFitDetector";
import { GapExplainer } from "./GapExplainer";
import { FirstJobMode } from "./FirstJobMode";
import { JobMatchMeter } from "./JobMatchMeter";
import { ConfidenceChecker } from "./ConfidenceChecker";

interface BeginnnerFeaturesHubProps {
  userId: string;
  resumeText: string;
  userExperience?: number; // years of experience
  userRole?: string;
  allJobs?: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary?: string;
    description: string;
  }>;
}

const FEATURES = [
  {
    id: "share",
    name: "Score Share",
    icon: Share2,
    description: "Create shareable resume scorecard",
  },
  {
    id: "quickwins",
    name: "Quick Wins",
    icon: Zap,
    description: "Get 3 easy 2-minute fixes",
  },
  {
    id: "jobfit",
    name: "Job Fits",
    icon: Briefcase,
    description: "See 5 jobs you qualify for",
  },
  {
    id: "gaps",
    name: "Gap Explainer",
    icon: AlertCircle,
    description: "Handle employment gaps",
  },
  {
    id: "fresher",
    name: "Fresher Mode",
    icon: GraduationCap,
    description: "For 0 experience users",
  },
  {
    id: "matcher",
    name: "Job Match",
    icon: Gauge,
    description: "Match resume to job",
  },
  {
    id: "confidence",
    name: "Confidence",
    icon: Smile,
    description: "Analyze resume language",
  },
];

export const BeginnerFeaturesHub: React.FC<BeginnnerFeaturesHubProps> = ({
  userId,
  resumeText,
  userExperience = 0,
  userRole = "Job Seeker",
  allJobs = [],
}) => {
  const [activeTab, setActiveTab] = useState("share");

  const renderFeature = () => {
    switch (activeTab) {
      case "share":
        return <ShareCard userData={{ name: "User", targetRole: "Role", atsScore: 85, percentile: 75, skillCount: 10, years: 2, keywords: 20 }} />;
      case "quickwins":
        return <QuickWins resumeText={resumeText} />;
      case "jobfit":
        return <JobFitDetector resumeText={resumeText} />;
      case "gaps":
        return <GapExplainer resumeText={resumeText} />;
      case "fresher":
        return (
          <FirstJobMode
            allJobs={allJobs}
            onGenerateCoverLetter={undefined}
            onApply={undefined}
          />
        );
      case "matcher":
        return <JobMatchMeter resumeText={resumeText} />;
      case "confidence":
        return <ConfidenceChecker resumeText={resumeText} />;
      default:
        return <ShareCard userData={{ name: "User", targetRole: "Role", atsScore: 85, percentile: 75, skillCount: 10, years: 2, keywords: 20 }} />;
    }
  };

  const currentFeature = FEATURES.find((f) => f.id === activeTab);
  const CurrentIcon = currentFeature?.icon || Share2;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-black mb-2">Resume AI Features</h1>
        <p className="text-gray-400">
          7 powerful tools to boost your job search — all free, all instant
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={`p-3 rounded-lg border transition-all ${
                activeTab === feature.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <feature.icon
                size={20}
                className="mx-auto mb-1"
              />
              <div className="text-xs font-bold">{feature.name}</div>
              <div className="text-xs text-gray-500">{feature.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Content */}
      <div className="max-w-6xl mx-auto">
        {/* Feature Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <CurrentIcon size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black">{currentFeature?.name}</h2>
            <p className="text-gray-400">{currentFeature?.description}</p>
          </div>
        </div>

        {/* Feature Component */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {renderFeature()}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-gray-400">
              Use all 7 features in order: Score Share → Quick Wins → Job Fits
              → Gaps → Matcher → Confidence → Fresher Mode (if applicable)
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">⚡ Speed</h3>
            <p className="text-sm text-gray-400">
              All features run instantly. No waiting, no expensive APIs. Pure
              speed.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">💰 Cost</h3>
            <p className="text-sm text-gray-400">
              $0 — Forever free. Uses Gemini free tier (15K requests/day).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeginnerFeaturesHub;
