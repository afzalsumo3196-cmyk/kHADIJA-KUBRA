import React, { useState, useEffect } from 'react';
import { Award, PlusCircle, Loader2, CheckCircle2, User, FileUp, Search, Filter, X, Trash2, Edit } from 'lucide-react';
import api from '../../api/axios';

const ManageCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [formData, setFormData] = useState({ 
    studentId: '', 
    certificateType: 'Character Certificate',
    file: null 
  });
  
  const [editingCertId, setEditingCertId] = useState(null);
  
  const [status, setStatus] = useState({ type: '', message: '' });

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [studentsRes, certsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/certificates')
      ]);
      
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.students);
      }
      if (certsRes.data.success) {
        setCertificates(certsRes.data.certificates);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
      setStudentsLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setFormData({ ...formData, studentId: student.regNo });
    setSearchQuery(`${student.regNo} - ${student.name}`);
    setIsOpen(false);
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
    if (!selectedStudent && !editingCertId) {
      setStatus({ type: 'error', message: 'Please select a student first.' });
      return;
    }
    if (!formData.file && !editingCertId) {
      setStatus({ type: 'error', message: 'Please upload a certificate file.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });
    
    try {
      const form = new FormData();
      form.append('studentId', formData.studentId);
      form.append('certificateType', formData.certificateType);
      if (formData.file) form.append('file', formData.file);

      if (editingCertId) {
        const res = await api.put(`/admin/certificates/${editingCertId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setStatus({ type: 'success', message: 'Certificate updated successfully!' });
          setCertificates(certificates.map(c => c._id === editingCertId ? res.data.certificate : c));
          setFormData({ studentId: '', certificateType: 'Character Certificate', file: null });
          setSelectedStudent(null);
          setSearchQuery('');
          setEditingCertId(null);
          document.getElementById('cert-file-upload').value = '';
        }
      } else {
        const res = await api.post('/admin/certificates', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.success) {
          setStatus({ type: 'success', message: 'Certificate uploaded and issued successfully!' });
          setCertificates([res.data.certificate, ...certificates]);
          setFormData({ studentId: '', certificateType: 'Character Certificate', file: null });
          setSelectedStudent(null);
          setSearchQuery('');
          document.getElementById('cert-file-upload').value = '';
        }
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to process certificate' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cert) => {
    setEditingCertId(cert._id);
    const student = students.find(s => s.regNo === cert.studentId);
    if (student) {
      setSelectedStudent(student);
      setSearchQuery(`${student.regNo} - ${student.name}`);
    } else {
      setSearchQuery(`${cert.studentId} - ${cert.studentName}`);
    }
    setFormData({ 
      studentId: cert.studentId, 
      certificateType: cert.certificateType,
      file: null 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      const res = await api.delete(`/admin/certificates/${id}`);
      if (res.data.success) {
        setCertificates(certificates.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to delete certificate' });
    }
  };

  const clearFilters = () => {
    setFilterSearch('');
    setFilterFaculty('');
    setFilterSemester('');
  };

  // Derived Filter Data
  const uniqueFaculties = [...new Set(students.map(s => s.faculty).filter(Boolean))];
  const uniqueSemesters = [...new Set(students.map(s => s.currentSemester).filter(Boolean))].sort((a,b)=>a-b);

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.studentName.toLowerCase().includes(filterSearch.toLowerCase()) || 
                          cert.studentId.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesFaculty = filterFaculty ? cert.faculty === filterFaculty : true;
    const matchesSemester = filterSemester ? cert.semester === parseInt(filterSemester) : true;
    return matchesSearch && matchesFaculty && matchesSemester;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="text-blue-600" /> Manage Certificates
        </h2>
        <p className="mt-1 text-slate-500">Upload and manage official student certificates.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Issue Form - Left Col */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {editingCertId ? <Edit size={20} className="text-blue-500" /> : <PlusCircle size={20} className="text-blue-500" />}
              {editingCertId ? 'Edit Certificate' : 'Upload Certificate'}
            </h3>
            {editingCertId && (
              <button onClick={() => {
                setEditingCertId(null);
                setFormData({ studentId: '', certificateType: 'Character Certificate', file: null });
                setSelectedStudent(null);
                setSearchQuery('');
              }} className="text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {status.message && (
              <div className={`p-4 rounded-xl flex items-start gap-2 border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                <span className="text-xs font-bold">{status.message}</span>
              </div>
            )}

            {/* Student Search */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-700">Search Student</label>
              {studentsLoading ? (
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" /> Loading...
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsOpen(true);
                      if (selectedStudent) {
                          setSelectedStudent(null);
                          setFormData({ ...formData, studentId: '' });
                      }
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Type name or reg no..."
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required={!formData.studentId}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              )}
              
              {isOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                  {students.filter(student => 
                    student.regNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    student.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(student => (
                    <div 
                      key={student._id}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm flex flex-col"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <span className="font-bold text-slate-900">{student.name}</span>
                      <span className="text-xs text-slate-500">{student.regNo}</span>
                    </div>
                  ))}
                </div>
              )}
              {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Certificate Type</label>
              <select name="certificateType" value={formData.certificateType} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 outline-none">
                <option value="Character Certificate">Character Certificate</option>
                <option value="Achievement Certificate">Achievement Certificate</option>
                <option value="Course Completion">Course Completion</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Certificate File {editingCertId && <span className="font-normal text-slate-400">(Optional if keeping existing)</span>}</label>
              <div className="w-full flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <input type="file" id="cert-file-upload" name="file" onChange={handleChange} className="w-full p-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" accept=".pdf,image/*" required={!editingCertId} />
              </div>
            </div>
            
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold py-3.5 mt-2 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (editingCertId ? <Edit size={16} /> : <FileUp size={16} />)}
              {submitting ? (editingCertId ? 'Updating...' : 'Uploading...') : (editingCertId ? 'Update Certificate' : 'Upload Certificate')}
            </button>
          </form>
        </div>

        {/* List & Filters - Right Col */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Filter size={18} className="text-blue-500" /> Find Certificates</h3>
            
            <div className="grid md:grid-cols-3 gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={filterSearch} 
                  onChange={e => setFilterSearch(e.target.value)} 
                  placeholder="Search by name..." 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              </div>

              <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500">
                <option value="">All Departments</option>
                {uniqueFaculties.map((fac, i) => <option key={i} value={fac}>{fac}</option>)}
              </select>

              <div className="flex gap-2">
                <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500">
                  <option value="">All Semesters</option>
                  {uniqueSemesters.map((sem, i) => <option key={i} value={sem}>Semester {sem}</option>)}
                </select>
                
                <button onClick={clearFilters} className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="Clear Filters">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center p-12 text-slate-500">
                No certificates match your search/filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Student</th>
                    <th className="p-4">Certificate Type</th>
                    <th className="p-4">Dept / Sem</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{cert.studentName}</div>
                        <div className="text-xs text-slate-500">{cert.studentId}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{cert.certificateType}</td>
                      <td className="p-4">
                        <div className="text-slate-700">{cert.faculty || 'N/A'}</div>
                        <div className="text-xs text-slate-500">Sem {cert.semester || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(cert.createdAt || cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cert.fileUrl && (
                            <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors">
                              View / DL
                            </a>
                          )}
                          <button onClick={() => handleEdit(cert)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(cert._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCertificates;
