import { useState } from "react";
import api from "../lib/api";

interface RejectionAnalysisResult {
  matchScore: number;
  verdict: string;
  verdictReason: string;
  resumeStrengths: string[];
  rejectionReasons: Array<{
    reason: string;
    severity: "critical" | "high" | "medium" | "low";
    details: string;
    fix: string;
  }>;
  keywordGaps: {
    inJD: string[];
    inResume: string[];
    missing: string[];
  };
  experienceGap: {
    required: string;
    youHave: string;
    verdict: string;
    advice: string;
  };
  hiringSections: Array<{
    section: string;
    jdExpects: string;
    resumeShows: string;
    status: "strong" | "weak" | "mismatch";
  }>;
  atsWouldReject: boolean;
  atsReason: string;
  options: {
    applyAnyway?: {
      should: boolean;
      reason: string;
      successChance: string;
    };
    fixAndApply?: {
      timeNeeded: string;
      scoreAfterFix: number;
      successChance: string;
      quickFixes: string[];
    };
    upskillThenApply?: {
      timeNeeded: string;
      scoreAfterFix: number;
      successChance: string;
      learnFirst: string[];
    };
    applyToEasierRole?: {
      suggestedRoles: string[];
      reason: string;
    };
  };
  rewrittenSummary: string;
  motivationMessage: string;
}

