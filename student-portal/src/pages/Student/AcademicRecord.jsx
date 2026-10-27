import React, { useState, useEffect } from 'react';
import { Award, BookOpen, GraduationCap, Loader2, AlertCircle, Calendar, ChevronDown, ChevronUp, Activity, BarChart2 } from 'lucide-react';
import api from '../../api/axios';

const AcademicRecord = () => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portal/academic-record');
      if (res.data.success) {
        setRecord(res.data);
        // Expand the first semester by default
        if (res.data.semesterResults?.length > 0) {
          setExpandedSemesters({ [res.data.semesterResults[0].semester]: true });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch academic record');
    } finally {
      setLoading(false);
    }
  };

  const toggleSemester = (sem) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [sem]: !prev[sem]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Academic Record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto mt-8">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 shadow-sm flex items-center gap-3">
          <AlertCircle size={24} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const { studentProfile, cgpa, semesterResults } = record;

  const totalCourses = semesterResults.reduce((acc, sem) => acc + sem.courses.length, 0);

  return (
    <div className="space-y-8 animate-fade-in-up max-w-[1200px] mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-bl-full pointer-events-none"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-extrabold flex items-center gap-2"><Award size={14}/> Official Transcript</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Academic Record & Grades</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xl font-medium">
                Comprehensive view of your academic progress, detailed category-wise marks, and cumulative performance.
              </p>
            </div>
         </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Active Diploma */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[28px] p-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-inner">
              <GraduationCap size={24} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Active Program</p>
            <h3 className="text-lg font-black text-slate-800 truncate" title={studentProfile.programName}>
              {studentProfile.programName || 'Not Assigned'}
            </h3>
          </div>
        </div>

        {/* Current Semester */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[28px] p-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 shadow-inner">
              <Calendar size={24} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Progression</p>
            <h3 className="text-xl font-black text-slate-800">
              Semester {studentProfile.currentSemester} <span className="text-slate-400 text-sm font-bold">/ {studentProfile.totalSemesters}</span>
            </h3>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[28px] p-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 shadow-inner">
              <BookOpen size={24} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Completed Courses</p>
            <h3 className="text-xl font-black text-slate-800">{totalCourses} Courses</h3>
          </div>
        </div>

        {/* CGPA */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[28px] p-6 shadow-xl shadow-emerald-200 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-emerald-900/20 rounded-full"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/20">
              <Activity size={24} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-100 font-bold mb-1">Overall CGPA</p>
            <h3 className="text-4xl font-black tracking-tight">
              {cgpa} <span className="text-emerald-200 text-lg font-bold">/ 4.00</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Semester Results List */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2 tracking-tight">
          <BarChart2 size={24} className="text-emerald-600" />
          Detailed Course Grades
        </h3>
        
        {semesterResults.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-slate-200 shadow-sm">
            <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4"><BookOpen size={32} className="text-slate-300"/></div>
            <p className="text-slate-500 font-bold text-lg">No academic records found yet.</p>
            <p className="text-slate-400 text-sm mt-2">Your grades will appear here once published by your teachers.</p>
          </div>
        ) : (
          semesterResults.map((sem) => (
            <div key={sem.semester} className="bg-slate-50/50 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:border-slate-300">
              {/* Accordion Header */}
              <button 
                onClick={() => toggleSemester(sem.semester)}
                className="w-full px-8 py-6 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 font-black flex items-center justify-center text-lg shadow-sm border border-emerald-100/50">
                    S{sem.semester}
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-slate-900">Semester {sem.semester}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{sem.courses.length} Courses Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Semester GPA</p>
                    <p className="text-lg font-black text-emerald-600 leading-none mt-1">{sem.gpa}</p>
                  </div>
                  <div className={`text-slate-400 transition-transform duration-300 ${expandedSemesters[sem.semester] ? 'rotate-180' : ''}`}>
                    <ChevronDown size={24} />
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              {expandedSemesters[sem.semester] && (
                <div className="px-6 py-8 border-t border-slate-100 space-y-6">
                   {sem.courses.map((course, idx) => (
                       <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                          {/* Course Highlight Header */}
                          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 pb-6 border-b border-slate-100 gap-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                      <BookOpen size={20} className="stroke-[2.5]" />
                                  </div>
                                  <div>
                                      <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{course.title}</h4>
                                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg mt-1.5 inline-block tracking-widest uppercase">{course.code}</span>
                                  </div>
                              </div>
                              
                              {/* Overall Highlights */}
                              <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-100 w-full xl:w-auto overflow-x-auto">
                                  <div className="text-center px-4 sm:px-6 border-r border-slate-200 min-w-[100px]">
                                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1.5">Total Marks</p>
                                      <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{course.marksObtained} <span className="text-sm text-slate-400 font-bold">/ {course.totalMarks}</span></p>
                                  </div>
                                  <div className="text-center px-4 sm:px-6 border-r border-slate-200 min-w-[100px]">
                                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1.5">Percentage</p>
                                      <p className={`text-xl sm:text-2xl font-black leading-none ${course.percentage >= 80 ? 'text-emerald-600' : course.percentage >= 50 ? 'text-blue-600' : 'text-red-500'}`}>{course.percentage}%</p>
                                  </div>
                                  <div className="text-center px-4 sm:px-6 min-w-[80px]">
                                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-1.5">Grade</p>
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black shadow-inner border ${course.gpa >= 3.0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : course.gpa >= 2.0 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {course.grade}
                                      </span>
                                  </div>
                              </div>
                          </div>

                          {/* Categories Breakdown */}
                          <div>
                             <p className="text-[11px] uppercase tracking-widest text-slate-400 font-extrabold mb-4 ml-1">Detailed Breakdown</p>
                             {course.categories && course.categories.length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {course.categories.map((cat, i) => {
                                        const isExtra = cat.type === 'Extra' || cat.title.toLowerCase().includes('extra');
                                        const catPct = cat.totalMarks > 0 ? Math.min((cat.marksObtained / cat.totalMarks) * 100, 100) : (cat.marksObtained > 0 ? 100 : 0);
                                        const barColor = isExtra ? 'bg-purple-500' : (catPct >= 80 ? 'bg-emerald-500' : catPct >= 50 ? 'bg-blue-500' : 'bg-red-500');
                                        const bgColor = isExtra ? 'bg-purple-100' : (catPct >= 80 ? 'bg-emerald-100' : catPct >= 50 ? 'bg-blue-100' : 'bg-red-100');
                                        
                                        return (
                                            <div key={i} className="bg-slate-50/70 rounded-[20px] p-5 border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group">
                                               <div className="flex justify-between items-center mb-4">
                                                   <span className="font-bold text-slate-700 text-sm truncate pr-2" title={cat.title}>{cat.title}</span>
                                                   <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                                                       {cat.marksObtained} <span className="text-slate-400 font-bold">/ {cat.totalMarks}</span>
                                                   </span>
                                               </div>
                                               <div className={`w-full h-2 rounded-full overflow-hidden ${bgColor} shadow-inner`}>
                                                   <div className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${catPct}%` }}></div>
                                               </div>
                                               {isExtra && <p className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mt-3">Bonus Marks (Excluded from total base)</p>}
                                            </div>
                                        )
                                    })}
                                 </div>
                             ) : (
                                 <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                                    <p className="text-sm text-slate-400 font-bold">No detailed category marks available for this course.</p>
                                 </div>
                             )}
                          </div>
                       </div>
                   ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AcademicRecord;
