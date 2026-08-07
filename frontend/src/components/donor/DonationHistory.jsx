import React, { useState, useEffect } from 'react';
import { Download, Building2, Calendar, X, Heart, RefreshCw, FileText } from 'lucide-react';

const DonationHistory = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const res = await fetch(`/api/donor/history?user_id=${userId}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.donations) {
        setHistory(data.donations);
        setTotalDonations(data.total_donations || data.donations.length);
      }
    } catch (err) {
      console.error('Failed to fetch donation history from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching Donation History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading">Donation History & Verified Certificates</h2>
          {user?.name && <p className="text-xs text-slate-400">Donation records for {user.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-slate-400">Total Donations</p>
            <p className="text-lg font-bold text-white">{totalDonations} Times</p>
          </div>
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-slate-400">Lives Impacted</p>
            <p className="text-lg font-bold text-amber-300">{totalDonations * 3} Lives</p>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-2 border border-slate-800">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Donations Recorded Yet</h3>
          <p className="text-xs text-slate-400">When you complete a blood donation at a partner hospital, your certificate will appear here.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="p-4">Hospital Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Recipient / Purpose</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Certificate ID</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((item) => (
                  <tr key={item.donation_id || item.id} className="hover:bg-slate-800/50 transition">
<td className="p-4 font-bold text-white flex items-center gap-2">
  <Building2 className="w-4 h-4 text-red-400" /> {item.hospital_name}
</td>
                    <td className="p-4 text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}
                      </span>
                    </td>
                    <td className="p-4">{item.donor_name}</td>
                    <td className="p-4">
                      <span className="bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/40">
                        {item.blood_group || user?.blood_group || 'O-'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{item.qr_code || 'LF-VERIFIED-DONATION'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedCert(item)}
                        className="btn-secondary text-xs py-1.5 px-3 rounded-lg"
                      >
                        <Download className="w-3.5 h-3.5 text-red-400" /> Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-8 relative rounded-2xl border-2 border-amber-500/40 shadow-2xl bg-slate-950">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-4 border-double border-amber-500/50 rounded-xl text-center space-y-4 bg-slate-900/80">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center mx-auto shadow-lg">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">LifeFlow Official Certificate</span>
                <h3 className="text-2xl font-extrabold text-white font-heading mt-1">CERTIFICATE OF APPRECIATION</h3>
              </div>

                <h2 className="text-2xl font-black text-red-400 underline font-heading uppercase">
                  {user?.name}
                </h2>

              <p className="text-xs text-slate-300 max-w-md mx-auto">
                In noble recognition of your voluntary blood donation at <strong>{selectedCert.hospital_name || 'Hospital Desk'}</strong>.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700/80 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500">Certificate Passcode</p>
                  <p className="font-mono text-amber-300 font-bold">{selectedCert.qr_code || 'LF-VERIFIED-DONATION'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Authorized Officer</p>
                  <p className="font-semibold text-white">LifeFlow Board</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => window.print()} className="btn-primary w-full justify-center">
                <Download className="w-4 h-4" /> Save PDF Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistory;
