import React, { useState, useEffect } from 'react';
import { Droplet, RefreshCw } from 'lucide-react';

const ManageDonorsView = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/donors');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.donors) {
        setDonors(data.donors);
      }
    } catch (err) {
      console.error('Failed to fetch donors from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const toggleVerify = async (donorId, currentVerified) => {
    const newVerified = !currentVerified;
    setDonors(donors.map(d => (d.donor_id === donorId || d.id === donorId) ? { ...d, verified: newVerified } : d));

    try {
      await fetch('/api/admin/donors/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_id: donorId, verified: newVerified })
      });
      fetchDonors();
    } catch (err) {
      console.error('Failed to update verification on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching donor records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Droplet className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white font-heading">Donor Verification & Availability Monitor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Audit donor health verifications, emergency response rates and availability status</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Blood Group</th>
                <th className="p-4">Total Donations</th>
                <th className="p-4">Response Rate</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Verification</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {donors.map((d) => {
                const isVerified = d.verified !== undefined ? d.verified : true;
                return (
                  <tr key={d.donor_id || d.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{d.name}</td>
                    <td className="p-4">
                      <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/40">
                        {d.blood_group}
                      </span>
                    </td>
                    <td className="p-4">{d.total_donations || 0} Times</td>
                    <td className="p-4 font-bold text-amber-300">{d.response_rate || 95}%</td>
                    <td className="p-4 font-bold">
                      <span className={`text-[10px] ${d.availability ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {d.availability ? '● Available' : '○ Unavailable'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                        {isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleVerify(donorId, isVerified)} className="btn-secondary text-xs py-1 px-3">
                        {isVerified ? 'Unverify' : 'Verify Now'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageDonorsView;
