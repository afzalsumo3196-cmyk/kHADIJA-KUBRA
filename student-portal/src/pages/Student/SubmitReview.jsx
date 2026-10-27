import React, { useState } from 'react';
import { Star, Send, Loader2, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import api from '../../api/axios';

const SubmitReview = () => {
  const [formData, setFormData] = useState({
    quote: '',
    rating: 5
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingClick = (val) => {
    setFormData({ ...formData, rating: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quote.trim()) {
      setStatus({ type: 'error', message: 'Please write your testimonial quote.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/portal/reviews', formData);
      setStatus({ type: 'success', message: 'Thank you! Your testimonial has been submitted successfully.' });
      setFormData({ quote: '', rating: 5 }); // Reset form
    } catch (error) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit review. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-emerald-50 rounded-full text-emerald-600 mb-4 shadow-sm border border-emerald-100">
          <Star size={32} fill="currentColor" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Share Your Experience</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
          We value your feedback. Submit a review of your experience at Khadeeja Tul Kubra Islamic Institute to be displayed on our landing page.
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
          
          {/* Star Rating */}
          <div className="space-y-2 flex flex-col items-center">
            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = val <= formData.rating;
                const isHovered = val <= hoveredRating;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleRatingClick(val)}
                    onMouseEnter={() => setHoveredRating(val)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    <Star
                      size={36}
                      className={`${
                        isHovered
                          ? 'text-amber-400 fill-amber-400'
                          : isSelected
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-200'
                      } transition-colors`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {formData.rating} Star{formData.rating > 1 ? 's' : ''}
            </p>
          </div>

          {/* Review Text / Quote */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Your Review / Testimonial</label>
            <textarea 
              name="quote"
              value={formData.quote}
              onChange={handleChange}
              required
              rows="6"
              maxLength="300"
              placeholder="Tell us about the curriculum, faculty support, study environment, or online portal..."
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 resize-none transition-all"
            ></textarea>
            <div className="flex justify-between text-xs text-slate-400 px-1">
              <span>Limit: 300 characters</span>
              <span>{formData.quote.length}/300</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitReview;
