import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CalendarCheck, 
  Award, 
  BellRing, 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  FileText,
  HelpCircle
} from 'lucide-react';
import api from '../../api/axios';

const LiveQuestionCard = ({ question, answerTexts, setAnswerTexts, fetchActiveQuestion, submitSuccess, setSubmitSuccess }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitTriggered = useRef(false);

  useEffect(() => {
    autoSubmitTriggered.current = false;
    
    const calculateTimeLeft = () => {
      const end = new Date(question.endAt).getTime();
      const diff = end - Date.now();
      return Math.max(0, diff);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0 && !question.hasSubmitted && !autoSubmitTriggered.current) {
        autoSubmitTriggered.current = true;
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [question]);

  const handleAutoSubmit = async () => {
    setSubmitting(true);
    try {
      const finalAnswers = answerTexts.map((ans, idx) => ans.trim() || `(No answer submitted - time expired for Q${idx + 1})`);
      await api.post('/portal/live-questions/submit', {
        questionId: question._id,
        answerTexts: finalAnswers
      });
      setSubmitSuccess(true);
      fetchActiveQuestion();
    } catch (err) {
      console.error('Auto-submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const hasAnyAnswer = answerTexts.some(ans => ans.trim() !== '');
    if (!hasAnyAnswer || submitting || submitSuccess) return;

    setSubmitting(true);
    try {
      const res = await api.post('/portal/live-questions/submit', {
        questionId: question._id,
        answerTexts: answerTexts.map(ans => ans.trim())
      });
      if (res.data.success) {
        setSubmitSuccess(true);
        fetchActiveQuestion();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextChange = (index, value) => {
    setAnswerTexts(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isTimeUp = timeLeft <= 0;
  const displayQuestions = (question.questions && question.questions.length > 0)
    ? question.questions
    : [question.questionText || ''];

  const hasAnyAnswer = answerTexts.some(ans => ans.trim() !== '');

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 text-slate-800 shadow-xl shadow-slate-100/50 animate-pulse-slow">
      <div className="absolute top-[-30%] right-[-10%] w-80 h-80 bg-indigo-50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-emerald-50/50 rounded-full blur-3xl"></div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
              Live Classroom Session
            </span>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg">
              {question.course?.title} ({question.course?.courseCode})
            </span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono text-base font-extrabold ${
            timeLeft < 30 * 1000 
              ? 'bg-red-50 border-red-200 text-red-600 animate-bounce' 
              : 'bg-indigo-50/80 border-indigo-100 text-indigo-600'
          }`}>
            <Clock size={16} />
            <span>{isTimeUp ? '0:00' : formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Questions from teacher ({question.teacher?.name}):</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {displayQuestions.map((quesText, index) => (
              <div key={index} className="space-y-2 border-l-2 border-indigo-500/35 pl-3.5">
                <p className="text-base font-extrabold text-slate-800 leading-relaxed tracking-wide">
                  <span className="text-slate-400 font-bold text-sm mr-1.5">Q{index + 1}.</span>
                  {quesText}
                </p>
                <textarea
                  value={answerTexts[index] || ''}
                  onChange={e => handleTextChange(index, e.target.value)}
                  disabled={submitting || submitSuccess || isTimeUp}
                  placeholder={isTimeUp ? "Time's up! Answers have been locked." : "Type your answer here..."}
                  rows={2}
                  className={`w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-850 placeholder-slate-400 resize-none ${
                    submitSuccess || isTimeUp
                      ? 'border-slate-200 cursor-not-allowed opacity-75 bg-slate-50'
                      : 'border-slate-200'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-semibold leading-none">
              {submitSuccess 
                ? '✓ All answers successfully recorded.' 
                : isTimeUp 
                  ? '⚠️ Time limit reached. Auto-submitted.' 
                  : 'Submit before the timer runs out.'}
            </p>
            
            <button
              type="submit"
              disabled={submitting || submitSuccess || isTimeUp || !hasAnyAnswer}
              className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-lg uppercase tracking-wider transition-all flex items-center gap-2 ${
                submitSuccess 
                  ? 'bg-emerald-600 border border-emerald-500 text-white shadow-emerald-950/20' 
                  : isTimeUp 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none' 
                    : !hasAnyAnswer
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-950/20 hover:-translate-y-0.5'
              }`}
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : submitSuccess ? (
                <>✓ Submitted</>
              ) : isTimeUp ? (
                <>🔒 Closed</>
              ) : (
                <>Submit Answers</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [courseGrades, setCourseGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Question States
  // [LIVE_QUESTIONS_DISABLED] const [activeQuestion, setActiveQuestion] = useState(null);
  // [LIVE_QUESTIONS_DISABLED] const [answerTexts, setAnswerTexts] = useState([]);
  // [LIVE_QUESTIONS_DISABLED] const [submitSuccess, setSubmitSuccess] = useState(false);
  // [LIVE_QUESTIONS_DISABLED] const activeQuestionIdRef = useRef(null);

  /* [LIVE_QUESTIONS_DISABLED]
  const fetchActiveQuestion = async () => {
    try {
      const res = await api.get('/portal/live-questions/active');
      if (res.data.success && res.data.questions && res.data.questions.length > 0) {
        const question = res.data.questions[0];
        setActiveQuestion(question);

        const count = (question.questions && question.questions.length > 0) 
            ? question.questions.length 
            : 1;

        if (activeQuestionIdRef.current !== question._id) {
          activeQuestionIdRef.current = question._id;
          if (question.hasSubmitted) {
            setAnswerTexts(question.submittedAnswerTexts && question.submittedAnswerTexts.length > 0 
                ? question.submittedAnswerTexts 
                : [question.submittedAnswerText || '']);
          } else {
            setAnswerTexts(Array(count).fill(''));
          }
          setSubmitSuccess(question.hasSubmitted);
        } else if (question.hasSubmitted) {
          setSubmitSuccess(true);
          setAnswerTexts(question.submittedAnswerTexts && question.submittedAnswerTexts.length > 0 
              ? question.submittedAnswerTexts 
              : [question.submittedAnswerText || '']);
        }
      } else {
        setActiveQuestion(null);
        activeQuestionIdRef.current = null;
        setAnswerTexts([]);
        setSubmitSuccess(false);
      }
    } catch (err) {
      console.error('Error fetching active live question:', err);
    }
  };

  useEffect(() => {
    fetchActiveQuestion();
    const pollInterval = setInterval(fetchActiveQuestion, 10000);
    return () => clearInterval(pollInterval);
  }, []);
  */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all endpoints concurrently
        const [profileRes, coursesRes, noticesRes, attendanceRes, academicRecordRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/portal/courses'),
          api.get('/portal/notices'),
          api.get('/portal/attendance'),
          api.get('/portal/academic-record') // Fetch overall course performance
        ]);

        if (profileRes.data.success) setProfile(profileRes.data.student);
        if (coursesRes.data.success) setCourses(coursesRes.data.courses);
        if (noticesRes.data.success) setNotices(noticesRes.data.notices);
        if (attendanceRes.data.success) setAttendance(attendanceRes.data);
        
        if (academicRecordRes.data.success) {
           // Flatten the semester courses into a single array for the recent performance widget
           const allCourses = [];
           academicRecordRes.data.semesterResults?.forEach(sem => {
              allCourses.push(...sem.courses);
           });
           setCourseGrades(allCourses);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-emerald-200 border-b-transparent animate-spin-reverse"></div>
        </div>
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Student Dashboard...</p>
        <style jsx="true">{`
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 text-red-600 px-6 py-5 rounded-2xl border border-red-100 shadow-sm max-w-md text-center">
          <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* [LIVE_QUESTIONS_DISABLED]
      {activeQuestion && (
        <LiveQuestionCard 
          question={activeQuestion}
          answerTexts={answerTexts}
          setAnswerTexts={setAnswerTexts}
          fetchActiveQuestion={fetchActiveQuestion}
          submitSuccess={submitSuccess}
          setSubmitSuccess={setSubmitSuccess}
        />
      )}
      */}

      {/* 1. Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/10 bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-white shadow-xl shadow-emerald-950/10">
        {/* Background blobs for premium depth */}
        <div className="absolute top-[-30%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-emerald-500/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-50 backdrop-blur-md">
              Scholar Portal
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {getGreeting()}, {profile?.name || 'Student'}!
            </h1>
            <p className="mt-2 text-emerald-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Welcome back to your academic portal. Track your classes, attendance record, assignments, and institute notices.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5 bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Registration ID</span>
            <span className="text-xl font-extrabold tracking-wide">{profile?.regNo || '—'}</span>
            <span className="text-emerald-200 text-xs mt-1.5 font-bold uppercase bg-emerald-700/50 px-2 py-0.5 rounded-md">
              {profile?.faculty || 'Aalima'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Enrolled Courses */}
        <div 
          onClick={() => navigate('/courses')}
          className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <BookOpen size={22} />
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</h3>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{courses.length}</p>
          <span className="text-xs text-slate-400 font-medium block mt-1">Active class subjects</span>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div 
          onClick={() => navigate('/courses')}
          className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <CalendarCheck size={22} />
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</h3>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {attendance?.rate !== undefined ? `${attendance.rate}%` : `${profile?.attendanceRate || 0}%`}
          </p>
          <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${attendance?.rate || profile?.attendanceRate || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Academic GPA */}
        <div 
          onClick={() => navigate('/transcripts')}
          className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <GraduationCap size={22} />
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Academic CGPA</h3>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{profile?.cgpa !== undefined && profile?.cgpa !== null ? profile.cgpa.toFixed(2) : '0.00'}</p>
          <span className="text-xs text-slate-400 font-medium block mt-1">Excellent standing</span>
        </div>

        {/* Metric 4: Notices & Board */}
        <div 
          onClick={() => navigate('/notices')}
          className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <BellRing size={22} />
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Notice Board</h3>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{notices.length}</p>
          <span className="text-xs text-slate-400 font-medium block mt-1">Latest announcements</span>
        </div>
      </div>

      {/* 3. Main Dashboard Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Left Side: Weekly Timetable / Schedule */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enrolled Subjects & Timetable</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your schedule for classes throughout the week</p>
            </div>
            <button 
              onClick={() => navigate('/courses')} 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl transition-all hover:gap-1.5"
            >
              All Courses <ArrowRight size={14} />
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
              <BookOpen size={40} className="text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">No Active Courses Enrolled</h4>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                You do not have any courses assigned to your account yet. Contact the administrator to assign subjects.
              </p>
            </div>
          ) : (
            <div className="p-6 divide-y divide-slate-100 space-y-4">
              {courses.map((course, idx) => (
                <div 
                  key={course._id} 
                  onClick={() => navigate(`/courses/${course._id}`)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0 group cursor-pointer`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase rounded-md tracking-wider">
                        {course.courseCode}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">By {course.teacherName || 'Instructor TBA'}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors text-base">
                      {course.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right sm:text-left">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl">
                        <Clock size={13} className="text-slate-400" />
                        {course.classTime || 'TBA'}
                      </span>
                    </div>
                    <div className="min-w-[100px] text-right">
                      <span className="inline-block text-[11px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md bg-slate-50">
                        {course.classDays?.join(', ') || 'TBA'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Notice Board Snippet & Recent Performance */}
        <div className="space-y-6">
          
          {/* Recent Notices */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Latest Notices</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Stay updated with academic decisions</p>
              </div>
              <button 
                onClick={() => navigate('/notices')}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                View Notice Board
              </button>
            </div>

            <div className="space-y-3.5">
              {notices.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500">No recent notices found.</p>
                </div>
              ) : (
                notices.slice(0, 3).map((notice) => (
                  <div key={notice._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 hover:bg-slate-100/80 transition-colors">
                    <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold bg-emerald-50 text-emerald-600">
                      i
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{notice.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {new Date(notice.date || notice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Overall Course Marks</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Total grades in enrolled subjects</p>
              </div>
              <button 
                onClick={() => navigate('/transcripts')}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                View Transcripts
              </button>
            </div>

            <div className="space-y-3">
              {courseGrades.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                  <p className="text-xs font-extrabold text-slate-800">Perfect Standing</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">No overall course grades have been published yet.</p>
                </div>
              ) : (
                courseGrades.slice(0, 4).map((courseGrade, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{courseGrade.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{courseGrade.code}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className={`inline-block text-xs font-black bg-white px-2 py-0.5 rounded shadow-sm border ${courseGrade.percentage >= 80 ? 'text-emerald-600 border-emerald-100' : courseGrade.percentage >= 50 ? 'text-blue-600 border-blue-100' : 'text-red-500 border-red-100'}`}>
                        {courseGrade.percentage}%
                      </span>
                      <span className="inline-block text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                        {courseGrade.marksObtained}/{courseGrade.totalMarks}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
