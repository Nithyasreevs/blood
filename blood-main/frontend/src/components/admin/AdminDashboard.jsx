import React, { useState, useEffect } from 'react';
import { Shield, Users, HeartPulse, Building2, Droplet, AlertTriangle, Radio, BarChart3, Bot, RefreshCw } from 'lucide-react';

const AdminDashboard = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState({
    total_users: 0,
    active_requests: 0,
    total_donations: 0,
    total_hospitals: 0,
    lives_saved: 0,
    fake_requests_flagged: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.dashboard) {
        setMetrics(data.dashboard);
      }
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching admin metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="card-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/60 border border-purple-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white font-heading">Admin Command Center</h2>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Live Metrics
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">Platform monitoring, user management, fake request detection & broadcasts</p>
            </div>
          </div>

          <button onClick={() => onNavigate('broadcast')} className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30">
            <Radio className="w-4 h-4" /> System Broadcast Alert
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Registered Users</p>
            <p className="text-xl font-bold text-white">{metrics.total_users} Users</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Requests</p>
            <p className="text-xl font-bold text-red-400">{metrics.active_requests} Active</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Verified Donations</p>
            <p className="text-xl font-bold text-emerald-400">{metrics.total_donations} Units</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Connected Hospitals</p>
            <p className="text-xl font-bold text-amber-300">{metrics.total_hospitals} Hospitals</p>
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => onNavigate('manage-users')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <Users className="w-7 h-7 text-purple-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Manage Users</p>
          <p className="text-[10px] text-slate-400">View & suspend users</p>
        </button>

        <button onClick={() => onNavigate('manage-donors')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <Droplet className="w-7 h-7 text-red-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Manage Donors</p>
          <p className="text-[10px] text-slate-400">Donor verifications</p>
        </button>

        <button onClick={() => onNavigate('manage-hospitals')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <Building2 className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Manage Hospitals</p>
          <p className="text-[10px] text-slate-400">Add & edit hospitals</p>
        </button>

        <button onClick={() => onNavigate('manage-requests')} className="card-panel p-5 text-center hover:border-purple-500/60 transition relative">
          <div className="absolute top-2 right-2 badge badge-critical text-[9px] px-1.5 py-0">{metrics.fake_requests_flagged} Flagged</div>
          <Bot className="w-7 h-7 text-rose-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Fake Request Detection</p>
          <p className="text-[10px] text-slate-400">Risk detection audit</p>
        </button>

        <button onClick={() => onNavigate('inventory-monitor')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Inventory Monitor</p>
          <p className="text-[10px] text-slate-400">Shortage alerts & stock</p>
        </button>

        <button onClick={() => onNavigate('analytics')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <BarChart3 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">System Analytics</p>
          <p className="text-[10px] text-slate-400">Demand & response time</p>
        </button>

        <button onClick={() => onNavigate('broadcast')} className="card-panel p-5 text-center hover:border-purple-500/60 transition">
          <Radio className="w-7 h-7 text-blue-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-white">Notification Centre</p>
          <p className="text-[10px] text-slate-400">Broadcast system alerts</p>
        </button>

        <div className="card-panel p-5 text-center bg-slate-900/60 flex flex-col justify-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Lives Saved</p>
          <p className="text-2xl font-black text-emerald-400 font-heading mt-1">{metrics.lives_saved}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
