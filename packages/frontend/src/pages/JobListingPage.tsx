/**
 * Job Listing Page with Filtering
 * Shows all available jobs for India with search, filters, and apply
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  ExternalLink,
  Check,
  Clock,
  Star,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  url?: string;
  source: string;
  createdAt: string;
}

interface Application {
  jobId: string;
  status: string;
}

export const JobListingPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);

  // Load jobs
  useEffect(() => {
    fetchJobs();
  }, [search, location, type, page]);

  // Load applied jobs
  useEffect(() => {
    loadAppliedJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/jobs', {
        params: {
          search,
          location: location || '',
          type: type || '',
          page,
          limit: 20,
        },
      });

      setJobs(response.data.jobs);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppliedJobs = async () => {
    try {
      const response = await axios.get('/api/applications');
      const applied = new Set<string>(response.data.applications.map((a: any) => a.jobId));
      setAppliedJobs(applied);
    } catch (error) {
      console.error('Error loading applied jobs:', error);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    try {
      await axios.post('/api/applications', { jobId });
      setAppliedJobs(prev => new Set([...prev, jobId]));
      alert('✅ Applied successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const isApplied = (jobId: string) => appliedJobs.has(jobId);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🔥 India Job Board</h1>
          <p className="text-gray-200">
            {jobs.length.toLocaleString()}+ Fresh Jobs Updated Every 6 Hours
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Search Role
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Software Engineer, PM, Designer..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Mumbai, Bangalore..."
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Job Type
              </label>
              <select
                value={type}
                onChange={e => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            {/* Stats */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Quick Stats
              </label>
              <div className="bg-blue-500/20 p-3 rounded border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">
                  {appliedJobs.size}
                </div>
                <div className="text-xs text-gray-400">Applied</div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
            <p>No jobs found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-400">{job.company}</p>
                    </div>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={isApplied(job.id) || applying === job.id}
                      className={`px-4 py-2 rounded font-bold transition ${
                        isApplied(job.id)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : applying === job.id
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isApplied(job.id) ? (
                        <>
                          <Check size={16} className="inline mr-2" />
                          Applied
                        </>
                      ) : applying === job.id ? (
                        'Applying...'
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  </div>

                  {/* Job Details */}
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-gray-400">
                      <MapPin size={16} className="mr-2" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Briefcase size={16} className="mr-2" />
                      {job.type}
                    </div>
                    {job.salary && (
                      <div className="flex items-center text-gray-400">
                        <DollarSign size={16} className="mr-2" />
                        {job.salary}
                      </div>
                    )}
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock size={16} className="mr-2" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                    <div className="text-xs text-gray-500">
                      Source: <span className="font-bold">{job.source}</span>
                    </div>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                      >
                        View on Site
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
                >
                  ← Previous
                </button>
                <div className="text-gray-400">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobListingPage;
