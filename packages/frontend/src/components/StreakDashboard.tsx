/**
 * Career Streak Dashboard Component
 * Shows daily tasks, points, level progression, badges, and leaderboard
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Zap, Award, TrendingUp, Users } from "lucide-react";

interface DailyTask {
  id: string;
  name: string;
  points: number;
  completed: boolean;
  icon: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: string;
  levelProgress: number;
  nextLevelPoints: number;
  badges: Badge[];
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  level: string;
  totalPoints: number;
  currentStreak: number;
}

export const StreakDashboard: React.FC = () => {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const LEVEL_COLORS: Record<string, string> = {
    "Job Seeker": "from-blue-400 to-blue-600",
    "Active Applicant": "from-purple-400 to-purple-600",
    "Interview Ready": "from-pink-400 to-pink-600",
    "Career Builder": "from-orange-400 to-orange-600",
    "Career Master": "from-red-400 to-red-600",
  };

  useEffect(() => {
    loadStats();
    loadTasks();
    loadLeaderboard();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      loadStats();
      loadTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/streak/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load stats");

      const data = await response.json();
      setStats(data.data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/streak/tasks", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load tasks");

      const data = await response.json();
      setTasks(data.data.tasks || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch("/api/streak/leaderboard?limit=10", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load leaderboard");

      const data = await response.json();
      setLeaderboard(data.data.leaderboard || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      const response = await fetch(`/api/streak/tasks/${taskId}/complete`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to complete task");

      await loadStats();
      await loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("❌ Failed to complete task");
    } finally {
      setCompletingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: string) =>
    LEVEL_COLORS[level] || "from-gray-400 to-gray-600";

  return (
    <div className="space-y-6">
      {/* Level & Streak Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level Card */}
          <div
            className={`bg-gradient-to-br ${getLevelColor(
              stats.level
            )} text-white rounded-lg p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Current Level</p>
                <h2 className="text-3xl font-bold">{stats.level}</h2>
              </div>
              <Award size={40} className="opacity-80" />
            </div>

            {/* Level Progress Bar */}
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span>{stats.totalPoints} points</span>
                <span>{stats.nextLevelPoints} to next</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white/60 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (stats.totalPoints / stats.nextLevelPoints) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Current Streak</p>
                <h2 className="text-3xl font-bold">{stats.currentStreak} days</h2>
              </div>
              <Zap size={40} className="opacity-80" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={16} />
                <span>Longest: {stats.longestStreak} days</span>
              </div>
              <p className="text-xs opacity-75 mt-2">
                Keep up the consistency to unlock more badges! 🎯
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Tasks */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" />
          Today's Tasks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => !task.completed && handleCompleteTask(task.id)}
              disabled={task.completed || completingTask === task.id}
              className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
                task.completed
                  ? "bg-gray-50 border-gray-200 cursor-default opacity-60"
                  : "border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100"
              }`}
            >
              <div className="text-2xl mb-2">{task.icon}</div>
              <h4 className="font-semibold text-sm mb-1">{task.name}</h4>
              <p className="text-xs font-bold text-yellow-600">+{task.points}pts</p>

              {task.completed ? (
                <CheckCircle2 className="mt-2 text-green-500 mx-auto" size={16} />
              ) : (
                <Circle className="mt-2 text-gray-300 mx-auto" size={16} />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          💡 Complete all 5 tasks daily for maximum points!
        </p>
      </div>

      {/* Badges */}
      {stats && stats.badges.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award size={20} className="text-purple-500" />
            Badges Earned ({stats.badges.length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.badges.map((badge) => (
              <div
                key={badge.id}
                className="text-center p-4 bg-gradient-to-b from-purple-50 to-pink-50 rounded-lg border border-purple-200"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-semibold text-sm">{badge.name}</p>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="w-full font-bold text-lg flex items-center justify-between mb-4 hover:opacity-80"
        >
          <span className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Top Career Builders
          </span>
          <span className="text-sm">{showLeaderboard ? "▼" : "▶"}</span>
        </button>

        {showLeaderboard && (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-gray-600 w-6">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{entry.username}</p>
                    <p className="text-xs text-gray-500">{entry.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{entry.totalPoints}pts</p>
                  <p className="text-xs text-gray-500">🔥 {entry.currentStreak}d</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
