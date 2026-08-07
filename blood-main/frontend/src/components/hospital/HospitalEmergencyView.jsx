import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, Check, MapPin, RefreshCw } from 'lucide-react';

const HospitalEmergencyView = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState(2);
  const [priority, setPriority] = useState('Critical');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hospital/requests');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch emergency requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hospital/request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: user?.user_id || 'hosp_1',
          hospital_name: user?.name || 'Hospital Speciality Desk',
          patient_name: patientName,
          blood_group: bloodGroup,
          units: Number(units),
          priority,
          contact_number: phone || user?.phone || '044-28290200',
          city: user?.city || 'Chennai',
          latitude: user?.latitude,
          longitude: user?.longitude
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Emergency request for ${patientName} broadcasted under ${user?.name || 'Hospital Desk'}!`);
        setPatientName('');
        setPhone('');
        fetchRequests();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create emergency request on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching emergency requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white font-heading">Hospital Emergency Request Desk</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Broadcast urgent blood needs to compatible donors</p>
        </div>

        {message && (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
            <Check className="w-4 h-4" /> {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Request Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4 md:col-span-1">
          <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
            <Plus className="w-5 h-5 text-red-500" /> Create New Emergency Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-group">
              <label>Patient Full Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="Patient name"
                className="form-control"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>Blood Group</label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="form-control bg-slate-900">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Units Needed</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={units}
                  onChange={e => setUnits(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Priority Level</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="form-control bg-slate-900">
                <option value="Critical">🔴 Critical (Immediate)</option>
                <option value="High">🟠 High Priority</option>
                <option value="Medium">🟡 Normal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hospital Contact Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="044-28290200"
                className="form-control"
              />
            </div>

            <button type="submit" className="w-full btn-primary justify-center py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-red-600/30">
              Broadcast Request to Donors
            </button>
          </form>
        </div>

        {/* Live Active Requests List */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4 md:col-span-2">
          <h3 className="text-base font-bold text-white font-heading">
            Active Requests ({requests.length})
          </h3>

          {requests.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No active requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.request_id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{r.patient_name}</span>
                      <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded text-xs border border-red-500/40">
                        {r.blood_group} ({r.units} Units)
                      </span>
                    </div>
                    <span className={`badge ${r.priority === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{r.priority}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> {r.hospital_name}</span>
                    <span>Patient: <strong className="text-white">{r.patient_name}</strong></span>
                    <span className="text-emerald-400 font-semibold">{r.status || 'Broadcasted'}</span>
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

export default HospitalEmergencyView;
