import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { ArrowLeft, Calendar, Building2, CheckCircle, Clock, XCircle, AlertCircle, Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  atsScore?: number;
  notes?: string;
  firstInteractionAt?: string;
  lastUpdateAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  APPLIED: { bg: "bg-blue-400/10", text: "text-blue-300", icon: Clock },
  INTERVIEW: { bg: "bg-purple-400/10", text: "text-purple-300", icon: Calendar },
  REJECTED: { bg: "bg-red-400/10", text: "text-red-300", icon: XCircle },
  OFFER: { bg: "bg-green-400/10", text: "text-green-300", icon: CheckCircle },
  PENDING: { bg: "bg-yellow-400/10", text: "text-yellow-300", icon: AlertCircle }
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  INTERVIEW: "Interview Scheduled",
  REJECTED: "Rejected",
  OFFER: "Offer Received",
  PENDING: "Pending Response"
};

function getTimeAgo(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function ApplicationTrackerPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter(app => app.status === statusFilter)
      );
    }
  }, [applications, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/jobs/user/applications");
      setApplications(response.data.data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Could not load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await api.patch(`/jobs/applications/${applicationId}`, {
        status: newStatus
      });
      
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      toast.success("Status updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Could not update status");
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === "APPLIED").length,
    interviews: applications.filter(a => a.status === "INTERVIEW").length,
    offers: applications.filter(a => a.status === "OFFER").length,
    rejected: applications.filter(a => a.status === "REJECTED").length
  };

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto px-0 py-0">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/jobs")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-cyan-300" />
              Application Tracker
            </h1>
          </div>
          <Button onClick={() => navigate("/jobs")} className="bg-gradient-to-r from-indigo-500 to-cyan-500">
            <Plus className="w-4 h-4 mr-2" />
            Apply for More
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Apps", value: stats.total, color: "text-blue-300" },
            { label: "Applied", value: stats.applied, color: "text-slate-300" },
            { label: "Interviews", value: stats.interviews, color: "text-purple-300" },
            { label: "Offers", value: stats.offers, color: "text-green-300" },
            { label: "Rejected", value: stats.rejected, color: "text-red-300" }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-white/5 p-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs font-medium ${stat.color}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Filter by Status</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === "all"
                  ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
              }`}
            >
              All ({stats.total})
            </button>
            {Object.keys(STATUS_LABELS).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40"
                    : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
                }`}
              >
                {STATUS_LABELS[status]} ({applications.filter(a => a.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <Building2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">
              {statusFilter === "all"
                ? "No applications yet"
                : `No ${STATUS_LABELS[statusFilter]} applications`}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {statusFilter === "all"
                ? "Start applying to jobs to track them here!"
                : ""}
            </p>
            <Button
              onClick={() => navigate("/jobs")}
              className="mt-4 mx-auto"
            >
              Find Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map(app => {
              const isBg = STATUS_COLORS[app.status];
              const Icon = isBg?.icon || AlertCircle;

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isBg?.bg}`}>
                          <Icon className={`w-5 h-5 ${isBg?.text}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white">{app.jobTitle}</h3>
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {app.company}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          Applied {getTimeAgo(app.appliedAt)}
                        </div>
                        {app.firstInteractionAt && (
                          <div className="flex items-center gap-1 text-purple-300">
                            <CheckCircle className="w-4 h-4" />
                            First interaction {getTimeAgo(app.firstInteractionAt)}
                          </div>
                        )}
                        {app.atsScore && (
                          <div className="px-2 py-1 bg-indigo-400/10 text-indigo-200 rounded text-xs font-semibold">
                            ATS Score: {app.atsScore}%
                          </div>
                        )}
                      </div>

                      {app.notes && (
                        <div className="mt-3 p-2 bg-white/5 rounded text-sm text-slate-300 line-clamp-2">
                          {app.notes}
                        </div>
                      )}
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="flex-shrink-0">
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition cursor-pointer ${
                          isBg?.bg
                        } border-white/10 focus:ring-2 focus:ring-cyan-400`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Box */}
        {applications.length > 0 && (
          <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 backdrop-blur-xl">
            <h3 className="font-semibold text-cyan-300 mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Update your application status to track progress</li>
              <li>• Follow up after 1-2 weeks if you haven't heard back</li>
              <li>• Review rejected applications to improve your resume and cover letter</li>
              <li>• Keep track of interview dates and times in your calendar</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
