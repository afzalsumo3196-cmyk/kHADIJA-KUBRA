import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, Search, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/complaints');
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      const res = await api.delete(`/admin/complaints/${id}`);
      if (res.data.success) {
        setComplaints(complaints.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete complaint');
    }
  };

  const handleReplySubmit = async (id) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await api.put(`/admin/complaints/${id}/reply`, { replyText });
      if (res.data.success) {
        setComplaints(complaints.map(c => c._id === id ? res.data.complaint : c));
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquareWarning className="text-blue-600" /> Student Complaints
        </h2>
        <p className="mt-1 text-slate-500">View and manage issues reported by students.</p>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {complaints.map((c) => (
            <div key={c._id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  c.urgency === 'High' || c.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                  c.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {c.urgency} Priority
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  c.status === 'Pending' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {c.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{c.subject}</h3>
              <p className="text-slate-600 text-sm mb-4 line-clamp-3">{c.description}</p>
              
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Student</p>
                <p className="text-sm font-bold text-slate-800">
                  {c.studentId?.name || 'Unknown Student'}
                </p>
                <p className="text-xs text-slate-500">{c.studentId?.regNo || 'N/A'}</p>
              </div>
              
              {/* Admin Reply Section */}
              {c.adminReply && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Your Reply</p>
                  <p className="text-sm text-emerald-900">{c.adminReply}</p>
                </div>
              )}

              {/* Action Buttons & Reply Box */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                {replyingTo === c._id ? (
                  <div className="space-y-2 text-left">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply to the student..."
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleReplySubmit(c._id)}
                        disabled={submittingReply}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submittingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <button 
                      onClick={() => { setReplyingTo(c._id); setReplyText(c.adminReply || ''); }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {c.adminReply ? 'Edit Reply' : 'Reply'}
                    </button>
                    <button 
                      onClick={() => handleDelete(c._id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              No complaints found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
