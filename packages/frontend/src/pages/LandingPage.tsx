import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ArrowRight, Sparkles, Stars } from 'lucide-react';

const steps = [
  { number: 1, title: 'Upload Resume', description: 'PDF or Word doc' },
  { number: 2, title: 'Get ATS Score', description: 'Real feedback on formatting' },
  { number: 3, title: 'Find Jobs', description: 'Matched to your skills' },
  { number: 4, title: 'Apply', description: 'With cover letters' }
];

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
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center mb-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Stars className="h-3.5 w-3.5" />
              AI-powered career tools
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Land Your
              <span className="block bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                Dream Job
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Upload your resume. Get instant ATS score, job matches, cover letters, and everything you need to get hired.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/register')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-950/30 hover:from-indigo-400 hover:via-violet-400 hover:to-cyan-400">
                Start Free — No Credit Card
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                Already have an account?
              </Button>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-slate-400">What's Included</div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div>✓ ATS score & improvement tips</div>
                <div>✓ Job recommendations</div>
                <div>✓ AI resume rewriting</div>
                <div>✓ Cover letter generator</div>
              </div>
            </div>
          </div>

          {/* Right side - simple visual */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="space-y-6">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-6">
                <div className="text-sm font-semibold text-indigo-200 mb-2">Step 1: Upload</div>
                <div className="text-sm text-slate-300">Drag & drop your resume (PDF or DOC)</div>
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
                <div className="text-sm font-semibold text-cyan-200 mb-2">Step 2: Analyze</div>
                <div className="text-sm text-slate-300">AI scans for ATS compatibility & gaps</div>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
                <div className="text-sm font-semibold text-emerald-200 mb-2">Step 3: Improve</div>
                <div className="text-sm text-slate-300">Get actionable fixes & job matches</div>
              </div>
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                <div className="text-sm font-semibold text-violet-200 mb-2">Step 4: Apply</div>
                <div className="text-sm text-slate-300">Create cover letters & track applications</div>
              </div>
            </div>
          </div>
        </section>

        {/* Process steps */}
        <section>
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-white">Simple 4-Step Process</h2>
            <p className="mt-2 text-slate-400">From resume to job offer in under 30 minutes</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-white/20 transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-100 mb-4">
                  {number}
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-24 rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 p-12 text-center backdrop-blur-xl">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to transform your career?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200">
            Join students and professionals getting hired faster with AI-powered career tools.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-slate-900 hover:bg-slate-100">
              Start For Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              Sign In
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#04050f]/80 py-8 mt-24">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
          <div>SmartAI · AI-Powered Career Platform</div>
          <div className="mt-2 text-xs text-slate-500">No credit card required. Free forever plan available.</div>
        </div>
      </footer>
    </div>
  );
}
