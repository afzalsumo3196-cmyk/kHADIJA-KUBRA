import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Loader2, BookMarked } from 'lucide-react';
import api from '../../api/axios';

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/teacher/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up max-w-7xl mx-auto pb-6 overflow-x-hidden md:overflow-x-visible">
      <div>
        <p className="text-[9px] uppercase tracking-widest text-indigo-600 font-bold">Overview</p>
        <h2 className="mt-0.5 text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">Faculty Dashboard</h2>
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          Welcome back. Here is a summary of your assigned classes and timetable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-indigo-600 border border-indigo-500 p-3.5 shadow-sm text-white flex flex-col justify-between">
          <div className="flex items-start justify-between mb-2">
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
              <BookMarked size={16} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-indigo-100 uppercase tracking-widest">Total Classes Assigned</p>
            <h3 className="mt-0.5 text-xl font-extrabold">{courses.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" /> My Timetable
          </h3>
        </div>

        {courses.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto h-10 w-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-2.5">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">No Courses Assigned</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
              You currently do not have any courses assigned to you. Please contact administration.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <div key={course._id} className="bg-slate-50/70 border border-slate-200 p-3.5 rounded-lg hover:border-indigo-300 transition-colors shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-1.5 py-0.5 bg-white text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold tracking-wider uppercase shadow-sm">
                    {course.courseCode}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">{course.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{course.description}</p>
                
                <div className="space-y-1 mt-auto pt-2.5 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{course.classDays?.join(', ') || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>{course.classTime || 'TBD'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