export const RejectAnalyzer = ({
  resumeText,
}: {
  resumeText: string;
}) => {
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<RejectionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "why" | "compare" | "fix" | "rewrite"
  >("why");

  const analyze = async () => {
    if (!jobDesc.trim()) {
      alert("Please paste a job description");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/analysis/rejection", {
        resumeText: resumeText || "",
        jobDescription: jobDesc,
      });

      if (response.data?.success && response.data?.analysis) {
        setResult(response.data.analysis);
      } else {
        alert("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to analyze rejection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f0919 100%)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "600px",
          margin: "0 auto",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔍</div>
          <h2 style={{ color: "white", margin: 0, fontSize: "22px" }}>
            Why Didn't I Get Selected?
          </h2>
          <p
            style={{
              color: "#64748b",
              marginTop: "8px",
              fontSize: "14px",
            }}
          >
            Paste the job description. AI will tell you exactly why you got
            rejected + how to fix it.
          </p>
        </div>

        {/* Trending badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <span
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            🔥 TRENDING — Most shared feature
          </span>
        </div>

        {/* Job Description Input */}
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          placeholder="Paste the full job description here..."
          style={{
            width: "100%",
            height: "200px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            padding: "16px",
            color: "white",
            fontSize: "14px",
            lineHeight: "1.6",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "16px",
          }}
        />

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={!jobDesc.trim() || loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading
              ? "rgba(99,102,241,0.4)"
              : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 0 30px rgba(99,102,241,0.3)",
          }}
        >
          {loading
            ? "🤖 AI Analyzing Your Rejection..."
            : "🔍 Find Out Why I Got Rejected →"}
        </button>

        {/* What you'll get */}
        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {[
            "✅ Exact rejection reasons",
            "✅ Missing keywords found",
            "✅ Section by section breakdown",
            "✅ 4 options to fix it",
          ].map((item, i) => (
            <div
              key={i}
              style={{
                color: "#64748b",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "why" as const, label: "❌ Why Rejected" },
    { id: "compare" as const, label: "⚖️ Side by Side" },
    { id: "fix" as const, label: "🔧 Fix Options" },
    { id: "rewrite" as const, label: "✨ AI Rewrite" },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", color: "white" }}>
      {/* VERDICT BANNER */}
      <div
        style={{
          background:
            result.matchScore >= 70
              ? "rgba(16,185,129,0.1)"
              : result.matchScore >= 50
                ? "rgba(245,158,11,0.1)"
                : "rgba(239,68,68,0.1)",
          border: `1px solid ${
            result.matchScore >= 70
              ? "rgba(16,185,129,0.3)"
              : result.matchScore >= 50
                ? "rgba(245,158,11,0.3)"
                : "rgba(239,68,68,0.3)"
          }`,
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>
            AI HIRING MANAGER VERDICT
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "white",
              marginBottom: "6px",
            }}
          >
            {result.verdict}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "400px" }}>
            {result.verdictReason}
          </div>
        </div>

        {/* Match score circle */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: "900",
              color:
                result.matchScore >= 70
                  ? "#10b981"
                  : result.matchScore >= 50
                    ? "#f59e0b"
                    : "#ef4444",
              lineHeight: 1,
            }}
          >
            {result.matchScore}%
          </div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>
            Match Score
          </div>
        </div>
      </div>

      {/* ATS WARNING */}
      {result.atsWouldReject && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "14px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🤖</span>
          <div>
            <div style={{ color: "#f87171", fontWeight: "bold", fontSize: "13px" }}>
              ATS BOT REJECTED YOU FIRST
            </div>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              {result.atsReason}
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border:
                activeTab === tab.id
                  ? "1px solid rgba(99,102,241,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                activeTab === tab.id
                  ? "rgba(99,102,241,0.2)"
                  : "transparent",
              color:
                activeTab === tab.id ? "#a5b4fc" : "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              whiteSpace: "nowrap",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: WHY REJECTED ── */}
      {activeTab === "why" && (
        <div>
          <h3 style={{ color: "white", marginBottom: "14px" }}>
            Exact Reasons You Were Rejected
          </h3>
          {result.rejectionReasons.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#0c0e1a",
                border: `1px solid ${
                  r.severity === "critical"
                    ? "rgba(239,68,68,0.3)"
                    : "rgba(245,158,11,0.2)"
                }`,
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "white",
                    fontSize: "15px",
                  }}
                >
                  {r.reason}
                </div>
                <span
                  style={{
                    background:
                      r.severity === "critical"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(245,158,11,0.15)",
                    color:
                      r.severity === "critical" ? "#f87171" : "#fbbf24",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {r.severity}
                </span>
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginBottom: "10px",
                  lineHeight: "1.5",
                }}
              >
                {r.details}
              </div>

              <div
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#6ee7b7",
                  fontSize: "13px",
                }}
              >
                💡 Fix: {r.fix}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: COMPARE ── */}
      {activeTab === "compare" && (
        <div>
          <h3 style={{ color: "white", marginBottom: "14px" }}>
            Resume vs Job — Section by Section
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: "#0c0e1a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                📋 Job Requires
              </div>
              {result.keywordGaps.inJD.map((k, i) => {
                const isMissing =
                  result.keywordGaps.missing.includes(k);
                return (
                  <div
                    key={i}
                    style={{
                      display: "inline-block",
                      background: isMissing
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(16,185,129,0.15)",
                      color: isMissing ? "#f87171" : "#6ee7b7",
                      border: `1px solid ${
                        isMissing
                          ? "rgba(239,68,68,0.3)"
                          : "rgba(16,185,129,0.3)"
                      }`,
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      margin: "3px",
                      fontWeight: "bold",
                    }}
                  >
                    {isMissing ? "✗" : "✓"} {k}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: "#0c0e1a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                📄 Your Resume Has
              </div>
              {result.keywordGaps.inResume.map((k, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-block",
                    background: "rgba(99,102,241,0.15)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99,102,241,0.3)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    margin: "3px",
                  }}
                >
                  {k}
                </div>
              ))}
            </div>
          </div>

          {result.hiringSections.map((sec, i) => (
            <div
              key={i}
              style={{
                background: "#0c0e1a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {sec.section}
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background:
                      sec.status === "strong"
                        ? "rgba(16,185,129,0.15)"
                        : sec.status === "weak"
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(239,68,68,0.15)",
                    color:
                      sec.status === "strong"
                        ? "#6ee7b7"
                        : sec.status === "weak"
                          ? "#fbbf24"
                          : "#f87171",
                  }}
                >
                  {sec.status === "strong"
                    ? "✅ Strong"
                    : sec.status === "weak"
                      ? "⚠️ Weak"
                      : "❌ Mismatch"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "6px",
                    }}
                  >
                    JOB EXPECTS
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      background: "rgba(255,255,255,0.03)",
                      padding: "10px",
                      borderRadius: "8px",
                    }}
                  >
                    {sec.jdExpects}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "6px",
                    }}
                  >
                    YOUR RESUME SHOWS
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      background: "rgba(255,255,255,0.03)",
                      padding: "10px",
                      borderRadius: "8px",
                    }}
                  >
                    {sec.resumeShows}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: FIX OPTIONS ── */}
      {activeTab === "fix" && (
        <div>
          <h3 style={{ color: "white", marginBottom: "6px" }}>
            Your 4 Options
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            Ranked by success likelihood
          </p>

          {/* Option 1: Fix and Apply */}
          {result.options.fixAndApply && (
            <div
              style={{
                background: "#0c0e1a",
                border: "2px solid rgba(16,185,129,0.3)",
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "24px" }}>⚡</div>
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "white",
                        fontSize: "15px",
                      }}
                    >
                      Fix & Apply (Best Bet)
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      Takes {result.options.fixAndApply.timeNeeded}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "900",
                      color: "#10b981",
                    }}
                  >
                    {result.options.fixAndApply.successChance}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>
                    Success chance
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                <strong style={{ color: "#6ee7b7" }}>
                  New match score: {result.options.fixAndApply.scoreAfterFix}%
                </strong>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>
                  Quick fixes:
                </div>
                {result.options.fixAndApply.quickFixes.map((fix, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "6px",
                      color: "#6ee7b7",
                      fontSize: "12px",
                    }}
                  >
                    {fix}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option 2: Upskill Then Apply */}
          {result.options.upskillThenApply && (
            <div
              style={{
                background: "#0c0e1a",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "24px" }}>📚</div>
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "white",
                        fontSize: "15px",
                      }}
                    >
                      Upskill Then Apply
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      Takes {result.options.upskillThenApply.timeNeeded}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "900",
                      color: "#f59e0b",
                    }}
                  >
                    {result.options.upskillThenApply.successChance}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>
                    Success chance
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              >
                <strong style={{ color: "#fbbf24" }}>
                  New match score: {result.options.upskillThenApply.scoreAfterFix}%
                </strong>
              </div>

              <div>
                <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>
                  Learn these first:
                </div>
                {result.options.upskillThenApply.learnFirst.map((skill, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "6px",
                      color: "#fbbf24",
                      fontSize: "12px",
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option 3: Apply Easier Role */}
          {result.options.applyToEasierRole && (
            <div
              style={{
                background: "#0c0e1a",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "12px",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    color: "white",
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}
                >
                  🎯 Apply to Easier Roles
                </div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  {result.options.applyToEasierRole.reason}
                </div>
              </div>

              {result.options.applyToEasierRole.suggestedRoles.map((role, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "6px",
                    color: "#a5b4fc",
                    fontSize: "13px",
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: REWRITE ── */}
      {activeTab === "rewrite" && (
        <div>
          <div
            style={{
              background: "#0c0e1a",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "white", marginBottom: "12px" }}>
              ✨ AI-Rewritten Summary
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              {result.rewrittenSummary}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.rewrittenSummary);
                alert("Copied to clipboard!");
              }}
              style={{
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#a5b4fc",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>

          <div
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#6ee7b7", marginBottom: "12px" }}>
              💪 Motivation
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              {result.motivationMessage}
            </p>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={() => setResult(null)}
        style={{
          marginTop: "20px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#64748b",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        ← Analyze Another Job
      </button>
    </div>
  );
};
