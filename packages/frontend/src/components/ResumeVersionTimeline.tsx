/**
 * Resume Version Timeline Component
 * Shows version history with diffs and allows restore
 */

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Clock, Download, Undo2, Trash2 } from "lucide-react";

interface Diff {
  type: "added" | "removed" | "modified";
  line: string;
  lineNumber: number;
}

interface ResumeVersion {
  id: string;
  versionName: string;
  atsScore: number;
  overallScore: number;
  createdAt: string;
  changes: Diff[];
}

interface ResumeVersionTimelineProps {
  resumeId: string;
  onVersionRestore?: (versionId: string) => void;
}

export const ResumeVersionTimeline: React.FC<ResumeVersionTimelineProps> = ({
  resumeId,
  onVersionRestore,
}) => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState<{
    v1?: string;
    v2?: string;
  }>({});

  useEffect(() => {
    loadVersions();
  }, [resumeId]);

  const loadVersions = async () => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load versions");

      const data = await response.json();
      setVersions(data.data?.versions || []);
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}/restore`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to restore version");

      await loadVersions();
      onVersionRestore?.(versionId);
      alert("✅ Version restored successfully!");
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("❌ Failed to restore version");
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this version?")) return;

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to delete version");

      setVersions((prev) => prev.filter((v) => v.id !== versionId));
      alert("✅ Version deleted");
    } catch (error) {
      console.error("Error deleting version:", error);
      alert("❌ Failed to delete version");
    }
  };

  const getScoreChange = (index: number): { value: number; direction: string } | null => {
    if (index === 0 || !versions[index - 1]) return null;
    const change = versions[index].overallScore - versions[index - 1].overallScore;
    return {
      value: Math.abs(change),
      direction: change >= 0 ? "up" : "down",
    };
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">No resume versions yet. Start editing to create versions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-blue-600" />
            <h3 className="font-bold text-lg">Version History</h3>
          </div>
          <p className="text-sm text-gray-600">{versions.length} versions saved</p>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto">
          {versions.map((version, index) => {
            const scoreChange = getScoreChange(index);
            return (
              <div key={version.id} className="hover:bg-gray-50 transition">
                {/* Version Summary */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === version.id ? null : version.id)
                  }
                  className="w-full text-left px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-semibold text-gray-900">
                        {version.versionName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm">
                        ATS Score:{" "}
                        <span className="font-bold text-purple-600">
                          {version.atsScore}%
                        </span>
                      </span>
                      <span className="text-sm">
                        Overall:{" "}
                        <span className="font-bold text-blue-600">
                          {version.overallScore}%
                        </span>
                      </span>
                      {scoreChange && (
                        <span
                          className={`text-sm font-semibold ${
                            scoreChange.direction === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {scoreChange.direction === "up" ? "↑" : "↓"} {scoreChange.value}%
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedId === version.id ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedId === version.id && (
                  <div className="bg-gray-50 px-6 py-4 border-t space-y-4">
                    {/* Changes Preview */}
                    {version.changes && version.changes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-gray-700">
                          Changes ({version.changes.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {version.changes.slice(0, 5).map((diff, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-2 rounded font-mono ${
                                diff.type === "added"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : diff.type === "removed"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              }`}
                            >
                              <span className="font-bold">
                                [{diff.type.toUpperCase()}]
                              </span>{" "}
                              {diff.line}
                            </div>
                          ))}
                          {version.changes.length > 5 && (
                            <p className="text-xs text-gray-500">
                              +{version.changes.length - 5} more changes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleRestore(version.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition text-sm font-medium"
                      >
                        <Undo2 size={16} />
                        Restore
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition"
                        title="Download version"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                        title="Delete version"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
