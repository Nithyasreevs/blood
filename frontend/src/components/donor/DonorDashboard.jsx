import React, { useState, useEffect } from 'react';
import { Droplet, Award, CheckCircle, Clock, MapPin, ArrowRight, ShieldCheck, Zap, UserCheck, RefreshCw } from 'lucide-react';

const DonorDashboard = ({ user, onNavigate, onAcceptRequest }) => {
  const [profile, setProfile] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const [profileRes, reqsRes] = await Promise.all([
        fetch(`/api/donor/profile?user_id=${userId}`),
        fetch(`/api/donor/requests/nearby?user_id=${userId}`)
      ]);

      const profileData = await profileRes.json();
      const reqsData = await reqsRes.json();

      if (profileData.success && profileData.donor) {
        setProfile(profileData.donor);
      }
      if (reqsData.success) setNearbyRequests(reqsData.requests || []);
    } catch (err) {
      console.error('Failed to fetch live donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const toggleAvailability = async () => {
    const newStatus = !profile?.availability;
    setProfile({ ...profile, availability: newStatus });

    try {
      await fetch('/api/donor/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.user_id || profile?.user_id, availability: newStatus })
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Loading Dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <p className="text-sm font-bold text-white">Unable to load profile data. Please try again later.</p>
      </div>
    );
  }

  const displayName = user?.name || profile?.name;
  const displayBloodGroup = user?.blood_group || profile?.blood_group || 'O-';
  const displayCity = user?.city || profile?.city || 'Chennai';

  return (
    <div className="space-y-6">
      {/* Profile Overview Bar */}
      <div className="card-panel p-5 border-l-4 border-l-red-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xl font-bold font-heading">
            {displayBloodGroup}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-heading">{displayName}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded">
                Verified Donor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Blood Group: <strong className="text-red-400">{displayBloodGroup}</strong> • City: <strong>{displayCity}</strong>
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="text-right">
            <p className="text-[11px] text-slate-400">Emergency Status</p>
            <p className={`text-xs font-bold ${profile?.availability ? 'text-emerald-400' : 'text-amber-400'}`}>
              {profile?.availability ? '● Ready for Dispatch' : '○ Standby Mode'}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              profile?.availability ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {profile?.availability ? 'Set Inactive' : 'Set Active'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Donations</p>
            <p className="text-lg font-bold text-white">{profile?.total_donations || 0} Times</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Reward Points</p>
            <p className="text-sm font-bold text-amber-300">{profile?.points || 0} pts ({profile?.badge || 'Member'})</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Donation Eligibility</p>
            <p className="text-sm font-bold text-emerald-400">Eligible Today</p>
          </div>
        </div>

        <div className="card-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Priority Score</p>
            <p className="text-sm font-bold text-purple-300">98% Priority</p>
          </div>
        </div>
      </div>

      {/* Emergency Requests */}
      <div className="card-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-heading">Emergency Requests</h3>
            <p className="text-xs text-slate-400">Requests matching blood group {displayBloodGroup}</p>
          </div>
          {nearbyRequests.length > 0 && (
            <button onClick={() => onNavigate('emergency-requests')} className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
              View All ({nearbyRequests.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {nearbyRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Pending Emergency Requests</h4>
            <p className="text-xs text-slate-400">No emergency requests currently active for {displayBloodGroup}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyRequests.map((req) => (
              <div key={req.request_id} className="card-panel-highlight p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`badge-status ${req.priority === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                    {req.priority === 'Critical' && <span className="live-dot mr-1"></span>}
                    {req.priority} Emergency
                  </span>
                  <span className="text-xs font-semibold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                    Match: {req.ai_score || 95}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{req.hospital_name}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Patient: <strong className="text-white">{req.patient_name}</strong> • Units: <strong>{req.units} Units</strong></p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {req.distance_km || req.radius_km || 2.3} km away</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> ETA: ~{req.eta_minutes || 14} mins</span>
                </div>

                <button onClick={async () => { try { const r = await fetch('/api/donor/request/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: req.request_id, user_id: user?.user_id || 'usr_donor_1' }) }); const d = await r.json(); if (d.verification_code) sessionStorage.setItem('verification_code', d.verification_code); if (onAcceptRequest) onAcceptRequest(req.request_id); else onNavigate('live-tracking'); } catch(e) { console.error(e); } }} className="w-full btn-primary justify-center text-xs py-2 mt-1">
                  <Zap className="w-4 h-4" /> Accept & Navigate to Hospital
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
