import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const InventoryMonitorView = () => {
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitor();
  }, []);

  const fetchMonitor = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory-monitor');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.shortages) {
        setShortages(data.shortages);
      }
    } catch (err) {
      console.error('Failed to fetch inventory monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching inventory shortage alerts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-heading">City Inventory Shortage Monitor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time alerts on blood group shortages across all partner hospital blood banks</p>
        </div>
      </div>

      {shortages.length === 0 ? (
        <div className="card-panel p-8 text-center text-slate-400">
          No critical inventory shortages reported across hospitals.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortages.map((s, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-white">{s.hospital_name || 'Hospital Desk'}</span>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded border border-amber-500/40">
                  Shortage Alert
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-500/30">
                <div>
                  <p className="text-xs text-slate-400">Affected Blood Group</p>
                  <p className="text-lg font-black text-red-400">{s.blood_group}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Available Units</p>
                  <p className="text-lg font-black text-amber-300">{s.available_units} Units Remaining</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryMonitorView;
