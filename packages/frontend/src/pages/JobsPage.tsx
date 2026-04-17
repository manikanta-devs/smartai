import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft, ExternalLink, MapPin, Sparkles, Brain, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "../components/Button";
import { ApplicationForm } from "../components/ApplicationForm";

type Mode = "jobs" | "internships";

type RoleSuggestion = {
  role: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
};

type MatchedJob = {
  id: string;
  title: string;
  company: string;
  platform: string;
  location: string;
  salary?: string;
  url?: string;
  description: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyMatched: string[];
  mode: Mode;
};

type StudentSearchResponse = {
  context: {
    userType: string;
    location: string;
    mode: Mode;
    city: string | null;
    remoteOnly: boolean;
    queryRole: string;
    objective: string | null;
  };
  jobs: MatchedJob[];
  recommended: {
    roles: RoleSuggestion[];
    skillsToLearnNext: string[];
  };
  fallback: {
    similarRoles: string[];
    internshipSuggestions: string[];
    upskillingSuggestions: string[];
    mode: Mode;
  } | null;
};

const INDIA_CITIES = ["Hyderabad", "Bangalore", "Mumbai", "Delhi", "Pune", "Chennai"];
const RELEVANT_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn India" },
  { id: "internshala", name: "Internshala" },
  { id: "naukri", name: "Naukri" },
  { id: "indeed", name: "Indeed India" },
  { id: "remoteok", name: "Remote (India)" }
];

