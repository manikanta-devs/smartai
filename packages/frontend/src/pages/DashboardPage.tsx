import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { Upload, FileText, Briefcase, TrendingUp, Eye, Trash2, BarChart3, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useState, useEffect } from "react";

interface Resume {
  id: string;
  fileName: string;
  atsScore: number;
  overallScore: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/resumes");
      setResumes(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const validExtensions = [".pdf", ".doc", ".docx", ".txt"];
    const fileName = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    if (!isValidType) {
      toast.error("Only PDF, DOC, DOCX, or TXT files are supported");
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Resume uploaded and analyzed successfully!");
      const newResume = response.data.data;
      setResumes([newResume, ...resumes]);
      
      setTimeout(() => {
        navigate(`/resume/${newResume.id}`);
      }, 500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || "Failed to upload resume";
      toast.error(errorMsg);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    try {
      await api.delete(`/resumes/${resumeId}`);
      setResumes(resumes.filter(r => r.id !== resumeId));
      toast.success("Resume deleted");
    } catch (error: any) {
      toast.error("Failed to delete resume");
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-blue-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Upload Resume
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2 font-medium">
                {uploading ? "Uploading and analyzing..." : "Drag and drop your resume or click to browse"}
              </p>
              <p className="text-sm text-gray-500">PDF, DOC, DOCX, or TXT (max 5MB)</p>
            </label>
          </div>
        </div>

        {/* Loading or Empty State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading your resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No resumes yet</p>
            <p className="text-sm text-gray-500">Upload your first resume to get started with AI analysis</p>
          </div>
        ) : (
          <>
            {/* Resumes List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Your Resumes ({resumes.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {resumes.map((resume) => (
                  <div key={resume.id} className="px-8 py-6 hover:bg-blue-50 transition">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{resume.fileName}</h3>
                          {resume.status === "analyzed" && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ATS Score</p>
                          <div className={`px-3 py-2 rounded-lg font-bold text-lg ${getScoreBadgeColor(resume.atsScore)}`}>
                            {resume.atsScore}%
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Overall</p>
                          <div className={`px-3 py-2 rounded-lg font-bold text-lg ${getScoreBadgeColor(resume.overallScore)}`}>
                            {resume.overallScore}%
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/resume/${resume.id}`)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteResume(resume.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border-l-4 border-blue-600">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              AI Analysis
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Get detailed ATS scores and improvement suggestions</p>
            <p className="text-xs text-gray-500">Upload a resume to get started</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-l-4 border-purple-600">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Job Matching
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Find jobs that match your resume</p>
            <Button
              onClick={() => navigate("/jobs")}
              className="w-full"
              size="sm"
            >
              Browse Jobs
            </Button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-600">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Account
            </h3>
            <div className="space-y-2 mb-4 text-sm">
              <p className="text-gray-700"><span className="font-semibold">Email:</span> {user?.email}</p>
              <p className="text-gray-700"><span className="font-semibold">Total Resumes:</span> {resumes.length}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="w-full"
              size="sm"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
