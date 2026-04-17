import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050f] text-slate-100">
      {/* Background effects */}
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[14rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04050f]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">SmartAI</div>
              <div className="text-xs text-slate-400">Career Platform</div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/login')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero - Minimal */}
        <section className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            SmartAI
            <span className="block bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Career Platform
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Upload your resume, get ATS insights, and move from analysis to job applications in one workflow.
          </p>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row justify-center">
            <Button size="lg" onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-950/30 hover:from-indigo-400 hover:via-violet-400 hover:to-cyan-400">
              Go to Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              Sign In
            </Button>
          </div>

          <div className="mt-16 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-cyan-200 mb-2">What you can do now</div>
            <div className="text-sm text-slate-300">
              Sign up, upload a resume, review ATS scores, generate improvements, and track jobs from your personal dashboard.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#04050f]/80 py-8 mt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-slate-400 mb-4">
            <div>SmartAI Career Platform</div>
          </div>
          <div className="text-center text-xs text-slate-500 space-y-2">
            <div>© 2026 SmartAI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
