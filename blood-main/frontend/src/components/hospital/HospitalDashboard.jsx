import React, { useState, useEffect } from 'react';
import { Building2, Droplet, HeartPulse, ShieldAlert, Award, Plus, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

const HospitalDashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    active_requests: 0,
    todays_donations: 0,
    total_blood_stock_units: 0,
    critical_alerts: 0,
    inventory_shortages: 0
  });
  const [bloodStock, setBloodStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalData();
  }, [user]);

  const fetchHospitalData = async () => {
    setLoading(true);
    try {
      const hospitalId = user?.user_id || '';
      const [dashRes, invRes] = await Promise.all([
        fetch(`/api/hospital/dashboard?hospital_id=${hospitalId}`),
        fetch(`/api/hospital/inventory?hospital_id=${hospitalId}`)
      ]);

      const dashData = await dashRes.json().catch(() => null);
      const invData = await invRes.json().catch(() => null);

      if (dashData && dashData.success && dashData.dashboard) {
        setStats(dashData.dashboard);
      }
      if (invData && invData.success && invData.inventory) {
        setBloodStock(invData.inventory);
      }
    } catch (err) {
      console.error('Failed to fetch hospital backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const hospitalName = user?.name;
  const hospitalLocation = user?.address || `${user?.city || 'Chennai'}`;
  const hospitalPhone = user?.phone || '044-28290200';

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching hospital data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hospital Hero Banner */}
      <div className="card-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/60 border border-slate-700/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/30">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-heading">{hospitalName}</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Verified Blood Bank Desk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{hospitalLocation} • Contact: {hospitalPhone}</p>
            </div>
          </div>

          <button onClick={() => onNavigate('create-request')} className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30">
            <Plus className="w-4 h-4" /> Create Emergency Blood Request
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Active Requests</p>
            <p className="text-xl font-bold text-white">{stats.active_requests} Requests</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Today's Verified Donations</p>
            <p className="text-xl font-bold text-emerald-400">{stats.todays_donations} Units</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Blood Stock</p>
            <p className="text-xl font-bold text-blue-300">{stats.total_blood_stock_units} Units</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Stock Shortages Alert</p>
            <p className="text-xl font-bold text-amber-400">{stats.inventory_shortages} Groups</p>
          </div>
        </div>
      </div>

      {/* Blood Stock Quick Grid */}
      <div className="card-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-white font-heading">Hospital Blood Inventory Overview</h3>
          </div>
          <button onClick={() => onNavigate('inventory')} className="text-xs text-red-400 font-bold hover:underline flex items-center gap-1">
            Manage Inventory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bloodStock.map((stock) => (
            <div
              key={stock.blood_group}
              className={`p-4 rounded-xl border transition-all ${
                stock.available_units < 3
                  ? 'bg-red-950/40 border-red-500/60'
                  : stock.available_units < 6
                  ? 'bg-amber-950/40 border-amber-500/60'
                  : 'bg-slate-900/80 border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white font-heading">{stock.blood_group}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  stock.available_units < 3 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {stock.available_units < 3 ? 'Critical' : stock.available_units < 6 ? 'Low' : 'Normal'}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-200 mt-2">{stock.available_units} <span className="text-xs font-normal text-slate-400">Units</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
