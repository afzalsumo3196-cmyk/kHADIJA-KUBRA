import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Loader2, Save, AlertCircle, CheckCircle2, FileQuestion, Calendar, Edit2, X } from 'lucide-react';
import api from '../../api/axios';
import { formatPkt, utcToPktInputValue, pktInputValueToIso, getQuizStatus } from '../../utils/quizTime';

const ManageQuizzes = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  
  const [activeTab, setActiveTab] = useState('create');
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const [quizForm, setQuizForm] = useState({
    title: '',
    courseId: '',
    status: 'Active',
    timeLimit: 15,
    allowedAttempts: 1,
    startDate: '',
    endDate: ''
  });

  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  useEffect(() => {
    let ignore = false;
    const loadCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        if (!ignore && res.data.success) {
          setCourses(res.data.courses);
        }
      } catch {
        console.error('Failed to fetch courses');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    loadCourses();
    return () => {
      ignore = true;
    };
  }, []);

  const fetchQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const res = await api.get('/teacher/quizzes');
      if (res.data.success) {
        setQuizzes(res.data.quizzes);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const handleViewAttempts = async (quiz) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
    setAttemptsLoading(true);
    setAttempts([]);
    try {
      const res = await api.get(`/teacher/quizzes/${quiz._id}/attempts`);
      if (res.data.success) {
        setAttempts(res.data.attempts);
      }
    } catch (err) {
      console.error('Failed to fetch quiz attempts', err);
    } finally {
      setAttemptsLoading(false);
    }
  };
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await api.delete(`/teacher/quizzes/${quizId}`);
      if (res.data.success) {
        setFormStatus({ type: 'success', message: 'Quiz deleted successfully!' });
        fetchQuizzes(); // Refresh quiz list
      }
    } catch (err) {
      console.error(err);
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete quiz' });
    }
  };

  const handleEditClick = (quiz) => {
    setEditingQuizId(quiz._id);
    setQuizForm({
      title: quiz.title || '',
      courseId: quiz.course ? quiz.course._id : '',
      status: quiz.status || 'Active',
      timeLimit: quiz.timeLimit || 15,
      allowedAttempts: quiz.allowedAttempts || 1,
      startDate: utcToPktInputValue(quiz.startDate),
      endDate: utcToPktInputValue(quiz.endDate)
    });
    setQuestions(quiz.questions && quiz.questions.length > 0 ? quiz.questions : [{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingQuizId(null);
    setFormStatus({ type: '', message: '' });
    setQuizForm({ title: '', courseId: '', status: 'Active', timeLimit: 15, allowedAttempts: 1, startDate: '', endDate: '' });
    setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleQuizChange = (e) => {
    setQuizForm({ ...quizForm, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    const prevVal = newQuestions[qIndex].options[oIndex];
    newQuestions[qIndex].options[oIndex] = value;
    // Automatically keep correctAnswer updated only if this non-empty option was chosen as correct
    if (prevVal && prevVal.trim() !== '' && newQuestions[qIndex].correctAnswer === prevVal) {
      newQuestions[qIndex].correctAnswer = value;
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormStatus({ type: '', message: '' });

    if (!quizForm.courseId) {
      setFormStatus({ type: 'error', message: 'Please select a course.' });
      setSubmitLoading(false);
      return;
    }

    // Clean and validate questions
    const sanitizedQuestions = questions.map((q) => {
      const qText = (q.questionText || '').trim();
      const opts = (q.options || []).map(opt => (typeof opt === 'string' ? opt.trim() : ''));
      const cAns = (q.correctAnswer || '').trim();
      return {
        ...q,
        questionText: qText,
        options: opts,
        correctAnswer: cAns
      };
    });

    for (let i = 0; i < sanitizedQuestions.length; i++) {
      const q = sanitizedQuestions[i];
      if (!q.questionText) {
        setFormStatus({ type: 'error', message: `Question ${i + 1}: Question text cannot be empty.` });
        setSubmitLoading(false);
        return;
      }
      if (q.options.some(opt => !opt)) {
        setFormStatus({ type: 'error', message: `Question ${i + 1}: All 4 options must be filled.` });
        setSubmitLoading(false);
        return;
      }
      if (!q.correctAnswer) {
        setFormStatus({ type: 'error', message: `Question ${i + 1}: Please select the correct option.` });
        setSubmitLoading(false);
        return;
      }
      if (!q.options.includes(q.correctAnswer)) {
        setFormStatus({ type: 'error', message: `Question ${i + 1}: Correct answer must match one of the options.` });
        setSubmitLoading(false);
        return;
      }
    }

    // Validate and convert dates to UTC ISO
    const isoStart = quizForm.startDate ? pktInputValueToIso(quizForm.startDate) : null;
    const isoEnd = quizForm.endDate ? pktInputValueToIso(quizForm.endDate) : null;

    if (quizForm.startDate && !isoStart) {
      setFormStatus({ type: 'error', message: 'Invalid start date & time format.' });
      setSubmitLoading(false);
      return;
    }

    if (quizForm.endDate && !isoEnd) {
      setFormStatus({ type: 'error', message: 'Invalid end date & time format.' });
      setSubmitLoading(false);
      return;
    }

    if (isoStart && isoEnd && new Date(isoEnd).getTime() <= new Date(isoStart).getTime()) {
      setFormStatus({ type: 'error', message: 'End date & time must be after start date & time.' });
      setSubmitLoading(false);
      return;
    }

    const payload = {
      ...quizForm,
      startDate: isoStart,
      endDate: isoEnd,
      questions: sanitizedQuestions
    };

    try {
      let response;
      if (editingQuizId) {
        response = await api.put(`/teacher/quizzes/${editingQuizId}`, payload);
      } else {
        response = await api.post('/teacher/quizzes', payload);
      }

      if (response.data.success) {
        setFormStatus({ type: 'success', message: editingQuizId ? 'Quiz updated successfully!' : 'Quiz published successfully!' });
        
        // Reset form
        cancelEdit();
        fetchQuizzes(); // Refresh quiz list in background
      }
    } catch (err) {
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'Failed to publish quiz' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold">Assessment Management</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Online Quizzes</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Design interactive quizzes and view student attempts and scores.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Create Quiz
        </button>
        <button
          onClick={() => {
            setActiveTab('list');
            fetchQuizzes();
          }}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Quiz List & Attempts
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                {editingQuizId ? <Edit2 size={18} /> : <FileQuestion size={18} />} 
                {editingQuizId ? 'Edit Quiz Details' : 'Quiz Details'}
              </h3>
              {editingQuizId && (
                <button type="button" onClick={cancelEdit} className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <X size={14} /> Cancel Edit
                </button>
              )}
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course</label>
                  <select name="courseId" value={quizForm.courseId} onChange={handleQuizChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                    <option value="" disabled>Select Course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title} ({c.courseCode})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Quiz Title</label>
                  <input type="text" name="title" value={quizForm.title} onChange={handleQuizChange} required placeholder="e.g. Midterm Examination" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Total Quiz Time Limit (Minutes) — e.g. 15</label>
                  <input type="number" min="1" max="300" name="timeLimit" value={quizForm.timeLimit} onChange={handleQuizChange} required placeholder="e.g. 15" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Allowed Attempts</label>
                  <input type="number" min="1" max="100" name="allowedAttempts" value={quizForm.allowedAttempts} onChange={handleQuizChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>

              {/* Availability Window Section */}
              <div className="border-t border-slate-100 pt-5 mt-5">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" /> Availability & Scheduling Window
                </h4>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Start Date & Time</label>
                    <input type="datetime-local" name="startDate" value={quizForm.startDate} onChange={handleQuizChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">End Date & Time</label>
                    <input type="datetime-local" name="endDate" value={quizForm.endDate} onChange={handleQuizChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative group">
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-full">
                    <Trash2 size={18} />
                  </button>
                )}
                
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">{qIndex + 1}</div>
                  <h3 className="font-bold text-slate-900">Question Settings</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Question Text</label>
                    <textarea value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} required rows="2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"></textarea>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Option {String.fromCharCode(65 + oIndex)}</label>
                        <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1 text-emerald-600">Correct Answer</label>
                    <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} required className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm font-semibold text-emerald-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all">
                      <option value="">Select the correct option</option>
                      {q.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formStatus.message && (
            <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 ${
              formStatus.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {formStatus.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
              <span>{formStatus.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button type="button" onClick={addQuestion} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all">
              <Plus size={18} /> Add Next Question
            </button>
            
            <button type="submit" disabled={submitLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 text-lg">
              {submitLoading ? <Loader2 size={24} className="animate-spin" /> : <><Save size={24} /> {editingQuizId ? 'Update Quiz' : 'Publish Quiz'}</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {quizzesLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-[32px] shadow-sm">
              <FileQuestion size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No Published Quizzes</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                You have not published any quizzes yet. Switch to the "Create Quiz" tab to publish your first assessment.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                      {quiz.course?.courseCode || 'N/A'}
                    </span>
                    {(() => {
                      if (quiz.status === 'Inactive') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-slate-100 text-slate-500 border-slate-200">
                            Inactive
                          </span>
                        );
                      }
                      const scheduleStatus = getQuizStatus(quiz.startDate, quiz.endDate);
                      if (scheduleStatus === 'UPCOMING') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
                            Upcoming
                          </span>
                        );
                      }
                      if (scheduleStatus === 'EXPIRED') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-red-50 text-red-600 border-red-100">
                            Expired
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                          Live
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-6">{quiz.course?.title}</p>
                  
                  <div className="flex flex-col gap-1 border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <span>{quiz.questions.length} Questions</span>
                      <span className="text-indigo-600">{quiz.attemptCount || 0} Attempts</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                      <span>Total Time: {quiz.timeLimit || 15} Mins</span>
                      <span>Allowed Atts: {quiz.allowedAttempts || 1}</span>
                    </div>
                    {(quiz.startDate || quiz.endDate) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-left bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        {quiz.startDate && (
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Start:
                            </span>
                            <span className="text-slate-700 font-bold">{formatPkt(quiz.startDate)}</span>
                          </div>
                        )}
                        {quiz.endDate && (
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> End:
                            </span>
                            <span className="text-slate-700 font-bold">{formatPkt(quiz.endDate)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewAttempts(quiz)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                      >
                        View Attempts
                      </button>
                      <button
                        onClick={() => handleEditClick(quiz)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Edit Quiz"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attempts Modal Panel */}
      {isModalOpen && selectedQuiz && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                  {selectedQuiz.course?.courseCode} - Attempt Details
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedQuiz.title}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center border border-slate-200 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              {attemptsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={36} />
                  <p className="text-sm text-slate-500 font-medium">Loading attempts data...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-xl font-bold">
                    📝
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">No Attempts Recorded</h4>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                    No students have completed this assessment yet. Check back later once students start attempting the quiz.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 md:-mx-8">
                  <div className="inline-block min-w-full align-middle px-6 md:px-8 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 min-w-[800px]">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                          <th className="pb-4">Student Details</th>
                          <th className="pb-4">Registration No</th>
                          <th className="pb-4 text-center">Attempt</th>
                          <th className="pb-4 text-center">Score</th>
                          <th className="pb-4 text-center">Percentage</th>
                          <th className="pb-4 text-right">Attempt Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {attempts.map((attempt) => {
                          const percentage = Math.round((attempt.marksObtained / attempt.totalMarks) * 100);
                          return (
                            <tr key={attempt._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 font-bold text-slate-900">
                                {attempt.studentName}
                                <div className="text-xs text-slate-400 font-normal mt-0.5">{attempt.studentEmail}</div>
                              </td>
                              <td className="py-4 font-semibold text-slate-600">{attempt.studentId}</td>
                              <td className="py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  Attempt {attempt.attemptNo || 1}
                                  {attempt.isBest && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                                      Best
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="py-4 text-center font-extrabold text-slate-800">
                                {attempt.marksObtained} <span className="text-slate-400 font-normal">/ {attempt.totalMarks}</span>
                              </td>
                              <td className="py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  percentage >= 75 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : percentage >= 50 
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                      : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                  {percentage}%
                                </span>
                              </td>
                              <td className="py-4 text-right text-xs text-slate-700 font-semibold">
                                {formatPkt(attempt.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all text-sm shadow-sm"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageQuizzes;
