import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, Loader2, AlertCircle, BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

const AudioLectures = ({ courseId }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    fetchLectures();
  }, [courseId]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/portal/lectures?courseId=${courseId}` : '/portal/lectures';
      const response = await api.get(url);
      if (response.data.success) {
        setLectures(response.data.lectures);
      }
    } catch (err) {
      setError('Failed to load video lectures. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Content...</p>
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

  // Group lectures by Course
  const lecturesToGroup = courseId ? lectures.filter(lec => lec.course?._id === courseId) : lectures;

  const groupedData = lecturesToGroup.reduce((acc, lecture) => {
    const lecCourseId = lecture.course?._id || 'unknown';
    if (!acc[lecCourseId]) {
      acc[lecCourseId] = {
        course: lecture.course || { title: lecture.faculty || 'Unknown Course', courseCode: 'N/A' },
        lectures: []
      };
    }
    acc[courseId].lectures.push(lecture);
    return acc;
  }, {});

  const courses = Object.values(groupedData);

  // Auto-expand first course if available
  if (expandedCourse === null && courses.length > 0) {
    setExpandedCourse(0);
  }

  return (
    <div className={`space-y-8 animate-fade-in-up ${courseId ? '' : 'max-w-5xl mx-auto pb-12'}`}>
      {!courseId && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">Course Content</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Video Lectures & Materials</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
            Access official faculty lectures, recorded sessions, and study materials organized by your enrolled courses.
          </p>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="py-16 text-center bg-white/80 border border-slate-200 rounded-[32px] shadow-sm backdrop-blur-md">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No Content Available</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Your teachers haven't uploaded any lectures for your enrolled courses yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((group, index) => {
            const isExpanded = courseId ? true : expandedCourse === index;

            return (
              <div key={index} className={`bg-white shadow-sm rounded-3xl overflow-hidden backdrop-blur-md transition-all ${courseId ? '' : 'border border-slate-200 hover:shadow-md'}`}>
                {/* Course Header Bar */}
                {!courseId && (
                  <div 
                    className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedCourse(isExpanded ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                            {group.course.courseCode}
                          </span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                            {group.lectures.length} Lectures
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{group.course.title}</h3>
                      </div>
                    </div>
                    
                    <div className={`text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={24} />
                    </div>
                  </div>
                )}

                {/* Collapsible Content Area */}
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-slate-50 border-t border-slate-100`}>
                  <div className="p-6 sm:p-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      {group.lectures.map((lec) => (
                        <div key={lec._id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                              <PlayCircle size={24} />
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-500">
                              <Clock size={12} /> {lec.duration || 'N/A'}
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-extrabold text-slate-900 leading-tight mb-2">{lec.title}</h4>
                          <p className="text-xs text-slate-500 mb-6 flex-1 line-clamp-3 leading-relaxed">{lec.description}</p>
                          
                          <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                            <a 
                              href={lec.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-all w-full justify-center shadow-sm"
                            >
                              <ExternalLink size={16} /> Watch Lecture
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AudioLectures;
