import React, { useState, useEffect } from 'react';
import { BookOpen, Clock3, ChevronRight, Lightbulb, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const ActiveCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/portal/courses');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      setError('Failed to load active courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 shadow-sm max-w-md text-center flex flex-col items-center gap-3">
          <AlertCircle size={32} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Courses</p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Active Courses</h2>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Monitor your enrolled subjects, syllabus progress and upcoming class plans at a glance.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          {courses.length === 0 ? (
            <div className="py-12 text-center bg-white border border-slate-200 rounded-3xl text-slate-500 font-medium shadow-sm">
              You are not enrolled in any courses.
            </div>
          ) : (
            courses.map((course) => (
              <article key={course._id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-slate-800 text-white shadow-lg shrink-0">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{course.faculty}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shrink-0">
                    {course.courseCode}
                  </span>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2 rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <Sparkles size={16} /> Enrolled
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-6 rounded-[32px] border border-slate-200 bg-gradient-to-br from-emerald-600/10 to-slate-50 p-6 shadow-sm h-fit">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700 shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Focused Learning</p>
                <p className="mt-2 text-sm text-slate-500">Complete the current module to unlock the next certification path.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Weekly goal</p>
            <h4 className="mt-3 text-xl font-bold text-slate-900">Review 4 lessons</h4>
            <p className="mt-3 text-sm text-slate-500">Stay ahead by reviewing class notes and completing exercises.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ActiveCourses;
