/**
 * Premium Features Dashboard Page
 * Unified view for Career Coach, Resume Versions, and Career Streak
 */

import React, { useMemo } from "react";
import { CareerCoachWidget } from "../components/CareerCoachWidget";
import { ResumeVersionTimeline } from "../components/ResumeVersionTimeline";
import { StreakDashboard } from "../components/StreakDashboard";
import { Zap, MessageSquare, GitBranch } from "lucide-react";

interface PremiumFeaturesPageProps {
  resumeId?: string;
}

export const PremiumFeaturesPage: React.FC<PremiumFeaturesPageProps> = ({
  resumeId = "",
}) => {
  const tabs = useMemo(
    () => [
      {
        id: "streak",
        label: "Daily Streak",
        icon: <Zap size={20} />,
        color: "from-yellow-500 to-orange-600",
      },
      {
        id: "versions",
        label: "Resume Versions",
        icon: <GitBranch size={20} />,
        color: "from-blue-500 to-purple-600",
      },
      {
        id: "coach",
        label: "Career Coach",
        icon: <MessageSquare size={20} />,
        color: "from-purple-500 to-pink-600",
      },
    ],
    []
  );

  const [activeTab, setActiveTab] = React.useState(tabs[0].id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">✨ Premium Features</h1>
          <p className="text-blue-100">
            Your AI Career Companion - Track Progress, Optimize Resume, Build Momentum
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Streak Tab */}
          {activeTab === "streak" && (
            <div className="animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  🔥 Career Streak Challenge
                </h2>
                <p className="text-gray-600">
                  Complete daily tasks to build your streak, earn points, and level up your career
                  journey.
                </p>
              </div>
              <StreakDashboard />
            </div>
          )}

          {/* Resume Versions Tab */}
          {activeTab === "versions" && (
            <div className="animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  📝 Resume Version Control
                </h2>
                <p className="text-gray-600">
                  Track all your resume versions, see what changed, and easily restore previous
                  versions. Like Git for your resume!
                </p>
              </div>
              {resumeId ? (
                <ResumeVersionTimeline resumeId={resumeId} />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 mb-4">
                    Select a resume to view version history
                  </p>
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    Choose Resume
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Career Coach Tab */}
          {activeTab === "coach" && (
            <div className="animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  🤖 AI Career Coach
                </h2>
                <p className="text-gray-600">
                  Your personal AI coach is available 24/7 to help with resume optimization,
                  interview prep, job search strategy, and career guidance.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    title: "Resume Optimization",
                    desc: "Get AI-powered suggestions to improve your resume",
                    icon: "📄",
                  },
                  {
                    title: "Interview Prep",
                    desc: "Practice with AI and get feedback on your answers",
                    icon: "🎤",
                  },
                  {
                    title: "Career Strategy",
                    desc: "Receive personalized guidance for your job search",
                    icon: "🚀",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-lg transition"
                  >
                    <div className="text-4xl mb-2">{feature.icon}</div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">
                  💬 Open the chat widget in the bottom-right corner to start talking with your
                  AI coach!
                </p>
                <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                  Start Coaching Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span>🎯</span> Daily Consistency
            </h3>
            <p className="text-gray-600 text-sm">
              Build unstoppable momentum with daily tasks and streaks that keep you engaged and
              focused on your career goals.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span>🔄</span> Version Control
            </h3>
            <p className="text-gray-600 text-sm">
              Never lose a resume version again. Track changes, compare versions, and restore
              previous iterations instantly.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span>🤖</span> AI Intelligence
            </h3>
            <p className="text-gray-600 text-sm">
              Get personalized, contextual advice from your AI coach who understands your resume,
              goals, and career path.
            </p>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">7+</p>
              <p className="text-gray-700">Premium Features</p>
              <p className="text-sm text-gray-500 mt-1">Continuously growing</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600 mb-2">24/7</p>
              <p className="text-gray-700">AI Availability</p>
              <p className="text-sm text-gray-500 mt-1">Always there for you</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-pink-600 mb-2">FREE</p>
              <p className="text-gray-700">Forever</p>
              <p className="text-sm text-gray-500 mt-1">No hidden charges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Career Coach Widget */}
      <CareerCoachWidget />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
