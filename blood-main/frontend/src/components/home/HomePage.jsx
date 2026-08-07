import React, { useState, useEffect } from 'react';
import { HeartPulse, User, Building2, Shield, Bot, ArrowRight, Droplet, Zap, ShieldAlert, RefreshCw } from 'lucide-react';

const HomePage = ({ onSelectModule, onOpenAuth }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (data.success && data.dashboard) {
        setStats({
          total_users: data.dashboard.total_users,
          total_donors: data.dashboard.total_donors,
          total_donations: data.dashboard.total_donations,
          total_hospitals: data.dashboard.total_hospitals,
          lives_saved: data.dashboard.lives_saved
        });
      } else {
        setStats({ total_users: 0, total_donors: 0, total_donations: 0, total_hospitals: 0, lives_saved: 0 });
      }
    } catch (err) {
      console.error('Fetching live backend stats:', err);
      setStats({ total_users: 0, total_donors: 0, total_donations: 0, total_hospitals: 0, lives_saved: 0 });
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      id: 'donor',
      title: 'Donor Module 👤',
      tagline: 'Register, manage availability & save lives nearby',
      desc: 'Access your profile, view matched emergency requests, track hospital routes, and earn rewards & certificates.',
      icon: User,
      color: 'from-red-600 to-rose-600',
      btnText: 'Enter Donor Portal'
    },
    {
      id: 'requester',
      title: 'Emergency Patient Module 🏥',
      tagline: 'No Login Required for Emergency Blood Requests',
      desc: 'Submit instant blood requests, track matched donors on live GPS maps, and view emergency request progress.',
      icon: HeartPulse,
      color: 'from-rose-600 to-pink-600',
      btnText: 'Request Blood Now'
    },
    {
      id: 'hospital',
      title: 'Hospital Module 🏥',
      tagline: 'Manage blood bank stock & donor verifications',
      desc: 'Update available blood units, create priority emergency requests, verify donors via QR code, and organize blood drives.',
      icon: Building2,
      color: 'from-amber-600 to-red-600',
      btnText: 'Open Hospital Desk'
    },
    {
      id: 'admin',
      title: 'Admin Module 👨‍💻',
      tagline: 'System oversight, analytics & AI risk audit',
      desc: 'Monitor user accounts, audit flagged requests, view city blood demand charts, and dispatch broadcast alerts.',
      icon: Shield,
      color: 'from-purple-600 to-indigo-600',
      btnText: 'Access Admin Console'
    },
    {
      id: 'ai',
      title: 'Smart Features Hub 🧠',
      tagline: 'Priority Engine, Compatibility & More',
      desc: 'Explore Donor Priority Scoring, Compatibility Matrix, Radius Expansion, and Chat Assistant.',
      icon: Bot,
      color: 'from-indigo-600 to-purple-600',
      btnText: 'Explore Features'
    }
  ];

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">Loading live statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* Hero Section */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl text-center space-y-6 relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-red-950/40 border border-red-500/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
          <span className="live-dot"></span> Emergency Blood Dispatch Network
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white font-heading tracking-tight leading-tight max-w-4xl mx-auto">
          Saving Lives with <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">Real-Time Blood Matching</span>
        </h1>

        <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          LifeFlow connects critical patients, universal blood donors, and hospital blood banks in under 15 minutes using intelligent priority algorithms.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onSelectModule('requester')}
            className="btn-primary text-sm py-3 px-6 rounded-xl font-extrabold shadow-xl shadow-red-600/40"
          >
            <ShieldAlert className="w-5 h-5" /> Request Blood Immediately (No Login Needed)
          </button>
          <button
            onClick={onOpenAuth}
            className="btn-secondary text-sm py-3 px-6 rounded-xl font-bold"
          >
            <User className="w-5 h-5" /> Sign In / Register as Donor
          </button>
        </div>
      </div>

      {/* Live System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl text-center">
          <Droplet className="w-7 h-7 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-heading">{stats.total_donations}+</p>
          <p className="text-xs text-slate-400 font-semibold">Verified Donations</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center">
          <User className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-heading">{stats.total_donors}+</p>
          <p className="text-xs text-slate-400 font-semibold">Active Donors</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center">
          <Building2 className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white font-heading">{stats.total_hospitals}</p>
          <p className="text-xs text-slate-400 font-semibold">Connected Hospitals</p>
        </div>
        <div className="glass-panel p-5 rounded-2xl text-center">
          <Zap className="w-7 h-7 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-emerald-400 font-heading">{stats.lives_saved}</p>
          <p className="text-xs text-slate-400 font-semibold">Lives Saved</p>
        </div>
      </div>

      {/* Module Portals Selection Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
            Select Your Portal to Get Started
          </h2>
          <p className="text-xs text-slate-400">Choose a dedicated module below to access all feature pages</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="glass-panel p-6 rounded-2xl border border-slate-700/80 hover:border-red-500/60 cursor-pointer space-y-4 group transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-red-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Enter <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-heading group-hover:text-red-400 transition">
                    {m.title}
                  </h3>
                  <p className="text-xs font-semibold text-amber-300 mt-1">{m.tagline}</p>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{m.desc}</p>
                </div>

                <button className="w-full btn-secondary text-xs py-2 justify-center group-hover:bg-red-600 group-hover:border-red-600 group-hover:text-white transition">
                  {m.btnText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
