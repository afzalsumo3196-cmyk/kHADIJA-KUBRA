import React, { useState, useEffect } from 'react';
import { Send, MessageSquareWarning, Loader2, CheckCircle2, Clock, CheckCircle } from 'lucide-react';
import api from '../../api/axios'; // Ensure this path is correct based on your folder structure

const ComplaintBox = () => {
  const [formData, setFormData] = useState({
    category: 'Academic Issue',
    urgency: 'Low',
    subject: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' or 'error'
  
  const [pastComplaints, setPastComplaints] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    fetchPastComplaints();
  }, []);

  const fetchPastComplaints = async () => {
    try {
      setLoadingPast(true);
      const res = await api.get('/portal/complaints');
      if (res.data.success) {
        setPastComplaints(res.data.complaints);
      }
    } catch (error) {
      console.error('Failed to fetch past complaints', error);
    } finally {
      setLoadingPast(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Sending data to backend
      await api.post('/portal/complaints', formData);
      
      setStatus({ type: 'success', message: 'Your complaint has been submitted successfully.' });
      setFormData({ category: 'Academic Issue', urgency: 'Low', subject: '', description: '' }); // Reset form
      fetchPastComplaints(); // Refresh the list
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit complaint. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-50 rounded-full text-red-500 mb-4 shadow-sm border border-red-100">
          <MessageSquareWarning size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Submit a Complaint</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
          Your feedback is strictly confidential. Please let us know if you are facing any issues.
        </p>
      </div>

      <div className="bg-white/90 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 backdrop-blur-md">
        
        {/* Status Messages */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
            {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <MessageSquareWarning size={20} className="shrink-0 mt-0.5" />}
            <span className="text-sm font-semibold">{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-700 transition-all"
              >
                <option value="Academic Issue">Academic Issue</option>
                <option value="Portal/Technical Issue">Portal/Technical Issue</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Urgency Level</label>
              <select 
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-700 transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Subject</label>
            <input 
              type="text" 
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Brief title of your issue"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Detailed Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Explain your issue in detail here..."
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 resize-none transition-all"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      {/* Past Complaints Section */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="text-blue-500" /> My Past Complaints
        </h3>

        {loadingPast ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : pastComplaints.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-200 text-slate-500">
            You haven't submitted any complaints yet.
          </div>
        ) : (
          <div className="space-y-4">
            {pastComplaints.map(c => (
              <div key={c._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-900">{c.subject}</h4>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{c.description}</p>
                
                {c.adminReply && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-emerald-500" size={16} />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Admin Reply</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{c.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ComplaintBox;