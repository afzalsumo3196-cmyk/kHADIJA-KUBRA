import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ShieldCheck, Loader2, ChevronDown, CalendarCheck } from 'lucide-react';
import api from '../../api/axios';

const Record = ({ courseId }) => {
  const [data, setData] = useState({ logs: [], rate: 0, total: 0, presents: 0, absents: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [courseId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/portal/attendance?courseId=${courseId}` : '/portal/attendance';
      const res = await api.get(url);
      if (res.data.success) {
        setData({
          logs: res.data.logs,
          rate: res.data.rate,
          total: res.data.total,
          presents: res.data.presents,
          absents: res.data.absents
        });
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  // Group logs by Course
  const logsToGroup = courseId ? data.logs.filter(log => log.course?._id === courseId) : data.logs;

  const groupedData = logsToGroup.reduce((acc, log) => {
    const logCourseId = log.course?._id || 'unknown';
    if (!acc[logCourseId]) {
      acc[logCourseId] = {
        course: log.course || { title: log.faculty || 'Unknown Course', courseCode: 'N/A' },
        logs: [],
        presents: 0,
        total: 0
      };
    }
    acc[courseId].logs.push(log);
    acc[courseId].total += 1;
    if (log.status === 'Present') acc[courseId].presents += 1;
    return acc;
  }, {});

  const courses = Object.values(groupedData);

  return (
    <div className={`space-y-6 animate-fade-in-up ${courseId ? '' : 'pb-12'}`}>
      {!courseId && (
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Attendance</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Attendance Record</h2>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Review your attendance performance categorized by your enrolled courses.
          </p>
        </div>
      )}

      {/* Overall Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white/90 border border-slate-200 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Overall Rate</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{data.rate}%</h3>
        </div>
        <div className="rounded-3xl bg-white/90 border border-slate-200 p-5 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Total Classes</p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{data.total}</h3>
        </div>
        <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Presents</p>
          <h3 className="mt-2 text-3xl font-extrabold text-emerald-700">{data.presents}</h3>
        </div>
        <div className="rounded-3xl bg-red-50 border border-red-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-red-600 font-semibold">Absents</p>
          <h3 className="mt-2 text-3xl font-extrabold text-red-700">{data.absents}</h3>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {!courseId && <h3 className="text-xl font-bold text-slate-900">Course Breakdown</h3>}
        
        {courses.length === 0 ? (
          <div className="bg-white/80 rounded-3xl p-12 border border-slate-200 text-center shadow-sm backdrop-blur-md">
            <CalendarCheck size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No Records Found</h3>
            <p className="text-slate-500 mt-2">No attendance has been logged for your courses yet.</p>
          </div>
        ) : (
          courses.map((group, index) => {
            const courseRate = Math.round((group.presents / group.total) * 100);
            const isExpanded = courseId ? true : expandedCourse === index;
            const groupRate = courseRate;

            return (
              <div key={index} className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden backdrop-blur-md transition-all hover:shadow-md">
                {/* Course Header - Hidden if inside specific course view */}
                {!courseId && (
                  <div 
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedCourse(isExpanded ? null : index)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                          <CalendarCheck size={20} />
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest border border-slate-200">
                          {group.course.courseCode}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900">{group.course.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{group.total} classes recorded</p>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                        <div className="flex items-end gap-2 justify-end">
                          <span className={`text-3xl font-extrabold ${courseRate >= 75 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {courseRate}%
                          </span>
                        </div>
                      </div>
                      <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={24} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Accordion Content */}
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-slate-50 border-t border-slate-100`}>
                  <div className="p-6 sm:p-8">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Detailed Logs</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.logs.map(entry => (
                        <div key={entry._id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm font-semibold text-slate-700">
                              {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${entry.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {entry.status === 'Present' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {entry.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Record;
