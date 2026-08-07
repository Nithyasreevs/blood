import React, { useState, useEffect } from 'react';
import { Building2, MessageSquare, RefreshCw, CheckCircle, FileText } from 'lucide-react';

const EmergencyHistory = ({ onLeaveFeedback }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const requestKey = Object.keys(localStorage).find(key => key.startsWith('lifeflow_request_'));
      const token = requestKey ? localStorage.getItem(requestKey) : '';
      const res = await fetch(`/api/request/history?requester_access_token=${encodeURIComponent(token || '')}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch emergency history from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching request history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Emergency Request History</h2>
          <p className="text-xs text-slate-400 mt-1">View previous patient emergency requests & feedback ratings</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-2 border border-slate-800">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Request History Found</h3>
          <p className="text-xs text-slate-400">Created emergency blood requests will appear in this history.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Hospital</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Units</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((item) => (
                  <tr key={item.request_id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{item.patient_name}</td>
                    <td className="p-4 font-bold text-white">{item.hospital_name}</td>
                    <td className="p-4">
                      <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/40">
                        {item.blood_group}
                      </span>
                    </td>
                    <td className="p-4">{item.units} Units</td>
                    <td className="p-4 font-bold text-emerald-400">{item.status}</td>
                    <td className="p-4">
                      <span className={`badge ${item.priority === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{item.priority}</span>
                    </td>
                    <td className="p-4 font-bold text-white">{item.city || item.hospital_name}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={onLeaveFeedback}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Rate & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyHistory;
