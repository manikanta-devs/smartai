import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Loader2, ArrowLeft, Download, Trash2, Sparkles, Target, Wand2, BarChart3, Brain, ExternalLink, AlertTriangle, Zap, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumAnalysisTab } from '@/components/PremiumAnalysisTab';
import { JobOpportunitiesTab } from '@/components/JobOpportunitiesTab';
import { ResumeRewriteTab } from '@/components/ResumeRewriteTab';
import { CustomJobSearchTab } from '@/components/CustomJobSearchTab';

// Animated Counter Component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const increment = value / (duration / 50);
    let current = 0;

    countRef.current = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(countRef.current);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(countRef.current);
  }, [value, duration]);

  return <>{displayValue}</>;
}

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

interface BrainJob {
  id?: string;
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  match_score?: number;
  skills_required?: string[];
  url?: string;
}

interface BrainData {
  target_role?: string;
  profile?: {
    category?: string;
    experience_years?: number;
  };
  coach_message?: string;
  missing_keywords?: string[];
  skill_gap?: {
    missing_skills?: string[];
  };
  why_not_hired?: Array<{
    problem?: string;
    why?: string;
    solution?: string;
  }>;
  jobs?: BrainJob[];
  resume_rebuild?: {
    original?: string;
    rebuilt?: string;
    highlights?: string[];
  };
}

interface MatchResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  feedback: string;
}

interface ATSResult {
  atsScore: number;
  keywordScore: number;
  formatScore: number;
  sectionScore: number;
  recommendations: string[];
}

