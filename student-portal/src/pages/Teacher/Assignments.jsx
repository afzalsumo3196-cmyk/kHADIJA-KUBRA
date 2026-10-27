import React, { useState, useEffect } from 'react';
import { PenTool, Upload, Trash2, Loader2, AlertCircle, CheckCircle2, FileText, Calendar, Users, X, Download } from 'lucide-react';
import api from '../../api/axios';

const Assignments = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    courseId: '',
    file: null
  });

  useEffect(() => {
    fetchCoursesAndAssignments();
  }, []);

  const fetchCoursesAndAssignments = async () => {
    try {
      setLoading(true);
      const [coursesRes, assignRes] = await Promise.all([
        api.get('/teacher/courses'),
        api.get('/academic/assignments')
      ]);
      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
      if (assignRes.data.success) setAssignments(assignRes.data.assignments);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setStatus({ type: 'error', message: 'Please select a file to upload.' });
      return;
    }

    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('deadline', formData.deadline);
    data.append('courseId', formData.courseId);
    data.append('file', formData.file);

    try {
      const res = await api.post('/academic/assignments', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Assignment uploaded successfully!' });
        setFormData({ title: '', description: '', deadline: '', courseId: '', file: null });
        document.getElementById('assign-file-upload').value = null;
        fetchCoursesAndAssignments();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to upload assignment.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await api.delete(`/academic/assignments/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Assignment deleted.' });
        fetchCoursesAndAssignments();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to delete assignment.' });
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setViewingAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/academic/assignments/submissions?assignmentId=${assignment._id}`);
      if (res.data.success) {
        setSubmissions(res.data.submissions);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load submissions.' });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold">Academic Tasks</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Assignments</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Upload assignment briefs and set deadlines for your students.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Upload size={18} className="text-indigo-600" />
          Create Assignment
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Assignment 1: Case Study" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course</label>
              <select name="courseId" value={formData.courseId} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                <option value="" disabled>Select Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Deadline</label>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">File Upload</label>
              <input id="assign-file-upload" type="file" onChange={handleFileChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Instructions / Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Detailed instructions..." required rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={submitLoading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Upload Assignment
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 pl-2">
          <PenTool size={18} className="text-slate-400" />
          Active Assignments
        </h3>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">No assignments created yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {assignments.map(assignment => (
              <div key={assignment._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors">
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{assignment.title}</h4>
                  <p className="text-xs font-semibold text-indigo-600 mb-1">{assignment.course?.title}</p>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2">
                    <Calendar size={12}/> Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2">{assignment.description}</p>
                  <div className="mt-4 flex gap-3">
                    <a href={assignment.fileUrl?.startsWith('http') ? assignment.fileUrl : `http://localhost:5000/${assignment.fileUrl}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">View Brief</a>
                    <button onClick={() => handleViewSubmissions(assignment)} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                      <Users size={14} /> Submissions
                    </button>
                    <button onClick={() => handleDelete(assignment._id)} className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">{viewingAssignment.title}</h3>
                <p className="text-sm font-bold text-indigo-600 mt-1">Student Submissions</p>
              </div>
              <button onClick={() => setViewingAssignment(null)} className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingSubmissions ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No students have submitted yet.</div>
              ) : (
                <div className="space-y-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider text-xs font-bold">
                        <th className="p-4 pl-6">Student</th>
                        <th className="p-4">Reg No</th>
                        <th className="p-4">Submitted At</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map(sub => {
                        const deadlineDate = new Date(viewingAssignment.deadline);
                        const submittedDate = new Date(sub.submittedAt);
                        const isLate = submittedDate > deadlineDate;
                        const daysLate = isLate ? Math.ceil((submittedDate - deadlineDate) / (1000 * 60 * 60 * 24)) : 0;
                        
                        return (
                          <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900">{sub.student?.name}</td>
                            <td className="p-4 text-sm text-slate-500">{sub.student?.regNo}</td>
                            <td className="p-4 text-sm text-slate-500 font-medium">
                              {submittedDate.toLocaleDateString()} {submittedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4">
                              {isLate ? (
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 tracking-widest uppercase">
                                  {daysLate} Days Late
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 tracking-widest uppercase">
                                  On Time
                                </span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <a 
                                href={sub.fileUrl?.startsWith('http') ? sub.fileUrl : `http://localhost:5000/${sub.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Download size={14} /> Download
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
