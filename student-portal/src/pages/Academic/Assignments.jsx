import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Clock, CheckCircle2, ChevronRight, XOctagon, Trophy, FileQuestion } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const Assignments = ({ courseId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quizState, setQuizState] = useState('listing'); // 'listing', 'running', 'terminated', 'completed'
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);

  const timerRef = useRef(null);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/portal/quizzes?courseId=${courseId}` : '/portal/quizzes';
      const response = await api.get(url);
      if (Array.isArray(response.data)) {
        setQuizzes(response.data);
      }
    } catch (err) {
      setError('Failed to load active quizzes and assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizState === 'running') {
        clearInterval(timerRef.current);
        setQuizState('terminated');
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [quizState]);

  useEffect(() => {
    if (quizState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [quizState, currentQuestionIndex, activeQuiz, selectedAnswers]); // Added selectedAnswers to deps to capture current state

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(10);
    setScore(0);
    setQuizState('running');
  };

  const handleOptionSelect = (option) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option
    }));
  };

  const calculateFinalScore = () => {
    let finalScore = 0;
    activeQuiz.questions.forEach((q, idx) => {
      // Use the functional state approach or ensure we have the latest selectedAnswers
      if (selectedAnswers[idx] === q.correctAnswer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
  };

  const handleNextQuestion = async () => {
    if (!activeQuiz) return;
    
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(10);
    } else {
      // Submit the quiz
      try {
        await api.post('/portal/quizzes/submit', {
          quizId: activeQuiz._id,
          answers: selectedAnswers
        });
        // Force refetch so listing state is up to date
        await fetchQuizzes();
      } catch (err) {
        console.error('Failed to submit quiz:', err);
      }
      setQuizState('completed');
    }
  };

  // Safe score calculation for render
  const getCalculatedScore = () => {
    if (!activeQuiz) return 0;
    let finalScore = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        finalScore += 1;
      }
    });
    return finalScore;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (quizState === 'listing') {
    return (
      <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Academic</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Assignments & Quizzes</h2>
          <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
            Select an active assessment to begin. Note: Strict anti-cheat monitoring is enabled. Navigating away from this tab will instantly terminate your attempt.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/80 backdrop-blur-md border border-slate-200 rounded-[32px] flex flex-col items-center justify-center shadow-sm">
              <div className="h-20 w-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <FileQuestion size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No active assignments or quizzes at the moment</h3>
              <p className="text-slate-500 max-w-md">There are no assessments currently scheduled for your faculty. Please check back later.</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <article key={quiz._id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md flex flex-col">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400 mb-3">{quiz.faculty}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900">{quiz.title}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-100">
                    <FileQuestion size={16} className="text-emerald-600" /> {quiz.questions.length} Questions
                  </div>
                </div>
                
                {quiz.isAttempted ? (
                  <div className="mt-auto w-full bg-slate-100 text-slate-500 py-4 rounded-3xl text-center font-bold shadow-inner">
                    ✅ Completed | Score: {quiz.marksObtained}/{quiz.totalMarks}
                  </div>
                ) : (
                  <button 
                    onClick={() => startQuiz(quiz)}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-6 py-4 rounded-3xl font-bold transition-all duration-300 hover:-translate-y-0.5 shadow-md"
                  >
                    Start Quiz <ChevronRight size={18} />
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    );
  }

  if (quizState === 'terminated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in-up">
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-8 md:p-12 max-w-lg text-center shadow-2xl shadow-red-500/20">
          <div className="h-24 w-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <XOctagon size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Quiz Terminated</h2>
          <p className="text-slate-700 text-lg mb-8 leading-relaxed font-medium">
            Tab switching or application minimizing detected. Your session has been locked.
          </p>
          <div className="mb-8 p-4 bg-white rounded-2xl border border-red-100">
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-1">Final Score</p>
            <p className="text-4xl font-black text-red-600">0</p>
          </div>
          <button 
            onClick={() => { setQuizState('listing'); navigate('/'); }}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all w-full text-lg shadow-lg hover:shadow-red-600/30"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'completed') {
    const finalScore = getCalculatedScore();
    const percentage = Math.round((finalScore / activeQuiz.questions.length) * 100);
    const passed = percentage >= 50;

    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in-up">
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 max-w-lg text-center shadow-xl w-full">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <Trophy size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Quiz Completed</h2>
          <p className="text-slate-600 mb-8 leading-relaxed text-lg">
            Your answers have been securely submitted.
          </p>
          
          <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Score</p>
              <p className={`text-4xl font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {finalScore} <span className="text-xl text-slate-400 font-bold">/ {activeQuiz.questions.length}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Accuracy</p>
              <p className={`text-4xl font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {percentage}%
              </p>
            </div>
          </div>

          <button 
            onClick={() => setQuizState('listing')}
            className="px-8 py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-full font-bold transition-all w-full text-lg shadow-lg hover:-translate-y-1"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  // running STATE
  const currentQuestion = activeQuiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in-up">
      {/* Header & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{activeQuiz.title}</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-bold mt-2">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </p>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-3 rounded-full font-extrabold border shadow-sm transition-colors ${timeLeft <= 3 ? 'bg-red-50 border-red-200 text-red-600 shadow-red-100' : 'bg-white border-slate-200 text-slate-700'}`}>
          <Clock size={20} className={timeLeft <= 3 ? 'animate-pulse' : ''} />
          <span className="text-xl w-8 text-center">{timeLeft}s</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200 shadow-sm mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
          {currentQuestion.questionText}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedAnswers[currentQuestionIndex] === opt;
          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(opt)}
              className={`w-full text-left p-6 rounded-[24px] border-2 transition-all duration-300 font-semibold text-lg ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-md translate-x-2' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                }`}>
                  {isSelected && <div className="h-3 w-3 bg-white rounded-full" />}
                </div>
                {opt}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="mt-10 flex justify-end">
        <button 
          onClick={handleNextQuestion}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-200 transition-all duration-300 hover:-translate-y-1 text-lg"
        >
          {currentQuestionIndex === activeQuiz.questions.length - 1 ? 'Submit Exam' : 'Next Question'} <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Visual Progress Bar */}
      <div className="mt-12 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out" 
          style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Assignments;
