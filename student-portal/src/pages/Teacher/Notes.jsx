import React, { useState, useEffect } from 'react';
import { Book, Upload, Trash2, Loader2, AlertCircle, CheckCircle2, FileText, ExternalLink, Download } from 'lucide-react';
import api from '../../api/axios';

const Notes = () => {
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    file: null
  });

  useEffect(() => {
    fetchCoursesAndNotes();
  }, []);

  const fetchCoursesAndNotes = async () => {
    try {
      setLoading(true);
      const [coursesRes, notesRes] = await Promise.all([
        api.get('/teacher/courses'),
        api.get('/academic/notes')
      ]);
      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
      if (notesRes.data.success) setNotes(notesRes.data.notes);
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
    data.append('courseId', formData.courseId);
    data.append('file', formData.file);

    try {
      const res = await api.post('/academic/notes', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Note uploaded successfully!' });
        setFormData({ title: '', description: '', courseId: '', file: null });
        // Optionally reset file input value
        document.getElementById('file-upload').value = null;
        fetchCoursesAndNotes();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to upload note.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await api.delete(`/academic/notes/${id}`);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Note deleted.' });
        fetchCoursesAndNotes();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to delete note.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto pb-12">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold">Academic Resources</p>
        <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Notes</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Upload and organize study materials for your assigned courses.
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
          Upload New Note
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Chapter 1 Summary" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Brief description of the material" required rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 ml-1">File Upload</label>
              <input id="file-upload" type="file" onChange={handleFileChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={submitLoading} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0">
              {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Upload Note
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 pl-2">
          <Book size={18} className="text-slate-400" />
          Uploaded Notes
        </h3>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">No notes uploaded yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {notes.map(note => (
              <div key={note._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{note.title}</h4>
                  <p className="text-xs font-semibold text-indigo-600 mb-2">{note.course?.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{note.description}</p>
                  <div className="mt-4 flex gap-3">
                    <a 
                      href={note.fileUrl?.startsWith('http') ? note.fileUrl : `http://localhost:5000/${note.fileUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={14} /> View
                    </a>
                    <a 
                      href={note.fileUrl?.includes('cloudinary.com') ? note.fileUrl.replace('/upload/', '/upload/fl_attachment/') : (note.fileUrl?.startsWith('http') ? note.fileUrl : `http://localhost:5000/${note.fileUrl}`)}
                      target="_blank" 
                      rel="noreferrer" 
                      download
                      className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download size={14} /> Download
                    </a>
                    <button onClick={() => handleDelete(note._id)} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ml-auto">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
