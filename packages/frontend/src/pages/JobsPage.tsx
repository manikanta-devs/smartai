import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowLeft, ExternalLink, MapPin, Sparkles, ChevronDown, ChevronUp, Brain, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "../components/Button";

type JobType = "Job" | "Internship";

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
  url: string;
  applyLink: string;
  description: string;
  type: JobType;
  matchScore: number;
  scoreBreakdown: {
    skillsMatch: number;
    roleMatch: number;
    experienceMatch: number;
    locationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  improvementSuggestion: string;
  whyMatched: string[];
  postedDate?: string;
};

type StudentSearchResponse = {
  context: {
    userType: string;
    location: string;
    mode: "mixed";
    queryRole: string;
    objective: string | null;
    profile: {
      skills: string[];
      level: "fresher" | "junior" | "mid" | "senior";
      preferred_roles: string[];
    };
  };
  jobs: MatchedJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  recommended: {
    roles: RoleSuggestion[];
    skillsToLearnNext: string[];
  };
  fallback: {
    similarRoles: string[];
    internshipSuggestions: string[];
    upskillingSuggestions: string[];
    mode: "jobs" | "internships";
  } | null;
};

export default function JobsPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<StudentSearchResponse | null>(null);
  const [jobs, setJobs] = useState<MatchedJob[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const handleSearch = async () => {
    if (!role.trim()) {
      toast.error("Enter Job Role");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data } = await api.post<{ success: boolean; data: StudentSearchResponse }>("/jobs/student-search", { role, page: 1, limit: 10 });

      setResult(data.data);
      setJobs(data.data.jobs || []);
      setExpandedIds({});
      setPage(1);
      setHasMore(Boolean(data.data.pagination?.hasMore));
      if ((data.data.jobs || []).length > 0) {
        toast.success(`Found ${data.data.pagination?.total || data.data.jobs.length} India-only listings`);
      } else {
        toast.info("No direct matches found. Showing role alternatives and upskilling suggestions.");
      }
    } catch (error: any) {
      console.error("Job aggregator search error:", error);
      toast.error(error?.response?.data?.error?.message || "Search failed. Try again.");
      setResult(null);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading || !role.trim()) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const { data } = await api.post<{ success: boolean; data: StudentSearchResponse }>("/jobs/student-search", {
        role,
        page: nextPage,
        limit: 10
      });
      setJobs((prev) => [...prev, ...(data.data.jobs || [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.data.pagination?.hasMore));
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || "Failed to load more jobs.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (jobId: string) => {
    setExpandedIds((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

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
          <div className="mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">AI Job Aggregator (India Only)</h2>
              <p className="text-sm text-slate-400 mt-1">Enter one role. AI searches across free job sources, removes duplicates, validates real apply links, and ranks by match.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Enter Job Role</label>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="e.g. Software Engineer, Finance Analyst, Data Analyst"
              className="w-full px-4 py-3 border border-white/10 rounded-lg bg-[#04050f] text-slate-100 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSearch();
                }
              }}
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
            {loading ? "Searching India jobs..." : "Search Jobs"}
          </Button>
        </div>

        {searched && result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Match Summary</h2>
                  <p className="text-sm text-slate-400 mt-1">Parsed from your resume profile with weighted match scoring.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  {result.context.location} • {result.context.profile.level}
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

            {jobs.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{result.pagination.total} matched listings (ranked)</h3>
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl hover:border-cyan-400/30 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                          <span className="px-2.5 py-1 bg-cyan-400/10 text-cyan-200 text-xs rounded-full border border-cyan-400/20">{job.platform}</span>
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-200 text-xs rounded-full border border-indigo-400/20">{job.type}</span>
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

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={() => {
                          window.open(job.applyLink, "_blank", "noopener,noreferrer");
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                      >
                        Apply Now
                      </Button>
                      <Button variant="outline" onClick={() => toggleExpand(job.id)}>
                        {expandedIds[job.id] ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        {expandedIds[job.id] ? "Hide Match Details" : "Show Match Details"}
                      </Button>
                      <Button variant="outline" onClick={() => window.open(job.applyLink, "_blank", "noopener,noreferrer")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Link
                      </Button>
                    </div>

                    {expandedIds[job.id] && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
                        <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Matched Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {(job.matchedSkills.length > 0 ? job.matchedSkills : ["Role alignment"]).slice(0, 8).map((skill) => (
                              <span key={`${job.id}-m-${skill}`} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-200 text-xs border border-emerald-400/20">{skill}</span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Missing Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {(job.missingSkills.length > 0 ? job.missingSkills : ["No major skill gaps"]).slice(0, 8).map((skill) => (
                              <span key={`${job.id}-x-${skill}`} className="px-2 py-1 rounded bg-amber-500/10 text-amber-200 text-xs border border-amber-400/20">{skill}</span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-[#0b0d18] p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Improvement Suggestion</p>
                          <p className="text-sm text-slate-300 mb-2">{job.improvementSuggestion}</p>
                          <p className="text-xs text-slate-500">Breakdown: Skills {job.scoreBreakdown.skillsMatch} • Role {job.scoreBreakdown.roleMatch} • Experience {job.scoreBreakdown.experienceMatch} • Location {job.scoreBreakdown.locationMatch}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {hasMore && (
                  <div className="pt-2">
                    <Button onClick={loadMore} disabled={loading} className="w-full bg-white/10 border border-white/20 hover:bg-white/20">
                      {loading ? "Loading more..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white mb-2">No direct matches yet</h3>
                <p className="text-sm text-slate-400 mb-4">Try these alternatives to improve discoverability.</p>
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
    </div>
  );
}
