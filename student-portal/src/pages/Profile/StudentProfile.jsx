import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Award, ShieldCheck, CircleDollarSign, Edit2, Loader2, CheckCircle2, X, AlertCircle } from "lucide-react";
import api from "../../api/axios";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', phone: '', address: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setStudent(response.data.student);
          setEditForm({
            email: response.data.student.email || '',
            phone: response.data.student.phone || '',
            address: response.data.student.address || '',
            fatherName: response.data.student.fatherName || '',
            cnic: response.data.student.cnic || '',
            dob: response.data.student.dob ? new Date(response.data.student.dob).toISOString().split('T')[0] : '',
            gender: response.data.student.gender || '',
            nationality: response.data.student.nationality || '',
            presentAddress: response.data.student.presentAddress || '',
            permanentAddress: response.data.student.permanentAddress || '',
            photo: null
          });
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

  const handleFileChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.files[0] });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateStatus({ type: '', message: '' });

    try {
      const data = new FormData();
      Object.keys(editForm).forEach(key => {
        if (editForm[key] !== null && editForm[key] !== undefined && editForm[key] !== '') {
          data.append(key, editForm[key]);
        }
      });

      const response = await api.put('/auth/profile/update', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setStudent(response.data.student);
        setUpdateStatus({ type: 'success', message: 'Profile updated successfully!' });
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
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-emerald-200 border-b-transparent animate-spin-reverse"></div>
        </div>
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Profile...</p>
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

  if (!student) return null;

  const stats = [
    { label: "Current Semester", value: student?.currentSemester ? 'Semester ' + student.currentSemester : 'Active', accent: "Emerald" },
    { label: "Degree Program", value: student?.programName || student?.faculty || 'Not Assigned', accent: "Slate" },
    { label: "CGPA", value: student?.cgpa?.toFixed(2) || "TBD", accent: "Emerald" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold">
          Profile
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Profile
        </h2>
        <p className="mt-2 text-[13px] md:text-sm text-slate-500 max-w-2xl leading-relaxed">
          A premium snapshot of your academic progress, attendance, and active
          institute services.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        {/* Left Column: Main Identity Card */}
        <div className="bg-white/90 border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Avatar Section */}
            <div className="relative mx-auto lg:mx-0 shrink-0">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-emerald-500 to-slate-800 p-1 shadow-lg shadow-emerald-200">
                <div className="h-full w-full rounded-full overflow-hidden bg-slate-50 border-2 border-white flex items-center justify-center text-4xl font-bold text-emerald-700">
                  {student.photoUrl ? (
                    <img src={student.photoUrl ? ( student.photoUrl.startsWith('http') ? student.photoUrl : `http://localhost:5000/${student.photoUrl.replace(/\\/g, '/')}` ) : ''} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md border-2 border-white">
                <Award size={18} />
              </div>
            </div>

            {/* Info Section */}
            <div className="text-center lg:text-left flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold">
                Scholar
              </p>
              
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-1">
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {student.name}
                </h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-100"
                  title="Edit Profile"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Reg No: {student.regNo}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">
                    {student.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">
                    {student.phone || 'Not Provided'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-colors hover:bg-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Address</p>
                <p className="mt-1 text-sm font-bold text-slate-900 line-clamp-1">{student.address || 'Not Provided'}</p>
              </div>

              {/* Detailed Personal Info Section */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Father/Guardian</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">{student.fatherName || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">CNIC / B-Form</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">{student.cnic || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Date of Birth</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">{student.dob ? new Date(student.dob).toLocaleDateString() : '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Gender / Nationality</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">
                    {student.gender || '-'} {student.nationality ? `(${student.nationality})` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats (Attendance & Fee) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm flex items-center justify-between gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Attendance Rate
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {student.attendanceRate || 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-2.5 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm flex items-center justify-between gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div>
                <p className="text-xs font-medium text-slate-500">Fee Status</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  Paid
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-2.5 text-white shadow-md shadow-emerald-200">
                <CircleDollarSign size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic & Progress */}
        <div className="grid gap-6">
          {/* Academic Snapshot */}
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-md">
            <h3 className="text-base font-bold text-slate-900">
              Academic Snapshot
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Summary of semester progress & metrics.
            </p>

            <div className="mt-5 space-y-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {item.accent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Status */}
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
                  Progress
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Milestone Status
                </h3>
              </div>
              <div className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                Active
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2.5">
                  <span>Attendance Overview</span>
                  <span className="text-emerald-600">{student?.attendanceRate || 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${student?.attendanceRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2.5">
                  <span>Active Courses</span>
                  <span className="text-emerald-600">{student?.assignedCourses?.length || 0} Enrolled</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: student?.assignedCourses?.length ? "100%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Profile Details</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleUpdate} className="space-y-6">
                {updateStatus.message && (
                  <div className={`p-4 rounded-2xl flex items-start gap-3 border ${updateStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    {updateStatus.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                    <span className="text-sm font-semibold">{updateStatus.message}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Profile Photo</label>
                  <input 
                    type="file" 
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all border border-slate-200 rounded-2xl p-2 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Phone Number</label>
                    <input 
                      type="text" 
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Father / Guardian Name</label>
                    <input 
                      type="text" 
                      name="fatherName"
                      value={editForm.fatherName}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">CNIC / B-Form Number</label>
                    <input 
                      type="text" 
                      name="cnic"
                      value={editForm.cnic}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob"
                      value={editForm.dob}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Gender</label>
                    <select 
                      name="gender"
                      value={editForm.gender}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Nationality / Domicile</label>
                  <input 
                    type="text" 
                    name="nationality"
                    value={editForm.nationality}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Current Address</label>
                  <textarea 
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    rows="2"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium text-slate-900 resize-none transition-all"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={updateLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {updateLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile Changes'}
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

export default StudentProfile;
