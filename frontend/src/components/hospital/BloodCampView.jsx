import React, { useState, useEffect } from 'react';
import { Users, Plus, Calendar, MapPin, Check, RefreshCw } from 'lucide-react';

const BloodCampView = ({ user }) => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [city, setCity] = useState(user?.city || 'Chennai');
  const [message, setMessage] = useState('');

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospital/camps?hospital_id=${user?.user_id || ''}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.camps) {
        setCamps(data.camps);
      }
    } catch (err) {
      console.error('Failed to fetch blood camps from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const hospName = user?.name;
      const res = await fetch('/api/hospital/camps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital: hospName, venue, organizer, date, city: city || user?.city || 'Chennai' })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Blood donation drive created under ${hospName}!`);
        setVenue('');
        setOrganizer('');
        setDate('');
        fetchCamps();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create blood camp on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching blood donation drives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-heading">Blood Donation Camp Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Organize blood donation drives & track donor registrations</p>
        </div>

        {message && (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
            <Check className="w-4 h-4" /> {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4 md:col-span-1">
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" /> Organize New Drive
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-group">
              <label>Drive Venue</label>
              <input type="text" required value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue address" className="form-control" />
            </div>

            <div className="form-group">
              <label>Organizer / College</label>
              <input type="text" required value={organizer} onChange={e => setOrganizer(e.target.value)} placeholder="NSS / Rotary Club" className="form-control" />
            </div>

            <div className="form-group">
              <label>Drive Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="form-control" />
            </div>

            <div className="form-group">
              <label>City</label>
              <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="form-control" />
            </div>

            <button type="submit" className="w-full btn-primary justify-center py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-red-600/30">
              Publish Blood Camp Drive
            </button>
          </form>
        </div>

        {/* Live List */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4 md:col-span-2">
          <h3 className="text-base font-bold text-white font-heading">
            Upcoming Blood Drives ({camps.length})
          </h3>

          {camps.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No blood donation drives scheduled.</p>
          ) : (
            <div className="space-y-3">
              {camps.map((camp) => (
                <div key={camp.camp_id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{camp.venue}</h4>
                    <span className="text-xs text-amber-300 font-bold">{camp.organizer}</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Organizer: <strong>{camp.organizer}</strong> • Hospital: <strong>{camp.hospital}</strong>
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-400" /> {camp.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {camp.city}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodCampView;
