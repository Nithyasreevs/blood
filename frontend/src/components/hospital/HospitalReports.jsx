import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

const HospitalReports = ({ user }) => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospital/reports?hospital_id=${user?.user_id || ''}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch hospital reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reports) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching reports...</p>
      </div>
    );
  }

  const hospitalName = user?.name;
  const usageGroups = reports.usage_by_group || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-heading">{hospitalName} Analytics & Reports</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl text-center space-y-2 border border-blue-500/30">
          <p className="text-xs text-slate-400 font-semibold">Total Verified Donations</p>
          <p className="text-3xl font-black text-white font-heading">{reports.total_verified_donations}</p>
          <p className="text-[11px] text-blue-400">Verified units</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl text-center space-y-2 border border-emerald-500/30">
          <p className="text-xs text-slate-400 font-semibold">Emergency Fulfillment Rate</p>
          <p className="text-3xl font-black text-emerald-400 font-heading">{reports.emergency_fulfillment_rate}%</p>
          <p className="text-[11px] text-emerald-300">Under 15 minutes response</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl text-center space-y-2 border border-purple-500/30">
          <p className="text-xs text-slate-400 font-semibold">Average Donor Response Time</p>
          <p className="text-3xl font-black text-purple-300 font-heading">{reports.avg_donor_response_mins} mins</p>
          <p className="text-[11px] text-purple-400">GPS ETA dispatch speed</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white font-heading">Blood Group Usage & Distribution</h3>

        <div className="space-y-3">
          {usageGroups.map((g) => (
            <div key={g.group} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">{g.group} Blood Group</span>
                <span className="text-slate-400 font-mono">{g.units} Units Collected</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-500 h-2 rounded-full"
                  style={{ width: `${Math.min(g.units * 4, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalReports;
