import React, { useState, useEffect } from 'react';
import { Upload, Plus, AlertCircle, Loader2, PlayCircle, Clock, CheckCircle2, BookOpen, ExternalLink, Link as LinkIcon, Trash2 } from 'lucide-react';
import api from '../../api/axios';

const ManageLectures = () => {
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [uploadType, setUploadType] = useState('link'); // 'link' or 'file'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    fileUrl: '',
    duration: '',
    file: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecRes, courseRes] = await Promise.all([
        api.get('/teacher/lectures'),
        api.get('/teacher/courses')
      ]);
      if (lecRes.data.success) setLectures(lecRes.data.lectures);
      if (courseRes.data.success) setCourses(courseRes.data.courses);
    } catch (error) {
      console.error('Failed to fetch data');
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

  const handleDeleteLecture = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;
    try {
      const res = await api.delete(`/teacher/lectures/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Lecture deleted successfully!' });
        fetchData();
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to delete lecture.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    if (!formData.courseId) {
      setStatus({ type: 'error', message: 'Please select a course.' });
      setSubmitLoading(false);
      return;
    }

    try {
      let payload;
      let headers = {};
      
      if (uploadType === 'file') {
        if (!formData.file) {
          setStatus({ type: 'error', message: 'Please select a file to upload.' });
          setSubmitLoading(false);
          return;
        }
        payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description || '');
        payload.append('duration', formData.duration || '');
        payload.append('courseId', formData.courseId);
        payload.append('file', formData.file);
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        if (!formData.fileUrl) {
          setStatus({ type: 'error', message: 'Please provide a video link.' });
          setSubmitLoading(false);
          return;
        }
        payload = {
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          courseId: formData.courseId,
          fileUrl: formData.fileUrl
        };
      }

      const response = await api.post('/teacher/lectures', payload, { headers });
      if (response.data.success) {
        setStatus({ type: 'success', message: 'Lecture published successfully!' });
        setFormData({ title: '', description: '', courseId: '', fileUrl: '', duration: '', file: null });
        fetchData(); // Refresh list
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to upload lecture' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold">Content Management</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Video Lectures</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
          Manage video lecture links (Google Drive, YouTube, etc.) bound to your assigned courses.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Upload Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Plus size={18} className="text-indigo-600" /> Add New Lecture Link
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="uploadType" value="link" checked={uploadType === 'link'} onChange={() => setUploadType('link')} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span className="text-sm font-semibold text-slate-700">Provide Link</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="uploadType" value="file" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                <span className="text-sm font-semibold text-slate-700">Upload File</span>
              </label>
            </div>

            {status.message && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                <span className="text-sm font-semibold">{status.message}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Course</label>
              <select name="courseId" value={formData.courseId} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                <option value="" disabled>Select Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.courseCode})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Duration</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock size={16} className="text-slate-400" />
                  </div>
                  <input type="text" name="duration" placeholder="e.g. 45:00" value={formData.duration} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">
                  {uploadType === 'link' ? 'Video Link (Drive/YouTube)' : 'Upload Lecture File'}
                </label>
                {uploadType === 'link' ? (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                      <LinkIcon size={16} className="text-slate-400 group-focus-within:text-indigo-500" />
                    </div>
                    <input type="url" name="fileUrl" value={formData.fileUrl} onChange={handleChange} required={uploadType === 'link'} placeholder="Paste Google Drive or YouTube URL here..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                ) : (
                  <input type="file" name="file" onChange={handleFileChange} required={uploadType === 'file'} accept="video/*,.pdf,.doc,.docx,.ppt,.pptx" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Description (Optional)</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"></textarea>
            </div>

            <button type="submit" disabled={submitLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Publish Lecture</>}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 ml-1">My Uploaded Lectures</h3>
          {loading ? (
            <div className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-slate-400" /></div>
          ) : lectures.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-sm text-slate-500 shadow-sm flex flex-col items-center">
              <BookOpen size={32} className="text-slate-300 mb-3" />
              <p>No video links added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lectures.map((lec) => (
                <div key={lec._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="h-12 w-12 shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <PlayCircle size={24} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-extrabold text-slate-900 truncate" title={lec.title}>{lec.title}</h4>
                      {lec.course && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                          {lec.course.courseCode}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 flex-1 line-clamp-2 leading-relaxed mb-4">{lec.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <Clock size={14} className="text-slate-400" /> {lec.duration || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteLecture(lec._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Lecture"
                      >
                        <Trash2 size={16} />
                      </button>
                      {lec.fileUrl && (
                        <a 
                          href={lec.fileUrl.startsWith('http') ? lec.fileUrl : `http://localhost:5000/${lec.fileUrl.replace(/\\/g, '/')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> View {lec.fileType === 'link' ? 'Link' : 'File'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLectures;
