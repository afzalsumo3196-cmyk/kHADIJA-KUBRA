import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, Trash, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import api from '../../api/axios';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    quote: ''
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/public/reviews');
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load reviews' });
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
      const res = await api.post('/admin/reviews', formData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Review added successfully!' });
        setFormData({ name: '', role: '', quote: '' });
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to add review' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await api.delete(`/admin/reviews/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Review deleted successfully!' });
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete review' });
    }
  };

  const handleReplySubmit = async (id) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await api.put(`/admin/reviews/${id}/reply`, { replyText });
      if (res.data.success) {
        setReviews(reviews.map(r => r._id === id ? res.data.review : r));
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
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Public Content</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Reviews</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Add or remove student testimonials displayed on the landing page.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <MessageSquareWarning size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      {/* Add Review Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Add New Review</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Student Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ayesha R." required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course / Role</label>
              <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Diploma Student" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Quote</label>
              <textarea name="quote" value={formData.quote} onChange={handleChange} placeholder="Write the testimonial here..." required rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={submitLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
              Add Review
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Existing Reviews</h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{reviews.length}</span>
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
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Quote</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 align-top w-1/4">
                      <div className="font-bold text-slate-900">{review.name}</div>
                      <div className="text-sm text-slate-500">{review.role}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 italic">"{review.quote}"</td>
                    <td className="p-4 pr-6 text-right align-top w-48">
                      <div className="flex flex-col items-end gap-2">
                        {review.adminReply && (
                          <div className="text-left w-full bg-emerald-50 text-emerald-800 text-xs p-2 rounded border border-emerald-100 mb-2 whitespace-pre-wrap">
                            <span className="font-bold">Reply:</span> {review.adminReply}
                          </div>
                        )}
                        {replyingTo === review._id ? (
                          <div className="w-full flex flex-col gap-2">
                            <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type reply..."
                              className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                              rows="2"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={() => handleReplySubmit(review._id)} disabled={submittingReply} className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50">Send</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setReplyingTo(review._id); setReplyText(review.adminReply || ''); }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {review.adminReply ? 'Edit Reply' : 'Reply'}
                            </button>
                            <button 
                              onClick={() => handleDelete(review._id)}
                              className="inline-flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Review"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">No reviews found. Add one above.</td>
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

export default ManageReviews;
