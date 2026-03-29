import { useState } from 'react';
import { Loader2, Briefcase, MapPin, DollarSign, TrendingUp, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { premiumAPI } from '@/lib/api';

interface JobOpportunity {
  id: string;
  title: string;
  company: {
    name: string;
    size?: string;
    industry?: string;
    rating?: number;
  };
  location: {
    city: string;
    state?: string;
    remote: string;
  };
  compensation: {
    salary: string;
    equity?: string;
    totalCompRange?: string;
  };
  matchScore: number;
  whyGreatMatch: Array<{
    reason: string;
    details: string;
    impact: string;
  }>;
  skillsAnalysis: {
    requiredSkills: string[];
    yourMatchingSkills: string[];
    missingButLearnable: string[];
    matchPercentage: number;
  };
  applicationLinks?: {
    primaryUrl?: string;
    linkedinUrl?: string;
  };
}

interface JobOpportunitiesTabProps {
  resumeId: string;
  resumeText: string;
  candidateProfile?: {
    title?: string;
    years?: number;
    skills?: string[];
    level?: string;
    location?: string;
    salary_range?: string;
  };
}

export function JobOpportunitiesTab({ resumeId, resumeText, candidateProfile }: JobOpportunitiesTabProps) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract profile from resume if not provided
      const profile = candidateProfile || {
        title: 'Software Engineer',
        years: 5,
        skills: ['JavaScript', 'React', 'Python', 'AWS'],
        level: 'mid',
        location: 'Remote',
        salary_range: '$100K - $150K',
      };

      const response = await premiumAPI.post('/job-opportunities', {
        userID: resumeId,
        candidate_profile: profile,
      });

      if (response.data.jobs && response.data.jobs.length > 0) {
        setJobs(response.data.jobs);
        toast.success(`🎯 Found ${response.data.count} perfect job matches!`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to generate job opportunities';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (jobs.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Briefcase className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Premium Job Opportunities</h3>
              <p className="text-sm text-gray-700 mb-4">
                Generate 12 tailored job opportunities matched to your experience and skills. Get detailed analysis of why you're perfect for each role, skill gaps, and application strategies.
              </p>
              <Button
                onClick={generateOpportunities}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Generate 12 Job Matches
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          {jobs.length} Job Opportunities
        </h2>
        <Button
          onClick={generateOpportunities}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </Button>
      </div>

      {selectedJob ? (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h3>
              <p className="text-lg text-gray-600 mt-1">
                {selectedJob.company.name} • {selectedJob.location.city}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{selectedJob.matchScore}%</div>
              <div className="text-sm text-gray-600">Match Score</div>
            </div>
          </div>

          {/* Why Great Match */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">🎯 Why Perfect Match</h4>
            <div className="space-y-3">
              {selectedJob.whyGreatMatch?.map((reason, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="font-medium text-gray-900">{reason.reason}</div>
                  <p className="text-sm text-gray-700 mt-1">{reason.details}</p>
                  <p className="text-xs text-blue-600 font-medium mt-2">→ {reason.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Skills Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-sm font-medium text-green-900 mb-2">✓ Your Matching Skills</div>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skillsAnalysis?.yourMatchingSkills?.slice(0, 6).map((skill, idx) => (
                    <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-sm font-bold text-green-600 mt-3">
                  {selectedJob.skillsAnalysis?.matchPercentage || 0}% match
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="text-sm font-medium text-amber-900 mb-2">🚀 Missing But Learnable</div>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skillsAnalysis?.missingButLearnable?.slice(0, 6).map((skill, idx) => (
                    <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-amber-600 mt-3">Can learn in 1-4 weeks</div>
              </div>
            </div>

            {/* All Required Skills */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2">All Required Skills:</div>
              <div className="flex flex-wrap gap-2">
                {selectedJob.skillsAnalysis?.requiredSkills?.map((skill, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Base Salary</div>
              <div className="text-xl font-bold text-gray-900">{selectedJob.compensation.salary}</div>
            </div>
            {selectedJob.compensation.totalCompRange && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Compensation</div>
                <div className="text-xl font-bold text-gray-900">{selectedJob.compensation.totalCompRange}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() =>
                window.open(
                  selectedJob.applicationLinks?.primaryUrl || 'https://www.linkedin.com/jobs/',
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Apply Now
            </Button>
            <Button onClick={() => setSelectedJob(null)} variant="outline" className="flex-1">
              ← Back to List
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="cursor-pointer bg-white border rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {job.matchScore}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {job.company.name} • {job.location.city}, {job.location.state}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {job.compensation.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location.remote}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skillsAnalysis?.yourMatchingSkills?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        ✓ {skill}
                      </span>
                    ))}
                    {job.skillsAnalysis && job.skillsAnalysis.requiredSkills.length > 3 && (
                      <span className="text-xs text-gray-600 px-2 py-0.5">
                        +{job.skillsAnalysis.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-blue-600">{job.matchScore}%</div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobOpportunitiesTab;
