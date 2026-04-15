import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/Button';
import {
  ArrowRight,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
  Upload,
  User
} from 'lucide-react';

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload', path: '/upload', icon: Upload },
  { label: 'Jobs', path: '/jobs', icon: Search },
  { label: 'Profile', path: '/profile', icon: User }
];

const workflowSteps = [
  { label: 'Upload', description: 'Add resume content', path: '/upload' },
  { label: 'Review', description: 'Check ATS and scores', path: '/dashboard' },
  { label: 'Improve', description: 'Use rewrite tools', path: '/dashboard' },
  { label: 'Apply', description: 'Find and open jobs', path: '/jobs' }
];

function getActiveSection(pathname: string) {
  if (pathname.startsWith('/resume/')) return 'Resume workspace';
  if (pathname.startsWith('/jobs')) return 'Job search';
  if (pathname.startsWith('/upload')) return 'Upload flow';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Dashboard';
}

export function WorkspaceShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, accessToken } = useAuthStore();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  const activeSection = getActiveSection(location.pathname);

  return (
    <div className="min-h-screen bg-[#04050f] text-slate-100">
      <div className="pointer-events-none fixed left-[-8rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none fixed right-[-8rem] top-[12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none fixed left-1/2 top-[28rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-white/5 px-6 py-6 backdrop-blur-xl lg:flex">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200 shadow-lg shadow-cyan-950/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">CareerOS</div>
              <div className="text-xs text-slate-400">One workflow. One workspace.</div>
            </div>
          </button>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Current workspace</div>
            <div className="mt-2 text-lg font-semibold text-white">{activeSection}</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Every tool shares the same app shell, navigation, and visual language.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {workflowSteps.map((step, index) => {
              const active = location.pathname.startsWith(step.path) || (step.path === '/dashboard' && location.pathname === '/');
              return (
                <button
                  key={step.label}
                  onClick={() => navigate(step.path)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    active ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/10 text-slate-300'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{step.label}</div>
                    <div className="text-sm text-slate-400">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    active ? 'border-white/20 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-[#0b0d18] p-4">
            <div className="text-sm font-medium text-white">Need a fast path?</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Upload, analyze, fix, and apply from one place instead of hopping across disconnected screens.
            </p>
            <Button onClick={() => navigate('/upload')} className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
              Start workflow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04050f]/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Unified workspace</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">{activeSection}</span>
                  <span className="hidden sm:inline">{location.pathname}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-white">{user.email}</p>
                  <p className="text-xs text-slate-400">{user.firstName || ''} {user.lastName || ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/upload')} className="hidden border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 lg:inline-flex">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/jobs')} className="hidden border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 lg:inline-flex">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Jobs
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="outline" size="sm" className="border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10 px-4 py-3 sm:px-6 lg:px-8 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {navigationItems.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                        active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}