import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { Briefcase, ArrowLeft, ExternalLink, Filter } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

interface Job {
  id: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  description?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
}

const JOB_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "indeed", name: "Indeed", icon: "🔍" },
  { id: "glassdoor", name: "Glassdoor", icon: "✨" },
  { id: "monster", name: "Monster", icon: "👹" },
  { id: "dice", name: "Dice", icon: "🎲" },
  { id: "builtin", name: "Built In", icon: "🏗️" },
  { id: "greenhouse", name: "Greenhouse", icon: "🌱" },
  { id: "workable", name: "Workable", icon: "⚙️" }
];

export default function JobsPage() {
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [role, setRole] = useState("");

  const handleSearchJobs = async () => {
    if (!role.trim()) {
      toast.error("Please enter a job role");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Call search endpoint
      const response = await api.get(`/jobs/search/${encodeURIComponent(role)}`, {
        params: { platforms: selectedPlatforms.join(",") }
      });

      setJobs(response.data.data || []);

      if (!response.data.data || response.data.data.length === 0) {
        toast.info("No jobs found. Try a different role or platform");
      } else {
        toast.success(`Found ${response.data.data.length} matching jobs!`);
      }
    } catch (error: any) {
      console.error("Error searching jobs:", error);
      // Fallback with mock data for demonstration
      const mockJobs: Job[] = JOB_PLATFORMS
        .filter(p => selectedPlatforms.includes(p.id))
        .map((platform, idx) => ({
          id: `${platform.id}-${idx}`,
          title: `${role} - ${Math.floor(Math.random() * 50) + 1} positions`,
          company: `Company ${idx + 1}`,
          platform: platform.name,
          url: `#`,
          description: `Click to view ${role} positions on ${platform.name}`
        }));
      setJobs(mockJobs);
      toast.info("Showing demonstration job results. Check the backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              Job Search
            </h1>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Your Next Opportunity</h2>

          {/* Role Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Role or Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Full Stack Engineer, Product Manager, UX Designer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleSearchJobs()}
            />
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-700">
                Search Platforms
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {JOB_PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 transition text-left ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-medium text-sm">{platform.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearchJobs}
            disabled={loading || !role.trim() || selectedPlatforms.length === 0}
            className="w-full"
          >
            {loading ? "Searching..." : "Search Jobs"}
          </Button>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Results for "{role}" {jobs.length > 0 && `(${jobs.length} found)`}
              </h2>
            </div>

            {jobs.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No matching jobs found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {jobs.map(job => (
                  <div key={job.id} className="px-6 py-5 hover:bg-blue-50 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{job.title}</h3>
                          <span className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs rounded-full font-semibold flex-shrink-0">
                            {job.platform}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-700 mb-1">{job.company}</p>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              📍 {job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              💰 {job.salary}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="flex items-center gap-1">
                              📋 {job.jobType}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                        )}
                      </div>

                      {job.url && job.url !== "#" && (
                        <Button
                          onClick={() => {
                            window.open(job.url, "_blank");
                          }}
                          className="flex items-center gap-2 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Apply Now
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!searched && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 How It Works</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Enter a job title or role you're interested in</li>
              <li>• Select the job platforms you want to search</li>
              <li>• We'll search across all selected platforms and show you available positions</li>
              <li>• Each job links directly to the application page</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
