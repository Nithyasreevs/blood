import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

const DonorVerificationView = ({ user }) => {
  const [donorCode, setDonorCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/hospital/donor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: donorCode
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setResult({
          verified: true,
          donor_name: data.donation?.donor_name || 'Verified Donor',
          blood_group: data.donation?.blood_group || 'N/A',
          units: data.donation?.units || 1,
          message: data.message || `Donation recorded successfully!`
        });
      } else {
        setResult({ verified: false, donor_name: '', blood_group: '', units: 0, message: data?.message || 'Verification failed. Donor code not found.' });
      }
    } catch (err) {
      setResult({ verified: false, donor_name: '', blood_group: '', units: 0, message: 'Server error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white font-heading">Donor Verification & QR Scanner Desk</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Verify donor arrival code & credit donation points</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="form-group">
            <label>Enter Donor QR Code / Passcode</label>
            <div className="relative">
              <QrCode className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={donorCode}
                onChange={e => setDonorCode(e.target.value)}
                placeholder="e.g. LF-2026-DONOR-101"
                className="form-control pl-11 font-mono uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center py-3 text-xs font-bold rounded-xl shadow-lg shadow-red-600/30"
          >
            {loading ? 'Verifying...' : 'Verify Donor & Credit Points'}
          </button>
        </form>

        {result && (
          <div className={`p-5 rounded-xl border space-y-3 ${result.verified ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-red-950/40 border-red-500/50'}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-7 h-7 ${result.verified ? 'text-emerald-400' : 'text-red-400'}`} />
              <div>
                <h4 className="text-base font-bold text-white">{result.verified ? 'Verification Successful' : 'Verification Failed'}</h4>
                <p className="text-xs text-slate-300">{result.message || 'Donor code verified.'}</p>
              </div>
            </div>

            {result.verified && (
              <div className="pt-3 border-t border-emerald-500/30 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Donor Name</p>
                  <p className="font-bold text-white">{result.donor_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Blood Group</p>
                  <p className="font-bold text-red-400">{result.blood_group}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Units Donated</p>
                  <p className="font-bold text-white">{result.units}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorVerificationView;
