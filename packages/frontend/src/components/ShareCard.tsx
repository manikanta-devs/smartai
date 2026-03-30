/**
 * Feature 1: Resume Score Share Card
 * Shareable image card showing resume score like Spotify Wrapped
 */

import React, { useRef } from "react";
import { Download } from "lucide-react";

interface ShareCardProps {
  userData: {
    name: string;
    targetRole: string;
    atsScore: number;
    percentile: number;
    skillCount: number;
    years: number;
    keywords: number;
  };
}

export const ShareCard: React.FC<ShareCardProps> = ({ userData }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    try {
      // Dynamic import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: "#0a0e1a",
          scale: 2,
        });
        const link = document.createElement("a");
        link.download = `${userData.name.replace(/\s+/g, "-")}-resume-score.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error("Error downloading card:", error);
      alert("Install html2canvas: npm install html2canvas");
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div
        ref={cardRef}
        style={{
          width: "400px",
          background: "linear-gradient(135deg, #0a0e1a, #1a1035)",
          borderRadius: "20px",
          padding: "32px",
          border: "1px solid rgba(99,102,241,0.3)",
          fontFamily: "sans-serif",
          color: "white",
          margin: "0 auto",
        }}
      >
        {/* Top Label */}
        <div style={{ fontSize: "12px", color: "#6366f1", marginBottom: "16px" }}>
          ✦ CareerOS Resume Analysis
        </div>

        {/* Name */}
        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          {userData.name}
        </div>
        <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
          {userData.targetRole}
        </div>

        {/* Big Score */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "900",
            color: "#6366f1",
            lineHeight: 1,
            marginBottom: "4px",
          }}
        >
          {userData.atsScore}
          <span style={{ fontSize: "24px" }}>/100</span>
        </div>
        <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
          ATS Score — Beats {userData.percentile}% of resumes
        </div>

        {/* 3 Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Skills", value: userData.skillCount },
            { label: "Experience", value: `${userData.years}yr` },
            { label: "Keywords", value: userData.keywords },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ fontSize: "12px", color: "#334155", textAlign: "center" }}>
          careeros.vercel.app — Free Resume Analysis
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadCard}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
        >
          <Download size={18} />
          📸 Download Score Card
        </button>
        <p className="text-xs text-gray-500 mt-2">Share on LinkedIn, Twitter, WhatsApp</p>
      </div>
    </div>
  );
};