interface RolePrediction {
  name: string;
  matchPercentage: number;
  requiredSkills: string[];
  missingSkills: string[];
}

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [predictedRoles, setPredictedRoles] = useState<RolePrediction[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [brainData, setBrainData] = useState<BrainData | null>(null);
  const [brainLocation, setBrainLocation] = useState('');
  const [selectedJob, setSelectedJob] = useState<BrainJob | null>(null);
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [loadingJobSkills, setLoadingJobSkills] = useState(false);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'premium' | 'opportunities' | 'rewrite' | 'custom-search'>('features');
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/resumes/${id}`);
      setResume(response.data.data);
      await runBrainAnalyze(true);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
      toast.error('Failed to load resume details');
    } finally {
      setLoading(false);
    }
  };

  const runATSScore = async () => {
    if (!id) return;
    try {
      setProcessing('ats');
      const response = await api.post(`/resumes/${id}/ats-score`, {
        jobDescription: jobDescription || undefined
      });
      setAtsResult(response.data.data);
      toast.success('ATS scoring completed');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'ATS scoring failed');
    } finally {
      setProcessing(null);
    }
  };

  const runMatchScore = async () => {
    if (!id) return;
    if (!jobDescription.trim()) {
      toast.error('Add a job description to run match scoring');
      return;
    }
    try {
      setProcessing('match');
      const response = await api.post(`/resumes/${id}/match-job`, { jobDescription });
      setMatchResult(response.data.data);
      toast.success('Match score generated');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Match scoring failed');
    } finally {
      setProcessing(null);
    }
  };

  const runRolePrediction = async () => {
    if (!id) return;
    try {
      setProcessing('roles');
      const response = await api.post(`/resumes/${id}/predict-roles`);
      setPredictedRoles(response.data.data.roles || []);
      toast.success('Role prediction completed');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Role prediction failed');
    } finally {
      setProcessing(null);
    }
  };

  const runRewriteSuggestions = async () => {
    if (!id) return;
    try {
      setProcessing('rewrite');
      const response = await api.post(`/resumes/${id}/improvements`, {
        jobTitle: jobTitle || undefined
      });
      setImprovements(response.data.data.improvements || []);
      toast.success('Rewrite suggestions generated');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Rewrite suggestions failed');
    } finally {
      setProcessing(null);
    }
  };

  const runBrainAnalyze = async (silent = false) => {
    if (!id) return;
    try {
      setProcessing('brain');
      const response = await api.post(`/resumes/${id}/analyze`, {
        location: brainLocation || undefined
      });
      setBrainData(response.data?.data?.brain || null);
      if (!silent) {
        toast.success('AI Brain analysis completed');
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.response?.data?.error?.message || 'AI Brain analysis failed');
      }
    } finally {
      setProcessing(null);
    }
  };

  const fetchJobSkills = async (job: BrainJob) => {
    try {
      setLoadingJobSkills(true);
      const response = await api.post('/jobs/search', {
        keywords: job.title || 'Developer',
        location: brainLocation || ''
      });
      
      // Extract skills from job
      const skills = job.skills_required || [];
      setJobSkills(skills);
      setSelectedJob(job);
      toast.success(`Found ${skills.length} required skills for ${job.title}`);
    } catch (error: any) {
      console.error('Error fetching job skills:', error);
      setJobSkills(job.skills_required || []);
      setSelectedJob(job);
    } finally {
      setLoadingJobSkills(false);
    }
  };

  const refreshJobs = async () => {
    if (!brainData?.target_role) {
      toast.error('No target role detected');
      return;
    }
    try {
      setRefreshingJobs(true);
      const response = await api.post('/jobs/refresh', {
        keywords: brainData.target_role,
        location: brainLocation || ''
      });
      
      if (response.data.jobs) {
        const updatedBrainData = { ...brainData, jobs: response.data.jobs };
        setBrainData(updatedBrainData);
        toast.success(`Refreshed! Found ${response.data.count} jobs`);
      }
    } catch (error: any) {
      console.error('Error refreshing jobs:', error);
      toast.error('Failed to refresh jobs');
    } finally {
      setRefreshingJobs(false);
    }
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
      
      // Create blob and download
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
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-center py-12">
              <p className="text-gray-600">Resume not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analysis = resume.analysisResult;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              disabled={downloadingResume}
              onClick={handlePreviewResume}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              {downloadingResume ? 'Loading...' : 'Preview ATS'}
            </Button>
            <Button 
              variant="outline"
              disabled={downloadingResume}
              onClick={handleDownloadResume}
              className="bg-green-50 text-green-700 hover:bg-green-100"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingResume ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              variant="outline"
              className="text-red-600"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewHTML && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">ATS-Friendly Resume Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <iframe
                  srcDoc={previewHTML}
                  className="w-full h-[70vh] border border-gray-200 rounded"
                  title="Resume Preview"
                />
              </div>
              <div className="border-t p-4 text-center">
                <Button
                  onClick={handleDownloadResume}
                  disabled={downloadingResume}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingResume ? 'Downloading...' : 'Download This Resume'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resume Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resume.fileName}</h1>
              <p className="text-gray-600 text-sm">
                {(resume.fileSize / 1024).toFixed(2)} KB • Status: <span className="font-medium capitalize">{resume.status}</span>
              </p>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">ATS Score</div>
              <div className="text-4xl font-bold text-blue-600">{resume.atsScore || 0}</div>
              <div className="text-xs text-gray-500 mt-2">AI assessment of ATS compatibility</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Overall Score</div>
              <div className="text-4xl font-bold text-green-600">{resume.overallScore || 0}</div>
              <div className="text-xs text-gray-500 mt-2">Overall resume quality</div>
            </div>
          </div>

          {/* Analysis Details */}
          {analysis && (
            <div className="space-y-6">
              {/* Breakdown */}
              {analysis.breakdown && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysis.breakdown).map(([key, value]: any) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">{key}</h4>
                          <span className="text-sm font-bold text-blue-600">{value.score}/25</span>
                        </div>
                        <p className="text-sm text-gray-600">{value.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions for Improvement</h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-600 font-bold mt-0.5">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keywords */}
              {analysis.keywordRecommendations && analysis.keywordRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywordRecommendations.map((keyword: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-0 border-b mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                activeTab === 'features'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Features
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                activeTab === 'premium'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Premium Analysis
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                activeTab === 'opportunities'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Job Matches
            </button>
            <button
              onClick={() => setActiveTab('rewrite')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                activeTab === 'rewrite'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              ATS Rewrite
            </button>
            <button
              onClick={() => setActiveTab('custom-search')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                activeTab === 'custom-search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Target className="w-4 h-4" />
              Custom Search
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'features' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Feature Lab</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Title (optional)</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description (for match & skills gap)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location (AI job matching)</label>
                  <input
                    type="text"
                    value={brainLocation}
                    onChange={(e) => setBrainLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Remote, Hyderabad"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button onClick={runATSScore} disabled={processing !== null} className="flex items-center justify-center gap-2">
                  {processing === 'ats' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  ATS Score
                </Button>
                <Button onClick={runMatchScore} disabled={processing !== null} className="flex items-center justify-center gap-2">
                  {processing === 'match' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  Match Score
                </Button>
                <Button onClick={runRolePrediction} disabled={processing !== null} className="flex items-center justify-center gap-2">
                  {processing === 'roles' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Predict Roles
                </Button>
                <Button onClick={runRewriteSuggestions} disabled={processing !== null} className="flex items-center justify-center gap-2">
                  {processing === 'rewrite' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Rewrite Ideas
                </Button>
                <Button onClick={() => runBrainAnalyze(false)} disabled={processing !== null} className="flex items-center justify-center gap-2">
                  {processing === 'brain' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  AI Brain
                </Button>
              </div>

              {brainData && (
                <div className="mt-6 space-y-6 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">AI Career Engine</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Best Role</p>
                      <p className="text-lg font-bold text-indigo-700">{brainData.target_role || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-lg font-bold text-purple-700">{brainData.profile?.category || 'General'}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="text-lg font-bold text-blue-700">{brainData.profile?.experience_years ?? 0} years</p>
                    </div>
                  </div>

                  {brainData.coach_message && (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Coach Insight</p>
                      <p className="text-sm text-yellow-800">{brainData.coach_message}</p>
                    </div>
                  )}

                  {brainData.why_not_hired && brainData.why_not_hired.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Why You Are Not Getting Jobs
                      </h3>
                      <div className="space-y-3">
                        {brainData.why_not_hired.map((item, idx) => (
                          <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                            <p className="font-medium text-gray-900">{item.problem}</p>
                            <p className="text-sm text-gray-600 mt-1">Why: {item.why}</p>
                            <p className="text-sm text-green-700 mt-1">Fix: {item.solution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brainData.missing_keywords && brainData.missing_keywords.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {brainData.missing_keywords.slice(0, 15).map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {brainData.jobs && brainData.jobs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Auto Job Matches ({brainData.jobs.length})
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshJobs}
                          disabled={refreshingJobs}
                          className="flex items-center gap-2"
                        >
                          {refreshingJobs ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄'}
                          {refreshingJobs ? 'Refreshing...' : 'Refresh'}
                        </Button>
                      </div>
                      
                      {selectedJob && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-indigo-600" />
                                Selected: {selectedJob.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{selectedJob.company} • {selectedJob.location}</p>
                            </div>
                            <button
                              onClick={() => setSelectedJob(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {jobSkills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">📚 Required Skills:</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {jobSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-sm font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="bg-white rounded p-3 mb-3">
                                <p className="text-xs text-gray-600 mb-2">💡 Pro tip: Tailor your resume to highlight these skills. Download the job-specific resume builder below or click "Apply" to go directly to the job posting.</p>
                              </div>
                              
                              <Button
                                onClick={() => window.open(selectedJob.url || 'https://www.linkedin.com/jobs/', '_blank', 'noopener,noreferrer')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Apply for {selectedJob.title}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {brainData.jobs.slice(0, 12).map((job, idx) => (
                          <div
                            key={job.id || idx}
                            className={`border rounded-lg p-4 cursor-pointer transition hover:shadow-md ${
                              selectedJob?.id === job.id || selectedJob?.title === job.title
                                ? 'bg-indigo-50 border-indigo-300'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                            onClick={() => fetchJobSkills(job)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{job.title || 'Role'}</p>
                                <p className="text-sm text-gray-600">{job.company || 'Company'} • {job.location || 'Location'}</p>
                                <p className="text-xs text-gray-500 mt-1">💰 {job.salary || 'Not specified'}</p>
                                {job.skills_required && job.skills_required.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {job.skills_required.slice(0, 4).map((skill, sidx) => (
                                      <span key={sidx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                    {job.skills_required.length > 4 && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                        +{job.skills_required.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Match</p>
                                <p className="text-lg font-bold text-indigo-700">{job.match_score ?? 0}%</p>
                                <div 
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    window.open(job.url || 'https://www.linkedin.com/jobs/', '_blank', 'noopener,noreferrer');
                                  }}
                                  className="mt-2"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brainData.resume_rebuild?.rebuilt && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">AI Resume Rebuilder (Before vs After)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <textarea className="w-full rounded-md border border-gray-300 p-3 min-h-[200px] text-sm" value={brainData.resume_rebuild.original || ''} readOnly />
                        <textarea className="w-full rounded-md border border-indigo-300 bg-indigo-50 p-3 min-h-[200px] text-sm" value={brainData.resume_rebuild.rebuilt || ''} readOnly />
                      </div>
                      {brainData.resume_rebuild.highlights && brainData.resume_rebuild.highlights.length > 0 && (
                        <ul className="list-disc ml-5 text-sm text-gray-700 mt-3">
                          {brainData.resume_rebuild.highlights.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(atsResult || matchResult || predictedRoles.length > 0 || improvements.length > 0) && (
                <div className="mt-6 border-t pt-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Feature Results</h2>

                  {atsResult && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">ATS Score Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-blue-50 p-3 rounded">ATS: <span className="font-bold">{atsResult.atsScore}</span></div>
                        <div className="bg-purple-50 p-3 rounded">Keywords: <span className="font-bold">{atsResult.keywordScore}</span></div>
                        <div className="bg-green-50 p-3 rounded">Format: <span className="font-bold">{atsResult.formatScore}</span></div>
                        <div className="bg-yellow-50 p-3 rounded">Sections: <span className="font-bold">{atsResult.sectionScore}</span></div>
                      </div>
                      <ul className="list-disc ml-5 text-sm text-gray-700">
                        {atsResult.recommendations?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matchResult && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Match Scoring & Skills Gap</h3>
                      <p className="text-sm text-gray-700 mb-2">Match Score: <span className="font-bold">{matchResult.matchScore}%</span></p>
                      <p className="text-sm text-gray-600 mb-2">{matchResult.feedback}</p>
                      <p className="text-sm"><span className="font-medium">Matching skills:</span> {matchResult.matchingSkills.join(', ') || 'None detected'}</p>
                      <p className="text-sm"><span className="font-medium">Missing skills:</span> {matchResult.missingSkills.join(', ') || 'No major gaps found'}</p>
                    </div>
                  )}

                  {predictedRoles.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Role Prediction</h3>
                      <div className="space-y-2">
                        {predictedRoles.map((role) => (
                          <div key={role.name} className="border rounded p-3">
                            <p className="font-medium">{role.name} - {role.matchPercentage}%</p>
                            <p className="text-sm text-gray-600">Missing: {role.missingSkills.join(', ') || 'None'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {improvements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Resume Rewriting Suggestions</h3>
                      <ul className="list-disc ml-5 text-sm text-gray-700">
                        {improvements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'premium' && (
            <PremiumAnalysisTab 
              resumeId={id || ''} 
              resumeText={resume?.text || ''} 
            />
          )}

          {activeTab === 'opportunities' && (
            <JobOpportunitiesTab 
              resumeId={id || ''} 
              resumeText={resume?.text || ''}
              candidateProfile={{
                title: brainData?.target_role || 'Professional',
                years: brainData?.profile?.experience_years || 0,
                level: brainData?.profile?.category || 'Not specified'
              }}
            />
          )}

          {activeTab === 'rewrite' && (
            <ResumeRewriteTab 
              resumeId={id || ''} 
              resumeText={resume?.text || ''}
              targetRole={jobTitle || brainData?.target_role || 'Professional'}
              level={brainData?.profile?.category || 'Mid-level'}
            />
          )}

          {activeTab === 'custom-search' && (
            <CustomJobSearchTab 
              resumeId={id || ''} 
              resumeText={resume?.text || ''}
              candidateProfile={{
                location: brainLocation || undefined,
              }}
            />
          )}
        </div>

        {/* Matching Jobs Section (kept at bottom) */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => navigate('/jobs')} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              View All Jobs
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
