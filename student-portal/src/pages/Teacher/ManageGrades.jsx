import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Save, Search, User, GraduationCap, Calculator, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const ManageGrades = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const defaultCategories = [
    { id: 'cat_quiz', title: 'Term Quiz', type: 'Quiz', maxMarks: 20 },
    { id: 'cat_assign', title: 'Term Assignment', type: 'Assignment', maxMarks: 20 },
    { id: 'cat_mid', title: 'Midterm Exam', type: 'Midterm', maxMarks: 20 },
    { id: 'cat_final', title: 'Final Exam', type: 'Final', maxMarks: 40 },
    { id: 'cat_extra', title: 'Extra Marks', type: 'Extra', maxMarks: 10 }
  ];

  const [categories, setCategories] = useState([]);
  const [grades, setGrades] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editCatModal, setEditCatModal] = useState({ isOpen: false, cat: null, newTitle: '', newMaxMarks: '' });
  const [newCatModal, setNewCatModal] = useState({ isOpen: false, title: '', type: 'Quiz', maxMarks: 20 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/teacher/courses');
      if (res.data.success) setCourses(res.data.courses);
    } catch (err) {
      console.error('Failed to load courses');
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
      setSearchQuery('');
    } else {
      setStudents([]);
      setCategories([]);
    }
  }, [selectedCourse]);

  const fetchStudents = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.get(`/teacher/students?courseId=${courseId}`);
      if (res.data.success) {
        setStudents(res.data.students);
        
        let extractedCats = [];
        let catIndex = 1;
        const initialGrades = {};

        res.data.students.forEach(s => {
          initialGrades[s.regNo] = {};
          if (s.grades && s.grades.length > 0) {
             s.grades.forEach(g => {
                let existingCat = extractedCats.find(c => c.title === g.title && c.type === g.type);
                if (!existingCat) {
                   existingCat = { id: `cat_${catIndex++}`, title: g.title, type: g.type, maxMarks: g.totalMarks };
                   extractedCats.push(existingCat);
                }
                initialGrades[s.regNo][existingCat.id] = g.marksObtained;
             });
          }
        });
        
        if (extractedCats.length === 0) {
          extractedCats = defaultCategories;
        }

        // Ensure all students have fields for all categories
        res.data.students.forEach(s => {
           extractedCats.forEach(cat => {
               if (initialGrades[s.regNo][cat.id] === undefined) {
                   initialGrades[s.regNo][cat.id] = '';
               }
           });
        });
        
        setCategories(extractedCats);
        setGrades(initialGrades);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (regNo, catId, value) => {
    setGrades(prev => ({
      ...prev,
      [regNo]: {
        ...prev[regNo],
        [catId]: value
      }
    }));
  };

  const calculateTotal = (studentGrades) => {
    if (!studentGrades) return 0;
    return categories.reduce((sum, cat) => sum + (Number(studentGrades[cat.id]) || 0), 0);
  };

  const calculateTotalPossible = () => {
    return categories.reduce((sum, cat) => {
        // Exclude extra/bonus marks from the possible total denominator
        if (cat.type === 'Extra' || cat.title.toLowerCase().includes('extra') || cat.title.toLowerCase().includes('bonus')) return sum; 
        return sum + (Number(cat.maxMarks) || 0);
    }, 0);
  };

  const calculatePercentage = (obtained, possible) => {
    if (possible === 0) return 0;
    const pct = (obtained / possible) * 100;
    return pct.toFixed(1);
  };

  const handleSaveCategory = async () => {
    if (!editCatModal.newTitle.trim() || !editCatModal.newMaxMarks) return;

    if (editCatModal.newTitle !== editCatModal.cat.title) {
       try {
          await api.put('/teacher/grades/category', {
             oldTitle: editCatModal.cat.title,
             newTitle: editCatModal.newTitle,
             type: editCatModal.cat.type,
             courseId: selectedCourse
          });
       } catch (err) { 
           setStatus({ type: 'error', message: 'Failed to rename category in database.' });
           return; 
       }
    }
    
    setCategories(prev => prev.map(c => 
       c.id === editCatModal.cat.id 
          ? { ...c, title: editCatModal.newTitle, maxMarks: editCatModal.newMaxMarks }
          : c
    ));
    setEditCatModal({ isOpen: false, cat: null, newTitle: '', newMaxMarks: '' });
  };

  const handleAddNewCategory = () => {
      if (!newCatModal.title.trim() || !newCatModal.maxMarks) return;
      
      const newCat = { 
          id: `cat_new_${Date.now()}`, 
          title: newCatModal.title, 
          type: newCatModal.type, 
          maxMarks: newCatModal.maxMarks 
      };
      setCategories(prev => [...prev, newCat]);
      
      setGrades(prev => {
         const newGrades = { ...prev };
         Object.keys(newGrades).forEach(regNo => {
            newGrades[regNo][newCat.id] = '';
         });
         return newGrades;
      });
      setNewCatModal({ isOpen: false, title: '', type: 'Quiz', maxMarks: 20 });
  };

  const handleDeleteCategory = async (cat) => {
      if (!window.confirm(`Are you sure you want to delete "${cat.title}"? This will delete all marks for this category permanently.`)) return;
      
      try {
         await api.delete(`/teacher/grades/category?title=${encodeURIComponent(cat.title)}&type=${encodeURIComponent(cat.type)}&courseId=${selectedCourse}`);
         
         setCategories(prev => prev.filter(c => c.id !== cat.id));
         setGrades(prev => {
             const newGrades = { ...prev };
             Object.keys(newGrades).forEach(regNo => {
                delete newGrades[regNo][cat.id];
             });
             return newGrades;
         });
      } catch (err) {
         console.error(err);
         setStatus({ type: 'error', message: 'Failed to delete category' });
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      setStatus({ type: 'error', message: 'Please select a course first.' });
      return;
    }
    setSubmitLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const promises = categories.map(async (cat) => {
        const marksData = [];
        for (const student of students) {
          const val = grades[student.regNo]?.[cat.id];
          if (val !== '' && val !== undefined) {
            const numVal = Number(val);
            if (numVal < 0 || numVal > Number(cat.maxMarks)) {
               throw new Error(`Invalid marks in ${cat.title} for ${student.name}. Must be between 0 and ${cat.maxMarks}.`);
            }
            marksData.push({ studentId: student.regNo, marksObtained: numVal });
          }
        }
        
        if (marksData.length > 0) {
           return api.post('/teacher/grades', {
             title: cat.title,
             type: cat.type,
             totalMarks: Number(cat.maxMarks),
             courseId: selectedCourse,
             marksData
           });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setStatus({ type: 'success', message: 'All marks saved successfully!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Failed to save marks' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.regNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPossible = calculateTotalPossible();

  return (
    <div className="space-y-8 animate-fade-in-up max-w-[1400px] mx-auto pb-12 relative">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[28px] bg-white/70 backdrop-blur-md border border-white/30 shadow-lg shadow-indigo-100/10">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-extrabold">Marks Entry System</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Manage Grades</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl leading-relaxed">
            Record marks for your custom categories. Total and Percentage will auto-calculate.
          </p>
        </div>

        <div className="bg-white/90 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 shrink-0">
          <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 ml-1">Select Course</label>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700"
          >
            <option value="">Choose Course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border backdrop-blur-sm shadow-sm ${status.type === 'success' ? 'bg-emerald-50/70 border-emerald-100/80 text-emerald-700' : 'bg-red-50/70 border-red-100/80 text-red-600'}`}>
          {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <span className="text-sm font-semibold">{status.message}</span>
        </div>
      )}

      {selectedCourse && students.length > 0 && !loading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Action Bar */}
          <div className="flex justify-end">
            <button 
                type="button" 
                onClick={() => setNewCatModal({ isOpen: true, title: '', type: 'Quiz', maxMarks: 20 })}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all border border-indigo-200"
            >
              <Plus size={16} /> Add New Category
            </button>
          </div>

          {/* Student Table Glass Panel */}
          <div className="bg-white/80 backdrop-blur-lg rounded-[32px] shadow-2xl border border-white/50 overflow-hidden">
            {/* Search Header Bar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap size={18} className="text-slate-500" /> Enrolled Students ({filteredStudents.length})
              </span>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search student by name or Reg No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 font-semibold"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[10px] font-bold">
                    <th className="p-4 pl-6 min-w-[200px] sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Student Info</th>
                    
                    {categories.map((cat) => (
                       <th key={cat.id} className="p-4 w-32 text-center group">
                          <div className="flex flex-col items-center justify-center gap-1">
                             <span className="text-slate-700 font-extrabold">{cat.title}</span>
                             <span className="text-[9px] font-medium bg-slate-200/50 px-2 py-0.5 rounded-md">Max: {cat.maxMarks}</span>
                             <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => setEditCatModal({ isOpen: true, cat, newTitle: cat.title, newMaxMarks: cat.maxMarks })} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600"><Edit2 size={12}/></button>
                                <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600"><Trash2 size={12}/></button>
                             </div>
                          </div>
                       </th>
                    ))}
                    
                    <th className="p-4 w-32 text-center bg-indigo-50/30">Total & %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student) => {
                    const studentGrades = grades[student.regNo] || {};
                    const totalObtained = calculateTotal(studentGrades);
                    const percentage = calculatePercentage(totalObtained, totalPossible);
                    
                    return (
                      <tr key={student._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 pl-6 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                          <div className="font-bold text-slate-800 text-[14px]">{student.name}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">{student.regNo}</div>
                        </td>
                        
                        {categories.map((cat) => (
                          <td key={cat.id} className="p-4">
                            <input 
                              type="number" 
                              min="0"
                              max={cat.maxMarks}
                              value={studentGrades[cat.id] ?? ''}
                              onChange={(e) => handleGradeChange(student.regNo, cat.id, e.target.value)}
                              placeholder="-"
                              className="w-full px-2 py-2 bg-white/70 border border-slate-200 rounded-xl text-center text-sm font-black text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm"
                            />
                          </td>
                        ))}

                        <td className="p-4 bg-indigo-50/20">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[15px] font-black text-indigo-700">{totalObtained} <span className="text-[10px] text-indigo-400 font-bold">/ {totalPossible}</span></span>
                            <span className={`text-xs font-extrabold mt-1 px-2 py-0.5 rounded-md ${percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={categories.length + 2} className="p-12 text-center text-slate-400 font-medium">No students match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100/60 bg-slate-50/30 backdrop-blur-md flex justify-end">
              <button 
                type="submit" 
                disabled={submitLoading} 
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Publish All Marks
              </button>
            </div>
          </div>
        </form>
      )}

      {selectedCourse && students.length === 0 && !loading && (
        <div className="p-16 text-center text-slate-400 font-semibold bg-white/80 rounded-[32px] border border-white/50">
          No students found enrolled in this course.
        </div>
      )}
      {!selectedCourse && !loading && (
        <div className="p-16 text-center text-slate-400 font-semibold bg-white/80 rounded-[32px] border border-white/50">
          Please select a course to load students.
        </div>
      )}
      {loading && (
        <div className="flex justify-center p-16 bg-white/80 rounded-[32px] border border-white/50">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}

      {/* Edit Category Modal */}
      {editCatModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg text-slate-800">Edit Category</h3>
                <button onClick={() => setEditCatModal({ isOpen: false, cat: null, newTitle: '', newMaxMarks: '' })} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X size={18}/></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Category Name</label>
                   <input type="text" value={editCatModal.newTitle} onChange={(e) => setEditCatModal(prev => ({...prev, newTitle: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Max Marks</label>
                   <input type="number" min="1" value={editCatModal.newMaxMarks} onChange={(e) => setEditCatModal(prev => ({...prev, newMaxMarks: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <button onClick={handleSaveCategory} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors">Save Changes</button>
             </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {newCatModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg text-slate-800">Add New Category</h3>
                <button onClick={() => setNewCatModal({ isOpen: false, title: '', type: 'Quiz', maxMarks: 20 })} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X size={18}/></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Category Name</label>
                   <input type="text" placeholder="e.g. Quiz 2" value={newCatModal.title} onChange={(e) => setNewCatModal(prev => ({...prev, title: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Type</label>
                   <select value={newCatModal.type} onChange={(e) => setNewCatModal(prev => ({...prev, type: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                      <option value="Quiz">Quiz</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Midterm">Midterm</option>
                      <option value="Final">Final</option>
                      <option value="Extra">Extra Marks</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Max Marks</label>
                   <input type="number" min="1" value={newCatModal.maxMarks} onChange={(e) => setNewCatModal(prev => ({...prev, maxMarks: e.target.value}))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <button onClick={handleAddNewCategory} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors">Add Category</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageGrades;
