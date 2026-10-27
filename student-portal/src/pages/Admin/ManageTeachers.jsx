import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Search, X, Loader2, BookOpen, Save, Trash2, Edit2, Clock, Calendar } from 'lucide-react';
import api from '../../api/axios';

const initialFormState = { 
  name: '', regNo: '', email: '', password: '', faculty: '',
  cnic: '', presentAddress: '',
  highestDegree: '', specialization: '', instituteName: '', passingYear: '',
  experienceYears: 0, previousInstitute: '', keySubjectsTaught: '',
  appliedPosition: '', department: '', preferredShift: '',
  cvDocument: null, degreeDocument: null, coverLetterDocument: null
};

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

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [isCustomFaculty, setIsCustomFaculty] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isModalOpen || assignModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, assignModalOpen]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/teachers');
      if (res.data.success) {
        setTeachers(res.data.teachers);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
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

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (isEditMode && key === 'password' && !formData[key]) return; // Skip blank password
          data.append(key, formData[key]);
        }
      });

      let res;
      if (isEditMode) {
        res = await api.put(`/admin/teachers/${editTeacherId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/admin/teachers', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (res.data.success) {
        setSuccess(isEditMode ? 'Teacher successfully updated!' : 'Teacher successfully registered!');
        setIsModalOpen(false);
        setFormData(initialFormState);
        setIsCustomFaculty(false);
        setIsEditMode(false);
        setEditTeacherId(null);
        fetchTeachers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || (isEditMode ? 'Failed to update teacher' : 'Failed to add teacher'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (teacher) => {
    setIsEditMode(true);
    setEditTeacherId(teacher._id);
    setFormData({
      ...initialFormState,
      ...teacher,
      password: '', // blank password initially on edit
      cvDocument: null,
      degreeDocument: null,
      coverLetterDocument: null
    });
    setIsCustomFaculty(!FACULTIES.includes(teacher.faculty || ''));
    setIsModalOpen(true);
  };

  const openAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedCourses(teacher.assignedCourses ? teacher.assignedCourses.map(c => c._id || c) : []);
    setCourseSearchQuery('');
    setAssignModalOpen(true);
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      const res = await api.post('/admin/assign-courses', {
        userId: selectedTeacher._id,
        courseIds: selectedCourses
      });
      if (res.data.success) {
        setSuccess('Courses assigned successfully!');
        setAssignModalOpen(false);
        fetchTeachers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign courses');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const res = await api.delete(`/admin/user/${id}`);
      if (res.data.success) {
        setSuccess('Teacher deleted successfully');
        fetchTeachers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.regNo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.faculty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Manage Teachers
            <span className="text-base bg-blue-100 text-blue-700 py-1 px-3 rounded-full ml-2 font-bold">{teachers.length} Total</span>
          </h2>
          <p className="mt-1 text-slate-500">View and register faculty members.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teachers..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditTeacherId(null);
              setFormData(initialFormState);
              setIsCustomFaculty(false);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md hover:-translate-y-0.5"
          >
            <UserPlus size={18} /> Add New Teacher
          </button>
        </div>
      </div>

      {success && <div className="text-emerald-600 bg-emerald-50 p-4 rounded-xl font-bold">{success}</div>}
      {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl font-bold">{error}</div>}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-bold">
                  <th className="p-4 pl-6 w-16">#</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Reg No</th>
                  <th className="p-4">Faculty</th>
                  <th className="p-4 text-center">Courses</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher, index) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-slate-500 font-semibold">{index + 1}</td>
                    <td className="p-4 max-w-[250px]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                          {teacher.photoUrl ? (
                            <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                          ) : (
                            teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate" title={teacher.name}>{teacher.name}</div>
                          <div className="text-sm text-slate-500 truncate" title={teacher.email}>{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700 whitespace-nowrap">{teacher.regNo}</td>
                    <td className="p-4 text-slate-600 max-w-[200px] truncate" title={teacher.faculty}>{teacher.faculty}</td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {teacher.assignedCourses?.length || 0}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        onClick={() => openAssignModal(teacher)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                        title="Assign Courses"
                      >
                        <BookOpen size={16} /> <span className="hidden sm:inline">Assign Courses</span>
                      </button>
                      <button 
                        onClick={() => handleEditClick(teacher)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-sm font-bold transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(teacher._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                        title="Delete Teacher"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No teachers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-backdrop-enter">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col animate-modal-enter max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">{isEditMode ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                {/* Hidden fields to trap aggressive browser autofill */}
                <input type="text" name="trap_username" style={{display: 'none'}} aria-hidden="true" autoComplete="username" />
                <input type="password" name="trap_password" style={{display: 'none'}} aria-hidden="true" autoComplete="current-password" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Full Name</label>
                    <input required name="name" value={formData.name} onChange={handleChange} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Registration No.</label>
                    <input required name="regNo" value={formData.regNo} onChange={handleChange} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Email</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">
                      Password {isEditMode && <span className="text-slate-400 font-normal lowercase">(Blank to keep current)</span>}
                    </label>
                    <input required={!isEditMode} type="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">1. Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">CNIC Number</label>
                      <input name="cnic" value={formData.cnic} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">City / Address</label>
                      <input name="presentAddress" value={formData.presentAddress} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                </div>

                {/* Academic Qualifications */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">2. Academic Qualifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Highest Degree</label>
                      <input name="highestDegree" value={formData.highestDegree} onChange={handleChange} placeholder="e.g., Master's, PhD" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Specialization / Major</label>
                      <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g., Computer Science" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Institute / University</label>
                      <input name="instituteName" value={formData.instituteName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Passing Year</label>
                      <input name="passingYear" value={formData.passingYear} onChange={handleChange} type="number" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                </div>

                {/* Teaching Experience */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">3. Teaching Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Total Years of Experience</label>
                      <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Previous Institute Name</label>
                      <input name="previousInstitute" value={formData.previousInstitute} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Key Subjects Taught</label>
                    <input name="keySubjectsTaught" value={formData.keySubjectsTaught} onChange={handleChange} placeholder="e.g., Math, Physics" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium" />
                  </div>
                </div>

                {/* Job Preferences */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">4. Job Preferences</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Applied Position</label>
                      <select name="appliedPosition" value={formData.appliedPosition} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white text-sm font-medium">
                        <option value="">Select Position</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lab Instructor">Lab Instructor</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Department/Faculty</label>
                      <select 
                        name="faculty" 
                        value={isCustomFaculty ? "Custom" : formData.faculty} 
                        onChange={handleFacultyChange} 
                        required 
                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white text-sm font-medium"
                      >
                        <option value="" disabled>Select Department</option>
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
                          className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all mt-2 text-sm font-medium bg-blue-50/50" 
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Preferred Shift</label>
                      <select name="preferredShift" value={formData.preferredShift} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white text-sm font-medium">
                        <option value="">Select Shift</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Weekend">Weekend</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">5. Document Uploads</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500">Updated CV / Resume</label>
                        {isEditMode && formData.cvUrl && (
                          <a href={formData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline font-bold">View Current CV</a>
                        )}
                      </div>
                      <input type="file" name="cvDocument" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500">Degree Certificates / Transcripts</label>
                        {isEditMode && formData.degreeUrl && (
                          <a href={formData.degreeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline font-bold">View Current Degree</a>
                        )}
                      </div>
                      <input type="file" name="degreeDocument" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-500">Cover Letter (Optional)</label>
                        {isEditMode && formData.coverLetterUrl && (
                          <a href={formData.coverLetterUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline font-bold">View Current Letter</a>
                        )}
                      </div>
                      <input type="file" name="coverLetterDocument" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-2" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 shrink-0 border-t border-slate-100 mt-6">
                  <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-4 transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center gap-2 text-lg">
                    {submitting ? <><Loader2 size={20} className="animate-spin" /> {isEditMode ? 'Updating Record...' : 'Registering Teacher...'}</> : (isEditMode ? 'Update Teacher Record' : 'Register New Teacher')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Courses Modal */}
      {assignModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-backdrop-enter">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col animate-modal-enter max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Assign Courses</h3>
                <p className="text-sm text-slate-500 mt-1">For {selectedTeacher?.name}</p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                <X size={24} />
              </button>
            </div>

            {/* Premium Course Search Bar */}
            {courses.length > 0 && (
              <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <input 
                    type="text" 
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    placeholder="Search courses by name, code, or faculty..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            )}
            
            <form onSubmit={handleAssignSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
                {courses.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No courses available. Create a course first.</p>
                ) : (
                  (() => {
                    const filtered = courses.filter(course => 
                      course.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                      course.courseCode.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                      (course.faculty && course.faculty.toLowerCase().includes(courseSearchQuery.toLowerCase()))
                    );

                    if (filtered.length === 0) {
                      return <p className="text-center text-slate-400 py-4 text-xs font-semibold">No matching courses found.</p>;
                    }

                    return filtered.map(course => {
                      const isSelected = selectedCourses.includes(course._id);
                      return (
                        <label 
                          key={course._id} 
                          className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden select-none ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600' 
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center h-5 mt-0.5 shrink-0">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleCourseSelection(course._id)}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider mb-1">
                                {course.courseCode}
                              </span>
                              <div className="font-extrabold text-slate-900 text-sm leading-snug">{course.title}</div>
                              <div className="text-xs text-slate-400 font-semibold mt-0.5">{course.faculty}</div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600/90 bg-indigo-50/70 px-2 py-1 rounded-lg">
                                <Clock size={12} className="text-indigo-500" />
                                {course.classTime || 'Timing TBA'}
                              </span>
                              {course.classDays && course.classDays.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-150 px-2 py-1 rounded-lg">
                                  <Calendar size={12} className="text-slate-500" />
                                  {course.classDays.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    });
                  })()
                )}
              </div>
              
              <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={assignLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-70">
                  {assignLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageTeachers;
