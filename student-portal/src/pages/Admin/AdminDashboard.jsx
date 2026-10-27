import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, MessageSquareWarning, Activity, Loader2 } from 'lucide-react';
import api from '../../api/axios'; 

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeQuizzes: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Overview</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
          Monitor institute metrics, manage student records, and oversee academic progress from a centralized control panel.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Total Enrolled Students</p>
                <h3 className="text-4xl font-extrabold text-slate-900">{stats.totalStudents}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-bold">
              <Activity size={16} />
              <span>Real-time count</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Active Quizzes</p>
                <h3 className="text-4xl font-extrabold text-slate-900">{stats.activeQuizzes}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardList size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 font-bold">
              <span>Across all departments</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Pending Complaints</p>
                <h3 className="text-4xl font-extrabold text-slate-900">{stats.pendingComplaints}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MessageSquareWarning size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-bold">
              <span>Requires attention</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
         <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-3">System Online & Secured</h3>
            <p className="text-slate-500 text-sm">All administrative modules are currently functioning normally. Select an option from the sidebar to manage specific resources.</p>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
