import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, PenTool, ClipboardList, Loader2, ArrowLeft, Info, CalendarCheck, Headphones, Award } from 'lucide-react';
import api from '../../api/axios';

// Import existing modules
import Notes from './Notes';
import Assignments from './Assignments';
import OnlineQuiz from '../Academic/OnlineQuiz';
import Record from '../Attendance/Record';
import AudioLectures from '../Lectures/AudioLectures';
import Grades from '../Records/Grades';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      // We can fetch from /portal/courses and filter by ID, or create a specific endpoint
      const res = await api.get('/portal/courses');
      if (res.data.success) {
        const found = res.data.courses.find(c => c._id === courseId);
        setCourse(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'Overview', icon: Info, label: 'Overview' },
    { id: 'Attendance', icon: CalendarCheck, label: 'Attendance' },
    { id: 'Lectures', icon: Headphones, label: 'Lectures & Notes' },
    { id: 'Assignments', icon: PenTool, label: 'Assignments & Quizzes' },
    { id: 'Grades', icon: Award, label: 'My Grades' },
  ];

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  }

  if (!course) {
    return (
      <div className="text-center p-12 max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 mt-12">
        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Course Not Found</h3>
        <p className="text-slate-500 mb-6">The course you are looking for does not exist or you do not have access.</p>
        <button onClick={() => navigate('/courses')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Back to My Courses</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto pb-12">
      {/* Header */}
      <button 
        onClick={() => navigate('/courses')} 
        className="flex items-center gap-2 text-sm font-extrabold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 hover:-translate-x-1 transition-all w-fit"
      >
        <ArrowLeft size={16} /> Back to My Courses
      </button>

      <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-bl-full -z-0 opacity-70" />
        <div className="relative z-10 flex items-start gap-6">
          <div className="h-20 w-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
            <BookOpen size={40} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-lg border border-slate-200">
                {course.courseCode}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{course.title}</h1>
            <p className="mt-2 text-slate-500 font-medium flex items-center gap-2">
              By {course.faculty}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap gap-2 border-b border-slate-200 pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 font-bold text-sm rounded-t-2xl border-b-2 transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'Overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Course Description</h3>
                <p className="text-slate-600 leading-relaxed">
                  {course.description || 'No description provided by the instructor.'}
                </p>
              </div>

              {course.outlineTitle && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 animate-fade-in-up">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-blue-600" /> Course Outline / Syllabus
                  </h3>
                  <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 text-sm">{course.outlineTitle}</h4>
                    {course.outlineDescription && (
                      <p className="text-slate-500 text-sm leading-relaxed mt-2">{course.outlineDescription}</p>
                    )}
                    {course.outlineFile && (
                      <div className="mt-4">
                        <a 
                          href={course.outlineFile} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5"
                        >
                          <FileText size={14} /> View / Download Syllabus
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Course Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-medium">Semester</span>
                    <span className="font-bold text-slate-900">{course.semester || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-medium">Days</span>
                    <span className="font-bold text-slate-900">{course.classDays?.join(', ') || 'TBD'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-500 font-medium">Timings</span>
                    <span className="font-bold text-slate-900">{course.classTime || 'TBD'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Attendance' && <Record courseId={courseId} />}
        {activeTab === 'Lectures' && (
          <div className="space-y-8">
            <AudioLectures courseId={courseId} />
            <div className="border-t border-slate-200 my-8"></div>
            <Notes courseId={courseId} />
          </div>
        )}
        {activeTab === 'Assignments' && (
          <div className="space-y-8">
            <Assignments courseId={courseId} />
            <div className="border-t border-slate-200 my-8"></div>
            <OnlineQuiz courseId={courseId} />
          </div>
        )}
        {activeTab === 'Grades' && <Grades courseId={courseId} />}
      </div>
    </div>
  );
};

export default CourseDetails;
