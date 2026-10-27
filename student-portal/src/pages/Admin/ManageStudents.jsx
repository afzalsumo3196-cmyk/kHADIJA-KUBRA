import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Search, X, Loader2, BookOpen, Save, Trash2, Edit, Clock, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '../../api/axios';

const initialFormState = { 
  name: '', regNo: '', email: '', password: '', faculty: '', programName: '', currentSemester: 1, totalSemesters: 8,
  fatherName: '', cnic: '', dob: '', gender: '', nationality: '',
  presentAddress: '', permanentAddress: '', phone: '',
  previousQualification: '', boardName: '', passingYear: '', totalMarks: '', obtainedMarks: '',
  emergencyGuardianName: '', emergencyRelation: '', emergencyContact: '',
  photo: null, cnicDocument: null, marksheetDocument: null
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

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [isCustomFaculty, setIsCustomFaculty] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load students');
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
          if (isEditMode && key === 'password' && !formData[key]) return; // Skip blank password on edit
          data.append(key, formData[key]);
        }
      });

      let res;
      if (isEditMode) {
        res = await api.put(`/admin/students/${editingStudentId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/admin/students', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        setSuccess(isEditMode ? 'Student successfully updated!' : 'Student successfully registered!');
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingStudentId(null);
        setFormData(initialFormState);
        setIsCustomFaculty(false);
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setSelectedCourses(student.assignedCourses ? student.assignedCourses.map(c => c._id || c) : []);
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
        userId: selectedStudent._id,
        courseIds: selectedCourses
      });
      if (res.data.success) {
        setSuccess('Courses assigned successfully!');
        setAssignModalOpen(false);
        fetchStudents();
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
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await api.delete(`/admin/user/${id}`);
      if (res.data.success) {
        setSuccess('Student deleted successfully');
        fetchStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.regNo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.faculty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Manage Students
            <span className="text-base bg-blue-100 text-blue-700 py-1 px-3 rounded-full ml-2 font-bold">{students.length} Total</span>
          </h2>
          <p className="mt-1 text-slate-500">View and register new students.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingStudentId(null);
              setFormData(initialFormState);
              setIsCustomFaculty(false);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md hover:-translate-y-0.5"
          >
            <UserPlus size={18} /> Add New Student
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
                {paginatedStudents.map((student, index) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-slate-500 font-semibold">{startIndex + index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-500 shadow-inner">
                          {student.photoUrl ? (
                            <img src={student.photoUrl ? ( student.photoUrl.startsWith('http') ? student.photoUrl : `http://localhost:5000/${student.photoUrl.replace(/\\/g, '/')}` ) : ''} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{student.regNo}</td>
                    <td className="p-4 text-slate-600">{student.faculty}</td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        {student.assignedCourses?.length || 0}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        onClick={() => openAssignModal(student)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors"
                        title="Assign Courses"
                      >
                        <BookOpen size={16} /> <span className="hidden sm:inline">Assign Courses</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditMode(true);
                          setEditingStudentId(student._id);
                          setFormData({
                            ...initialFormState,
                            ...student,
                            password: '', // Leave empty so we don't accidentally update it
                            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '', // Format date for input
                            photo: null, cnicDocument: null, marksheetDocument: null // clear file inputs
                          });
                          setIsCustomFaculty(!FACULTIES.includes(student.faculty || ''));
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors"
                        title="Edit Student"
                      >
                        <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(student._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredStudents.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Summary and Records info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
              <span>
                Showing <strong className="text-slate-800">{totalStudents > 0 ? startIndex + 1 : 0}</strong> to{' '}
                <strong className="text-slate-800">{endIndex}</strong> of{' '}
                <strong className="text-slate-900 font-bold">{totalStudents}</strong> students
              </span>

              {/* Rows Per Page Dropdown */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-slate-400 font-medium">Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft size={15} />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs">...</span>
                  ) : (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        safeCurrentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm scale-105'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <ChevronRight size={15} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight size={15} />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-backdrop-enter">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col animate-modal-enter max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">{isEditMode ? 'Edit Student Details' : 'Add Student'}</h3>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input required name="user_full_name_random" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Registration No.</label>
                    <input required name="user_regno_random" value={formData.regNo} onChange={(e) => setFormData({ ...formData, regNo: e.target.value })} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input required type="email" name="user_email_random" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoComplete="nope" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Password {isEditMode && <span className="text-slate-400 font-normal text-xs">(Leave blank to keep current)</span>}
                    </label>
                    <input required={!isEditMode} type="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Faculty / Department</label>
                    <select 
                      name="faculty" 
                      value={isCustomFaculty ? "Custom" : formData.faculty} 
                      onChange={handleFacultyChange} 
                      required 
                      className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white"
                    >
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
                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all mt-2 bg-blue-50/50" 
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Program Name</label>
                    <input required name="programName" value={formData.programName} onChange={handleChange} placeholder="e.g. Diploma in Islamic Studies" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Current Semester</label>
                    <input required type="number" min="1" name="currentSemester" value={formData.currentSemester} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Semesters</label>
                    <input required type="number" min="1" name="totalSemesters" value={formData.totalSemesters} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Father / Guardian Name</label>
                      <input name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">CNIC / B-Form Number</label>
                      <input name="cnic" value={formData.cnic} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                      <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nationality / Domicile</label>
                      <input name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Contact Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number / WhatsApp</label>
                      <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Present Address</label>
                      <input name="presentAddress" value={formData.presentAddress} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Permanent Address</label>
                      <input name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Academic Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Previous Qualification</label>
                      <input name="previousQualification" value={formData.previousQualification} onChange={handleChange} placeholder="e.g. Intermediate / A-Levels" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Board Name</label>
                      <input name="boardName" value={formData.boardName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Passing Year</label>
                      <input type="text" name="passingYear" value={formData.passingYear} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Total Marks</label>
                      <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Obtained Marks</label>
                      <input type="number" name="obtainedMarks" value={formData.obtainedMarks} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Emergency & Uploads</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Guardian Name</label>
                      <input name="emergencyGuardianName" value={formData.emergencyGuardianName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Relation</label>
                      <input name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
                      <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                    </div>

                    <div className="sm:col-span-2 mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-slate-700">Passport Size Photo</label>
                        {isEditMode && formData.photoUrl && (
                          <a href={formData.photoUrl ? ( formData.photoUrl.startsWith('http') ? formData.photoUrl : `http://localhost:5000/${formData.photoUrl.replace(/\\/g, '/')}` ) : ''} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold">View Current Photo</a>
                        )}
                      </div>
                      <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="w-full border border-slate-200 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-slate-700">CNIC / B-Form Copy</label>
                        {isEditMode && formData.cnicUrl && (
                          <a href={formData.cnicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold">View Current Document</a>
                        )}
                      </div>
                      <input type="file" name="cnicDocument" accept="image/*,.pdf" onChange={handleFileChange} className="w-full border border-slate-200 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-slate-700">Matric & Inter Marksheets</label>
                        {isEditMode && formData.marksheetUrl && (
                          <a href={formData.marksheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold">View Current Marksheet</a>
                        )}
                      </div>
                      <input type="file" name="marksheetDocument" accept="image/*,.pdf" onChange={handleFileChange} className="w-full border border-slate-200 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 shrink-0">
                  <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-3 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : isEditMode ? 'Update Student' : 'Register Student'}
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
                <p className="text-sm text-slate-500 mt-1">For {selectedStudent?.name}</p>
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

export default ManageStudents;
