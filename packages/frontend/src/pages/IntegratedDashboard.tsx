/**
 * Unified Smart AI Dashboard
 * Integrates all three applications into one interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, Upload, Zap, Target, TrendingUp, Sparkles, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';

interface AnalysisResult {
  score: number;
  sections?: Record<string, any>;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

interface ResumeData {
  id: string;
  name: string;
  createdAt: string;
}

interface AutomationMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  platform: string;
  url?: string;
  matchScore: number;
  feedback: string;
  matchingSkills: string[];
  missingSkills: string[];
}

interface AutomationReport {
  id: string;
  userId: string;
  resumeId: string | null;
  mode: string;
  summary: string;
  newJobsCount: number;
  topMatches: AutomationMatch[];
  missingSkills: string[];
  generatedAt: string;
  agent?: {
    notification?: {
      state: 'ready' | 'review';
      message: string;
      actions: string[];
    };
  };
}

export default function IntegratedDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'roles' | 'ats'>('overview');
  const [automationReport, setAutomationReport] = useState<AutomationReport | null>(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [runningAutomation, setRunningAutomation] = useState(false);

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
    loadAutomationReport();
  }, []);

  const loadAutomationReport = async () => {
    try {
      setAutomationLoading(true);
      setAutomationError(null);
      const response = await api.get('/automation/latest');
      setAutomationReport(response.data?.data || null);
    } catch (err: any) {
      setAutomationError(err.response?.data?.error?.message || 'Automation report unavailable');
    } finally {
      setAutomationLoading(false);
    }
  };

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/resumes');
      setResumes(response.data?.data || []);
    } catch (err: any) {
      setError('Failed to load resumes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResume = async (resumeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend analysis endpoint which connects to Smart AI
      const response = await api.post(`/resumes/${resumeId}/analyze`);
      setAnalysis(response.data?.data);
      setSelectedResume(resumeId);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictRoles = async (resumeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend role prediction endpoint
      const response = await api.post(`/resumes/${resumeId}/predict-roles`);
      setActiveTab('roles');
      setAnalysis(response.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Role prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleATSScore = async (resumeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend ATS score endpoint
      const response = await api.post(`/resumes/${resumeId}/ats-score`);
      setActiveTab('ats');
      setAnalysis(response.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'ATS scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutomation = async () => {
    try {
      setRunningAutomation(true);
      setError(null);
      const payload: { resumeId?: string } = {};
      if (selectedResume) {
        payload.resumeId = selectedResume;
      }

      const response = await api.post('/automation/run', payload);
      setAutomationReport(response.data?.data || null);
      setActiveTab('overview');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Automation run failed');
    } finally {
      setRunningAutomation(false);
    }
  };

  const latestMatch = automationReport?.topMatches?.[0];

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Dashboard</div>
            <h1 className="mt-2 text-3xl font-bold text-white">Analyze, optimize, and perfect your resume</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Everything sits in the same workspace, so upload, rewrite, and job search feel like one flow.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white shadow-lg shadow-indigo-950/25"
            >
              <Upload className="mr-2 inline h-4 w-4" />
              Upload Resume
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 hover:bg-white/10"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-400/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0" />
            <p className="text-rose-100">{error}</p>
          </div>
        )}

        <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Background automation
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Jobs are fetched and matched automatically</h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                This engine runs in the backend, scores fresh jobs against your latest resume, and keeps a live report ready for the dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRunAutomation}
                disabled={runningAutomation}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white shadow-lg shadow-indigo-950/25 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${runningAutomation ? 'animate-spin' : ''}`} />
                {runningAutomation ? 'Running...' : 'Run automation now'}
              </button>
              <button
                onClick={loadAutomationReport}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 hover:bg-white/10"
              >
                Refresh report
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">New jobs today</div>
              <div className="mt-2 text-3xl font-bold text-white">
                {automationLoading ? '...' : automationReport?.newJobsCount ?? 0}
              </div>
              <p className="mt-2 text-sm text-slate-400">Fresh matches pulled from live job sources.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Best match</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {latestMatch ? `${latestMatch.title} · ${latestMatch.matchScore}%` : 'No match yet'}
              </div>
              <p className="mt-2 text-sm text-slate-400">{latestMatch ? latestMatch.company : 'Run automation to generate a report.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Missing skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(automationReport?.missingSkills || []).slice(0, 3).map((skill) => (
                  <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {skill}
                  </span>
                ))}
                {!automationReport?.missingSkills?.length && (
                  <span className="text-sm text-slate-400">Ready to analyze</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0b0d18] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                <Rocket className="h-4 w-4" />
                Latest summary
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {automationError || automationReport?.summary || 'Your automation report will appear here once the engine runs.'}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                {automationReport?.generatedAt
                  ? `Updated ${new Date(automationReport.generatedAt).toLocaleString()}`
                  : 'Waiting for the first automation run'}
              </div>
              {automationReport?.agent?.notification && (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-50">
                  <div className="font-semibold">
                    {automationReport.agent.notification.state === 'ready' ? 'Submit-ready' : 'Review needed'}
                  </div>
                  <div className="mt-1 text-cyan-100/80">{automationReport.agent.notification.message}</div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0b0d18] p-5">
              <div className="text-sm font-medium text-white mb-3">Top matches</div>
              <div className="space-y-3">
                {(automationReport?.topMatches || []).slice(0, 3).map((job) => (
                  <div key={job.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{job.title}</div>
                        <div className="text-xs text-slate-400">{job.company} · {job.location}</div>
                      </div>
                      <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                        {job.matchScore}%
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{job.feedback}</p>
                  </div>
                ))}
                {!automationReport?.topMatches?.length && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                    No matches yet. Run the automation engine to populate this panel.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Resumes List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
            <h2 className="text-xl font-bold text-white mb-4">Your Resumes</h2>
            
            {loading && !resumes.length ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No resumes yet. Upload one to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-[#0b0d18] hover:border-cyan-400/30 transition group"
                  >
                    <button
                      onClick={() => setSelectedResume(resume.id)}
                      className={`flex-1 text-left transition ${
                        selectedResume === resume.id
                          ? 'border-cyan-400/30 bg-cyan-400/10'
                          : ''
                      }`}
                    >
                      <p className="font-medium text-white">{resume.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => navigate(`/resume/${resume.id}`)}
                      className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs rounded font-medium transition"
                      title="View full resume details"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Content - Analysis & Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            {selectedResume && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleAnalyzeResume(selectedResume)} disabled={loading} className="bg-gradient-to-r from-indigo-500 to-cyan-500 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20">
                  <Zap className="w-5 h-5" />
                  Analyze Resume
                </button>
                
                <button onClick={() => handlePredictRoles(selectedResume)} disabled={loading} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20">
                  <Target className="w-5 h-5" />
                  Predict Roles
                </button>
                
                <button onClick={() => handleATSScore(selectedResume)} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-cyan-500 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20">
                  <TrendingUp className="w-5 h-5" />
                  ATS Score
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                  <h3 className="text-xl font-bold text-white">Analysis Results</h3>
                </div>

                {/* Score Display */}
                {analysis.score !== undefined && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-cyan-300">{analysis.score}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 rounded-full transition-all"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-white mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-emerald-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-white mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm text-amber-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm bg-cyan-400/10 text-cyan-100 p-2 rounded border border-cyan-400/20">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!selectedResume && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300">Select a resume to analyze</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
