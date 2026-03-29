/**
 * Unified Smart AI Dashboard
 * Integrates all three applications into one interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, Upload, Zap, Target, TrendingUp } from 'lucide-react';
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

export default function IntegratedDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'roles' | 'ats'>('overview');

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart AI Dashboard</h1>
              <p className="text-gray-600 mt-1">Analyze, optimize, and perfect your resume</p>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-medium">{user?.email}</p>
              <button 
                onClick={() => navigate('/upload')}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Resume
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Resumes List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Resumes</h2>
            
            {loading && !resumes.length ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No resumes yet. Upload one to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition group"
                  >
                    <button
                      onClick={() => setSelectedResume(resume.id)}
                      className={`flex-1 text-left transition ${
                        selectedResume === resume.id
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{resume.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => navigate(`/resume/${resume.id}`)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition"
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
                <button
                  onClick={() => handleAnalyzeResume(selectedResume)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Analyze Resume
                </button>
                
                <button
                  onClick={() => handlePredictRoles(selectedResume)}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Predict Roles
                </button>
                
                <button
                  onClick={() => handleATSScore(selectedResume)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  ATS Score
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
                </div>

                {/* Score Display */}
                {analysis.score !== undefined && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-blue-600">{analysis.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm text-orange-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm bg-blue-50 text-blue-900 p-2 rounded border border-blue-200">
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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select a resume to analyze</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
