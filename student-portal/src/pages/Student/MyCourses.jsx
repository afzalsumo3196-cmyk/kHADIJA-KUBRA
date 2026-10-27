import React, { useState, useEffect, useContext } from 'react';
import { Loader2, BookOpen, UserCircle, Calendar, ChevronRight, Search, Filter, User, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [studentName, setStudentName] = useState('Student');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
    // Assuming student name is stored in localStorage by auth
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.name) setStudentName(user.name.split(' ')[0]);
      } catch (e) {}
    }
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portal/courses'); // Assuming this endpoint returns assigned courses for student
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.courseCode && c.courseCode.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-bl-full -z-0 opacity-70" />
        <div className="relative z-10">
          <p className="text-[12px] uppercase tracking-widest text-blue-600 font-extrabold mb-1">Academic Hub</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Hi, {studentName}! 👋
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xl">
            Welcome to your Learning Management System. Access your enrolled courses, lecture notes, assignments, and grades all in one place.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Course Name</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
          You are not enrolled in any courses yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div 
              key={course._id}
              onClick={() => navigate(`/courses/${course._id}`)}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-lg border border-slate-200">
                  {course.courseCode}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2 relative z-10 line-clamp-2">
                {course.title}
              </h3>

              <div className="mt-auto space-y-3 pt-6 relative z-10">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <UserCircle size={16} className="text-slate-400" />
                  <span className="line-clamp-1">{course.faculty || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <User size={16} className="text-slate-400" />
                  <span className="line-clamp-1">{course.teacherName || 'Instructor TBA'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="line-clamp-1">{course.classDays?.join(', ') || 'TBD'} • {course.classTime || 'TBD'}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-700 relative z-10">
                Enter Course <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
