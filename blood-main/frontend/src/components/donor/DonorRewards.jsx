import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Zap, Sparkles, RefreshCw } from 'lucide-react';

const DonorRewards = ({ user }) => {
  const [userReward, setUserReward] = useState({ points: 0, badge: 'Active Donor', level: 'Bronze' });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, [user]);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const res = await fetch(`/api/donor/rewards?user_id=${userId}`);
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        if (data.userReward) setUserReward(data.userReward);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch rewards from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching Leaderboard & Rewards...</p>
      </div>
    );
  }

  const badges = [
    { title: userReward.badge || 'Life Saver Gold', desc: 'Completed emergency blood donations', icon: Trophy, color: 'from-amber-500 to-yellow-400', earned: true },
    { title: 'Universal Hero', desc: 'O- Universal Donor standing by for critical emergencies', icon: Flame, color: 'from-red-600 to-rose-500', earned: true },
    { title: 'Speed Responder', desc: 'Responded within 5 minutes of emergency broadcast', icon: Zap, color: 'from-purple-600 to-indigo-500', earned: true },
    { title: 'Platinum Legend', desc: 'Reach 15 total verified donations to unlock', icon: Sparkles, color: 'from-slate-700 to-slate-600', earned: false }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-heading">Donor Rewards & City Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Earn reward points, level badges and claim emergency life-saver recognition</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 border border-amber-500/40 px-5 py-2.5 rounded-xl text-center">
            <p className="text-xs text-amber-300 font-semibold">Your Total Points</p>
            <p className="text-2xl font-black text-white font-heading">{userReward.points} PTS</p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {badges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div key={idx} className={`glass-panel p-5 rounded-2xl border text-center space-y-3 relative ${b.earned ? 'border-amber-500/40 bg-slate-900/80' : 'border-slate-800 opacity-60'}`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${b.color} flex items-center justify-center mx-auto shadow-lg text-white`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{b.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{b.desc}</p>
              </div>
              <span className={`badge text-[10px] ${b.earned ? 'badge-high' : 'bg-slate-800 text-slate-400'}`}>
                {b.earned ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-400" /> Dynamic City Leaderboard
        </h3>

        {leaderboard.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No leaderboard entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Donor Name</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Total Donations</th>
                  <th className="p-3">Reward Points</th>
                  <th className="p-3">Badge Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {leaderboard.map((item, idx) => (
                  <tr key={item.donor_id || idx} className={`hover:bg-slate-800/50 ${item.name?.includes(user?.name) ? 'bg-amber-500/10 font-bold border-l-4 border-amber-500' : ''}`}>
                    <td className="p-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-800'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3">
                      <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/40">
                        {item.blood_group}
                      </span>
                    </td>
                    <td className="p-3">{item.total_donations} Times</td>
                    <td className="p-3 font-bold text-amber-400">{item.points} PTS</td>
                    <td className="p-3 font-semibold text-purple-300">{item.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorRewards;
