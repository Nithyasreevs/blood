import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, RefreshCw, Check } from 'lucide-react';

const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodInventoryView = ({ user }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospital/inventory?hospital_id=${user?.user_id || ''}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.inventory) {
        const backendMap = {};
        data.inventory.forEach(item => { backendMap[item.blood_group] = item.available_units; });
        setInventory(ALL_GROUPS.map(g => ({
          blood_group: g,
          available_units: backendMap[g] || 0
        })));
      } else {
        setInventory(ALL_GROUPS.map(g => ({ blood_group: g, available_units: 0 })));
      }
    } catch (err) {
      console.error('Failed to fetch blood inventory:', err);
      setInventory(ALL_GROUPS.map(g => ({ blood_group: g, available_units: 0 })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const updateUnits = async (group, delta) => {
    const currentItem = inventory.find(i => i.blood_group === group);
    const newUnits = Math.max((currentItem?.available_units || 0) + delta, 0);

    // Optimistic local update
    setInventory(inventory.map(item => {
      if (item.blood_group === group) return { ...item, available_units: newUnits };
      return item;
    }));

    try {
      const res = await fetch('/api/hospital/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blood_group: group,
          available_units: newUnits,
          hospital_id: user?.user_id || 'hosp_1',
          hospital_name: user?.name || 'Hospital Desk'
        })
      });
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        const backendMap = {};
        (data.inventory || []).forEach(item => { backendMap[item.blood_group] = item.available_units; });
        setInventory(ALL_GROUPS.map(g => ({
          blood_group: g,
          available_units: backendMap[g] || 0
        })));
        setMessage(`Blood inventory updated! ${group}: ${newUnits} units`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update inventory unit count on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching blood inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Inventory Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Droplet className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white font-heading">{user?.name} Inventory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage blood unit stock counts</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-5 h-5" /> {message}
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {inventory.map((item) => (
          <div key={item.blood_group} className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white font-heading">{item.blood_group}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                item.available_units < 3 ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {item.available_units < 3 ? 'Shortage' : 'Available'}
              </span>
            </div>

            <div className="text-center py-2 bg-slate-900/80 rounded-xl border border-slate-800">
              <p className="text-3xl font-black text-white font-heading">{item.available_units}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Units</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => updateUnits(item.blood_group, -1)}
                className="flex-1 btn-secondary text-xs py-2 justify-center font-bold text-red-400 hover:bg-red-950/40"
              >
                <Minus className="w-4 h-4" /> -1 Unit
              </button>
              <button
                onClick={() => updateUnits(item.blood_group, 1)}
                className="flex-1 btn-primary text-xs py-2 justify-center font-bold"
              >
                <Plus className="w-4 h-4" /> +1 Unit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BloodInventoryView;
