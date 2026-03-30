/**
 * Application Tracker - Track all job applications
 * Shows stats, status breakdown, and application history
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  Download,
  Trash2,
  Edit2,
} from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  atsScore?: number;
  notes?: string;
}

interface Stats {
  total: number;
  applied: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  rejected: number;
  conversionRate: string;
}

export const ApplicationTrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/applications', {
        params: { status: filter || undefined },
      });

      setApplications(response.data.applications);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/applications/${appId}`, { status: newStatus });
      loadApplications();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Withdraw application?')) return;

    try {
      await axios.delete(`/api/applications/${appId}`);
      loadApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const chartData = stats
    ? [
        { name: 'Applied', value: stats.applied },
        { name: 'Shortlisted', value: stats.shortlisted },
        { name: 'Interviews', value: stats.interviews },
        { name: 'Offers', value: stats.offers },
      ]
    : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const statusColors: Record<string, string> = {
    APPLIED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    SHORTLISTED: 'bg-green-500/20 text-green-400 border-green-500/30',
    INTERVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    OFFER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    APPLIED: <Clock size={16} />,
    SHORTLISTED: <CheckCircle2 size={16} />,
    INTERVIEW: <MessageSquare size={16} />,
    OFFER: <TrendingUp size={16} />,
    REJECTED: <Trash2 size={16} />,
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📊 Application Tracker</h1>
          <p className="text-gray-400">Track your job applications and conversion rates</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Applied</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{stats.shortlisted}</div>
              <div className="text-sm text-gray-400">Shortlisted</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-400">{stats.interviews}</div>
              <div className="text-sm text-gray-400">Interviews</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-emerald-400">{stats.offers}</div>
              <div className="text-sm text-gray-400">Offers</div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Pipeline Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name || ''}: ${entry.value || 0}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rate */}
        {stats && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Conversion Rate</h3>
                <p className="text-sm text-gray-400">
                  {stats.shortlisted + stats.interviews + stats.offers} / {stats.total}{' '}
                  applications advanced
                </p>
              </div>
              <div className="text-4xl font-bold text-purple-400">{stats.conversionRate}%</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {['', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED'].map(
              status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded font-bold transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {status || 'All'} ({statusColors[status]?.includes('blue') ? stats?.total : 0})
                </button>
              )
            )}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No applications yet. Start applying to jobs!</p>
            </div>
          ) : (
            applications.map(app => (
              <div
                key={app.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{app.jobTitle}</h3>
                    <p className="text-gray-400">{app.company}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-bold ${
                        statusColors[app.status]
                      }`}
                    >
                      {statusIcons[app.status]}
                      {editingId === app.id ? (
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value)}
                          className="bg-transparent border-0"
                        >
                          <option>APPLIED</option>
                          <option>SHORTLISTED</option>
                          <option>INTERVIEW</option>
                          <option>OFFER</option>
                          <option>REJECTED</option>
                        </select>
                      ) : (
                        app.status
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex gap-6 text-sm text-gray-400 mb-3">
                  <div>
                    📅 Applied: {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                  {app.atsScore && <div>✅ ATS Score: {app.atsScore}%</div>}
                </div>

                {/* Actions */}
                {editingId === app.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleStatusUpdate(app.id, editStatus || app.status)
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-800 text-gray-400 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(app.id);
                        setEditStatus(app.status);
                      }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-sm flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      Update Status
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm flex items-center gap-2 border border-red-500/30"
                    >
                      <Trash2 size={14} />
                      Withdraw
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationTrackerPage;
