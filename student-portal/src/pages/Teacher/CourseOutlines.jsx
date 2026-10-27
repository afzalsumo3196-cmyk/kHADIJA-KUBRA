import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

const CourseOutlines = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned courses outlines.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold">Academic Syllabus</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Course Outlines
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          View and download official outlines and syllabi for your assigned courses provided by the administration.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl flex items-start gap-3 border bg-red-50 border-red-100 text-red-600">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
          You are not currently assigned to any courses.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {course.courseCode}
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900 mt-2 leading-snug">{course.title}</h3>
                  </div>
                  <div className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                    Sem {course.semester}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Syllabus Outline</h4>
                  {course.outlineTitle ? (
                    <div className="space-y-2">
                      <div className="font-bold text-slate-800 text-sm">{course.outlineTitle}</div>
                      {course.outlineDescription && (
                        <p className="text-slate-500 text-sm leading-relaxed">{course.outlineDescription}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No outline provided by administration yet.</p>
                  )}
                </div>
              </div>

              {course.outlineFile && (
                <div className="border-t border-slate-100 pt-4 mt-6 flex gap-3">
                  <a
                    href={course.outlineFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                  >
                    <Download size={16} /> Download Outline
                  </a>
                  <a
                    href={course.outlineFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 border border-slate-200 hover:border-slate-300 rounded-2xl text-slate-600 hover:text-slate-900 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseOutlines;
