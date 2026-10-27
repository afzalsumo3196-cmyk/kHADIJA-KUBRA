import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, Play, Calendar, Clock, Users, ArrowRight, CheckCircle2, 
  XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Check, Square, X
} from 'lucide-react';
import api from '../../api/axios';

const TeacherLiveQuestions = () => {
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questionsList, setQuestionsList] = useState(['']);
  const [durationValue, setDurationValue] = useState(2);
  const [durationUnit, setDurationUnit] = useState('Minutes');
  const [publishType, setPublishType] = useState('now');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Grading states
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState(null);
  const [gradingMarks, setGradingMarks] = useState({ obtained: '', total: '10' });
  const [savingGrade, setSavingGrade] = useState(false);

  // Timer tick trigger for remaining time in active questions list
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedStudentSubmission) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedStudentSubmission]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, questionsRes] = await Promise.all([
        api.get('/teacher/courses'),
        api.get('/teacher/live-questions')
      ]);

      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
      if (questionsRes.data.success) setQuestions(questionsRes.data.questions);
    } catch (err) {
      console.error('Error fetching live questions data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/teacher/live-questions');
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch (err) {
      console.error('Error refetching questions:', err);
    }
  };

  const handleAddQuestionField = () => {
    setQuestionsList(prev => [...prev, '']);
  };

  const handleRemoveQuestionField = (index) => {
    if (questionsList.length === 1) return;
    setQuestionsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index, value) => {
    setQuestionsList(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const validQuestions = questionsList.filter(q => q.trim() !== '');
    if (!selectedCourse || validQuestions.length === 0 || !durationValue) {
      setMessage({ type: 'error', text: 'Please fill in all required fields (select course, set duration, and add at least one question).' });
      return;
    }

    if (publishType === 'scheduled' && !scheduledTime) {
      setMessage({ type: 'error', text: 'Please select a scheduled start time.' });
      return;
    }

    let finalDuration = Number(durationValue);
    if (durationUnit === 'Seconds') finalDuration = finalDuration / 60;
    else if (durationUnit === 'Hours') finalDuration = finalDuration * 60;
    else if (durationUnit === 'Days') finalDuration = finalDuration * 60 * 24;

    setPublishing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/teacher/live-questions', {
        courseId: selectedCourse,
        questions: validQuestions,
        duration: finalDuration,
        publishType,
        scheduledTime: publishType === 'scheduled' ? new Date(scheduledTime).toISOString() : null
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: `Live Question session with ${validQuestions.length} question(s) published successfully!` });
        // Reset form
        setQuestionsList(['']);
        setPublishType('now');
        setScheduledTime('');
        fetchQuestions();
      }
    } catch (err) {
      console.error('Publish Error:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to publish live question.' 
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleEndQuestion = async (qId) => {
    try {
      const res = await api.put(`/teacher/live-questions/${qId}/end`);
      if (res.data.success) {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error ending question:', err);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to permanently delete this live session? All student submissions for it will be lost.")) {
      return;
    }

    try {
      const res = await api.delete(`/teacher/live-questions/${qId}`);
      if (res.data.success) {
        alert('Live question session deleted successfully.');
        fetchQuestions();
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      alert(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudentSubmission) return;
    
    const { questionId, student } = selectedStudentSubmission;
    const { obtained, total } = gradingMarks;

    if (obtained === '' || total === '') {
      alert('Please enter both obtained marks and total marks.');
      return;
    }

    const obtainedNum = Number(obtained);
    const totalNum = Number(total);

    if (isNaN(obtainedNum) || isNaN(totalNum)) {
      alert('Marks must be valid numbers.');
      return;
    }

    if (obtainedNum < 0) {
      alert('Obtained marks cannot be negative.');
      return;
    }

    if (obtainedNum > totalNum) {
      alert('Obtained marks cannot be greater than total marks.');
      return;
    }

    setSavingGrade(true);
    try {
      const res = await api.put(`/teacher/live-questions/${questionId}/grade`, {
        studentId: student._id,
        obtainedMarks: obtainedNum,
        totalMarks: totalNum
      });

      if (res.data.success) {
        await fetchQuestions();
        setSelectedStudentSubmission(prev => ({
          ...prev,
          obtainedMarks: obtainedNum,
          totalMarks: totalNum,
          gradedAt: new Date()
        }));
        alert('Marks graded successfully!');
      }
    } catch (err) {
      console.error('Error grading student answers:', err);
      alert(err.response?.data?.message || 'Failed to grade submission.');
    } finally {
      setSavingGrade(false);
    }
  };

  // Helper to format remaining time
  const getRemainingTime = (endAtStr, status) => {
    if (status === 'ended') return 'Ended';
    const endAt = new Date(endAtStr).getTime();
    const now = Date.now();
    const diff = endAt - now;

    if (diff <= 0) return 'Expired';

    const min = Math.floor(diff / (60 * 1000));
    const sec = Math.floor((diff % (60 * 1000)) / 1000);

    return `${min}:${sec < 10 ? '0' : ''}${sec} min left`;
  };

  const formatDurationDisplay = (dur) => {
    if (dur < 1) return `${Math.round(dur * 60)} sec`;
    if (dur >= 1440) return `${Math.round(dur / 1440)} day${dur >= 2880 ? 's' : ''}`;
    if (dur >= 60 && dur % 60 === 0) return `${Math.round(dur / 60)} hr${dur >= 120 ? 's' : ''}`;
    return `${Math.round(dur * 100) / 100} min`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-600 font-bold">Interactions</p>
        <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Live Questions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create and publish live interactive questions for your courses. Check student submissions and grade their work in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Create Live Question Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <HelpCircle size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Create Live Session</h3>
          </div>

          {message.text && (
            <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-semibold ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-5">
            
            {/* Select Course */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Select Course</label>
              <select 
                value={selectedCourse} 
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all font-medium text-slate-700"
                required
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.courseCode}) - {c.classTime}</option>
                ))}
              </select>
            </div>

            {/* Questions Textareas list */}
            <div className="space-y-3.5">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400 block">Live Questions</label>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {questionsList.map((qText, index) => (
                  <div key={index} className="flex gap-2 items-start border-l-2 border-indigo-100 pl-3">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question #{index + 1}</span>
                      <textarea 
                        value={qText}
                        onChange={e => handleQuestionTextChange(index, e.target.value)}
                        placeholder={`Type question #${index + 1}...`}
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-all text-slate-700"
                        required
                      />
                    </div>
                    {questionsList.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveQuestionField(index)}
                        className="mt-6 text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 border border-red-100 hover:bg-red-100/50 p-2 rounded-xl transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={handleAddQuestionField}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/60 py-2.5 rounded-xl w-full flex items-center justify-center gap-1 transition-all"
              >
                + Add Another Question
              </button>
            </div>

            {/* Set Duration */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Timer Limit</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  min="1"
                  step="any"
                  value={durationValue}
                  onChange={e => setDurationValue(e.target.value)}
                  className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all font-medium text-slate-700"
                  placeholder="e.g. 2"
                  required
                />
                <select 
                  value={durationUnit} 
                  onChange={e => setDurationUnit(e.target.value)}
                  className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all font-medium text-slate-700"
                >
                  <option value="Seconds">Seconds</option>
                  <option value="Minutes">Minutes</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                </select>
              </div>
            </div>

            {/* Decide Timing (Start Now / Schedule) */}
            <div className="space-y-2.5">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400 block">Publish Scheduling</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPublishType('now')}
                  className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    publishType === 'now'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Play size={14} /> Start Now
                </button>
                <button
                  type="button"
                  onClick={() => setPublishType('scheduled')}
                  className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    publishType === 'scheduled'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Calendar size={14} /> Schedule Later
                </button>
              </div>
            </div>

            {/* Schedule time input */}
            {publishType === 'scheduled' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Scheduled Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all text-slate-700"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2 disabled:opacity-65"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Publish Session
            </button>

          </form>
        </div>

        {/* Right Side: Published Question History & Answers */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-slate-400" /> History & Submissions
            </h3>
            <button 
              onClick={fetchQuestions}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-xl transition-all"
            >
              Refresh Logs
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
              <HelpCircle size={44} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">No Questions Published</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Any live questions you create and publish will appear here, along with their live submissions count.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const isExpanded = expandedQuestion === q._id;
                const activeTimeRemaining = q.status === 'active' ? getRemainingTime(q.endAt, q.status) : '';
                const displayQuestions = (q.questions && q.questions.length > 0) ? q.questions : [q.questionText || ''];
                
                return (
                  <div key={q._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Header Row */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-wider">
                            {q.course?.courseCode || 'Course'}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            {q.course?.title}
                          </span>
                        </div>
                        
                        {/* Questions list */}
                        <div className="space-y-1.5 pl-1.5 border-l-2 border-slate-200">
                          {displayQuestions.map((quesText, idx) => (
                            <p key={idx} className="text-slate-800 font-bold text-sm leading-relaxed">
                              <span className="text-slate-400 text-xs font-bold mr-1.5">Q{idx + 1}.</span>
                              {quesText}
                            </p>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> Limit: {formatDurationDisplay(q.duration)}
                          </span>
                          {q.publishType === 'scheduled' && (
                            <span className="flex items-center gap-1.5 text-indigo-600">
                              <Calendar size={13} /> Scheduled: {new Date(q.scheduledTime).toLocaleString()}
                            </span>
                          )}
                          {q.publishedAt && (
                            <span className="flex items-center gap-1.5">
                              <Play size={13} /> Published: {new Date(q.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          {q.status === 'active' && (
                            <span className="animate-pulse flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              ● Live ({activeTimeRemaining})
                            </span>
                          )}
                          {q.status === 'draft' && q.publishType === 'scheduled' && (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                              📅 Scheduled
                            </span>
                          )}
                          {q.status === 'ended' && (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                              🔒 Ended
                            </span>
                          )}
                        </div>

                        {/* Submission Count button */}
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : q._id)}
                          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          <Users size={14} />
                          {q.answers?.length || 0} Submissions
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {q.status === 'active' && (
                            <button
                              onClick={() => handleEndQuestion(q._id)}
                              className="text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-xl hover:bg-amber-100 transition-colors"
                            >
                              End Question
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuestion(q._id)}
                            className="text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded view for Student Answers List */}
                    {isExpanded && (
                      <div className="bg-white border-t border-slate-100 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Submissions</h5>
                          <span className="text-xs text-slate-500 font-semibold">{q.answers?.length || 0} answers collected</span>
                        </div>

                        {(!q.answers || q.answers.length === 0) ? (
                          <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-2xl">
                            <Users size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-500">No submissions yet.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50">
                                  <th className="py-3 px-4">Student Name</th>
                                  <th className="py-3 px-4">Reg No</th>
                                  <th className="py-3 px-4">Submitted At</th>
                                  <th className="py-3 px-4">Grade / Marks Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {q.answers.map((ans, idx) => {
                                  const isGraded = ans.obtainedMarks !== undefined && ans.totalMarks !== undefined;
                                  return (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-white transition-colors">
                                      <td className="py-3.5 px-4 font-bold text-slate-800">{ans.student?.name || 'Unknown Student'}</td>
                                      <td className="py-3.5 px-4 text-slate-500 font-semibold">{ans.student?.regNo || '—'}</td>
                                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                                        {new Date(ans.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td className="py-3.5 px-4">
                                        {isGraded ? (
                                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-lg">
                                            {ans.obtainedMarks} / {ans.totalMarks} Marks
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-0.5 rounded-lg">
                                            Ungraded
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-right">
                                        <button
                                          onClick={() => {
                                            setSelectedStudentSubmission({
                                              ...ans,
                                              questionId: q._id,
                                              questionsList: displayQuestions
                                            });
                                            setGradingMarks({
                                              obtained: ans.obtainedMarks !== undefined ? ans.obtainedMarks : '',
                                              total: ans.totalMarks !== undefined ? ans.totalMarks : '10'
                                            });
                                          }}
                                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-750 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl transition-all"
                                        >
                                          View details & Grade
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

          {/* Centered Premium Modal for Viewing Student Submissions and Grading */}
      {selectedStudentSubmission && createPortal(
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-lg z-[9999] flex items-center justify-center p-4 transition-all"
          onClick={() => setSelectedStudentSubmission(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Close Button */}
            <button 
              onClick={() => setSelectedStudentSubmission(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Submission Details</span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {selectedStudentSubmission.student?.name}
              </h3>
              <div className="flex gap-4 text-xs font-semibold text-slate-400">
                <span>Reg No: {selectedStudentSubmission.student?.regNo}</span>
                <span>•</span>
                <span>Submitted: {new Date(selectedStudentSubmission.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Questions & Answers details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Answers</h4>
              
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {selectedStudentSubmission.questionsList.map((quesText, qIdx) => {
                  const stuAns = (selectedStudentSubmission.answerTexts && selectedStudentSubmission.answerTexts.length > qIdx)
                    ? selectedStudentSubmission.answerTexts[qIdx]
                    : (qIdx === 0 ? selectedStudentSubmission.answerText : '');

                  return (
                    <div key={qIdx} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                      <p className="font-extrabold text-slate-800 text-sm">
                        <span className="text-indigo-600 mr-1.5">Q{qIdx + 1}:</span>
                        {quesText}
                      </p>
                      <p className="text-xs text-slate-650 bg-white border border-slate-100 p-3 rounded-xl italic font-semibold leading-relaxed break-words whitespace-pre-wrap">
                        {stuAns || <span className="text-slate-400 font-normal italic">(No Answer Submitted)</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <Check className="text-emerald-500 font-bold" size={18} />
                <h4 className="text-sm font-bold text-slate-900">Grade This Submission</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Obtained Marks</label>
                  <input
                    type="number"
                    value={gradingMarks.obtained}
                    onChange={e => setGradingMarks(prev => ({ ...prev, obtained: e.target.value }))}
                    placeholder="e.g. 8"
                    step="any"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 rounded-2xl text-sm focus:outline-none transition-all font-semibold text-slate-850"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Marks</label>
                  <input
                    type="number"
                    value={gradingMarks.total}
                    onChange={e => setGradingMarks(prev => ({ ...prev, total: e.target.value }))}
                    placeholder="e.g. 10"
                    step="any"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 rounded-2xl text-sm focus:outline-none transition-all font-semibold text-slate-850"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-400 font-semibold">
                  {selectedStudentSubmission.gradedAt ? (
                    <span className="text-emerald-600 font-bold">
                      ✓ Graded on {new Date(selectedStudentSubmission.gradedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Not graded yet.</span>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-6 py-3 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-65 hover:-translate-y-0.5"
                >
                  {savingGrade ? <Loader2 size={14} className="animate-spin" /> : 'Save Grade'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeacherLiveQuestions;
