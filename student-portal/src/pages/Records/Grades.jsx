import React, { useState, useEffect } from 'react';
import { Loader2, Award, FileSignature, AlertCircle, BookOpen, ChevronDown } from 'lucide-react';
import api from '../../api/axios';

const Grades = ({ courseId }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, [courseId]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/portal/grades?courseId=${courseId}` : '/portal/grades';
      const res = await api.get(url);
      if (res.data.success) {
        setGrades(res.data.grades);
      }
    } catch (err) {
      console.error('Failed to fetch grades', err);
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

  // Group grades by Course
  const gradesToGroup = courseId ? grades.filter(grade => grade.course?._id === courseId) : grades;

  const groupedData = gradesToGroup.reduce((acc, grade) => {
    const gradeCourseId = grade.course?._id || 'unknown';
    if (!acc[gradeCourseId]) {
      acc[gradeCourseId] = {
        course: grade.course || { title: grade.faculty || 'Unknown Course', courseCode: 'N/A' },
        grades: [],
        totalMarksObtained: 0,
        totalMaxMarks: 0
      };
    }
    acc[gradeCourseId].grades.push(grade);
    acc[gradeCourseId].totalMarksObtained += grade.marksObtained || 0;
    acc[gradeCourseId].totalMaxMarks += grade.totalMarks || 0;
    return acc;
  }, {});

  const courses = Object.values(groupedData);

  return (
    <div className={`space-y-6 animate-fade-in-up ${courseId ? '' : 'pb-12 max-w-5xl mx-auto'}`}>
      {!courseId && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">Academics</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">My Grades</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
            View your published quiz and assignment results organized by course.
          </p>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="bg-white/80 rounded-[32px] p-12 border border-slate-200 text-center shadow-sm backdrop-blur-md mt-6">
          <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Grades Yet</h3>
          <p className="text-slate-500 mt-2">Your teachers haven't published any grades for you.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {courses.map((group, index) => {
            const courseAverage = group.totalMaxMarks > 0 ? Math.round((group.totalMarksObtained / group.totalMaxMarks) * 100) : 0;
            const isExpanded = courseId ? true : expandedCourse === index;

            return (
              <div key={index} className={`bg-white shadow-sm rounded-3xl overflow-hidden backdrop-blur-md transition-all ${courseId ? '' : 'border border-slate-200 hover:shadow-md'}`}>
                {/* Course Header */}
                {!courseId && (
                  <div 
                    className="p-6 sm:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                    onClick={() => setExpandedCourse(isExpanded ? null : index)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                          {group.course.courseCode}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900">{group.course.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{group.grades.length} assessments graded</p>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Average</p>
                        <div className="flex items-end gap-2 justify-end">
                          <span className={`text-3xl font-extrabold ${courseAverage >= 80 ? 'text-emerald-600' : courseAverage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {courseAverage}%
                          </span>
                        </div>
                      </div>
                      <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={24} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Assessments Accordion */}
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-slate-50 border-t border-slate-100`}>
                  <div className="p-6 sm:p-8 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Assessment Breakdown</h4>
                    {group.grades.map((grade) => {
                      const percentage = grade.totalMarks > 0 ? Math.round((grade.marksObtained / grade.totalMarks) * 100) : 0;
                      
                      return (
                        <div key={grade._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 shrink-0">
                                {['Quiz', 'Online Quiz'].includes(grade.type) ? <Award size={18} /> : <FileSignature size={18} />}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900">{grade.title}</h5>
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-widest">
                                  {grade.type}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl font-extrabold text-slate-900 leading-none">
                                {grade.marksObtained}
                                <span className="text-sm text-slate-400 font-medium">/{grade.totalMarks}</span>
                              </div>
                              <div className={`text-xs font-bold mt-1 ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                {percentage}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
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

export default Grades;
