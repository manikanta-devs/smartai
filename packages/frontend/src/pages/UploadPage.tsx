import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { Upload, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";
import { useState, useRef } from "react";

export default function UploadPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      console.log("Uploading file:", file.name);
      const response = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      console.log("Upload response:", response.data);
      toast.success("Resume uploaded and analyzed successfully!");
      
      // Redirect to the uploaded resume detail page
      const newResume = response.data.data;
      setTimeout(() => {
        navigate(`/resume/${newResume.id}`);
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.error?.message || error.message || "Failed to upload resume";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = {
        target: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Upload className="h-8 w-8" />
              Upload Your Resume
            </h1>
            <p className="text-blue-100 mt-2">Get instant AI analysis and ATS scoring</p>
          </div>

          {/* Upload Area */}
          <div className="p-12">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              
              {uploading ? (
                <>
                  <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-semibold text-gray-900">Processing your resume...</p>
                  <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
                </>
              ) : (
                <>
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    Drag and drop your resume here
                  </p>
                  <p className="text-gray-600 mb-4">or click to browse files</p>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                  </p>
                </>
              )}
            </div>

            {/* Features */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">⚡</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Instant Analysis</h3>
                <p className="text-sm text-gray-600">Get AI-powered resume analysis in seconds</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold text-lg">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">ATS Scoring</h3>
                <p className="text-sm text-gray-600">Optimize for applicant tracking systems</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold text-lg">💡</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Tips</h3>
                <p className="text-sm text-gray-600">Get personalized suggestions for improvement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Upload your resume in PDF, DOC, DOCX, or TXT format</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Our AI analyzes your resume for optimization</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Get your ATS score and improvement recommendations</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>View detailed analysis and apply for matching jobs</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
