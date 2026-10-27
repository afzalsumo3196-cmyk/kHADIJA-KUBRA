import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2, Save, UserCheck, AlertCircle, CheckCircle2,
  Clock, BarChart3, AlertTriangle, XCircle, Check,
  GraduationCap, User, BookOpen, RefreshCw, X, CalendarCheck
} from 'lucide-react';
import api from '../../api/axios';

const TIME_SLOTS = [
  '08:00 AM - 09:30 AM',
  '09:30 AM - 11:00 AM',
  '11:00 AM - 12:30 PM',
  '12:30 PM - 02:00 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
];

// Helper to check if a custom classTime string matches a standard time slot (supports variations in text and format)
const isCourseInSlot = (classTime, slotStr) => {
  if (!classTime || !slotStr) return false;
  
  // 1. Exact match after simple normalization
  const norm = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/to/g, '-');
  if (norm(classTime) === norm(slotStr)) return true;
  
  // 2. Contains check (e.g. if slot is inside classTime)
  if (norm(classTime).includes(norm(slotStr)) || norm(slotStr).includes(norm(classTime))) return true;

  // 3. Time parser matching fallback (extract start hour/minutes)
  const parseTime = (str) => {
    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
    if (!match) return null;
    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
    }
    return hrs * 60 + mins;
  };

  const slotStart = parseTime(slotStr);
  const classStart = parseTime(classTime);
  if (slotStart !== null && classStart !== null) {
    // If start times match within a 45-minute window, count it as a match
    return Math.abs(slotStart - classStart) <= 45;
  }
  
  return false;
};

const StatusBadge = ({ status }) => {
  if (status === 'Present') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
      <Check size={11} strokeWidth={3} /> Present
    </span>
  );
  if (status === 'Late') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
      <Clock size={11} /> Late
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
      <XCircle size={11} /> Absent
    </span>
  );
};

