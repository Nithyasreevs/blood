import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Phone, RefreshCw, ShieldCheck, CheckCircle, Award } from 'lucide-react';

const LiveTrackingView = ({ requestId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/request/tracking/${requestId}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.tracking) {
        setTracking(data.tracking);
        if (data.tracking.status === 'Completed') {
          setCompleted(true);
          sessionStorage.removeItem('verification_code');
        }
      }
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Connecting to Navigation...</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="glass-panel p-10 rounded-2xl border-2 border-emerald-500/50 text-center space-y-4 bg-emerald-950/20">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-white font-heading">Donation Completed!</h2>
          <p className="text-sm text-slate-300">Your blood donation has been verified by the hospital. Thank you for saving lives!</p>
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
            <Award className="w-4 h-4" /> Points credited to your account
          </div>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <p className="text-sm font-bold text-white">Tracking data not available. Please select an active request first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="live-dot"></span>
            <h2 className="text-xl font-bold text-white font-heading">Donor Navigation & Hospital Route</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Live turn-by-turn navigation for emergency blood delivery</p>
        </div>
        <div className="bg-red-500/20 text-red-300 border border-red-500/40 text-xs px-3 py-1.5 rounded-xl font-mono font-bold">
          ETA: ~{tracking.eta_minutes} Mins ({tracking.distance_km} km)
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl bg-slate-950 border border-slate-700/80 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="bg-slate-900/90 text-slate-300 text-xs font-mono px-3 py-1 rounded-full border border-slate-700">
            Connected
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/40">
            ● Route Active
          </span>
        </div>

        <div className="relative z-10 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Donor Location</p>
              <h4 className="text-sm font-bold text-white">{tracking.donor_location || tracking.accepted_donor_name}</h4>
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
              <h4 className="text-sm font-bold text-white">{tracking.hospital_name}</h4>
            </div>
          </div>
        </div>

        {sessionStorage.getItem('verification_code') && (
          <div className="relative z-10 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <p className="text-xs text-emerald-300 font-bold uppercase">Verification Code</p>
            </div>
            <p className="text-3xl font-black text-white font-heading tracking-widest">
              {sessionStorage.getItem('verification_code')}
            </p>
            <p className="text-[10px] text-emerald-400/70 mt-1">Share this code with the hospital to verify your donation</p>
          </div>
        )}

        <div className="relative z-10 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">{tracking.hospital_name}</h4>
            <p className="text-xs text-slate-400">Patient: <strong className="text-white">{tracking.patient_name}</strong></p>
          </div>

          <a
            href={`tel:${tracking.contact_number || '04428290200'}`}
            className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" /> Call Hospital Desk
          </a>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingView;
