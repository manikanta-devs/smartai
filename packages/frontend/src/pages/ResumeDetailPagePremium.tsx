import { useEffect, useState, useRef, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Loader2, ArrowLeft, Download, Trash2, Sparkles, Target, Wand2, BarChart3, Brain, ExternalLink, AlertTriangle, Zap, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  atsScore?: number;
  overallScore?: number;
  analysisResult?: any;
  text?: string;
}

interface CoverLetterData {
  subjectLine: string;
  greeting: string;
  coverLetter: string;
  highlights: string[];
  closing: string;
}

interface InterviewPrepData {
  role: string;
  questions: string[];
  suggestedPoints: string[];
  strengths: string[];
  watchOuts: string[];
  tips: string[];
}

interface SalaryInsightsData {
  role: string;
  location: string;
  experienceLevel: string;
  salaryRange: string;
  factors: string[];
  negotiationTips: string[];
}

interface ResumeAgentData {
  atsFriendlyResumeHtml: string;
  autofill: {
    contactInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
    };
    summary: string;
    skills: string[];
    formValues: {
      name: string;
      email: string;
      phone: string;
      location: string;
      headline: string;
    };
    sectionsFound: string[];
  };
  jobComparison: {
    targetRole: string;
    bestMatchTitle: string;
    bestMatchCompany: string;
    matchScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    summary: string;
  };
  notification: {
    state: 'ready' | 'review';
    message: string;
    actions: string[];
  };
}

// Animated Counter
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const increment = value / (duration / 50);
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <>{displayValue}</>;
}

// Score Ring Component
function ScoreRing({ score, max = 100, color = 'text-blue-500' }: { score: number; max?: number; color?: string }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / max) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-[1.5s] ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold">{score}</div>
          <div className="text-xs text-gray-400">{max}</div>
        </div>
      </div>
    </div>
  );
}

