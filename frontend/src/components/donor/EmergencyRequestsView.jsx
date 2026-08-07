import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Clock, Zap, Bot, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

const EmergencyRequestsView = ({ user, onAcceptRequest }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const res = await fetch(`/api/donor/requests/nearby?user_id=${userId}`);
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

  const handleAccept = async (reqId) => {
    try {
      const res = await fetch('/api/donor/request/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: reqId, user_id: user?.user_id || 'usr_donor_1' })
      });
      const data = await res.json();
      if (data.verification_code) {
        sessionStorage.setItem('verification_code', data.verification_code);
      }
      fetchRequests();
      if (onAcceptRequest) onAcceptRequest(reqId);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleReject = async (reqId) => {
    setRequests(requests.filter(r => r.request_id !== reqId));
    try {
      await fetch('/api/donor/request/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: reqId, user_id: user?.user_id || 'usr_donor_1' })
      });
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching Emergency Requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white font-heading">Active Emergency Requests</h2>
          </div>
          {user?.name && <p className="text-xs text-slate-400 mt-1">Matched for {user.name}</p>}
        </div>
        <span className="badge badge-ai px-3 py-1 text-xs font-bold">
          <Bot className="w-4 h-4" /> Priority Engine Active
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-2 border border-slate-800">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Active Emergency Requests Right Now</h3>
          <p className="text-xs text-slate-400">There are currently no broadcasted emergency blood requests matching blood group {user?.blood_group || 'O-'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div key={req.request_id} className="glass-panel p-5 rounded-2xl border border-slate-700/80 hover:border-red-500/40 transition-all space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-xl font-black text-white shadow-lg border border-rose-300/30">
                    {req.blood_group}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-heading">{req.hospital_name || 'Hospital Desk'}</h3>
                      <span className={`badge ${req.priority === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Patient: <strong className="text-white">{req.patient_name}</strong> • Units Needed: <strong className="text-red-400">{req.units} Units</strong>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {req.distance_km || 2.3} km ({req.city || 'Chennai'})</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> ETA: ~{req.eta_minutes || 14} mins</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <div className="bg-purple-950/80 border border-purple-500/50 px-3 py-1.5 rounded-xl text-center">
                    <p className="text-[10px] text-purple-300 uppercase font-semibold">Match Score</p>
                    <p className="text-lg font-black text-purple-200">{req.ai_score || 95}%</p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
                <span className="text-xs text-slate-400">
                  Status: <strong className="text-amber-400">{req.status}</strong>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReject(req.request_id)}
                    className="btn-secondary text-xs py-2 px-3 hover:border-red-500/50 hover:text-red-400"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                  <button
                    onClick={() => handleAccept(req.request_id)}
                    className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30"
                  >
                    <Zap className="w-4 h-4" /> Accept & Start Navigation
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyRequestsView;
