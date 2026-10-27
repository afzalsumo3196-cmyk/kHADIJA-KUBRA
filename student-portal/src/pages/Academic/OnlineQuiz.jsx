import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Clock, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, Trophy, FileQuestion, Eye } from 'lucide-react';
import api from '../../api/axios';
import { formatPkt, getQuizStatus } from '../../utils/quizTime';
import QuizReview from '../../components/Student/QuizReview';

const OnlineQuiz = ({ courseId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Review Modal State
  const [reviewQuizId, setReviewQuizId] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const openReview = (quizId) => {
    setReviewQuizId(quizId);
    setIsReviewOpen(true);
  };

  const closeReview = () => {
    setIsReviewOpen(false);
    setReviewQuizId(null);
  };

  // Quiz State Machine: 'IDLE' -> 'ACTIVE' -> 'FINISHED'
  const [quizState, setQuizState] = useState('IDLE');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(0);
  
  // Interactive Quiz Logic
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const selectedAnswersRef = useRef({});
  const isSubmittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // Total seconds remaining
  
  const hasAutoSubmittedRef = useRef(false);
  const timerRef = useRef(null);

  // Helper to format remaining seconds into MM:SS
  const formatTime = (totalSecs) => {
    if (totalSecs <= 0) return '00:00';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch Quizzes on Load
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const url = courseId ? `/portal/quizzes?courseId=${courseId}` : '/portal/quizzes';
        const response = await api.get(url);
        if (Array.isArray(response.data)) {
          setQuizzes(response.data);
        }
      } catch {
        setError('Failed to load active quizzes.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId, refreshTrigger]);

  // Final submit handler (called when clicking Submit Exam or when total time expires)
  const submitQuizFinal = useCallback(async () => {
    if (!activeQuiz || isSubmittingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/portal/quizzes/submit', {
        quizId: activeQuiz._id,
        answers: selectedAnswersRef.current
      });
      setRefreshTrigger(prev => prev + 1);
      setQuizState('FINISHED');
    } catch (err) {
      console.error('Failed to auto-save quiz score', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit quiz score. Please check your connection and click Retry.');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }, [activeQuiz]);

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // NOTE: Timer is continuous! It does not reset when moving between questions.
    } else {
      submitQuizFinal();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Continuous Total Timer Logic (decrements remaining seconds until 0)
  useEffect(() => {
    if (quizState === 'ACTIVE' && activeQuiz) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, activeQuiz]);

  // Auto-submit trigger when timer reaches 0 (fires exactly once, preventing infinite retry loops)
  useEffect(() => {
    if (quizState === 'ACTIVE' && activeQuiz && timeLeft === 0 && !hasAutoSubmittedRef.current && !submitting) {
      hasAutoSubmittedRef.current = true;
      submitQuizFinal();
    }
  }, [timeLeft, quizState, activeQuiz, submitting, submitQuizFinal]);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    selectedAnswersRef.current = {};
    setSelectedAnswers({});
    isSubmittingRef.current = false;
    hasAutoSubmittedRef.current = false;
    setSubmitting(false);
    setSubmitError(null);
    // Convert teacher's timeLimit in minutes into total seconds
    const totalMinutes = (quiz.timeLimit && quiz.timeLimit > 0) ? quiz.timeLimit : 15;
    setTimeLeft(totalMinutes * 60);
    setQuizState('ACTIVE');
  };

  const handleOptionSelect = (option) => {
    if (submitting) return;
    const updated = {
      ...selectedAnswersRef.current,
      [currentQuestionIndex]: option
    };
    selectedAnswersRef.current = updated;
    setSelectedAnswers(updated);
  };

  // Views

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (quizState === 'IDLE') {
    // If courseId prop is passed, ensure only quizzes belonging to this course are shown
    const relevantQuizzes = courseId
      ? quizzes.filter(quiz => {
          const qCourseId = (quiz.course?._id || quiz.course)?.toString();
          return qCourseId === courseId.toString();
        })
      : quizzes;

    // Group quizzes by Course
    const groupedData = relevantQuizzes.reduce((acc, quiz) => {
      const cId = (quiz.course?._id || quiz.course || 'unknown').toString();
      if (!acc[cId]) {
        acc[cId] = {
          course: quiz.course || { title: quiz.faculty || 'Unknown Course', courseCode: 'N/A' },
          quizzes: []
        };
      }
      acc[cId].quizzes.push(quiz);
      return acc;
    }, {});
    
    const courses = Object.values(groupedData);

    return (
      <div className={`space-y-8 animate-fade-in-up ${courseId ? '' : 'max-w-5xl mx-auto pb-12'}`}>
        {!courseId && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">Assessments</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Active Quizzes</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Select an assessment to begin your online quiz. Make sure to complete all questions within the given time limit.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 text-sm font-semibold">{error}</div>
        )}

        {courses.length === 0 ? (
          <div className="py-16 text-center bg-white/80 border border-slate-200 rounded-[32px] shadow-sm backdrop-blur-md">
            <FileQuestion size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No Active Quizzes Available</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              There are no assessments currently scheduled for your enrolled courses. Please check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((group, index) => {
              const isExpanded = expandedCourse === index;

              return (
                <div key={index} className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden backdrop-blur-md transition-all hover:shadow-md">
                  {/* Course Header Bar */}
                  <div 
                    className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedCourse(isExpanded ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <FileQuestion size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                            {group.course.courseCode}
                          </span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            {group.quizzes.length} Quizzes
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{group.course.title}</h3>
                      </div>
                    </div>
                    
                    <div className={`text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={24} />
                    </div>
                  </div>

                  {/* Collapsible Content Area */}
                  <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-slate-50 border-t border-slate-100`}>
                    <div className="p-6 sm:p-8">
                      <div className="grid gap-6 md:grid-cols-2">
                        {group.quizzes.map((quiz) => {
                          const status = getQuizStatus(quiz.startDate, quiz.endDate);
                          const isUpcoming = status === 'UPCOMING';
                          const isExpired = status === 'EXPIRED';

                          return (
                            <div key={quiz._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <h3 className="text-xl font-extrabold text-slate-900">{quiz.title}</h3>
                                {isUpcoming && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase tracking-widest">
                                    Upcoming
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase tracking-widest">
                                    Expired
                                  </span>
                                )}
                                {!isUpcoming && !isExpired && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                                    Live
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex-1">
                                {quiz.questions.length} Questions
                              </p>
                              
                              <div className="space-y-4 mt-auto">
                                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                                  <span>Total Time: {quiz.timeLimit || 15} mins</span>
                                  <span>Attempts: {quiz.attemptsMade || 0} / {quiz.allowedAttempts || 1}</span>
                                </div>

                                {quiz.attemptsMade > 0 && (
                                  <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 flex justify-between">
                                    <span>Best Score so far:</span>
                                    <span className="font-extrabold text-slate-900">{quiz.marksObtained} / {quiz.totalMarks}</span>
                                  </div>
                                )}

                                {(quiz.startDate || quiz.endDate) && (
                                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-xs font-semibold text-slate-600 space-y-1.5 shadow-sm">
                                    {quiz.startDate && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-400 font-bold">Starts:</span>
                                        <span className="font-extrabold text-slate-700">{formatPkt(quiz.startDate)}</span>
                                      </div>
                                    )}
                                    {quiz.endDate && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-400 font-bold">Ends:</span>
                                        <span className="font-extrabold text-slate-700">{formatPkt(quiz.endDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {(() => {
                                  const hasAttempted = (quiz.attemptsMade > 0 || quiz.isAttempted);

                                  if (quiz.isAttempted) {
                                    return (
                                      <div className="space-y-2">
                                        <div className="w-full flex items-center justify-center bg-slate-100 border border-slate-200 py-2.5 rounded-2xl font-bold text-slate-500 text-xs">
                                          <CheckCircle2 size={16} className="mr-1.5 text-slate-400" /> Max Attempts Reached
                                        </div>
                                        <button 
                                          onClick={() => openReview(quiz._id)}
                                          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold shadow-md transition-all hover:-translate-y-0.5 text-xs"
                                        >
                                          <Eye size={16} /> View Result
                                        </button>
                                      </div>
                                    );
                                  }

                                  if (isUpcoming) {
                                    return (
                                      <div className="w-full text-center bg-amber-50/50 border border-amber-200/60 py-3.5 rounded-2xl font-bold text-amber-700 text-xs">
                                        Scheduled: Starts {formatPkt(quiz.startDate)}
                                      </div>
                                    );
                                  }

                                  if (isExpired) {
                                    return (
                                      <div className="space-y-2">
                                        <div className="w-full text-center bg-rose-50/50 border border-rose-200/60 py-2.5 rounded-2xl font-bold text-rose-700 text-xs">
                                          Closed: Ended on {formatPkt(quiz.endDate)}
                                        </div>
                                        {hasAttempted && (
                                          <button 
                                            onClick={() => openReview(quiz._id)}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold shadow-md transition-all hover:-translate-y-0.5 text-xs"
                                          >
                                            <Eye size={16} /> View Result
                                          </button>
                                        )}
                                      </div>
                                    );
                                  }

                                  // Status is LIVE with attempts remaining
                                  if (hasAttempted) {
                                    return (
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <button 
                                          onClick={() => openReview(quiz._id)}
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-bold transition-all text-xs border border-slate-200"
                                        >
                                          <Eye size={15} /> View Result
                                        </button>
                                        <button 
                                          onClick={() => startQuiz(quiz)}
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl font-bold shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 text-xs"
                                        >
                                          Re-attempt Quiz <ChevronRight size={15} />
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <button 
                                      onClick={() => startQuiz(quiz)}
                                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 text-sm"
                                    >
                                      Start Quiz <ChevronRight size={18} />
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <QuizReview isOpen={isReviewOpen} onClose={closeReview} quizId={reviewQuizId} />
      </div>
    );
  }


  if (quizState === 'FINISHED') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in-up">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 max-w-lg text-center shadow-xl">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Quiz Completed</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your answers have been securely submitted to the faculty for automated grading. Results will be available in your transcripts soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {activeQuiz && (
              <button 
                onClick={() => {
                  const qId = activeQuiz._id;
                  setQuizState('IDLE');
                  openReview(qId);
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 w-full"
              >
                <Eye size={18} /> View Result Review
              </button>
            )}
            <button 
              onClick={() => setQuizState('IDLE')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all w-full"
            >
              Return to Assessments
            </button>
          </div>
          <QuizReview isOpen={isReviewOpen} onClose={closeReview} quizId={reviewQuizId} />
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ STATE
  const currentQuestion = activeQuiz?.questions?.[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-slate-600 font-semibold">Question not found or quiz is empty.</p>
        <button
          type="button"
          onClick={() => setQuizState('IDLE')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">

      {/* Header & Timer */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{activeQuiz.title}</h2>
          <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-bold mt-1">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold border shadow-sm transition-colors ${timeLeft <= 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-700'}`}>
          <Clock size={18} />
          <span className="text-base sm:text-lg font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Submit Error Banner with Retry */}
      {submitError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span>{submitError}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={submitQuizFinal}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors"
            >
              {submitting ? 'Retrying...' : 'Retry Submit'}
            </button>
            <button
              type="button"
              onClick={() => setQuizState('IDLE')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Return to Quizzes
            </button>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm mb-6">
        <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
          {currentQuestion.questionText}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedAnswers[currentQuestionIndex] === opt;
          return (
            <button
              type="button"
              key={idx}
              disabled={submitting}
              onClick={() => handleOptionSelect(opt)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-semibold ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${
                  isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                }`}>
                  {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                </div>
                {opt}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Controls with Previous & Next/Submit buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button 
          type="button"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0 || submitting}
          className="flex items-center gap-1.5 px-6 py-3.5 rounded-2xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <button 
          type="button"
          onClick={handleNextQuestion}
          disabled={submitting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Submitting Exam...
            </>
          ) : currentQuestionIndex === activeQuiz.questions.length - 1 ? (
            <>Submit Exam <ChevronRight size={18} /></>
          ) : (
            <>Next Question <ChevronRight size={18} /></>
          )}
        </button>
      </div>
      
      {/* Visual Progress Bar */}
      <div className="mt-12 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
          style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default OnlineQuiz;