export function ResumeDetailPagePremium() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'cover' | 'interview' | 'salary' | 'jobs' | 'rewrite'>('ai');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salaryLocation, setSalaryLocation] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepData | null>(null);
  const [salaryInsights, setSalaryInsights] = useState<SalaryInsightsData | null>(null);
  const [selectedFixSuggestion, setSelectedFixSuggestion] = useState<string | null>(null);
  const [rewriteSuggestions, setRewriteSuggestions] = useState<{ improvements: string[]; prioritized: Array<{ priority: string; suggestion: string; impact: string }> } | null>(null);
  const [automationAgent, setAutomationAgent] = useState<ResumeAgentData | null>(null);

  useEffect(() => {
    fetchResume();
    // Trigger confetti if score > 90
    setTimeout(() => {
      if (resume && resume.atsScore && resume.atsScore > 90) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    }, 1500);
  }, [id]);

  useEffect(() => {
    const loadLatestAutomation = async () => {
      if (!id) return;

      try {
        const response = await api.get('/automation/latest');
        const report = response.data?.data;

        if (report?.resumeId === id && report?.agent) {
          setAutomationAgent(report.agent);
          setPreviewHTML(report.agent.atsFriendlyResumeHtml);
        }
      } catch {
        // Keep the page usable if the automation report is missing.
      }
    };

    loadLatestAutomation();
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/resumes/${id}`);
      setResume(response.data.data);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
      toast.error('Failed to load resume details');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRun = async () => {
    if (!id) return;
    try {
      setProcessingAction('auto');
      const response = await api.post(`/resumes/${id}/auto-run`, {
        jobTitle,
        jobDescription
      });

      const analysis = response?.data?.data?.analysis;
      const agent = response?.data?.data?.agent;
      if (analysis) {
        setResume((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            atsScore: analysis.atsScore,
            overallScore: analysis.overallScore,
            analysisResult: analysis
          };
        });
      }

      if (agent) {
        setAutomationAgent(agent);
        setPreviewHTML(agent.atsFriendlyResumeHtml);
      }

      toast.success('Automation completed: analysis, match, roles, improvements');
    } catch (error: any) {
      console.error('Automation error:', error);
      toast.error(error?.response?.data?.error?.message || 'Automation failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCoverLetter = async () => {
    if (!id) return;
    try {
      setProcessingAction('cover');
      const response = await api.post(`/resumes/${id}/cover-letter`, {
        jobTitle,
        jobDescription
      });

      setCoverLetter(response.data?.data || null);
      setActiveTab('cover');
      toast.success('Cover letter generated');
    } catch (error: any) {
      console.error('Cover letter error:', error);
      toast.error(error?.response?.data?.error?.message || 'Cover letter generation failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleInterviewPrep = async () => {
    if (!id) return;
    try {
      setProcessingAction('interview');
      const response = await api.post(`/resumes/${id}/interview-prep`, {
        role: jobTitle,
        jobDescription
      });

      setInterviewPrep(response.data?.data || null);
      setActiveTab('interview');
      toast.success('Interview prep generated');
    } catch (error: any) {
      console.error('Interview prep error:', error);
      toast.error(error?.response?.data?.error?.message || 'Interview prep failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSalaryInsights = async () => {
    if (!id) return;
    try {
      setProcessingAction('salary');
      const response = await api.post(`/resumes/${id}/salary-insights`, {
        role: jobTitle,
        location: salaryLocation
      });

      setSalaryInsights(response.data?.data || null);
      setActiveTab('salary');
      toast.success('Salary insights generated');
    } catch (error: any) {
      console.error('Salary insights error:', error);
      toast.error(error?.response?.data?.error?.message || 'Salary insights failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRewriteSuggestions = async (focus?: string) => {
    if (!id) return;
    try {
      setProcessingAction('rewrite');
      const response = await api.post(`/resumes/${id}/improvements`, {
        jobTitle: jobTitle || undefined,
        focus: focus || undefined
      });

      setRewriteSuggestions(response.data?.data || null);
      setActiveTab('rewrite');
      toast.success(focus ? 'Focused fix generated' : 'Rewrite suggestions generated');
    } catch (error: any) {
      console.error('Rewrite suggestions error:', error);
      toast.error(error?.response?.data?.error?.message || 'Rewrite suggestions failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleFixSuggestion = async (suggestion: string) => {
    setSelectedFixSuggestion(suggestion);
    setActiveTab('rewrite');
    await handleRewriteSuggestions(suggestion);
  };

  const handlePreviewResume = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/resumes/${id}/preview`);
      setPreviewHTML(response.data);
      setShowPreview(true);
      toast.success('Preview loaded');
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
    }
  };

  const handleDownloadResume = async () => {
    if (!id) return;
    try {
      setDownloadingResume(true);
      const response = await api.get(`/resumes/${id}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume?.fileName || 'resume'}-ATS-Friendly.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Resume downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download resume');
    } finally {
      setDownloadingResume(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      setDeleting(true);
      await api.delete(`/resumes/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error('Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading your resume workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">Resume not found</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breakdown = resume.analysisResult?.breakdown || {};
  const suggestions = resume.analysisResult?.suggestions || [];
  const keywords = resume.analysisResult?.keywordRecommendations || [];

  // Format file size
  const fileSizeKB = (resume.fileSize / 1024).toFixed(2);

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto px-0 py-0 relative z-10">
        {/* Header Bar */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-clash)' }}>
                {resume.fileName}
              </h1>
              <p className="text-sm text-gray-400">
                {fileSizeKB} KB • <span className="text-green-500 font-semibold">ANALYZED</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreviewResume}
              disabled={downloadingResume}
              className="px-4 py-2 rounded-lg glass hover:bg-white/10 text-gray-200 hover:text-white flex items-center gap-2 transition disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleDownloadResume}
              disabled={downloadingResume}
              className="px-4 py-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadingResume ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg glass hover:bg-red-500/20 text-red-400 hover:text-red-300 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Scores Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* ATS Score Card */}
          <div
            className="glass-dark rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px] border border-blue-500/20 glow-blue animate-slide-up"
            style={{ animationDelay: '0ms' }}
          >
            <div className="mb-6 animate-count-up">
              <ScoreRing score={resume.atsScore || 0} max={100} color="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-clash)' }}>
              ATS Compatibility
            </h2>
            <p className="text-sm text-gray-400 text-center">
              {(resume.atsScore || 0) > 80 ? '✨ Excellent' : 'Good'} — beats{' '}
              {Math.max(50, (resume.atsScore || 0) - 10)}% of resumes
            </p>
          </div>

          {/* Overall Score Card */}
          <div
            className="glass-dark rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px] border border-green-500/20 glow-blue animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            <div className="mb-6 animate-count-up">
              <ScoreRing score={resume.overallScore || 0} max={100} color="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-clash)' }}>
              Overall Quality
            </h2>
            <p className="text-sm text-gray-400 text-center">
              {(resume.overallScore || 0) > 90 ? '🏆 Top tier' : 'Strong'} resume profile
            </p>
          </div>
        </div>

        {/* Analysis Breakdown Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-clash)' }}>
            Analysis Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Contact', score: breakdown.contact?.score || 0, max: 25 },
              { label: 'Experience', score: breakdown.experience?.score || 0, max: 25 },
              { label: 'Education', score: breakdown.education?.score || 0, max: 25 },
              { label: 'Skills', score: breakdown.skills?.score || 0, max: 25 },
              { label: 'Formatting', score: breakdown.formatting?.score || 0, max: 25 }
            ].map((item, idx) => (
              <div
                key={item.label}
                className="glass-dark rounded-xl p-4 border border-gray-700/50 animate-slide-up"
                style={{ animationDelay: `${200 + idx * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300" style={{ fontFamily: 'var(--font-satoshi)' }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {item.score}/{item.max}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-fill-progress"
                    style={{
                      '--progress-width': `${(item.score / item.max) * 100}%`
                    } as CSSProperties}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {item.score === item.max ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : item.score > item.max * 0.7 ? (
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {breakdown[item.label.toLowerCase()]?.feedback || 'No feedback'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-clash)' }}>
              Suggestions for Improvement
            </h2>
            <div className="space-y-3">
              {suggestions.map((suggestion: string, idx: number) => (
                <div
                  key={idx}
                  className="glass-dark border border-orange-500/20 rounded-lg p-4 flex items-start gap-4 hover:border-orange-500/50 transition animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-3 h-3 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-200">{suggestion}</p>
                  </div>
                  <button
                    onClick={() => handleFixSuggestion(suggestion)}
                    className="text-orange-500 hover:text-orange-400 text-sm font-semibold whitespace-nowrap ml-4 transition"
                  >
                    Fix This →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Keywords */}
        {keywords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-clash)' }}>
              Recommended Keywords
            </h2>
            <div className="flex flex-wrap gap-3">
              {keywords.map((keyword: string, idx: number) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-purple-200 text-sm font-medium cursor-pointer hover:from-purple-500/30 hover:to-indigo-500/30 hover:glow-purple transition"
                  style={{ fontFamily: 'var(--font-satoshi)' }}
                >
                  {keyword}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Feature Lab - Tabbed Section */}
        <div className="glass-dark rounded-2xl p-8 border border-gray-700/50 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-clash)' }}>
            AI Career Toolkit
          </h2>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-gray-700">
            {[
              { id: 'ai', label: 'AI Features', icon: Brain },
              { id: 'cover', label: 'Cover Letter', icon: Sparkles },
              { id: 'interview', label: 'Interview Prep', icon: AlertTriangle },
              { id: 'salary', label: 'Salary Insights', icon: BarChart3 },
              { id: 'jobs', label: 'Job Matches', icon: Zap },
              { id: 'rewrite', label: 'ATS Rewrite', icon: Wand2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 font-medium flex items-center gap-2 text-sm transition ${
                    isActive
                      ? 'text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Target Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  style={{ fontFamily: 'var(--font-satoshi)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition min-h-[120px]"
                  style={{ fontFamily: 'var(--font-satoshi)' }}
                />
              </div>

              {automationAgent && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-cyan-100">Automation agent</div>
                      <div className="mt-1 text-sm text-white">{automationAgent.notification.message}</div>
                    </div>
                    <button
                      onClick={() => {
                        setPreviewHTML(automationAgent.atsFriendlyResumeHtml);
                        setShowPreview(true);
                      }}
                      className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      Open ATS Draft
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Submit status</div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        {automationAgent.notification.state === 'ready' ? 'Ready to submit' : 'Needs review'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{automationAgent.jobComparison.summary}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Autofill snapshot</div>
                      <div className="mt-2 text-sm text-slate-200">
                        {automationAgent.autofill.formValues.name || 'Name'}, {automationAgent.autofill.formValues.email || 'email missing'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {automationAgent.autofill.sectionsFound.length > 0
                          ? automationAgent.autofill.sectionsFound.join(' · ')
                          : 'Waiting for more resume details'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <button
                  onClick={handleAutoRun}
                  disabled={processingAction !== null}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <BarChart3 className="w-4 h-4" />
                  {processingAction === 'auto' ? 'Running automation...' : 'Run Automation Suite'}
                </button>
                <button
                  onClick={handleCoverLetter}
                  disabled={processingAction !== null}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {processingAction === 'cover' ? 'Writing...' : 'Cover Letter'}
                </button>
                <button
                  onClick={handleInterviewPrep}
                  disabled={processingAction !== null}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Brain className="w-4 h-4" />
                  {processingAction === 'interview' ? 'Preparing...' : 'Interview Prep'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Target Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description (optional)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition min-h-[120px]"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleCoverLetter}
                disabled={processingAction !== null}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {processingAction === 'cover' ? 'Writing...' : 'Generate Cover Letter'}
              </button>

              {coverLetter && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Subject</p>
                    <p className="text-white font-medium">{coverLetter.subjectLine}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    <div className="text-sm text-slate-400 mb-2">Cover Letter</div>
                    <p className="font-medium text-white mb-2">{coverLetter.greeting}</p>
                    {coverLetter.coverLetter}
                    <p className="mt-4">{coverLetter.closing}</p>
                  </div>
                  {coverLetter.highlights.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {coverLetter.highlights.map((item) => (
                        <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Target Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Product Designer"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description (optional)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition min-h-[120px]"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleInterviewPrep}
                disabled={processingAction !== null}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                {processingAction === 'interview' ? 'Preparing...' : 'Generate Interview Prep'}
              </button>

              {interviewPrep && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400 mb-2">Top questions</div>
                      <div className="space-y-2">
                        {interviewPrep.questions.map((question) => (
                          <div key={question} className="rounded-lg border border-white/10 bg-[#0b0d18] p-3 text-sm text-slate-200">
                            {question}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400 mb-2">Prep tips</div>
                      <div className="space-y-2 text-sm text-slate-200">
                        {interviewPrep.tips.map((tip) => (
                          <div key={tip} className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">{tip}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <div className="text-sm font-semibold text-emerald-100 mb-2">Strengths to lean on</div>
                      <div className="flex flex-wrap gap-2">
                        {interviewPrep.strengths.map((item) => (
                          <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="text-sm font-semibold text-amber-100 mb-2">Watch outs</div>
                      <div className="space-y-2 text-sm text-amber-50">
                        {interviewPrep.watchOuts.map((item) => (
                          <div key={item} className="rounded-lg border border-amber-400/20 bg-[#0b0d18] p-3">{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-slate-400 mb-2">Suggested answer points</div>
                    <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
                      {interviewPrep.suggestedPoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Target Role</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={salaryLocation}
                    onChange={(e) => setSalaryLocation(e.target.value)}
                    placeholder="e.g. Remote, Bengaluru, New York"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    style={{ fontFamily: 'var(--font-satoshi)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleSalaryInsights}
                disabled={processingAction !== null}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4" />
                {processingAction === 'salary' ? 'Estimating...' : 'Generate Salary Insights'}
              </button>

              {salaryInsights && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Role</div>
                      <div className="text-lg font-semibold text-white">{salaryInsights.role}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Location</div>
                      <div className="text-lg font-semibold text-white">{salaryInsights.location}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400">Experience level</div>
                      <div className="text-lg font-semibold text-white">{salaryInsights.experienceLevel}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                    <div className="text-sm text-cyan-100">Estimated range</div>
                    <div className="mt-2 text-3xl font-bold text-white">{salaryInsights.salaryRange}</div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400 mb-2">Salary factors</div>
                      <div className="space-y-2 text-sm text-slate-200">
                        {salaryInsights.factors.map((item) => (
                          <div key={item} className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm text-slate-400 mb-2">Negotiation tips</div>
                      <div className="space-y-2 text-sm text-slate-200">
                        {salaryInsights.negotiationTips.map((item) => (
                          <div key={item} className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-10 h-10 text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Live Job Matching</h3>
                    <p className="text-sm text-slate-400">Open the Jobs workspace to search live listings and track applications.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button onClick={() => navigate('/jobs')} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                    Open Jobs Workspace
                  </Button>
                  <Button onClick={handleAutoRun} variant="outline">
                    Refresh Match Insights
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-4 text-sm text-slate-300">
                This page focuses on resume improvements. Use the Jobs workspace for live search and application tracking.
              </div>
            </div>
          )}

          {activeTab === 'rewrite' && (
            <div className="space-y-4">
              {selectedFixSuggestion && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-orange-200">Focused fix</div>
                  <div className="mt-2 text-sm text-white">{selectedFixSuggestion}</div>
                </div>
              )}
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Wand2 className="w-10 h-10 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">ATS Rewrite Suggestions</h3>
                    <p className="text-sm text-slate-400">Generate practical improvements from the resume text you already uploaded.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button onClick={handleRewriteSuggestions} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                    Generate Rewrite Suggestions
                  </Button>
                  <Button onClick={() => setActiveTab('ai')} variant="outline">
                    Back to AI Features
                  </Button>
                </div>
              </div>

              {rewriteSuggestions && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-4">
                    <div className="text-sm text-slate-400 mb-2">Improvement checklist</div>
                    <div className="space-y-2 text-sm text-slate-200">
                      {rewriteSuggestions.improvements.map((item) => (
                        <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {rewriteSuggestions.prioritized.map((item) => (
                      <div key={item.suggestion} className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.priority} priority</div>
                        <div className="mt-2 font-medium text-white">{item.suggestion}</div>
                        <p className="mt-2 text-sm text-slate-400">{item.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewHTML && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#111827] to-[#0a0e1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-clash)' }}>
                ATS-Friendly Resume Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <iframe
                srcDoc={previewHTML}
                className="w-full h-full border border-gray-600 rounded-lg"
                title="Resume Preview"
              />
            </div>
            <div className="border-t border-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 text-gray-400 hover:text-white rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleDownloadResume}
                disabled={downloadingResume}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloadingResume ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
