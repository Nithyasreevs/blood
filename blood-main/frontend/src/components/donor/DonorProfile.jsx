import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Droplet, Scale, ShieldCheck, Check, RefreshCw, Navigation } from 'lucide-react';

const DonorProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const res = await fetch(`/api/donor/profile?user_id=${userId}`);
      const data = await res.json();
      if (data.success && data.donor) {
        setProfile({
          ...data.donor,
          name: user?.name || data.donor.name,
          email: user?.email || data.donor.email,
          phone: user?.phone || data.donor.phone,
          city: user?.city || data.donor.city,
          blood_group: user?.blood_group || data.donor.blood_group
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/donor/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id || profile?.user_id,
          availability: profile?.availability,
          weight: profile?.weight,
          city: profile?.city,
          name: profile?.name,
          phone: profile?.phone,
          email: profile?.email,
          blood_group: profile?.blood_group,
          latitude: profile?.latitude,
          longitude: profile?.longitude
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <p className="text-sm font-bold text-white">Unable to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold text-xl">
              {profile.blood_group || 'O-'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-heading">{profile.name || user?.name}</h2>
              <p className="text-xs text-slate-400">Donor Profile</p>
            </div>
          </div>
          <span className="badge badge-ai">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
          </span>
        </div>

        {saved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="form-control pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="form-control pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="form-control pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label>City / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={e => setProfile({ ...profile, city: e.target.value })}
                  className="form-control pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <div className="relative">
                <Navigation className="w-4 h-4 absolute left-3.5 top-3.5 text-sky-400" />
                <button
                  type="button"
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const newLat = pos.coords.latitude;
                        const newLng = pos.coords.longitude;
                        setProfile({ ...profile, latitude: newLat, longitude: newLng });
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&addressdetails=1`, {
                            headers: { 'Accept-Language': 'en' }
                          });
                          const data = await res.json();
                          const addr = data?.address;
                          const name = addr?.city || addr?.town || addr?.village || addr?.county || addr?.state || 'Chennai';
                          setLocationName(name);
                        } catch { setLocationName('Location detected'); }
                      }, () => alert('Unable to detect location. Please enable GPS.'));
                    } else {
                      alert('GPS not available on this device.');
                    }
                  }}
                  className="form-control pl-10 text-left cursor-pointer hover:border-sky-500/50"
                >
                  {locationName || 'Tap to detect your current location'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <div className="relative">
                <Droplet className="w-4 h-4 absolute left-3.5 top-3.5 text-red-400" />
                <select
                  value={profile.blood_group || 'O-'}
                  onChange={e => setProfile({ ...profile, blood_group: e.target.value })}
                  className="form-control pl-10 bg-slate-900"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Body Weight (kg)</label>
              <div className="relative">
                <Scale className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  value={profile.weight || 65}
                  onChange={e => setProfile({ ...profile, weight: Number(e.target.value) })}
                  className="form-control pl-10"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Emergency Availability Status</h4>
              <p className="text-xs text-slate-400">Receive instant push notifications for nearby compatible emergency requests</p>
            </div>
            <button
              type="button"
              onClick={() => setProfile({ ...profile, availability: !profile.availability })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                profile.availability ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {profile.availability ? '● Available' : '○ Unavailable'}
            </button>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3 text-sm rounded-xl font-bold">
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorProfile;
