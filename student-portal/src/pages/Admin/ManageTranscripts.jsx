import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  User, 
  BookOpen, 
  GraduationCap, 
  ChevronRight, 
  CloudLightning,
  History,
  FileUp
} from 'lucide-react';
import api from '../../api/axios';

const ManageTranscripts = () => {
  const [formData, setFormData] = useState({ regNo: '', semester: '1', customSemester: '', file: null });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);

  const [allTranscripts, setAllTranscripts] = useState([]);
  const [allTranscriptsLoading, setAllTranscriptsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [studentsRes, transcriptsRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/transcripts')
        ]);
        
        if (studentsRes.data.success) {
          setStudents(studentsRes.data.students);
        }
        if (transcriptsRes.data.success) {
          setAllTranscripts(transcriptsRes.data.transcripts);
        }
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      } finally {
        setStudentsLoading(false);
        setAllTranscriptsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchTranscriptsForStudent = async (regNo) => {
    try {
      setTranscriptsLoading(true);
      const res = await api.get(`/admin/transcripts/student/${regNo}`);
      if (res.data.success) {
        setTranscripts(res.data.transcripts);
      }
    } catch (err) {
      console.error('Failed to load transcripts', err);
    } finally {
      setTranscriptsLoading(false);
    }
  };

  const fetchAllTranscripts = async () => {
    try {
      const res = await api.get('/admin/transcripts');
      if (res.data.success) {
        setAllTranscripts(res.data.transcripts);
      }
    } catch (err) {
      console.error('Failed to load all transcripts', err);
    }
  };

  const handleDeleteTranscript = async (id, regNo) => {
    if (!window.confirm('Are you sure you want to delete this transcript?')) return;
    try {
      const res = await api.delete(`/admin/transcripts/${id}`);
      if (res.data.success) {
        if (regNo) fetchTranscriptsForStudent(regNo);
        fetchAllTranscripts();
        setStatus({ type: 'success', message: 'Transcript deleted successfully' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      }
    } catch (err) {
      console.error('Failed to delete transcript', err);
      setStatus({ type: 'error', message: 'Failed to delete transcript' });
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'file') {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setFormData({ ...formData, regNo: student.regNo });
    setSearchQuery(`${student.regNo} - ${student.name}`);
    setIsOpen(false);
    fetchTranscriptsForStudent(student.regNo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
        setStatus({ type: 'error', message: 'Please select a student first.' });
        return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const form = new FormData();
      form.append('regNo', formData.regNo);
      
      const finalSemester = formData.semester === 'Custom' ? formData.customSemester.trim() : formData.semester;
      if (formData.semester === 'Custom' && !finalSemester) {
          setStatus({ type: 'error', message: 'Please enter a custom semester name.' });
          setLoading(false);
          return;
      }
      form.append('semester', finalSemester);
      
      if (formData.file) form.append('file', formData.file);

      const response = await api.post('/admin/transcripts', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setStatus({ type: 'success', message: 'Transcript uploaded and assigned successfully!' });
        setFormData({ ...formData, file: null, customSemester: '' });
        document.getElementById('transcript-file-upload').value = '';
        fetchTranscriptsForStudent(selectedStudent.regNo);
        fetchAllTranscripts();
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to upload transcript' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto pb-16 px-4">
      {/* Header section with glassmorphic touch */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-6 md:p-8 shadow-sm">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-20 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider mb-3">
              <CloudLightning size={12} /> Management Portal
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="text-blue-600 stroke-[2.5]" size={30} /> Document Registry
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Upload, update, and manage official semester-wise transcripts. Documents are securely linked to student profiles.
            </p>
          </div>
          <div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                showHistory 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
            >
              <History size={16} /> 
              {showHistory ? 'Hide All History' : 'Show All History'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Form Card (5 Cols on Large Screens) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2.5 text-base">
                <FileUp className="text-blue-500" size={18} />
                Publish Transcript
              </h3>
              <p className="text-xs text-slate-500 mt-1">Select student, select semester, and drop PDF/Image file.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {status.message && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-fade-in ${status.type === 'success' ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' : 'bg-red-50/70 border-red-100 text-red-700'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />}
                  <span className="text-xs font-bold leading-relaxed">{status.message}</span>
                </div>
              )}

              {/* Student autocomplete input */}
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 ml-1">Search Student</label>
                {studentsLoading ? (
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-500" /> Loading database...
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsOpen(true);
                          if (selectedStudent) {
                              setSelectedStudent(null);
                              setFormData({ ...formData, regNo: '' });
                              setTranscripts([]);
                          }
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Type name or registration number..."
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                        required={!formData.regNo}
                      />
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                    
                    {isOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-slate-50">
                        {students.filter(student => 
                          student.regNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.name.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length > 0 ? (
                          students.filter(student => 
                            student.regNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.name.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map(student => (
                            <div 
                              key={student._id}
                              className="px-4 py-3.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors flex items-center justify-between"
                              onClick={() => handleSelectStudent(student)}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{student.name}</span>
                                <span className="text-xs text-slate-500 font-semibold mt-0.5">{student.regNo}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-400" />
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-xs text-slate-400 text-center flex flex-col items-center justify-center">
                            <span>No students found in registry</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isOpen && (
                      <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    )}
                  </div>
                )}
              </div>

              {/* Semester selectors */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 ml-1">Semester / Term</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700 font-bold cursor-pointer">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                    <option value="Custom">Custom Semester (Type Name)</option>
                  </select>
                </div>
                
                {formData.semester === 'Custom' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 ml-1">Custom Term Name</label>
                    <input type="text" name="customSemester" value={formData.customSemester} onChange={handleChange} required className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" placeholder="e.g. Fall 2026, Summer-24" />
                  </div>
                )}
              </div>

              {/* PDF upload field */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 ml-1">Upload Document (PDF/Image)</label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition-all text-center group cursor-pointer">
                  <input 
                    type="file" 
                    id="transcript-file-upload" 
                    name="file" 
                    accept="application/pdf, image/*" 
                    onChange={handleChange} 
                    required 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-full flex items-center justify-center transition-colors">
                      <Upload size={18} />
                    </div>
                    {formData.file ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[240px]">{formData.file.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">Choose file or drag it here</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">PDF or Image up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || !selectedStudent} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-sm">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Upload size={16} /> Publish Transcript</>}
              </button>
            </form>
          </div>
        </div>

        {/* Status Dashboard & Info Card (7 Cols on Large Screens) */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedStudent ? (
            <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[460px]">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-200/60 shadow-inner">
                <User size={24} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No Student Profile Selected</h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                Use the search tool on the left to select a student. Once chosen, their profile summary and academic history dashboard will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Profile Summary Card with clean dark grid pattern */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
                <div className="absolute right-0 top-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute left-1/4 bottom-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner backdrop-blur-sm">
                    <User size={30} className="text-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-400">Selected Profile</span>
                    <h3 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-xl text-xs font-bold border border-white/5 backdrop-blur-sm">
                        <BookOpen size={12} className="text-blue-300" /> {selectedStudent.regNo}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-xl text-xs font-semibold border border-white/5 backdrop-blur-sm">
                        <GraduationCap size={12} className="text-indigo-300" /> {selectedStudent.faculty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Dashboard Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-slate-400" />
                    Semester Status Dashboard
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase bg-white px-2.5 py-1 border border-slate-200/80 rounded-xl shadow-xs">Semesters 1-8</span>
                </div>

                {transcriptsLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold bg-slate-50/30">
                          <th className="p-4 pl-6">Semester</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Document Link</th>
                          <th className="p-4 pr-6 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transcripts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400 font-bold text-xs">
                              No transcripts uploaded for this student yet.
                            </td>
                          </tr>
                        ) : (
                          [...transcripts]
                            .sort((a, b) => {
                              const numA = parseInt(a.semester, 10);
                              const numB = parseInt(b, 10);
                              if (!isNaN(numA) && !isNaN(numB)) {
                                return numA - numB;
                              }
                              return a.semester.localeCompare(b.semester);
                            })
                            .map((t) => (
                              <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 pl-6 font-bold text-slate-800 text-sm flex items-center gap-2">
                                  {['1','2','3','4','5','6','7','8'].includes(t.semester) ? `Semester ${t.semester}` : t.semester}
                                  {!['1','2','3','4','5','6','7','8'].includes(t.semester) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">Custom</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Uploaded
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-xs border border-blue-100/50">
                                    <ExternalLink size={12} /> View File
                                  </a>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <button 
                                    onClick={() => handleDeleteTranscript(t._id, selectedStudent.regNo)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Transcript"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Transcripts History Section */}
      {showHistory && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2.5 text-base">
                <History size={18} className="text-slate-500" />
                All Uploaded Transcripts
              </h3>
              <p className="text-xs text-slate-500 mt-1">Audit log of all documents present in the cloud storage database.</p>
            </div>
            <span className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm">{allTranscripts.length}</span>
          </div>

          {allTranscriptsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold bg-slate-50/30">
                    <th className="p-4 pl-6">Student RegNo</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Uploaded At</th>
                    <th className="p-4 text-center">Document</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTranscripts.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800 text-xs">{t.regNo}</td>
                      <td className="p-4 font-bold text-slate-700 text-xs">
                        {['1','2','3','4','5','6','7','8'].includes(t.semester) ? `Semester ${t.semester}` : t.semester}
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-semibold">
                        {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-center">
                        <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs border border-slate-200/50">
                          <ExternalLink size={12} /> View File
                        </a>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => handleDeleteTranscript(t._id, selectedStudent?.regNo)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Transcript"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allTranscripts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-16 text-center text-slate-400 font-bold text-xs">No records present in registry database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageTranscripts;