export default function JobsPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("jobs");
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(RELEVANT_PLATFORMS.map((p) => p.id));
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<StudentSearchResponse | null>(null);
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<MatchedJob | null>(null);

  const sortedJobs = useMemo(() => {
    if (!result?.jobs) return [];
    return [...result.jobs].sort((a, b) => b.matchScore - a.matchScore);
  }, [result]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const handleSearch = async () => {
    if (!role.trim()) {
      toast.error("Enter a role to search");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data } = await api.post<{ success: boolean; data: StudentSearchResponse }>("/jobs/student-search", {
        role,
        mode,
        location: "India",
        city: city || undefined,
        remoteOnly,
        platforms: selectedPlatforms
      });

      setResult(data.data);
      if ((data.data.jobs || []).length > 0) {
        toast.success(`Found ${data.data.jobs.length} ${mode}`);
      } else {
        toast.info("No direct matches found. Showing alternatives and upskilling suggestions.");
      }
    } catch (error: any) {
      console.error("Student search error:", error);
      toast.error(error?.response?.data?.error?.message || "Search failed. Try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const titleText = mode === "jobs" ? "Jobs" : "Internships";

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto px-0 py-0">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-cyan-300" />
            Student AI Job Assistant
          </h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">India-first search</h2>
              <p className="text-sm text-slate-400 mt-1">Location is locked to India for fresher jobs and internships.</p>
            </div>
            <div className="inline-flex rounded-lg border border-white/10 bg-[#04050f] p-1">
              <button
                onClick={() => setMode("jobs")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "jobs" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300"}`}
              >
                Jobs
              </button>
              <button
                onClick={() => setMode("internships")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${mode === "internships" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300"}`}
              >
                Internships
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Role</label>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder={mode === "jobs" ? "e.g. Full Stack Developer" : "e.g. Data Analyst Intern"}
                className="w-full px-4 py-2 border border-white/10 rounded-lg bg-[#04050f] text-slate-100 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">City (India)</label>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="w-full px-4 py-2 border border-white/10 rounded-lg bg-[#04050f] text-slate-100 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="">All India</option>
                {INDIA_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRemoteOnly((prev) => !prev)}
              className={`px-3 py-2 rounded-lg border text-sm transition ${remoteOnly ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-100" : "bg-white/5 border-white/10 text-slate-300"}`}
            >
              Remote (India) only
            </button>
            <span className="text-xs text-slate-500">International jobs are automatically filtered out.</span>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Platforms</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {RELEVANT_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-3 rounded-lg border transition text-left text-sm ${selectedPlatforms.includes(platform.id) ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"}`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
            {loading ? "Finding best matches..." : `Search ${titleText}`}
          </Button>
        </div>

        {searched && result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recommended for You</h2>
                  <p className="text-sm text-slate-400 mt-1">Based on your resume, skills, certifications, and objective.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  {result.context.location} • {result.context.mode}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-white/10 bg-[#0b0d18] p-4">
                  <div className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-300" />
                    Best-fit roles
                  </div>
                  <div className="space-y-2">
                    {result.recommended.roles.map((item) => (
                      <div key={item.role} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-100 font-medium">{item.role}</span>
                          <span className="text-cyan-200 text-sm">{item.score}% match</span>
                        </div>
                        {item.missingSkills.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">Missing: {item.missingSkills.slice(0, 3).join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b0d18] p-4">
                  <div className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-300" />
                    Skills to learn next
                  </div>
                  <div className="space-y-2">
                    {result.recommended.skillsToLearnNext.slice(0, 5).map((skillTip) => (
                      <div key={skillTip} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                        {skillTip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {sortedJobs.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{sortedJobs.length} matched {titleText.toLowerCase()}</h3>
                {sortedJobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl hover:border-cyan-400/30 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                          <span className="px-2.5 py-1 bg-cyan-400/10 text-cyan-200 text-xs rounded-full border border-cyan-400/20">{job.platform}</span>
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-200 text-xs rounded-full border border-emerald-400/20">{job.matchScore}% Match</span>
                        </div>
                        <p className="text-slate-300 font-medium">{job.company}</p>
                        <p className="text-sm text-slate-400 mt-1">{job.description}</p>
                      </div>

                      <div className="text-sm text-slate-300 space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-cyan-300" />
                          {job.location}
                        </div>
                        <div>Salary/Stipend: {job.salary || "Not disclosed"}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
                      <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Your matched skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(job.matchedSkills.length > 0 ? job.matchedSkills : ["Profile-aligned role"]).slice(0, 6).map((skill) => (
                            <span key={`${job.id}-m-${skill}`} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-200 text-xs border border-emerald-400/20">{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Missing skills</p>
                        <div className="flex flex-wrap gap-2">
                          {(job.missingSkills.length > 0 ? job.missingSkills : ["No major gaps detected"]).slice(0, 6).map((skill) => (
                            <span key={`${job.id}-x-${skill}`} className="px-2 py-1 rounded bg-amber-500/10 text-amber-200 text-xs border border-amber-400/20">{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Why this matches</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                          {job.whyMatched.slice(0, 3).map((reason) => (
                            <li key={`${job.id}-${reason}`}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={() => {
                          if (job.url) {
                            window.open(job.url, "_blank", "noopener,noreferrer");
                          } else {
                            toast.info("External apply link unavailable for this listing.");
                          }
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                      >
                        Apply Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedJobForApplication(job);
                          setApplicationFormOpen(true);
                        }}
                      >
                        Save Application Notes
                      </Button>
                      {job.url && (
                        <Button variant="outline" onClick={() => window.open(job.url, "_blank", "noopener,noreferrer")}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Source
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white mb-2">No direct matches yet</h3>
                <p className="text-sm text-slate-400 mb-4">Try these alternatives to keep momentum.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-[#0b0d18] p-4">
                    <p className="text-sm font-semibold text-slate-100 mb-2">Similar roles</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {(result.fallback?.similarRoles || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0b0d18] p-4">
                    <p className="text-sm font-semibold text-slate-100 mb-2">Internship suggestions</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {(result.fallback?.internshipSuggestions || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0b0d18] p-4">
                    <p className="text-sm font-semibold text-slate-100 mb-2">Upskilling suggestions</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {(result.fallback?.upskillingSuggestions || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedJobForApplication && (
        <ApplicationForm
          isOpen={applicationFormOpen}
          onClose={() => {
            setApplicationFormOpen(false);
            setSelectedJobForApplication(null);
          }}
          jobId={selectedJobForApplication.id}
          jobTitle={selectedJobForApplication.title}
          company={selectedJobForApplication.company}
          onSuccess={() => {
            toast.success(`Application notes saved for ${selectedJobForApplication.company}`);
          }}
        />
      )}
    </div>
  );
}
