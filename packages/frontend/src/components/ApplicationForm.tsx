import { useState, useEffect } from "react";
import { X, Send, Loader } from "lucide-react";
import { Button } from "./Button";
import { toast } from "sonner";
import api from "../lib/api";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  company: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Resume {
  id: string;
  title: string;
}

export function ApplicationForm({
  jobId,
  jobTitle,
  company,
  isOpen,
  onClose,
  onSuccess
}: ApplicationFormProps) {
  const [step, setStep] = useState<"resume" | "answers" | "review">("resume");
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [answers, setAnswers] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load resumes on mount
  useEffect(() => {
    if (isOpen && resumes.length === 0) {
      loadResumes();
    }
  }, [isOpen, resumes.length]);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/resumes");
      setResumes(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedResume(response.data.data[0].id);
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
      toast.error("Could not load your resumes");
    } finally {
      setLoading(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!selectedResume) {
      toast.error("Please select a resume");
      return;
    }

    try {
      setLoading(true);
      // Get resume content first
      // Then call cover letter API
      const response = await api.post("/jobs/cover-letter", {
        resumeText: "Sample resume text", // In real app, would fetch actual resume
        jobDescription: jobTitle,
        company: company,
        position: jobTitle
      });

      if (response.data.coverLetter) {
        setCoverLetter(response.data.coverLetter);
        toast.success("Cover letter generated!");
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast.error("Could not generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedResume) {
      toast.error("Please select a resume");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/jobs/applications", {
        jobId: jobId,
        jobTitle: jobTitle,
        company: company,
        resumeId: selectedResume,
        coverLetter: coverLetter,
        customAnswers: answers,
        status: "applied"
      });

      toast.success(`Successfully applied to ${company}!`);
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setStep("resume");
      setCoverLetter("");
      setAnswers("");
      onClose();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/95 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-white">{company}</h2>
            <p className="text-sm text-slate-400">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex gap-4">
            {["resume", "answers", "review"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    step === s
                      ? "bg-cyan-400/20 border-2 border-cyan-400 text-cyan-300"
                      : ["resume", "answers"].includes(s) &&
                        ["resume", "answers", "review"].indexOf(step) >
                          ["resume", "answers", "review"].indexOf(s)
                      ? "bg-green-400/20 border-2 border-green-400 text-green-300"
                      : "bg-white/5 border-2 border-white/10 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300 hidden sm:inline">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 2 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {/* Step 1: Resume Selection */}
          {step === "resume" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Select Resume
                </label>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                  </div>
                ) : resumes.length === 0 ? (
                  <p className="text-slate-400">No resumes found. Create one first!</p>
                ) : (
                  <select
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-400"
                  >
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write your cover letter here or generate one..."
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 resize-none h-32"
                />
                <Button
                  onClick={generateCoverLetter}
                  disabled={loading || !selectedResume}
                  variant="outline"
                  className="mt-2 text-sm"
                >
                  {loading ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Answers to Application Questions */}
          {step === "answers" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Screening Questions
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Some companies ask additional questions. Add your answers here if needed.
                </p>
                <textarea
                  value={answers}
                  onChange={(e) => setAnswers(e.target.value)}
                  placeholder="Q1: Why are you interested in this role?&#10;A: [Your answer]&#10;&#10;Q2: Tell us about a project you're proud of&#10;A: [Your answer]"
                  className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 resize-none h-40 font-mono text-sm"
                />
              </div>

              <div className="bg-indigo-400/10 border border-indigo-400/20 rounded-lg p-4">
                <p className="text-sm text-indigo-200">
                  💡 Tip: Including thoughtful answers increases your chance of getting an interview!
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Resume</p>
                  <p className="text-white">
                    {resumes.find(r => r.id === selectedResume)?.title || "Selected"}
                  </p>
                </div>

                {coverLetter && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Cover Letter</p>
                    <p className="text-white text-sm line-clamp-2">{coverLetter}</p>
                  </div>
                )}

                {answers && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Additional Answers</p>
                    <p className="text-white text-sm line-clamp-2">{answers}</p>
                  </div>
                )}
              </div>

              <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                <p className="text-sm text-green-200">
                  ✅ Ready to submit your application to <strong>{company}</strong>?
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-white/10 bg-slate-900/95 backdrop-blur">
          {step !== "resume" && (
            <Button
              variant="outline"
              onClick={() => {
                const steps = ["resume", "answers", "review"];
                const currentIndex = steps.indexOf(step);
                setStep(steps[currentIndex - 1] as any);
              }}
            >
              Back
            </Button>
          )}

          <Button
            onClick={() => {
              if (step === "resume") setStep("answers");
              else if (step === "answers") setStep("review");
              else if (step === "review") handleSubmitApplication();
            }}
            disabled={
              (step === "resume" && !selectedResume) ||
              submitting ||
              (step === "review" && submitting)
            }
            className="flex-1"
          >
            {step === "review" ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Application"}
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
