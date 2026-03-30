import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from './Button';
import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#04050f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            smartAI
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Find Jobs
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">{user.email}</p>
              <p className="text-xs text-slate-400">
                {user.firstName} {user.lastName}
              </p>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-slate-200 hover:bg-white/10"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2">
            <button
              onClick={() => {
                navigate('/dashboard');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10 rounded"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                navigate('/jobs');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10 rounded"
            >
              Find Jobs
            </button>
            <button
              onClick={() => {
                navigate('/profile');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10 rounded"
            >
              Profile
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-rose-300 hover:bg-rose-500/10 rounded"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
