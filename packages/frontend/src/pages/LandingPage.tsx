import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Sparkles, Zap, BarChart3, Briefcase } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            smartAI
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
            Your Resume, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-Powered</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build stronger resumes, improve ATS score, and find better job matches with one streamlined platform.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/login')}>
              Start Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Have an Account?
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose smartAI?</h3>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              icon: Sparkles,
              title: "AI Analysis",
              description: "Get detailed ATS score and actionable feedback to improve your resume"
            },
            {
              icon: Zap,
              title: "Smart Matching",
              description: "Match your skills with the best job opportunities instantly"
            },
            {
              icon: BarChart3,
              title: "Performance Tracking",
              description: "Track your progress and see how you compare to other candidates"
            },
            {
              icon: Briefcase,
              title: "Job Opportunities",
              description: "Access thousands of curated job listings matched to your profile"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Icon className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h3>
          <p className="text-lg mb-6 opacity-90">Join thousands of professionals who've improved their resumes with smartAI</p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => navigate('/login')}>
            Continue to Login
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 smartAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
