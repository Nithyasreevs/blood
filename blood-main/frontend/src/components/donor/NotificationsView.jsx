import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

const NotificationsView = ({ user, apiBase = 'donor' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userId = user?.user_id || 'usr_donor_1';
      const res = await fetch(`/api/${apiBase}/notifications?user_id=${userId}`);
      const data = await res.json().catch(() => null);
      if (data && data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, status: 'read' })));
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching Notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white font-heading">Notifications & Emergency Alerts</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time alerts, matches & community announcements</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary text-xs py-1.5 px-3">
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="card-panel p-8 text-center text-slate-400">
          No notifications found for your profile.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = n.status === 'unread';
            const isEmergency = (n.title || '').toLowerCase().includes('critical') || (n.title || '').toLowerCase().includes('emergency');
            return (
              <div
                key={n.notification_id || n.id}
                className={`glass-panel p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  isUnread ? 'border-red-500/50 bg-red-950/20' : 'border-slate-800'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${isEmergency ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {isEmergency ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {n.sent_time ? new Date(n.sent_time).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
