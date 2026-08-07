import React, { useState, useEffect } from 'react';
import { Users, Ban, Check, RefreshCw } from 'lucide-react';

const ManageUsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const action = currentStatus === 'active' ? 'suspend' : 'unsuspend';
    setUsers(users.map(u => u.user_id === id || u.id === id ? { ...u, status: action === 'suspend' ? 'suspended' : 'active' } : u));

    try {
      await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, action })
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status on backend:', err);
    }
  };

  if (loading) {
    return (
      <div className="card-panel p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-white">Fetching registered users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white font-heading">User Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">View, edit, or suspend users</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700/80">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">City</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => {
                const status = u.status || 'active';
                return (
                  <tr key={u.user_id || u.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 font-mono">{u.phone}</td>
                    <td className="p-4 font-mono">{u.phone}</td>
                    <td className="p-4 font-bold text-purple-300 uppercase">{u.role}</td>
                    <td className="p-4">{u.city || 'Chennai'}</td>
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(userId, status)}
                        className={`btn-secondary text-xs py-1 px-3 ${status === 'active' ? 'hover:border-red-500 hover:text-red-400' : 'hover:border-emerald-500 hover:text-emerald-400'}`}
                      >
                        {status === 'active' ? <><Ban className="w-3.5 h-3.5" /> Suspend</> : <><Check className="w-3.5 h-3.5" /> Unsuspend</>}
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

export default ManageUsersView;
