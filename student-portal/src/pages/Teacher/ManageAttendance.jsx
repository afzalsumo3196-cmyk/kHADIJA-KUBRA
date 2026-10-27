import React, { useState, useEffect } from 'react';
import {
  Clock, Loader2, CalendarCheck, BookOpen,
  Save, Users, ChevronDown, UserCheck, AlertTriangle,
  CheckCircle, XCircle, Check
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

// Animated checkbox component
const AttendanceCheckbox = ({ checked, onChange, label, color }) => {
  const colors = {
    green:  { ring: 'ring-emerald-400', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
    red:    { ring: 'ring-red-400',     bg: 'bg-red-500',     text: 'text-red-700',     light: 'bg-red-50'     },
    amber:  { ring: 'ring-amber-400',   bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50'   },
  };
  const c = colors[color] || colors.green;
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all duration-200 select-none
        ${checked
          ? `${c.light} border-current ${c.text} font-bold shadow-sm`
          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
        }`}
    >
      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
        ${checked ? `${c.bg} border-transparent` : 'border-slate-300 bg-white'}`}
      >
        {checked && <Check size={12} strokeWidth={3} className="text-white" />}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
};

const ManageAttendance = () => {
  const [activeView, setActiveView] = useState('mark');

  // Mark Attendance
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot]       = useState(TIME_SLOTS[0]);
  const [students, setStudents]       = useState([]);
  const [attendance, setAttendance]   = useState({}); // { id: 'Present' | 'Absent' | 'Late' }
  const [remarks, setRemarks]         = useState({}); // { id: 'remark string' }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveStatus, setSaveStatus]   = useState(null); // null | 'success' | 'error'
  const [isLocked, setIsLocked]       = useState(false);

  // My Attendance Record
  const [myData, setMyData]   = useState({ logs: [], rate: 0, total: 0, presents: 0, absents: 0 });
  const [myLoading, setMyLoading] = useState(true);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => { fetchCourses(); fetchMyAttendance(); }, []);
  useEffect(() => { if (selectedCourse) loadStudents(); }, [selectedCourse, date, timeSlot]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/teacher/courses');
      if (res.data.success) setCourses(res.data.courses);
    } catch (err) { console.error(err); }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    if (courseId) {
      const course = courses.find(c => c._id === courseId);
      if (course && course.classTime) {
        setTimeSlot(course.classTime);
      }
    }
  };

  const getTimeSlots = () => {
    const slots = [...TIME_SLOTS];
    if (selectedCourse) {
      const course = courses.find(c => c._id === selectedCourse);
      if (course && course.classTime && !slots.includes(course.classTime)) {
        slots.unshift(course.classTime);
      }
    }
    return slots;
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    setSaveStatus(null);
    try {
      const stuRes = await api.get(`/teacher/students?courseId=${selectedCourse}`);
      const list = stuRes.data.students || [];
      setStudents(list);

      const attRes = await api.get(
        `/teacher/attendance?date=${date}&courseId=${selectedCourse}&timeSlot=${encodeURIComponent(timeSlot)}`
      );
      const records = attRes.data.records || [];

      const initAtt = {};
      const initRem = {};
      list.forEach(s => {
        const ex = records.find(r => r.userId?._id === s._id);
        initAtt[s._id] = ex ? ex.status : 'Present';
        initRem[s._id] = ex ? (ex.remarks || '') : '';
      });
      setAttendance(initAtt);
      setRemarks(initRem);
      if (records.length > 0) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchMyAttendance = async () => {
    setMyLoading(true);
    try {
      const res = await api.get('/teacher/my-attendance');
      if (res.data.success) setMyData(res.data);
    } catch (err) { console.error(err); }
    finally { setMyLoading(false); }
  };

  // Toggle status — cycle: Present → Absent → Late → Present
  const cycleStatus = (id) => {
    setAttendance(prev => {
      const cur = prev[id] || 'Present';
      const next = cur === 'Present' ? 'Absent' : cur === 'Absent' ? 'Late' : 'Present';
      return { ...prev, [id]: next };
    });
  };

  const setStatus = (id, val) => setAttendance(prev => ({ ...prev, [id]: val }));

  const markAll = (val) => {
    const upd = {};
    students.forEach(s => { upd[s._id] = val; });
    setAttendance(upd);
  };

  const handleSave = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'Absent',
        remarks: remarks[s._id] || ''
      }));
      const res = await api.post('/teacher/attendance', {
        date, courseId: selectedCourse, timeSlot, records,
      });
      setSaveStatus(res.data.success ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const presentCount = students.filter(s => attendance[s._id] === 'Present').length;
  const absentCount  = students.filter(s => attendance[s._id] === 'Absent').length;
  const lateCount    = students.filter(s => attendance[s._id] === 'Late').length;

  // My record grouped by course
  const courseGroups = Object.values(
    myData.logs.reduce((acc, log) => {
      const cid = log.course?._id || 'x';
      if (!acc[cid]) acc[cid] = {
        course: log.course || { title: log.faculty || '—', courseCode: '—' },
        logs: [], presents: 0, total: 0
      };
      acc[cid].logs.push(log);
      acc[cid].total++;
      if (log.status === 'Present') acc[cid].presents++;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-600 font-bold">Attendance Management</p>
        <h2 className="mt-1 text-3xl font-extrabold text-slate-900">Attendance</h2>
        <p className="mt-1 text-sm text-slate-500">Mark your students' attendance or view your own record.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {[
          { id: 'mark',     label: 'Mark Students', icon: <Users size={15} /> },
          { id: 'myRecord', label: 'My Record',     icon: <UserCheck size={15} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveView(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeView === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ══════════ MARK STUDENTS ══════════ */}
      {activeView === 'mark' && (
        <div className="space-y-5">
          {/* Session Controls */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Session Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Course</label>
                <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all">
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.courseCode})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Time Slot</label>
                <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-all">
                  {getTimeSlots().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Save status */}
          {saveStatus && (
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-semibold animate-fade-in-up ${
              saveStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {saveStatus === 'success'
                ? <><CheckCircle size={18} /> Attendance saved and sent to admin!</>
                : <><XCircle size={18} /> Failed to save attendance.</>
              }
            </div>
          )}

          {!selectedCourse ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-14 text-center">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-semibold">Select a course to load students</p>
            </div>
          ) : loadingStudents ? (
            <div className="flex justify-center p-16"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
          ) : students.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
              <AlertTriangle size={36} className="mx-auto text-amber-400 mb-3" />
              <p className="text-slate-600 font-bold">No students enrolled in this course</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              {/* Active Info Banner */}
              <div className="px-6 py-4 bg-indigo-50/80 border-b border-indigo-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-indigo-800">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-500" />
                  <strong>Course:</strong> {courses.find(c => c._id === selectedCourse)?.title} ({courses.find(c => c._id === selectedCourse)?.courseCode})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                <span className="flex items-center gap-1.5">
                  <CalendarCheck size={14} className="text-indigo-500" />
                  <strong>Date:</strong> {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-500" />
                  <strong>Actual Class Time:</strong> {timeSlot}
                </span>
              </div>

              {/* Top bar: stats + mark-all */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-700">{students.length} Students</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                    <Check size={11} strokeWidth={3}/>{presentCount} Present
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">
                    <XCircle size={11}/>{absentCount} Absent
                  </span>
                  {lateCount > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl">
                      <Clock size={11}/>{lateCount} Late
                    </span>
                  )}
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-widest text-slate-400 font-bold">
                      <th className="px-6 py-3 w-8">#</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Reg No</th>
                      <th className="px-4 py-3 text-center w-32">Present</th>
                      <th className="px-4 py-3 text-center w-32">Absent</th>
                      <th className="px-4 py-3 text-center w-28">Late</th>
                      <th className="px-4 py-3 w-48">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((s, i) => {
                      const st = attendance[s._id] || 'Present';
                      return (
                        <tr key={s._id} className={`transition-colors ${
                          st === 'Present' ? 'hover:bg-emerald-50/30'
                          : st === 'Absent' ? 'hover:bg-red-50/30'
                          : 'hover:bg-amber-50/30'
                        }`}>
                          <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{i + 1}</td>
                          <td className="px-4 py-4 font-bold text-slate-900">{s.name}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">{s.regNo}</td>

                          {/* Present checkbox */}
                          <td className="px-4 py-4 text-center">
                            <button
                              disabled={isLocked}
                              onClick={() => setStatus(s._id, 'Present')}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                              style={{
                                background: st === 'Present' ? '#10b981' : 'white',
                                borderColor: st === 'Present' ? '#10b981' : '#cbd5e1',
                              }}
                            >
                              {st === 'Present' && <Check size={14} strokeWidth={3} className="text-white" />}
                            </button>
                          </td>

                          {/* Absent checkbox */}
                          <td className="px-4 py-4 text-center">
                            <button
                              disabled={isLocked}
                              onClick={() => setStatus(s._id, 'Absent')}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                              style={{
                                background: st === 'Absent' ? '#ef4444' : 'white',
                                borderColor: st === 'Absent' ? '#ef4444' : '#cbd5e1',
                              }}
                            >
                              {st === 'Absent' && <XCircle size={14} className="text-white" />}
                            </button>
                          </td>

                          {/* Late checkbox */}
                          <td className="px-4 py-4 text-center">
                            <button
                              disabled={isLocked}
                              onClick={() => setStatus(s._id, 'Late')}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all duration-200 mx-auto ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                              style={{
                                background: st === 'Late' ? '#f59e0b' : 'white',
                                borderColor: st === 'Late' ? '#f59e0b' : '#cbd5e1',
                              }}
                            >
                              {st === 'Late' && <Clock size={12} className="text-white" />}
                            </button>
                          </td>
                          {/* Remarks input */}
                          <td className="px-4 py-4">
                            <input 
                              type="text" 
                              placeholder={isLocked ? "" : "Add note..."}
                              disabled={isLocked}
                              value={remarks[s._id] || ''}
                              onChange={e => setRemarks(prev => ({ ...prev, [s._id]: e.target.value }))}
                              className={`w-full text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 ${isLocked ? 'bg-slate-50 cursor-not-allowed opacity-70' : 'bg-white'}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save button */}
              <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  <Clock size={12} className="inline mr-1" />{timeSlot}
                </p>
                {isLocked ? (
                  <button
                    onClick={() => setIsLocked(false)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5"
                  >
                    Unlock to Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save & Send to Admin
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ MY RECORD ══════════ */}
      {activeView === 'myRecord' && (
        <div className="space-y-6">
          {myLoading ? (
            <div className="flex justify-center p-16"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Rate', value: `${myData.rate}%`, cls: myData.rate >= 75 ? 'text-indigo-600' : 'text-amber-500', bg: 'bg-white border-slate-200' },
                  { label: 'Total Classes', value: myData.total, cls: 'text-slate-900', bg: 'bg-white border-slate-200' },
                  { label: 'Presents', value: myData.presents, cls: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                  { label: 'Absents', value: myData.absents, cls: 'text-red-700', bg: 'bg-red-50 border-red-100' },
                ].map(card => (
                  <div key={card.label} className={`rounded-3xl border p-5 shadow-sm ${card.bg}`}>
                    <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">{card.label}</p>
                    <h3 className={`mt-2 text-3xl font-extrabold ${card.cls}`}>{card.value}</h3>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Course Breakdown</h3>
                {courseGroups.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
                    <CalendarCheck size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No attendance records yet. Admin will mark your attendance.</p>
                  </div>
                ) : courseGroups.map((group, i) => {
                  const rate = Math.round((group.presents / group.total) * 100);
                  const isOpen = expanded === i;
                  return (
                    <div key={i} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-6 cursor-pointer flex items-center justify-between gap-4" onClick={() => setExpanded(isOpen ? null : i)}>
                        <div>
                          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold uppercase tracking-widest border border-slate-200">
                            {group.course.courseCode}
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-900 mt-1">{group.course.title}</h3>
                          <p className="text-sm text-slate-500">{group.total} classes</p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Rate</p>
                            <span className={`text-3xl font-extrabold ${rate >= 75 ? 'text-indigo-600' : 'text-amber-500'}`}>{rate}%</span>
                          </div>
                          <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <div className={`transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-slate-50 border-t border-slate-100`}>
                        <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.logs.map(entry => (
                            <div key={entry._id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                  <Clock size={13} className="text-slate-400" />
                                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                {entry.timeSlot && <p className="text-xs text-slate-400 mt-0.5 ml-5">{entry.timeSlot}</p>}
                              </div>
                              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl ${
                                entry.status === 'Present' ? 'bg-emerald-50 text-emerald-700'
                                : entry.status === 'Late'  ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                              }`}>
                                {entry.status === 'Present' ? <Check size={12} strokeWidth={3}/> : entry.status === 'Late' ? <Clock size={12}/> : <XCircle size={12}/>}
                                {entry.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageAttendance;
