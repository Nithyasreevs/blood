import React, { useState, useEffect } from 'react';
import { Bot, AlertTriangle, RefreshCw } from 'lucide-react';

const ManageRequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/requests');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch requests from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVerify = async (id) => {
    setRequests(requests.map(r => r.request_id === id ? { ...r, status: 'Waiting', needs_verification: false, ai_risk_score: 10 } : r));
    try {
      await fetch('/api/admin/requests/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id })
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to verify request on backend:', err);
    }
  };

  const handleBlock = async (id) => {
    setRequests(requests.filter(r => r.request_id !== id));
    try {
      await fetch('/api/admin/requests/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id })
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to block request on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching emergency requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-bold text-white font-heading">Fake Request Detection & Audit</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Audit emergency blood requests flagged for spam/fake patterns</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card-panel p-8 text-center text-slate-400">
          No emergency requests currently active.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isFlagged = r.ai_risk_score >= 60 || r.status === 'Needs Verification';
            return (
              <div
                key={r.request_id}
                className={`glass-panel p-5 rounded-2xl border space-y-3 ${
                  isFlagged ? 'border-red-500/60 bg-red-950/20' : 'border-slate-700/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{r.patient_name}</h3>
                      <span className={`badge-status ${r.priority === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{r.priority}</span>
                      {isFlagged && (
                        <span className="badge-status badge-critical text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Flagged Fake Risk
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Patient: <strong className="text-white">{r.patient_name}</strong> • Hospital: {r.hospital_name} • Phone: <span className="font-mono">{r.contact_number || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Risk Score</p>
                      <p className={`text-lg font-black ${r.ai_risk_score >= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {r.ai_risk_score || 5}% Risk
                      </p>
                    </div>

                    {isFlagged ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleVerify(r.request_id)} className="btn-primary text-xs py-1.5 px-3">
                          Approve Request
                        </button>
                        <button onClick={() => handleBlock(r.request_id)} className="btn-outline-danger text-xs py-1.5 px-3">
                          Block & Remove
                        </button>
                      </div>
                    ) : (
                      <span className="badge-status badge-scheduled">Verified Legitimate</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageRequestsView;
