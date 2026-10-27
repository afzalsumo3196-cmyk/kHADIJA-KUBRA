import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Trash2, AlertCircle, CheckCircle2, UserX } from 'lucide-react';
import api from '../../api/axios';

const RecycleBin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchRecycleBin = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/recycle-bin');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to fetch recycle bin data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  const handleRestore = async (id) => {
    if (!window.confirm('Are you sure you want to restore this user?')) return;
    try {
      setStatus({ type: '', message: '' });
      const res = await api.put(`/admin/recycle-bin/restore/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'User restored successfully' });
        fetchRecycleBin();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to restore user' });
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('WARNING: This will permanently delete the user and all their data. This cannot be undone. Are you sure?')) return;
    try {
      setStatus({ type: '', message: '' });
      const res = await api.delete(`/admin/recycle-bin/hard-delete/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'User permanently deleted' });
        fetchRecycleBin();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete user' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-red-600 font-bold">System Maintenance</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Recycle Bin</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Manage deleted students and teachers. You can restore them or permanently delete their records.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" />
            Deleted Users
          </h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{users.length}</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Deleted At</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'teacher' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{user.regNo || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        onClick={() => handleRestore(user._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-colors"
                        title="Restore User"
                      >
                        <RefreshCw size={16} /> <span className="hidden sm:inline">Restore</span>
                      </button>
                      <button 
                        onClick={() => handleHardDelete(user._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                        title="Permanently Delete"
                      >
                        <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <UserX size={24} className="text-slate-400" />
                        </div>
                        <p className="font-medium">Recycle bin is empty.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBin;
