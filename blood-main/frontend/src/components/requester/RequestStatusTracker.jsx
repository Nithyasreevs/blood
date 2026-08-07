import React, { useState, useEffect } from 'react';
import { CheckCircle2, MapPin, Phone, Bot, RefreshCw } from 'lucide-react';

const RequestStatusTracker = ({ requestId, onNavigateTracker }) => {
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [requestId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(`lifeflow_request_${requestId}`);
      const res = await fetch(`/api/request/status/${requestId}?requester_access_token=${encodeURIComponent(token || '')}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.request) {
        setRequestData(data.request);
      }
    } catch (err) {
      console.error('Failed to fetch request status from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching request status...</p>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <p className="text-sm font-bold text-white">Request not found. Please submit an emergency request first.</p>
      </div>
    );
  }

  const steps = [
    { title: 'Emergency Request Created', desc: 'Request logged with GPS coordinates', done: true },
    { title: 'Priority Score Computed', desc: 'Matched top 5 compatible nearby donors', done: true },
    { title: 'Donor Accepted Request', desc: `Donor matched & en route`, done: requestData.currentStep >= 3 },
    { title: 'Arrival at Hospital', desc: `Estimated Arrival: ~${requestData.eta_minutes || 14} mins`, done: requestData.currentStep >= 4 },
    { title: 'Donation Completed & Verified', desc: 'Hospital verified donation via QR passcode', done: requestData.currentStep >= 5 }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Live Emergency Request Progress</h2>
            <p className="text-xs text-slate-300">Patient: <strong className="text-white">{requestData.patient_name}</strong> • Needed: <strong className="text-red-400">{requestData.blood_group} ({requestData.units} Units)</strong></p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-critical">{requestData.priority} Priority</span>
            <span className="badge badge-ai">
              <Bot className="w-3.5 h-3.5" /> Priority Score: {requestData.ai_score || 98}%
            </span>
          </div>
        </div>

        {/* Stepper Grid */}
        <div className="py-6 space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 relative">
              {idx < steps.length - 1 && (
                <div className={`absolute left-4 top-8 w-0.5 h-10 ${step.done ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${step.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                {step.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>

              <div className="flex-1 pt-1">
                <h4 className={`text-sm font-bold ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Action Bar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Matched Donor On The Way</p>
              <p className="text-sm font-bold text-white">{requestData.blood_group} Donor En Route</p>
            </div>
          </div>

          <button onClick={onNavigateTracker} className="btn-primary text-xs py-2.5 px-4 shadow-lg shadow-red-600/30">
            <MapPin className="w-4 h-4" /> View Live GPS Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestStatusTracker;
