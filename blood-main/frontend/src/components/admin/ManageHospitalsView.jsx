import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, RefreshCw } from 'lucide-react';

const ManageHospitalsView = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Chennai');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hospitals');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hospitals/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, phone, address, latitude: 13.0827, longitude: 80.2707 })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName('');
        setPhone('');
        setAddress('');
        fetchHospitals();
      }
    } catch (err) {
      console.error('Failed to add hospital on backend:', err);
    }
  };

  const handleRemove = async (id) => {
    setHospitals(hospitals.filter(h => h.hospital_id !== id && h.id !== id));
    try {
      await fetch('/api/admin/hospitals/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: id })
      });
      fetchHospitals();
    } catch (err) {
      console.error('Failed to remove hospital on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching hospital directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-heading">Hospital Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Add, edit, or remove partner hospitals</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-2.5 px-4 shadow-lg shadow-red-600/30">
          <Plus className="w-4 h-4" /> Add Partner Hospital
        </button>
      </div>

      {hospitals.length === 0 ? (
        <div className="card-panel p-8 text-center text-slate-400">
          No partner hospitals found. Click "Add Partner Hospital" to register one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hospitals.map((h) => {
            return (
              <div key={h.hospital_id || h.id} className="glass-panel p-5 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-end">
                  <button onClick={() => handleRemove(h.hospital_id || h.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{h.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{h.address}, {h.city}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">📞 {h.phone}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">Add New Hospital</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="form-group">
                <label>Hospital Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-control" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="form-control" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="form-control" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="form-control" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Hospital</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHospitalsView;
