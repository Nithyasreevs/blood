import React from 'react';
import { HeartPulse, ShieldCheck, PhoneCall } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full glass-panel border-t border-slate-700/50 rounded-none rounded-t-xl py-6 px-4 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-red-500" />
          <span className="font-bold text-white">LifeFlow Blood Donation Platform</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Priority Match Engine Active
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <PhoneCall className="w-3.5 h-3.5" /> Emergency Helpline: 1800-BLOOD-HELP
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
