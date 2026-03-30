import { useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import api from '@/lib/api';

interface PremiumScore {
  score: number;
  breakdown: Record<string, number>;
  label: string;
}

interface PremiumAnalysis {
  personalInfo: Record<string, string>;
  careerLevel: string;
  yearsOfExperience: number;
  scores: {
    atsScore: number;
    overallScore: number;
    atsBreakdown: Record<string, number>;
    scoreBreakdown: Record<string, number>;
  };
  suggestedJobTitles: Array<{
    title: string;
    matchScore: number;
  }>;
  strengths: Array<{
    area: string;
    description: string;
    examples: string[];
  }>;
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    issue: string;
    recommendation: string;
    example: string;
  }>;
  keywordAnalysis: {
    currentKeywords: string[];
    missingCriticalKeywords: string[];
  };
}

interface PremiumAnalysisTabProps {
  resumeId: string;
  resumeText: string;
  onAnalysisComplete?: (analysis: PremiumAnalysis) => void;
}

export function PremiumAnalysisTab({ resumeId, resumeText, onAnalysisComplete }: PremiumAnalysisTabProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PremiumAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPremiumAnalysis = async () => {
    if (!resumeText || resumeText.length < 10) {
      toast.error('Resume text is too short for analysis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/resumes/${resumeId}/analyze`);
      const payload = response.data?.data || {};

      const mappedAnalysis: PremiumAnalysis = {
        personalInfo: {},
        careerLevel: payload.overallScore >= 85 ? 'senior' : payload.overallScore >= 60 ? 'mid-level' : 'entry-level',
        yearsOfExperience: 0,
        scores: {
          atsScore: payload.atsScore ?? payload.score ?? 0,
          overallScore: payload.score ?? payload.atsScore ?? 0,
          atsBreakdown: payload.breakdown || {},
          scoreBreakdown: payload.breakdown || {},
        },
        suggestedJobTitles: (payload.keywordRecommendations || []).slice(0, 5).map((keyword: string) => ({
          title: keyword,
          matchScore: 60,
        })),
        strengths: [],
        improvements: (payload.suggestions || []).map((suggestion: string) => ({
          priority: 'medium',
          area: 'Resume',
          issue: suggestion,
          recommendation: suggestion,
          example: ''
        })),
        keywordAnalysis: {
          currentKeywords: payload.keywordRecommendations || [],
          missingCriticalKeywords: []
        }
      };

      if (mappedAnalysis) {
        setAnalysis(mappedAnalysis);
        onAnalysisComplete?.(mappedAnalysis);
        toast.success('✨ Deep analysis complete!');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to run analysis';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Premium Deep Analysis</h3>
              <p className="text-sm text-gray-700 mb-4">
                Get an elite career strategist analysis with ATS scores, career level assessment, specific improvements, and suggested job titles. Powered by Claude Sonnet.
              </p>
              <Button
                onClick={runPremiumAnalysis}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Premium Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">ATS Score</div>
          <div className="text-3xl font-bold text-blue-600">{analysis.scores.atsScore}</div>
          <div className="text-xs text-gray-500 mt-2">Compatibility</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Overall Score</div>
          <div className="text-3xl font-bold text-purple-600">{analysis.scores.overallScore}</div>
          <div className="text-xs text-gray-500 mt-2">Quality</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-xs text-gray-600 mb-1">Career Level</div>
          <div className="text-2xl font-bold text-green-600 capitalize">{analysis.careerLevel}</div>
          <div className="text-xs text-gray-500 mt-2">{analysis.yearsOfExperience}y exp</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-xs text-gray-600 mb-1">Target Roles</div>
          <div className="text-2xl font-bold text-amber-600">{analysis.suggestedJobTitles.length}</div>
          <div className="text-xs text-gray-500 mt-2">Recommended</div>
        </div>
      </div>

      {/* Suggested Job Titles */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          🎯 Ideal Job Titles
        </h3>
        <div className="space-y-2">
          {analysis.suggestedJobTitles.map((job, idx) => (
            <div key={idx} className="bg-white border rounded-lg p-3 flex items-center justify-between">
              <span className="font-medium text-gray-900">{job.title}</span>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 rounded-full">
                  <span className="font-bold text-amber-700">{job.matchScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          ✅ Strengths (Keep & Emphasize)
        </h3>
        <div className="space-y-3">
          {analysis.strengths.map((strength, idx) => (
            <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-1">{strength.area}</div>
              <p className="text-sm text-gray-700 mb-2">{strength.description}</p>
              {strength.examples && strength.examples.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {strength.examples.map((ex, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      "{ex}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Improvements - High Priority */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          🚀 High-Priority Improvements
        </h3>
        <div className="space-y-3">
          {analysis.improvements
            .filter((imp) => imp.priority === 'high')
            .map((improvement, idx) => (
              <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-2">{improvement.area}</div>
                <div className="mb-3">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Issue:</span> {improvement.issue}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Fix:</span> {improvement.recommendation}
                  </p>
                </div>
                {improvement.example && (
                  <div className="bg-white rounded p-2 border border-orange-100 text-sm font-mono text-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Example:</div>
                    <div className="text-xs italic">{improvement.example}</div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Medium Priority Improvements */}
      {analysis.improvements.some((imp) => imp.priority === 'medium') && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">📊 Medium-Priority Improvements</h3>
          <div className="space-y-2">
            {analysis.improvements
              .filter((imp) => imp.priority === 'medium')
              .map((improvement, idx) => (
                <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="font-medium text-gray-900 text-sm">{improvement.area}</div>
                  <p className="text-xs text-gray-700 mt-1">{improvement.recommendation}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">🔑 Keyword Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="font-medium text-green-900 mb-2">✓ Current Keywords</div>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.currentKeywords.slice(0, 8).map((kw, idx) => (
                <span key={idx} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-medium text-red-900 mb-2">✗ Missing Critical Keywords</div>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.missingCriticalKeywords.slice(0, 8).map((kw, idx) => (
                <span key={idx} className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={runPremiumAnalysis}
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          🔄 Re-analyze
        </Button>
        <Button
          onClick={() => {
            const text = JSON.stringify(analysis, null, 2);
            navigator.clipboard.writeText(text);
            toast.success('Analysis copied to clipboard!');
          }}
          variant="outline"
          className="flex-1"
        >
          📋 Copy Analysis
        </Button>
      </div>
    </div>
  );
}

export default PremiumAnalysisTab;
