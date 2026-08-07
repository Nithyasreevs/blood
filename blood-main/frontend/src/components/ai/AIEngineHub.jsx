import React, { useState, useEffect } from 'react';
import { Bot, Zap, Droplet, Scale, RefreshCw } from 'lucide-react';

const ALL_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AIEngineHub = () => {
  const [activeTab, setActiveTab] = useState('priority-scorer');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [aiMatches, setAiMatches] = useState([]);
  const [loadingScore, setLoadingScore] = useState(false);
  const [compResult, setCompResult] = useState(null);
  const [eligAge, setEligAge] = useState(25);
  const [eligWeight, setEligWeight] = useState(65);
  const [eligDays, setEligDays] = useState(100);
  const [eligResult, setEligResult] = useState(null);

  const fetchData = async () => {
    setLoadingScore(true);
    try {
      const res = await fetch(`/api/ai/matches?blood_group=${encodeURIComponent(bloodGroup)}`);
      const data = await res.json();
      if (data.success) setAiMatches(data.donors || []);
    } catch { /* ignore */ } finally { setLoadingScore(false); }
    try {
      const res = await fetch(`/api/ai/compatibility?blood_group=${encodeURIComponent(bloodGroup)}`);
      const data = await res.json();
      if (data.success) setCompResult({
        requested_group: data.patient_blood_group,
        can_receive_from: data.compatible_donor_groups,
        notes: data.medical_note,
        group_counts: data.group_counts,
        donors: data.donors,
        total_available: data.total_available
      });
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, [bloodGroup]);

  const tabs = [
    { id: 'priority-scorer', label: 'AI Donor Match', icon: Zap },
    { id: 'compatibility', label: 'Compatibility', icon: Droplet },
    { id: 'eligibility', label: 'Eligibility', icon: Scale }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-rose-950/60 border border-purple-500/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/40">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-heading">AI Engine</h2>
              <p className="text-xs text-slate-300 mt-1">Smart donor matching, compatibility, and eligibility</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/80 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            ><Icon className="w-4 h-4" /> {t.label}</button>
          );
        })}
      </div>

      {activeTab === 'priority-scorer' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" /> AI-Powered Donor Ranking
              </h3>
              <p className="text-xs text-slate-400 mt-1">All registered donors ranked by priority score for selected blood group</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-bold">Blood Group:</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="form-control text-xs bg-slate-900">
                {ALL_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {loadingScore ? (
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Calculating...</p>
            ) : aiMatches.length === 0 ? (
              <p className="text-xs text-slate-500">No donors found for {bloodGroup}.</p>
            ) : (
              aiMatches.map((m, i) => (
                <div key={m.donor_id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs">#{i + 1}</div>
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center">{m.blood_group}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.name}</h4>
                      <p className="text-xs text-slate-400">{m.city} &middot; {m.distance_km} km &middot; ETA ~{m.eta_minutes} min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">AI Score</p>
                    <p className="text-lg font-black text-purple-200">{m.ai_score}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'compatibility' && compResult && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500" /> Blood Group Compatibility
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-bold">Patient:</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="form-control text-xs bg-slate-900">
                {ALL_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-300">
                  <th className="p-2 text-left font-bold border-b border-slate-700">Blood Group</th>
                  <th className="p-2 text-left font-bold border-b border-slate-700">Can Donate To</th>
                  <th className="p-2 text-left font-bold border-b border-slate-700">Can Receive From</th>
                  <th className="p-2 text-center font-bold border-b border-slate-700">Available Donors</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { bg: 'O-', donate: 'All blood types (Universal Donor)', receive: 'O-', group: 'O−' },
                  { bg: 'O+', donate: 'O+, A+, B+, AB+', receive: 'O+, O−', group: 'O+' },
                  { bg: 'A-', donate: 'A−, A+, AB−, AB+', receive: 'A−, O−', group: 'A−' },
                  { bg: 'A+', donate: 'A+, AB+', receive: 'A+, A−, O+, O−', group: 'A+' },
                  { bg: 'B-', donate: 'B−, B+, AB−, AB+', receive: 'B−, O−', group: 'B−' },
                  { bg: 'B+', donate: 'B+, AB+', receive: 'B+, B−, O+, O−', group: 'B+' },
                  { bg: 'AB-', donate: 'AB−, AB+', receive: 'AB−, A−, B−, O−', group: 'AB−' },
                  { bg: 'AB+', donate: 'AB+ only', receive: 'All blood types (Universal Recipient)', group: 'AB+' }
                ].map(row => {
                  const cnt = compResult.group_counts ? (compResult.group_counts[row.bg] ?? 0) : 0;
                  return (
                    <tr key={row.bg} className={`border-b border-slate-800 ${row.bg === compResult.requested_group ? 'bg-red-900/20' : 'hover:bg-slate-800/50'}`}>
                      <td className={`p-2 font-bold ${row.bg === compResult.requested_group ? 'text-red-400' : 'text-white'}`}>{row.group}{row.bg === compResult.requested_group ? ' (Patient)' : ''}</td>
                      <td className="p-2 text-slate-300">{row.donate}</td>
                      <td className="p-2 text-slate-300">{row.receive}</td>
                      <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded font-bold ${cnt > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{cnt}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {compResult.donors?.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Zap className="w-3 h-3 text-purple-400" /> Top Ranked Donors</p>
              {compResult.donors.slice(0, 5).map(d => (
                <div key={d.donor_id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-600/20 text-red-300 font-bold flex items-center justify-center text-xs">{d.blood_group}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{d.name}</h4>
                      <p className="text-xs text-slate-400">{d.city} &middot; {d.distance_km} km &middot; ETA ~{d.eta_minutes} min</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-base font-black text-purple-200">{d.ai_score}%</p></div>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Medical Note</h4>
            <p className="text-xs text-slate-300">{compResult.notes}</p>
          </div>
        </div>
      )}

      {activeTab === 'eligibility' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" /> Donation Eligibility Check
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl">
            <div className="form-group">
              <label>Age (Years)</label>
              <input type="number" value={eligAge} onChange={e => setEligAge(Number(e.target.value))} className="form-control" />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" value={eligWeight} onChange={e => setEligWeight(Number(e.target.value))} className="form-control" />
            </div>
            <div className="form-group">
              <label>Days Since Last Donation</label>
              <input type="number" value={eligDays} onChange={e => setEligDays(Number(e.target.value))} className="form-control" />
            </div>
          </div>
          <button onClick={async () => {
            try {
              const res = await fetch('/api/ai/check-eligibility', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ age: eligAge, weight: eligWeight, last_donation_date: new Date(Date.now() - eligDays * 86400000).toISOString(), has_illness: false, recent_tattoo: false })
              });
              const data = await res.json();
              if (data.success) setEligResult(data.eligibility);
            } catch { /* ignore */ }
          }} className="btn-primary text-xs py-2 px-4">Check Eligibility</button>
          {eligResult && (
            <div className={`p-4 rounded-xl border text-xs font-semibold ${eligResult.eligible ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' : 'bg-red-950/50 border-red-500/50 text-red-300'}`}>
              <p className="font-bold mb-1">{eligResult.eligible ? 'Eligible to Donate' : 'Not Eligible Yet'}</p>
              {eligResult.reasons.map((r, idx) => <p key={idx}>&bull; {r}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIEngineHub;
