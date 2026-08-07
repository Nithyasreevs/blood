import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, Award, RefreshCw } from 'lucide-react';

const LiveDonorTracker = ({ requestId, onNavigateFeedback }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, [requestId]);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/request/tracking/${requestId}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.tracking) {
        setTracking(data.tracking);
      }
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Connecting to Real-Time Donor GPS Tracker...</p>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <p className="text-sm font-bold text-white">Tracking data not available. Please submit a request first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="live-dot"></span>
            <h2 className="text-xl font-bold text-white font-heading">Real-Time Donor GPS Navigation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Live location tracking of dispatched donor en route to destination</p>
        </div>
        <div className="bg-red-500/20 text-red-300 border border-red-500/40 text-xs px-3 py-1.5 rounded-xl font-mono font-bold">
          ETA: ~{tracking.eta_minutes} Mins ({tracking.distance_km} km)
        </div>
      </div>

      {/* Simulated Live GPS Map Panel */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-slate-950 border border-slate-700/80 min-h-[300px] flex flex-col justify-between">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="bg-slate-900/90 text-slate-300 text-xs font-mono px-3 py-1 rounded-full border border-slate-700">
            GPS Signal: Locked (Live)
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/40">
            ● Navigation Active
          </span>
        </div>

        {/* Dynamic Route Indicator */}
        <div className="relative z-10 my-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Donor Starting Point</p>
              <h4 className="text-sm font-bold text-white">{tracking.donor_location || 'Chennai Central'}</h4>
            </div>
          </div>

          <div className="flex-1 w-full flex items-center gap-2 px-4">
            <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-white/40 animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Destination Hospital</p>
              <h4 className="text-sm font-bold text-white">{tracking.hospital_name || 'Hospital Desk'}</h4>
            </div>
          </div>
        </div>

        {/* Donor Contact Card */}
        <div className="relative z-10 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-sm">
              {tracking.matched_donor?.blood_group || 'O-'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{tracking.matched_donor?.name || 'Donor'}</h4>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                  Verified Donor
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">📞 {tracking.matched_donor?.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${tracking.matched_donor?.phone || ''}`}
              className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30 flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call Donor Directly
            </a>
            <button
              onClick={onNavigateFeedback}
              className="btn-secondary text-xs py-2 px-3"
            >
              <Award className="w-4 h-4 text-amber-400" /> Leave Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDonorTracker;
