import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, Trash, CheckCircle2, AlertCircle, BellRing, Calendar } from 'lucide-react';
import api from '../../api/axios';

const ManageNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    title: '',
    type: 'General',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/notices');
      if (res.data.success) {
        setNotices(res.data.notices);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.post('/admin/notices', formData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Notice posted successfully!' });
        setFormData({
          title: '',
          type: 'General',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to post notice' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await api.delete(`/admin/notices/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Notice deleted successfully!' });
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete notice' });
    }
  };

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Event':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Academic':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Announcements Desk</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Notice Board</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Create and manage announcements visible on student dashboards.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      {/* Add Notice Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <BellRing size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Post New Notice</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Notice Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Mid-Term Examination Schedule" 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Notice Type</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              >
                <option value="General">General</option>
                <option value="Urgent">Urgent</option>
                <option value="Event">Event</option>
                <option value="Academic">Academic</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Notice Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Description / Content</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Write notice board announcement detail here..." 
                required 
                rows="4" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={submitLoading} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
              Post Notice
            </button>
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Existing Notices</h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{notices.length}</span>
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
                  <th className="p-4 pl-6">Type & Date</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Content</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((notice) => (
                  <tr key={notice._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 align-top w-[180px]">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${getTypeBadgeStyles(notice.type)}`}>
                        {notice.type}
                      </span>
                      <div className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(notice.date || notice.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 align-top font-bold text-slate-800 w-[240px]">
                      {notice.title}
                    </td>
                    <td className="p-4 align-top text-sm text-slate-600">
                      <p className="line-clamp-3 leading-relaxed">{notice.description}</p>
                    </td>
                    <td className="p-4 pr-6 text-right align-top w-20">
                      <button 
                        onClick={() => handleDelete(notice._id)}
                        className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Notice"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">No notices found. Add one above.</td>
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

export default ManageNotices;
