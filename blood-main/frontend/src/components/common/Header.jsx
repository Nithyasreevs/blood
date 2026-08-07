import React from 'react';
import { HeartPulse, User, Building2, Shield, Bot, Bell, LogIn, LogOut, LayoutDashboard, FileText, MapPin, Award, CheckCircle, Plus, Users, BarChart3, AlertTriangle, Radio } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Header = ({ currentRole, setCurrentRole, activeTab, setActiveTab, isLoggedIn, user, onLogout, onOpenAuthWithRole }) => {
  // Sub-Pages Map for each module when inside a module
  const subPages = {
    donor: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my-profile', label: 'My Profile', icon: User },
      { id: 'donation-history', label: 'Donation History', icon: FileText },
      { id: 'emergency-requests', label: 'Emergency Requests', icon: HeartPulse },
      { id: 'live-tracking', label: 'Live Tracking', icon: MapPin },
      { id: 'rewards', label: 'Rewards & Leaderboard', icon: Award },
      { id: 'notifications', label: 'Notifications', icon: Bell }
    ],
    requester: [
      { id: 'emergency-form', label: '1. Emergency Request', icon: Plus },
      { id: 'request-status', label: '2. Request Status', icon: CheckCircle },
      { id: 'live-tracker', label: '3. Live Donor Tracking', icon: MapPin },
      { id: 'emergency-history', label: '4. Emergency History', icon: FileText },
      { id: 'feedback', label: '5. Feedback & Rating', icon: Award }
    ],
    hospital: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inventory', label: 'Blood Inventory', icon: Building2 },
      { id: 'create-request', label: 'Emergency Requests', icon: Plus },
      { id: 'donor-verify', label: 'Donor Verification', icon: CheckCircle },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'camps', label: 'Blood Camp Mgr', icon: Users },
      { id: 'reports', label: 'Reports', icon: BarChart3 }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'manage-users', label: 'Manage Users', icon: Users },
      { id: 'manage-donors', label: 'Manage Donors', icon: User },
      { id: 'manage-hospitals', label: 'Manage Hospitals', icon: Building2 },
      { id: 'manage-requests', label: 'Manage Requests', icon: Shield },
      { id: 'inventory-monitor', label: 'Inventory Monitor', icon: AlertTriangle },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'broadcast', label: 'Notification Centre', icon: Radio }
    ],
    ai: [
      { id: 'ai-engine', label: 'All Features Hub', icon: Bot }
    ]
  };

  const currentSubPages = subPages[currentRole] || null;

  return (
    <header className="w-full sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Home Link */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => { setCurrentRole('home'); setActiveTab('home'); }}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40 border border-rose-400/30">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight font-heading m-0">LifeFlow</h1>
              <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow">
                Network
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Smart Emergency Blood Dispatch System</p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {currentRole !== 'home' && (
            <button
              onClick={() => { setCurrentRole('home'); setActiveTab('home'); }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              🏠 Home
            </button>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {isLoggedIn ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white font-bold">{user?.name}</span>
              <button onClick={onLogout} className="text-slate-400 hover:text-red-400 ml-1" title="Sign Out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => onOpenAuthWithRole('donor')} className="btn-primary text-xs py-2 px-4 shadow-lg shadow-red-600/30">
              <LogIn className="w-4 h-4" /> Sign In / Portal
            </button>
          )}
        </div>
      </div>

      {/* Sub-Pages Bar (ONLY visible when inside a specific module, NOT on Home!) */}
      {currentRole !== 'home' && currentSubPages && (
        <div className="w-full bg-slate-900/95 border-t border-slate-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
              Navigation:
            </span>
            {currentSubPages.map(page => {
              const Icon = page.icon;
              const isSubActive = activeTab === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => setActiveTab(page.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isSubActive
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSubActive ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{page.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
