import { useState } from 'react';
import { Loader2, Search, MapPin, DollarSign, Filter, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Textarea';
import { Input } from '@/components/Input';
import { toast } from 'sonner';
import { premiumAPI } from '@/lib/api';

interface JobSearchCriteria {
  mandatory_skills: string[];
  nice_to_have_skills: string[];
  salary_min?: number;
  salary_max?: number;
  location_preferences: string[];
  work_environment?: string;
  company_size?: string;
  industry?: string;
  custom_requirements?: string;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range?: string;
  relevance_score: number;
  matched_criteria: {
    mandatory_matches: string[];
    nice_to_have_matches: string[];
    missing_skills: string[];
  };
  description: string;
  why_great_fit: string;
}

interface CustomJobSearchTabProps {
  resumeId: string;
  resumeText: string;
  candidateProfile?: {
    skills?: string[];
    location?: string;
    salary_range?: string;
  };
}

export function CustomJobSearchTab({
  resumeId,
  resumeText,
  candidateProfile,
}: CustomJobSearchTabProps) {
  const [criteria, setCriteria] = useState<JobSearchCriteria>({
    mandatory_skills: candidateProfile?.skills || [],
    nice_to_have_skills: [],
    location_preferences: [candidateProfile?.location || 'Remote'],
    work_environment: 'Hybrid',
    company_size: 'Any',
    industry: 'Tech/Software',
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const addMandatorySkill = () => {
    if (newSkill.trim()) {
      setCriteria((prev) => ({
        ...prev,
        mandatory_skills: [...new Set([...prev.mandatory_skills, newSkill.trim()])],
      }));
      setNewSkill('');
      toast.success('✓ Skill added');
    }
  };

  const removeMandatorySkill = (skill: string) => {
    setCriteria((prev) => ({
      ...prev,
      mandatory_skills: prev.mandatory_skills.filter((s) => s !== skill),
    }));
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      setCriteria((prev) => ({
        ...prev,
        location_preferences: [...new Set([...prev.location_preferences, newLocation.trim()])],
      }));
      setNewLocation('');
      toast.success('✓ Location added');
    }
  };

  const removeLocation = (location: string) => {
    setCriteria((prev) => ({
      ...prev,
      location_preferences: prev.location_preferences.filter((l) => l !== location),
    }));
  };

  const search = async () => {
    try {
      setLoading(true);
      setError(null);

      if (criteria.mandatory_skills.length === 0) {
        toast.error('Please add at least one mandatory skill');
        setLoading(false);
        return;
      }

      const response = await premiumAPI.post('/job-search-custom', {
        userID: resumeId,
        criteria,
      });

      if (response.data.jobs && response.data.jobs.length > 0) {
        setResults(response.data.jobs);
        toast.success(`🎯 Found ${response.data.jobs.length} matching jobs!`);
      } else {
        setResults([]);
        toast.info('No jobs matched your criteria');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to search jobs';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className={`bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-5 transition-all ${
        showFilters ? 'max-h-full' : 'max-h-20 overflow-hidden'
      }`}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between font-semibold text-gray-900 mb-4"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Custom Job Search Criteria
          </span>
          <span className="text-indigo-600">{showFilters ? '▼' : '▶'}</span>
        </button>

        {showFilters && (
          <div className="space-y-5">
            {/* Mandatory Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                Required Skills (Must-Have)
              </h4>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="e.g., React, Python, AWS"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addMandatorySkill();
                  }}
                  className="flex-1"
                />
                <Button onClick={addMandatorySkill} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.mandatory_skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => removeMandatorySkill(skill)}
                      className="hover:bg-indigo-700 rounded-full p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Location Preferences */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Location Preferences</h4>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, Remote, New York"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addLocation();
                  }}
                  className="flex-1"
                />
                <Button onClick={addLocation} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.location_preferences.map((location) => (
                  <span
                    key={location}
                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3" />
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Salary Range (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Min Salary ($)</label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={criteria.salary_min || ''}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        salary_min: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Max Salary ($)</label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={criteria.salary_max || ''}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        salary_max: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Other Preferences */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1 font-semibold">Work Environment</label>
                <select
                  value={criteria.work_environment || ''}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      work_environment: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1 font-semibold">Company Size</label>
                <select
                  value={criteria.company_size || ''}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      company_size: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="Any">Any Size</option>
                  <option value="Startup">Startup (&lt;50)</option>
                  <option value="Small">Small (50-200)</option>
                  <option value="Medium">Medium (200-1000)</option>
                  <option value="Enterprise">Enterprise (&gt;1000)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1 font-semibold">Industry</label>
                <select
                  value={criteria.industry || ''}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      industry: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="Any">Any Industry</option>
                  <option value="Tech/Software">Tech/Software</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consulting">Consulting</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>
            </div>

            {/* Custom Requirements */}
            <div>
              <label className="text-xs text-gray-600 block mb-1 font-semibold">Additional Requirements</label>
              <Textarea
                placeholder="e.g., Must have healthcare insurance, 401k match"
                value={criteria.custom_requirements || ''}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    custom_requirements: e.target.value,
                  }))
                }
                className="text-sm"
                rows={3}
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={search}
              disabled={loading || criteria.mandatory_skills.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Jobs
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg">
            {results.length} Jobs Found
          </h3>
          {results.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{job.title}</h4>
                  <p className="text-gray-600 text-sm">{job.company}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{job.relevance_score}%</div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                {job.salary_range && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_range}
                  </span>
                )}
              </div>

              {/* Why Great Fit */}
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                <div className="text-sm font-medium text-green-900 mb-1">✓ Why Great Fit:</div>
                <div className="text-sm text-green-800">{job.why_great_fit}</div>
              </div>

              {/* Criteria Match */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Required Matches:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.matched_criteria.mandatory_matches.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Nice to Have:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.matched_criteria.nice_to_have_matches.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        ★ {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Skills to Learn:</div>
                  <div className="flex flex-wrap gap-1">
                    {job.matched_criteria.missing_skills.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        📚 {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Add criteria and click &quot;Search Jobs&quot; to find opportunities</p>
        </div>
      )}
    </div>
  );
}

export default CustomJobSearchTab;
