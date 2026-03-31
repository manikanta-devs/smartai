import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  LayoutGrid,
  Rocket,
  Sparkles,
  Stars,
  Zap
} from 'lucide-react';

const steps = [
  { title: 'Upload Resume', description: 'PDF or Word doc' },
  { title: 'Get ATS Score', description: 'Real feedback on formatting' },
  { title: 'Find Jobs', description: 'Matched to your skills' },
  { title: 'Apply', description: 'With cover letters' }
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050f] text-slate-100">
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[14rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-[24rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04050f]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200 shadow-lg shadow-cyan-950/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-white">CareerOS</div>
              <div className="text-xs text-slate-400">Free career platform for students</div>
            </div>
          </button>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#students" className="hover:text-white">For Students</a>
            <a href="#jobs" className="hover:text-white">Job Board</a>
            <a href="#tools" className="hover:text-white">Free Tools</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/login')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              Sign In
            </Button>
            <Button onClick={() => navigate('/upload')} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400">
              Analyze My Resume Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Stars className="h-3.5 w-3.5" />
              Free career tools for students
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-clash)' }}>
              From Resume to
              <span className="block bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                Job Offer. Free.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Upload your resume once. Get ATS score, job matches, cover letters, interview prep and salary insights. Everything is AI-powered and built for students.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/upload')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-950/30 hover:from-indigo-400 hover:via-violet-400 hover:to-cyan-400">
                Upload Resume — It’s Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                See Live Demo
              </Button>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">What you get</div>
              <div className="mt-2 text-lg font-semibold text-white">ATS feedback, job matching, rewrites, and interview prep.</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The page now avoids fake metrics and instead points you toward the actual tools available in the app.
              </p>
            </div>
          </div>

          <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
            <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            <div className="rounded-[28px] border border-white/10 bg-[#0c0e1a] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Real workflow</div>
                  <div className="mt-2 text-3xl font-semibold text-white">Upload, analyze, improve</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Real resume upload</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Actual ATS analysis</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Job recommendations</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Rewrite guidance</div>
              </div>

              <div className="mt-5 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5">
                <div className="text-sm text-cyan-100">Live product flow</div>
                <div className="mt-2 text-xl font-semibold text-white">Upload, analyze, match, apply</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  CareerOS turns a resume into an end-to-end job search workflow without fake benchmark numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Features</div>
              <h2 className="mt-2 text-3xl font-semibold text-white">Everything a student needs to get hired</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="students" className="mt-24">
          <div className="mb-8">
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">For Students</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Built for students and fresh graduates</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studentCards.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-xl">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="jobs" className="mt-24 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Job Platforms</div>
              <h2 className="mt-2 text-3xl font-semibold text-white">Connected job platforms</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <span key={platform} className="rounded-full border border-white/10 bg-[#0b0d18] px-4 py-2 text-sm text-slate-300">
                {platform}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">How It Works</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">4 steps to go from resume to offer</h2>
            <div className="mt-6 space-y-4">
              {[
                'Upload resume (PDF / DOC)',
                'AI analyzes everything',
                'Get matched to jobs',
                'Apply with perfect documents'
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 font-semibold text-indigo-100">{index + 1}</div>
                  <div className="text-sm text-slate-200">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="tools" className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Testimonials</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Students are already using it</h2>
            <div className="mt-6 grid gap-4">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-[#0b0d18] p-5">
                  <p className="text-sm leading-6 text-slate-300">“{item.quote}”</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.result}</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-200">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-24 rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 p-8 text-center backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to transform your career?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-200">
            Upload your resume, get instant feedback, and start moving through the full CareerOS flow without paying for a basic career toolkit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/upload')} className="bg-white text-slate-900 hover:bg-slate-100">
              Analyze My Resume Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              Continue to Login
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#04050f]/80 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>CareerOS · Made with ❤️ for students</div>
          <div className="flex flex-wrap gap-4">
            <span>Features</span>
            <span>Job Board</span>
            <span>Free Tools</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
