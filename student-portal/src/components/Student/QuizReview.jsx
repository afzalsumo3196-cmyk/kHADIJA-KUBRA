import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, AlertCircle, HelpCircle, Trophy, Clock, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { formatPkt } from '../../utils/quizTime';

const QuizReview = ({ isOpen, onClose, quizId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [activeAttemptIndex, setActiveAttemptIndex] = useState(0);

  useEffect(() => {
    if (!isOpen || !quizId) return;

    let ignore = false;
    const fetchReview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/portal/quizzes/${quizId}/my-review`);
        if (!ignore && res.data.success) {
          setReviewData(res.data);
          // Default to the latest attempt or best attempt
          if (Array.isArray(res.data.attempts) && res.data.attempts.length > 0) {
            const bestIdx = res.data.attempts.findIndex(a => a.attemptNo === res.data.bestAttemptNo);
            setActiveAttemptIndex(bestIdx >= 0 ? bestIdx : res.data.attempts.length - 1);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Failed to load quiz review.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchReview();
    return () => {
      ignore = true;
    };
  }, [isOpen, quizId]);

  if (!isOpen) return null;

  const currentAttempt = reviewData?.attempts && reviewData.attempts[activeAttemptIndex] 
    ? reviewData.attempts[activeAttemptIndex] 
    : null;

  const percentage = currentAttempt && currentAttempt.totalMarks > 0
    ? Math.round((currentAttempt.score / currentAttempt.totalMarks) * 100)
    : 0;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-3">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Assessment Review</p>
            <h3 className="font-extrabold text-base sm:text-lg truncate">
              {reviewData?.quizTitle || 'Quiz Result Review'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin text-emerald-600" size={36} />
              <p className="text-xs font-semibold text-slate-500">Loading your quiz answers...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Review Unavailable</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          ) : reviewData?.legacyReview ? (
            /* Legacy Quiz (Attempt from before Phase 3 tracking) */
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl text-center space-y-3">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trophy size={32} />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Score Obtained</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {reviewData.legacyReview.score} <span className="text-lg text-slate-400">/ {reviewData.legacyReview.totalMarks}</span>
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <Clock size={14} className="text-slate-400" />
                  Submitted: {formatPkt(reviewData.legacyReview.submittedAt)}
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
                <HelpCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">{reviewData.legacyReview.message}</p>
                  <p className="text-amber-700 mt-0.5">
                    This attempt was recorded prior to detailed question tracking. Your score and grade are intact.
                  </p>
                </div>
              </div>
            </div>
          ) : currentAttempt ? (
            /* Modern Attempt Review with Question-level Status */
            <div className="space-y-5">
              {/* Attempt Selector Tabs (if multiple attempts) */}
              {reviewData.attempts.length > 1 && (
                <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
                  {reviewData.attempts.map((att, idx) => {
                    const isSelected = idx === activeAttemptIndex;
                    const isBest = att.attemptNo === reviewData.bestAttemptNo;
                    return (
                      <button
                        key={att.attemptNo}
                        onClick={() => setActiveAttemptIndex(idx)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>Attempt {att.attemptNo}</span>
                        {isBest && (
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            Best
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Summary Stats Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {currentAttempt.score}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        / {currentAttempt.totalMarks} ({percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span>Submitted: {formatPkt(currentAttempt.submittedAt)}</span>
                  </div>
                </div>

                {/* Score Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 pt-3">
                  <div className="bg-white border border-emerald-200/60 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 size={14} /> Correct
                    </div>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">
                      {currentAttempt.counts.correct}
                    </p>
                  </div>

                  <div className="bg-white border border-rose-200/60 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-rose-700 text-xs font-bold">
                      <XCircle size={14} /> Wrong
                    </div>
                    <p className="text-lg font-black text-rose-800 mt-0.5">
                      {currentAttempt.counts.wrong}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-600 text-xs font-bold">
                      <HelpCircle size={14} /> Unanswered
                    </div>
                    <p className="text-lg font-black text-slate-800 mt-0.5">
                      {currentAttempt.counts.unanswered}
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Level Breakdown */}
              <div className="space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Question Responses ({currentAttempt.questions.length})
                </p>

                {currentAttempt.questions.map((q, idx) => {
                  const isAnswered = q.selected !== null && q.selected !== undefined && q.selected !== '';
                  const isCorrect = q.isCorrect;

                  return (
                    <div 
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
                    >
                      {/* Question Top Row: Number, Text, Status Badge, Marks */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className="shrink-0 h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {q.questionText}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> Correct
                            </span>
                          ) : isAnswered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} /> Wrong
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle size={12} /> Not answered
                            </span>
                          )}

                          <span className="text-xs font-extrabold text-slate-400">
                            {q.marks} pt
                          </span>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="space-y-1.5 pl-8">
                        {q.options.map((opt, optIdx) => {
                          const isStudentChoice = isAnswered && (
                            opt === q.selected || 
                            (typeof opt === 'string' && opt.trim().toLowerCase() === String(q.selected).trim().toLowerCase())
                          );

                          if (isStudentChoice) {
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-semibold ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-rose-50/80 border-rose-300 text-rose-950 font-bold'
                                }`}
                              >
                                <span className="flex-1 mr-2">{opt}</span>
                                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                  isCorrect ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
                                }`}>
                                  Your Choice ({isCorrect ? 'Correct' : 'Wrong'})
                                </span>
                              </div>
                            );
                          }

                          // Neutral non-selected option (NEVER revealed as correct/wrong)
                          return (
                            <div
                              key={optIdx}
                              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-medium"
                            >
                              {opt}
                            </div>
                          );
                        })}

                        {!isAnswered && (
                          <p className="text-[11px] text-slate-400 italic pt-1">
                            No option was selected for this question during the attempt.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QuizReview;
