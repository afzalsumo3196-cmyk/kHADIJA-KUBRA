import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Save, FileText, CheckCircle2, AlertCircle, Edit, Trash2, X, Upload } from 'lucide-react';
import api from '../../api/axios';

const ManageOutlines = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    outlineTitle: '',
    outlineDescription: '',
    file: null
  });

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

  const handleOpenModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      outlineTitle: course.outlineTitle || '',
      outlineDescription: course.outlineDescription || '',
      file: null
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = new FormData();
      data.append('outlineTitle', formData.outlineTitle);
      data.append('outlineDescription', formData.outlineDescription);
      if (formData.file) {
        data.append('file', formData.file);
      }

      const res = await api.put(`/admin/courses/${selectedCourse._id}/outline`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setStatus({ type: 'success', message: 'Course outline updated successfully!' });
        setIsModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update outline' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteOutline = async (courseId) => {
    if (!window.confirm('Are you sure you want to remove this course outline?')) return;
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.delete(`/admin/courses/${courseId}/outline`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Course outline deleted successfully' });
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to delete outline' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Academic Syllabus</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="text-blue-600" /> Manage Course Outlines
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Provide syllabus outlines and files for each course. Assigned teachers will see these in their portal.
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-slate-400" />
            Courses Outlines Status
          </h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{courses.length} Courses</span>
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
                  <th className="p-4 pl-6">Course Name & Code</th>
                  <th className="p-4">Outline Title</th>
                  <th className="p-4">File Attachment</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">{course.title}</div>
                      <div className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1 font-bold">{course.courseCode}</div>
                    </td>
                    <td className="p-4">
                      {course.outlineTitle ? (
                        <div className="text-sm text-slate-800 font-semibold">{course.outlineTitle}</div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">No Outline Provided</span>
                      )}
                      {course.outlineDescription && (
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{course.outlineDescription}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {course.outlineFile ? (
                        <a href={course.outlineFile} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1">
                          <FileText size={14} /> View File
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No file uploaded</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {course.outlineTitle ? new Date(course.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(course)}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center gap-1"
                          title="Manage Outline"
                        >
                          <Edit size={14} /> Update Outline
                        </button>
                        {course.outlineTitle && (
                          <button
                            onClick={() => handleDeleteOutline(course._id)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove Outline"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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

      {/* Upload/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl animate-scale-up overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Upload size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Manage Outline</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{selectedCourse?.title} ({selectedCourse?.courseCode})</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Outline Title</label>
                <input
                  type="text"
                  name="outlineTitle"
                  value={formData.outlineTitle}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Fiqh Level 1 Syllabus"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Outline Description</label>
                <textarea
                  name="outlineDescription"
                  value={formData.outlineDescription}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Briefly describe the syllabus contents or key topics..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Upload Outline File (PDF / Word / Image)</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedCourse?.outlineFile && !formData.file && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ An outline file is already uploaded. Uploading a new file will replace it.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitLoading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-70">
                  {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Outline
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

export default ManageOutlines;
