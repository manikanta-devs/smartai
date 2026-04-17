import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import {
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  ClipboardPaste,
  FileText,
  Link2,
  Loader2,
  Lock,
  ScanSearch,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

const sampleResumeText = `Avery Chen
Product-minded software engineer with 2.5 years of experience building TypeScript, React, and Node.js applications.
Email: avery.chen@example.com | LinkedIn: linkedin.com/in/averychen | Remote, CA

Experience
- Built a resume analytics dashboard used by 2,000+ students, improving application completion by 31%.
- Reduced resume parsing latency by 43% by refactoring the upload and extraction workflow.
- Led a 4-person team to ship a job matching MVP in 6 weeks.

Skills
TypeScript, React, Node.js, Express, PostgreSQL, Prisma, Tailwind CSS, REST APIs, Product Design, AI workflows`;

const uploadSteps = [
  "Reading resume...",
  "Extracting skills...",
  "Calculating ATS score...",
  "Finding job matches...",
  "Generating insights..."
];

const supportedFormats = ["PDF", "DOCX", "DOC", "TXT"];

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeMode, setActiveMode] = useState<"file" | "text">("file");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) {
      setUploadProgress(0);
      setCurrentStep(0);
      return;
    }

    const progressTimer = window.setInterval(() => {
      setUploadProgress((current) => {
        const next = Math.min(current + 20, 95);
        setCurrentStep(Math.min(Math.floor(next / 20), uploadSteps.length - 1));
        return next;
      });
    }, 700);

    return () => window.clearInterval(progressTimer);
  }, [uploading]);

  const toUploadFile = (file: File) => {
    const validExtensions = [".pdf", ".doc", ".docx", ".txt"];
    const fileName = file.name.toLowerCase();
    const isValidType = validExtensions.some((extension) => fileName.endsWith(extension));

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return null;
    }

    if (!isValidType) {
      toast.error("Only PDF, DOC, DOCX, or TXT files are supported");
      return null;
    }

    return file;
  };

  const handleFileUpload = async (file: File) => {
    const validFile = toUploadFile(file);
    if (!validFile) return;

    setSelectedFile(validFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", validFile);

      const response = await api.post("/resumes/upload", formData);
      const uploadedResume = response.data?.data?.resume;
      const automation = response.data?.data?.automation;

      toast.success(automation ? "Resume uploaded and automation agent finished" : "Resume uploaded and analyzed successfully!");
      setUploadProgress(100);

      window.setTimeout(() => {
        navigate(uploadedResume?.id ? `/resume/${uploadedResume.id}` : "/dashboard");
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

  const buildFileFromText = (text: string, fileName: string) => {
    return new File([text], fileName, { type: "text/plain" });
  };

  const handleAnalyze = async () => {
    if (uploading) return;

    if (activeMode === "file" && selectedFile) {
      await handleFileUpload(selectedFile);
      return;
    }

    if (activeMode === "text" && resumeText.trim()) {
      await handleFileUpload(buildFileFromText(resumeText.trim(), "careeros-resume.txt"));
      return;
    }

    toast.error("Choose a resume file or paste text before analyzing");
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setActiveMode("file");
      setSelectedFile(files[0]);
      await handleFileUpload(files[0]);
    }
  };

  const sampleSizeLabel = `${Math.max(Math.round(new Blob([resumeText || sampleResumeText]).size / 1024), 1)} KB`;

  return (
    <div className="space-y-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-0 py-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <section className="grid gap-6 lg:grid-cols-[1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl sm:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Resume upload
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Upload your resume and get instant analysis.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Drop a resume file or paste resume text. You’ll see your selected file here, then the backend will generate real ATS and matching insights after upload.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0d18] p-5">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Current state</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {selectedFile ? selectedFile.name : "No resume selected yet"}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Upload a file or paste text to see the actual ATS score, improvements, and job-match signals from your resume.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-indigo-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Upload resume</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Drop your resume here</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Max 5MB • Private by default
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-6 cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center transition sm:p-10 ${dragActive ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-[#0b0d18] hover:border-indigo-400/50 hover:bg-white/5"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setSelectedFile(file);
                  setActiveMode("file");
                }}
                disabled={uploading}
                className="hidden"
              />

              {uploading ? (
                <div className="mx-auto flex max-w-xl flex-col items-center">
                  <Loader2 className="h-14 w-14 animate-spin text-cyan-300" />
                  <h3 className="mt-5 text-2xl font-semibold text-white">Analyzing your resume</h3>
                  <p className="mt-2 text-slate-400">This usually takes a few seconds.</p>

                  <div className="mt-8 w-full">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
                      <span>{uploadSteps[currentStep]}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {uploadSteps.map((step, index) => (
                        <div
                          key={step}
                          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${index <= currentStep ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-400"}`}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${index <= currentStep ? "text-emerald-300" : "text-slate-500"}`} />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex max-w-xl flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-400/10">
                    <CloudUpload className="h-9 w-9 text-indigo-200" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">{selectedFile ? selectedFile.name : "Drop your resume here"}</h3>
                  <p className="mt-2 text-slate-400">PDF, DOC, DOCX, TXT • drag and drop or click to browse</p>

                  {selectedFile ? (
                    <div className="mt-6 flex w-full max-w-lg items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-left">
                      <div>
                        <div className="font-medium text-emerald-100">Selected file</div>
                        <div className="text-sm text-emerald-200/80">{selectedFile.name} • {Math.max(Math.round(selectedFile.size / 1024), 1)} KB</div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="rounded-full border border-emerald-400/20 px-3 py-1 text-sm text-emerald-100 hover:bg-emerald-400/10"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                    {supportedFormats.map((format) => (
                      <span key={format} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "File upload", value: "PDF / DOC / DOCX / TXT", active: activeMode === "file", icon: FileText },
                { label: "Paste text", value: "Quick copy-paste analysis", active: activeMode === "text", icon: ClipboardPaste }
              ].map(({ label, value, active, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveMode(label === "File upload" ? "file" : "text")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-cyan-400/30 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 ${active ? "text-cyan-200" : "text-slate-400"}`} />
                  <div>
                    <div className="font-medium text-white">{label}</div>
                    <div className="text-sm text-slate-400">{value}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2 font-medium text-slate-200">
                <Link2 className="h-4 w-4" />
                LinkedIn import
              </div>
              <div className="mt-1 text-slate-400">Coming soon. For now, use file upload or paste text for full analysis.</div>
            </div>

            {activeMode !== "file" ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0b0d18] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Paste resume text</h3>
                    <p className="text-sm text-slate-400">Use a clean export or paste the content directly.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{sampleSizeLabel}</span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste your resume, project summary, skills, and experience here..."
                  className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-[#04050f] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={handleAnalyze} disabled={uploading} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analyze My Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResumeText(sampleResumeText);
                      toast.success("Sample resume loaded");
                    }}
                  >
                    Try sample resume
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={uploading}
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-950/40 hover:from-indigo-400 hover:via-violet-400 hover:to-cyan-400"
              >
                <Upload className="mr-2 h-4 w-4" />
                Analyze My Resume
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setActiveMode("text");
                  setResumeText(sampleResumeText);
                  toast.success("Sample resume loaded");
                }}
              >
                Try sample resume
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <Lock className="h-4 w-4 text-emerald-300" />
                Your file is analyzed in memory and not permanently stored by this page.
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
                <ScanSearch className="h-4 w-4" />
                What happens next
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Upload a file or paste resume text.",
                  "CareerOS extracts skills, impact, and keywords.",
                  "You get an ATS score plus improvement ideas.",
                  "Then jump into job matching and rewrites."
                ].map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-100">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Built for students
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  "Final year students",
                  "CS / engineering",
                  "Business / MBA",
                  "Design / research"
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-[#0b0d18] px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
