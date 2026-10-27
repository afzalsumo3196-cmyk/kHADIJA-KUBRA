import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, FileText, Calendar, Download, Upload, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const Assignments = ({ courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState({});
  const [editMode, setEditMode] = useState({});

  useEffect(() => {
    fetchAssignmentsAndSubmissions();
  }, [courseId]);

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/academic/assignments?courseId=${courseId}` : '/academic/assignments';
      const subUrl = courseId ? `/academic/assignments/submissions?courseId=${courseId}` : '/academic/assignments/submissions';
      
      const [res, subRes] = await Promise.all([
        api.get(url),
        api.get(subUrl)
      ]);

      if (res.data.success) {
        setAssignments(res.data.assignments);
      }
      if (subRes.data.success) {
        const subMap = {};
        subRes.data.submissions.forEach(sub => {
          subMap[sub.assignment._id] = sub;
        });
        setSubmissions(subMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, assignId) => {
    setUploadFile({ ...uploadFile, [assignId]: e.target.files[0] });
  };

  const handleSubmit = async (assignId) => {
    if (!uploadFile[assignId]) return alert('Please select a file to submit');
    setSubmitLoading(true);
    try {
      const data = new FormData();
      data.append('assignmentId', assignId);
      data.append('file', uploadFile[assignId]);

      const res = await api.post('/academic/assignments/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert(res.data.message || 'Assignment submitted successfully');
        setEditMode({ ...editMode, [assignId]: false });
        fetchAssignmentsAndSubmissions();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className={`space-y-8 animate-fade-in-up ${courseId ? '' : 'max-w-5xl mx-auto pb-12'}`}>
      {!courseId && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-bold">Academic Tasks</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Assignments</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Download assignment briefs, review deadlines, and submit your work.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 pl-2">
          <PenTool size={18} className="text-slate-400" />
          Pending Assignments
        </h3>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">No assignments pending.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {assignments.map(assignment => {
              const deadlineDate = new Date(assignment.deadline);
              const isPastDue = deadlineDate < new Date();
              const submission = submissions[assignment._id];
              let statusText = '';
              let statusColor = '';

              if (submission) {
                const submittedDate = new Date(submission.submittedAt);
                if (submittedDate > deadlineDate) {
                  const daysLate = Math.ceil((submittedDate - deadlineDate) / (1000 * 60 * 60 * 24));
                  statusText = `Uploaded ${daysLate} day(s) late`;
                  statusColor = 'text-red-500';
                } else {
                  statusText = 'Submitted on time';
                  statusColor = 'text-emerald-500';
                }
              }

              return (
                <div key={assignment._id} className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col gap-4 transition-colors ${isPastDue && !submission ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-emerald-200'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isPastDue && !submission ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 break-words">{assignment.title}</h4>
                        {isPastDue && !submission && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 tracking-widest uppercase shrink-0 w-fit">Late</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1 break-words">{assignment.course?.title}</p>
                      <p className={`text-xs font-bold flex items-center gap-1 mb-2 ${isPastDue && !submission ? 'text-red-500' : 'text-slate-500'}`}>
                        <Calendar size={12}/> Deadline: {deadlineDate.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{assignment.description}</p>
                      <a 
                        href={assignment.fileUrl?.startsWith('http') ? assignment.fileUrl : `http://localhost:5000/${assignment.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Download size={16} /> View Brief
                      </a>
                    </div>
                  </div>

                  {/* Submission UI */}
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    {submission && !editMode[assignment._id] ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className={statusColor} />
                          <span className={`text-sm font-bold ${statusColor}`}>{statusText}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button 
                            onClick={() => setEditMode({ ...editMode, [assignment._id]: true })}
                            className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 px-3 py-2 sm:py-1.5 rounded-lg transition-colors flex-1 sm:flex-none text-center"
                          >
                            Edit
                          </button>
                          <a 
                            href={submission.fileUrl?.startsWith('http') ? submission.fileUrl : `http://localhost:5000/${submission.fileUrl}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 sm:py-1.5 rounded-lg transition-colors flex-1 sm:flex-none text-center"
                          >
                            View Submission
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="w-full sm:flex-1 overflow-hidden">
                          <input 
                            type="file" 
                            onChange={(e) => handleFileChange(e, assignment._id)}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {submission && (
                            <button 
                              onClick={() => setEditMode({ ...editMode, [assignment._id]: false })}
                              disabled={submitLoading}
                              className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                              Cancel
                            </button>
                          )}
                          <button 
                            onClick={() => handleSubmit(assignment._id)}
                            disabled={submitLoading || !uploadFile[assignment._id]}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0"
                          >
                            {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {submission ? 'Update' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