// ─── DETAILED HISTORY MATRIX TABLE ────────────────────────────────────────────────
const DetailedHistoryTable = ({ date, courseId, selectedSlot }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await api.get(`/admin/detailed-attendance?date=${date}&courseId=${courseId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [date, courseId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!data || data.students.length === 0) return <div className="p-8 text-center text-slate-500">No student records found.</div>;

  const { students, timeSlots } = data;

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-bold">
            <th className="px-5 py-4 w-10 border-r border-slate-200">#</th>
            <th className="px-5 py-4 min-w-[200px] border-r border-slate-200">Student Name</th>
            <th className="px-5 py-4 min-w-[120px] border-r border-slate-200">Roll No</th>
            {timeSlots.filter(s => !selectedSlot || s === selectedSlot).map(slot => (
              <th key={slot} className="px-5 py-4 text-center min-w-[120px] border-r border-slate-200">{slot}</th>
            ))}
            <th className="px-5 py-4 min-w-[200px]">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((s, i) => (
            <tr key={s._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 text-sm text-slate-400 font-semibold border-r border-slate-100">{i + 1}</td>
              <td className="px-5 py-3 font-bold text-slate-900 border-r border-slate-100">{s.name}</td>
              <td className="px-5 py-3 text-sm text-slate-500 border-r border-slate-100">{s.regNo}</td>
              {timeSlots.filter(s => !selectedSlot || s === selectedSlot).map(slot => {
                const status = s.slots[slot];
                return (
                  <td key={slot} className="px-5 py-3 text-center border-r border-slate-100">
                    {status ? <StatusBadge status={status} /> : <span className="text-slate-300">—</span>}
                  </td>
                );
              })}
              <td className="px-5 py-3 text-sm text-slate-600 italic">{s.remarks || <span className="text-slate-300">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── STUDENT MONITOR: Live Dashboard ──────────────────────────────────────────
const StudentMonitor = () => {
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState({ cardIdx: null, slot: null });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setFetched(false);
    setExpandedSlot({ cardIdx: null, slot: null });
    try {
      const res = await api.get(`/admin/attendance-cards?date=${date}`);
      console.log("DEBUG: CARDS FROM BACKEND:", res.data.cards);
      setCards(res.data.cards || []);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Select Date</label>
            <input
              type="date" value={date}
              onChange={e => { setDate(e.target.value); setFetched(false); }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 transition-all"
            />
          </div>
          <button
            onClick={fetchCards}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Load Dashboard
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-500" size={40} /></div>}

      {fetched && !loading && (
        <>
          {cards.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
              <BarChart3 size={44} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700 text-lg">No Activity</h3>
              <p className="text-slate-400 text-sm mt-1">No attendance submitted on {new Date(date).toLocaleDateString()}.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cards.map((card, idx) => {
                const cardKey = card.course?._id ? `${card.course._id}-${idx}` : `course-${idx}`;

                return (
                  <div key={cardKey} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={22} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Course</p>
                          <h3 className="text-white font-extrabold text-xl leading-tight">{card.course?.title || 'Unknown Course'}</h3>
                          <p className="text-white/70 text-xs mt-0.5">{card.course?.courseCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Time Slots Grid */}
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Activity (Time Slots)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TIME_SLOTS.map(slotStr => {
                          const slotData = card.timeSlots.find(ts => ts.slot === slotStr);
                          
                          if (slotData) {
                            return (
                              <div key={slotStr} className="bg-white border-2 border-emerald-400 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Saved
                                </div>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                                  <Clock size={14} className="text-slate-400" /> {slotStr}
                                </p>
                                <p className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-lg w-fit">
                                  <User size={14} className="text-indigo-500" /> Teacher: {slotData.teacherName && slotData.teacherName !== 'Not Assigned' ? slotData.teacherName : (card.assignedTeacherName || 'Not Assigned')}
                                </p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{slotData.present} P</span>
                                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded">{slotData.absent} A</span>
                                    {slotData.late > 0 && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{slotData.late} L</span>}
                                  </div>
                                  <button
                                    onClick={() => setExpandedSlot(expandedSlot.cardIdx === idx && expandedSlot.slot === slotStr ? { cardIdx: null, slot: null } : { cardIdx: idx, slot: slotStr })}
                                    className="text-[11px] font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={slotStr} className="bg-white border border-dashed border-slate-200 rounded-2xl p-4 opacity-75 hover:opacity-100 transition-opacity">
                                <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-2">
                                  <Clock size={14} className="text-slate-300" /> {slotStr}
                                </p>
                                <div className="flex flex-col gap-2 mt-1">
                                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md w-fit">Pending...</span>
                                  {isCourseInSlot(card.course?.classTime, slotStr) && (
                                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                                      <User size={12} className="text-slate-400" /> Teacher: <strong className="font-extrabold text-indigo-600">{card.assignedTeacherName}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>

                    {/* Inline area removed to show modal instead */}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* View Details Popup Modal */}
      {expandedSlot.slot && expandedSlot.cardIdx !== null && cards[expandedSlot.cardIdx] && (() => {
        const selectedCard = cards[expandedSlot.cardIdx];
        const selectedSlotData = selectedCard.timeSlots?.find(ts => ts.slot === expandedSlot.slot);
        const teacherName = (selectedSlotData?.teacherName && selectedSlotData.teacherName !== 'Not Assigned')
          ? selectedSlotData.teacherName
          : (selectedCard.assignedTeacherName || 'Not Assigned');

        return createPortal(
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-none">{selectedCard.course?.title}</h3>
                    <p className="text-xs text-white/80 mt-1.5">Time Slot: {expandedSlot.slot} · {new Date(date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <User size={14} className="text-indigo-600" />
                    Teacher: {teacherName}
                  </div>
                  <button 
                    onClick={() => setExpandedSlot({ cardIdx: null, slot: null })}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <DetailedHistoryTable 
                  date={date} 
                  courseId={selectedCard.course?._id} 
                  selectedSlot={expandedSlot.slot}
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setExpandedSlot({ cardIdx: null, slot: null })}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-all"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {!fetched && !loading && (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-14 text-center">
          <GraduationCap size={44} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold">Select a date and click "Load Dashboard"</p>
        </div>
      )}
    </div>
  );
};

// ─── TEACHER ATTENDANCE: Admin marks teacher attendance with time slots ────────
const TeacherAttendance = ({ courses }) => {
  const [courseId, setCourseId]     = useState('');
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot]     = useState(TIME_SLOTS[0]);
  const [teachers, setTeachers]     = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState({ type: '', msg: '' });
  const [isLocked, setIsLocked]     = useState(false);

  const handleCourseChange = (id) => {
    setCourseId(id);
    if (id) {
      const course = courses.find(c => c._id === id);
      if (course && course.classTime) {
        setTimeSlot(course.classTime);
      }
    }
  };

  const getTimeSlots = () => {
    const slots = [...TIME_SLOTS];
    if (courseId) {
      const course = courses.find(c => c._id === courseId);
      if (course && course.classTime && !slots.includes(course.classTime)) {
        slots.unshift(course.classTime);
      }
    }
    return slots;
  };

  useEffect(() => {
    if (courseId) loadTeachers();
  }, [courseId, date, timeSlot]);

  const loadTeachers = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const tRes = await api.get('/admin/teachers');
      const all = tRes.data.teachers || [];
      const filtered = all.filter(t =>
        t.assignedCourses && t.assignedCourses.includes(courseId)
      );
      setTeachers(filtered);

      const attRes = await api.get(
        `/admin/attendance?date=${date}&targetType=Teacher&courseId=${courseId}&timeSlot=${encodeURIComponent(timeSlot)}`
      );
      const records = attRes.data.records || [];
      const init = {};
      filtered.forEach(t => {
        const ex = records.find(r => r.userId?._id === t._id);
        init[t._id] = ex ? ex.status : 'Present';
      });
      setAttendance(init);
      if (records.length > 0) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to load teachers.' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id, val) => setAttendance(prev => ({ ...prev, [id]: val }));
  const markAll = (val) => {
    const upd = {};
    teachers.forEach(t => { upd[t._id] = val; });
    setAttendance(upd);
  };

  const handleSave = async () => {
    if (!courseId) { setStatus({ type: 'error', msg: 'Please select a course.' }); return; }
    setSaving(true);
    setStatus({ type: '', msg: '' });
    const course = courses.find(c => c._id === courseId);
    const records = teachers.map(t => ({
      userId: t._id,
      date,
      status: attendance[t._id] || 'Absent',
      faculty: course?.faculty || 'N/A',
      course: courseId,
      targetType: 'Teacher',
      timeSlot,
    }));
    try {
      const res = await api.post('/admin/attendance', { records });
      if (res.data.success) {
        setStatus({ type: 'success', msg: '✓ Teacher attendance saved!' });
        setIsLocked(true);
      }
    } catch { setStatus({ type: 'error', msg: 'Failed to save.' }); }
    finally { setSaving(false); }
  };

  const presentCount = teachers.filter(t => attendance[t._id] === 'Present').length;
  const absentCount  = teachers.filter(t => attendance[t._id] === 'Absent').length;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Session Details</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Course</label>
            <select value={courseId} onChange={e => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400">
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.courseCode})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Time Slot</label>
            <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400">
              {getTimeSlots().map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {status.msg && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-semibold ${
          status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          {status.msg}
        </div>
      )}

      {!courseId ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <UserCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold">Select a course to load teachers</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : teachers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <AlertTriangle size={36} className="mx-auto text-amber-400 mb-3" />
          <p className="text-slate-600 font-bold">No teachers assigned to this course</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Active Info Banner */}
          <div className="px-6 py-4 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-blue-800">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-blue-500" />
              <strong>Course:</strong> {courses.find(c => c._id === courseId)?.title} ({courses.find(c => c._id === courseId)?.courseCode})
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
            <span className="flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-blue-500" />
              <strong>Date:</strong> {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-500" />
              <strong>Actual Class Time:</strong> {timeSlot}
            </span>
          </div>

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700">{teachers.length} Teachers</span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                <Check size={11} strokeWidth={3}/>{presentCount} Present
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">
                <XCircle size={11}/>{absentCount} Absent
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLocked ? (
                <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  🔒 Attendance Locked
                </span>
              ) : (
                <>
                  <span className="text-xs text-slate-400 font-semibold">Mark All:</span>
                  <button onClick={() => markAll('Present')} className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors">✓ Present</button>
                  <button onClick={() => markAll('Absent')}  className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors">✗ Absent</button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-3 w-10">#</th>
                <th className="px-4 py-3">Teacher Name</th>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3 text-center w-32">Present</th>
                <th className="px-4 py-3 text-center w-32">Absent</th>
                <th className="px-4 py-3 text-center w-32">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachers.map((t, i) => {
                const st = attendance[t._id] || 'Present';
                return (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{i + 1}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{t.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{t.regNo}</td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        disabled={isLocked}
                        onClick={() => toggle(t._id, 'Present')}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        style={{ background: st === 'Present' ? '#10b981' : 'white', borderColor: st === 'Present' ? '#10b981' : '#cbd5e1' }}>
                        {st === 'Present' && <Check size={14} strokeWidth={3} className="text-white" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        disabled={isLocked}
                        onClick={() => toggle(t._id, 'Absent')}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        style={{ background: st === 'Absent' ? '#ef4444' : 'white', borderColor: st === 'Absent' ? '#ef4444' : '#cbd5e1' }}>
                        {st === 'Absent' && <XCircle size={14} className="text-white" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        disabled={isLocked}
                        onClick={() => toggle(t._id, 'Late')}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        style={{ background: st === 'Late' ? '#f59e0b' : 'white', borderColor: st === 'Late' ? '#f59e0b' : '#cbd5e1' }}>
                        {st === 'Late' && <Clock size={12} className="text-white" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="px-6 py-5 border-t border-slate-100 flex justify-end">
            {isLocked ? (
              <button 
                onClick={() => setIsLocked(false)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5">
                Unlock to Edit
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-60">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Attendance
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ManageAttendance = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [courses, setCourses]     = useState([]);

  useEffect(() => {
    api.get('/admin/courses')
      .then(res => { if (res.data.success) setCourses(res.data.courses); })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-blue-600 font-bold">Central Control</p>
        <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Manage Attendance</h2>
        <p className="mt-2 text-sm text-slate-500">
          View teacher-submitted student attendance · Mark teacher attendance with time slots.
        </p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'student' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap size={16} /> Student Attendance
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'teacher' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={16} /> Teacher Attendance
        </button>
      </div>

      {activeTab === 'student' && <StudentMonitor />}
      {activeTab === 'teacher' && <TeacherAttendance courses={courses} />}
    </div>
  );
};

export default ManageAttendance;
