import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Award, ShieldCheck, BookOpen, Edit2, Loader2, CheckCircle2, X, AlertCircle } from "lucide-react";
import api from "../../api/axios";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', phone: '', address: '', designation: '', dateOfJoining: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setTeacher(response.data.student); // API uses "student" property for all users
          setEditForm({
            email: response.data.student.email || '',
            phone: response.data.student.phone || '',
            address: response.data.student.address || '',
            designation: response.data.student.designation || '',
            dateOfJoining: response.data.student.dateOfJoining ? new Date(response.data.student.dateOfJoining).toISOString().split('T')[0] : ''
          });
          if (response.data.student.photoUrl) {
            setPhotoPreview(response.data.student.photoUrl);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        formData.append(key, editForm[key]);
      });
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      
      const response = await api.put('/auth/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setTeacher(response.data.student);
        setUpdateStatus({ type: 'success', message: 'Profile updated successfully!' });
        
        // Update localStorage so header updates on next render
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...response.data.student };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          setIsEditing(false);
          setUpdateStatus({ type: '', message: '' });
        }, 1500);
      }
    } catch (err) {
      setUpdateStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-indigo-200 border-b-transparent animate-spin-reverse"></div>
        </div>
        <p className="text-indigo-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Profile...</p>
        <style jsx="true">{`
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 shadow-sm max-w-md text-center">
          <p className="font-bold mb-1">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!teacher) return null;

  const stats = [
    { label: "Faculty", value: teacher?.faculty || 'Not Assigned', accent: "Indigo" },
    { label: "Status", value: teacher?.status || 'Active', accent: "Slate" },
    { label: "Assigned Courses", value: teacher?.assignedCourses?.length || "0", accent: "Indigo" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto pb-6 w-full px-2 sm:px-4">
      {/* Page Header */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-indigo-700 font-bold">
          Profile
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Teacher Profile
        </h2>
        <p className="mt-2 text-[13px] md:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Manage your personal details, view your faculty information, and track active assignments.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr] w-full">
        {/* Left Column: Main Identity Card */}
        <div className="bg-white/90 border border-slate-200 shadow-sm rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md min-w-0">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Avatar Section */}
            <div className="relative mx-auto lg:mx-0 shrink-0">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-indigo-500 to-slate-800 p-1 shadow-lg shadow-indigo-200">
                <div className="h-full w-full rounded-full overflow-hidden bg-slate-50 border-2 border-white flex items-center justify-center text-4xl font-bold text-indigo-700">
                  {teacher.photoUrl ? (
                    <img src={teacher.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md border-2 border-white">
                <Award size={18} />
              </div>
            </div>

            {/* Info Section */}
            <div className="text-center lg:text-left flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-700 font-bold">
                {teacher.designation || 'Faculty Member'}
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-1">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {teacher.name}
                </h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-100"
                  title="Edit Profile"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <p className="mt-1 text-[13px] font-medium text-slate-500 flex flex-col lg:flex-row lg:gap-2 lg:items-center justify-center lg:justify-start">
                <span>Reg No: {teacher.regNo}</span>
                <span className="hidden lg:inline text-slate-300">•</span>
                <span>Joined: {teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toLocaleDateString() : 'N/A'}</span>
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 break-all sm:break-words">
                    {teacher.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 break-words">
                    {teacher.phone || 'Not Provided'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100 overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Address</p>
                <p className="mt-1 text-sm font-bold text-slate-900 whitespace-normal break-words">{teacher.address || 'Not Provided'}</p>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm flex items-center justify-between gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Role
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 capitalize truncate">
                  {teacher.role}
                </p>
              </div>
              <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-2.5 text-indigo-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm flex items-center justify-between gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500">Department</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900 truncate">
                  {teacher.faculty}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 text-white shadow-md shadow-indigo-200 shrink-0">
                <BookOpen size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic & Progress */}
        <div className="grid gap-6 min-w-0">
          {/* Academic Snapshot */}
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur-md min-w-0">
            <h3 className="text-base font-bold text-slate-900">
              Teaching Snapshot
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Summary of your faculty role.
            </p>

            <div className="mt-5 space-y-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900 truncate">
                        {item.value}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {item.accent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Profile</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {updateStatus.message && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${updateStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  {updateStatus.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                  <span className="text-sm font-semibold">{updateStatus.message}</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 pb-2">
                <div className="relative h-20 w-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 text-xs font-bold text-center">No Image</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPhotoFile(file);
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Designation</label>
                  <input 
                    type="text" 
                    name="designation"
                    value={editForm.designation}
                    onChange={handleEditChange}
                    placeholder="e.g. Senior Lecturer"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Date of Joining</label>
                  <input 
                    type="date" 
                    name="dateOfJoining"
                    value={editForm.dateOfJoining}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Residential Address</label>
                <textarea 
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 resize-none transition-all"
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updateLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {updateLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
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

export default TeacherProfile;
