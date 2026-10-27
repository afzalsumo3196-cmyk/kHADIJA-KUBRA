import React, { useState, useEffect } from 'react';
import { Book, Loader2, FileText, Download, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

const Notes = ({ courseId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [courseId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/academic/notes?courseId=${courseId}` : '/academic/notes';
      const res = await api.get(url);
      if (res.data.success) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-8 animate-fade-in-up ${courseId ? '' : 'max-w-5xl mx-auto pb-12'}`}>
      {!courseId && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-bold">Academic Resources</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Study Notes</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Access lecture slides, reading materials, and supplementary notes provided by your instructors.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 pl-2">
          <Book size={18} className="text-slate-400" />
          Available Notes
        </h3>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">No notes available yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {notes.map(note => (
              <div key={note._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:border-emerald-200 transition-colors">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{note.title}</h4>
                  <p className="text-xs font-semibold text-emerald-600 mb-2">{note.course?.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{note.description}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <a 
                      href={note.fileUrl?.startsWith('http') ? note.fileUrl : `http://localhost:5000/${note.fileUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink size={16} /> View
                    </a>
                    <a 
                      href={note.fileUrl?.includes('cloudinary.com') ? note.fileUrl.replace('/upload/', '/upload/fl_attachment/') : (note.fileUrl?.startsWith('http') ? note.fileUrl : `http://localhost:5000/${note.fileUrl}`)}
                      target="_blank" 
                      rel="noreferrer" 
                      download
                      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Download size={16} /> Download
                    </a>
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
