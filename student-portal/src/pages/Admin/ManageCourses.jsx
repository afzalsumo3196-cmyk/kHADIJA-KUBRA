import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Save, PlusCircle, AlertCircle, CheckCircle2, BookOpen, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const FACULTIES = [
  "Dermatology",
  "Nutrition",
  "Psychology",
  "Aesthetic Medicine",
  "Medical Health",
  "Aalima",
  "Tajweed",
  "Tafsir e Quran",
  "Hadith",
  "Bachelors and Masters Degree in Cosmetology Dermatology and  Aesthetic",
  "Bachelors and Masters Degree in Clinical Health Psychology",
  "Bachelors and Masters Degree in Gut Microbiome and Nutrition for Digestive Health",
  "Bachelors and Masters Degree in Nutrition and Ditetics",
  "Bachelors and Masters Degree in Implant Dentistry"
];

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    faculty: '',
    description: '',
    semester: 1,
    classDays: [],
    classTime: '',
    fees: 0
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);

  const [isCustomFaculty, setIsCustomFaculty] = useState(false);
  const [isEditCustomFaculty, setIsEditCustomFaculty] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFacultyChange = (e) => {
    if (e.target.value === 'Custom') {
      setIsCustomFaculty(true);
      setFormData({ ...formData, faculty: '' });
    } else {
      setIsCustomFaculty(false);
      setFormData({ ...formData, faculty: e.target.value });
    }
  };

  const handleEditFacultyChange = (e) => {
    if (e.target.value === 'Custom') {
      setIsEditCustomFaculty(true);
      setEditFormData({ ...editFormData, faculty: '' });
    } else {
      setIsEditCustomFaculty(false);
      setEditFormData({ ...editFormData, faculty: e.target.value });
    }
  };

  const handleDaysChange = (day) => {
    setFormData((prev) => {
      if (prev.classDays.includes(day)) {
        return { ...prev, classDays: prev.classDays.filter(d => d !== day) };
      } else {
        return { ...prev, classDays: [...prev.classDays, day] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.post('/admin/courses', formData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Course created successfully!' });
        setFormData({ title: '', courseCode: '', faculty: '', description: '', semester: 1, classDays: [], classTime: '', fees: 0 });
        setIsCustomFaculty(false);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create course' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.put(`/admin/courses/${editFormData._id}`, editFormData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Course updated successfully!' });
        setIsEditModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update course' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditFormData({
      _id: course._id,
      title: course.title || '',
      courseCode: course.courseCode || '',
      faculty: course.faculty || '',
      description: course.description || '',
      semester: course.semester || 1,
      classDays: course.classDays || [],
      classTime: course.classTime || '',
      fees: course.fees || 0
    });
    setIsEditCustomFaculty(!FACULTIES.includes(course.faculty || ''));
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const res = await api.delete(`/admin/courses/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Course deleted successfully!' });
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete course' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Academic Architecture</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Courses</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Create explicit courses to be assigned to teachers and students.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle size={20} className="text-blue-600" />
          <h3 className="font-bold text-slate-900">Create New Course</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Intro to Fiqh" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course Code</label>
              <input type="text" name="courseCode" value={formData.courseCode} onChange={handleChange} placeholder="e.g. ISL-101" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold uppercase focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Faculty</label>
              <select name="faculty" value={isCustomFaculty ? "Custom" : formData.faculty} onChange={handleFacultyChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                <option value="" disabled>Select Faculty</option>
                {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                <option value="Custom" className="font-bold text-blue-600">Other (Custom)</option>
              </select>
              {isCustomFaculty && (
                <input 
                  required 
                  name="faculty" 
                  value={formData.faculty} 
                  onChange={handleChange} 
                  placeholder="Type custom faculty name..." 
                  className="w-full px-4 py-3 bg-blue-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all mt-2" 
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Semester</label>
              <input type="number" min="1" name="semester" value={formData.semester} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Short course description" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Class Time</label>
              <input type="text" name="classTime" value={formData.classTime} onChange={handleChange} placeholder="e.g. 10:00 AM - 11:30 AM" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Class Days</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.classDays.includes(day)}
                      onChange={() => handleDaysChange(day)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={submitLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Create Course
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-slate-400" />
            All Courses
          </h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{courses.length}</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                  <th className="p-4 pl-6">Course Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Faculty</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 max-w-[200px] truncate" title={course.title}>{course.title}</div>
                      <div className="text-sm text-slate-500 line-clamp-1">{course.description}</div>
                      <div className="text-xs text-slate-400 mt-1">{course.classDays?.join(', ')} | {course.classTime}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold tracking-wider">{course.courseCode}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium max-w-[200px] truncate" title={course.faculty}>{course.faculty}</td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No courses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Edit2 size={16} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Edit Course</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course Title</label>
                    <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course Code</label>
                    <input type="text" value={editFormData.courseCode} onChange={(e) => setEditFormData({...editFormData, courseCode: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold uppercase focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Faculty</label>
                    <select value={isEditCustomFaculty ? "Custom" : editFormData.faculty} onChange={handleEditFacultyChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all">
                      <option value="" disabled>Select Faculty</option>
                      {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                      <option value="Custom" className="font-bold text-blue-600">Other (Custom)</option>
                    </select>
                    {isEditCustomFaculty && (
                      <input 
                        required 
                        value={editFormData.faculty} 
                        onChange={(e) => setEditFormData({...editFormData, faculty: e.target.value})} 
                        placeholder="Type custom faculty name..." 
                        className="w-full px-4 py-3 bg-blue-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all mt-2" 
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Semester</label>
                    <input type="number" min="1" value={editFormData.semester} onChange={(e) => setEditFormData({...editFormData, semester: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Description</label>
                    <input type="text" value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Class Time</label>
                    <input type="text" value={editFormData.classTime} onChange={(e) => setEditFormData({...editFormData, classTime: e.target.value})} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Class Days</label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={editFormData.classDays?.includes(day) || false}
                            onChange={() => {
                              if (editFormData.classDays?.includes(day)) {
                                setEditFormData({...editFormData, classDays: editFormData.classDays.filter(d => d !== day)});
                              } else {
                                setEditFormData({...editFormData, classDays: [...(editFormData.classDays || []), day]});
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-slate-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-70">
                    {updateLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageCourses;
