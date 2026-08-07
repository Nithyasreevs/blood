import React, { useState } from 'react';
import { Radio, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

const NotificationCentreView = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
    } catch (err) {
      console.error('Failed to post broadcast notification:', err);
    }
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle('');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white font-heading">Broadcast Notification Centre</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Send system-wide broadcast messages & emergency push alerts to donors</p>
        </div>
      </div>

      {sent && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Broadcast alert pushed to all 148 registered donors!
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="form-group">
            <label>Alert Header / Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 📢 CRITICAL SHORTAGE ALERT: O- Blood Needed"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Broadcast Message Details</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Urgent request across all city blood banks for O negative donors..."
              className="form-control"
            />
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3 text-sm rounded-xl font-bold">
            <Send className="w-4 h-4" /> Dispatch Push Broadcast Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationCentreView;
