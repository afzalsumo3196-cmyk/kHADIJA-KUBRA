import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { X, Save, Loader2, Info, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const FEE_FIELDS = [
  { key: 'enrollmentFee', label: 'Enrollment Fee' },
  { key: 'perSemesterFee', label: 'Per Semester Fee' },
  { key: 'secondSemesterFee', label: 'Second Semester Fee' },
  { key: 'secondCertificateFee', label: 'Second Certificate Fee' },
  { key: 'currentFee', label: 'Current Fee' },
  { key: 'remainingSemestersFee', label: 'Remaining Semesters Fee' },
  { key: 'certificateFeeCNS', label: 'Certificate Fee (CNS)' },
  { key: 'certificateFeeCPET', label: 'Certificate Fee (CPET)' }
];

const EditFeeModal = ({ studentId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [studentInfo, setStudentInfo] = useState({});
  const [fullStudent, setFullStudent] = useState({});
  const [academic, setAcademic] = useState({});
  const [dates, setDates] = useState({});
  
  const [formData, setFormData] = useState({
    enrollmentDate: '',
    durationMonths: '',
    courseEndDateOverride: '',
    semesterLengthMonths: 3,
    classInstructor: '',
    totalDiplomaEnrollment: '',
    currentDiploma: '',
    notesOverride: '',
  });

  const [fees, setFees] = useState({
    enrollmentFee: 0, perSemesterFee: 0, secondSemesterFee: 0, secondCertificateFee: 0,
    currentFee: 0, remainingSemestersFee: 0, certificateFeeCNS: 0, certificateFeeCPET: 0
  });

  const [lineStatus, setLineStatus] = useState({
    enrollmentFee: 'Unpaid', perSemesterFee: 'Unpaid', secondSemesterFee: 'Unpaid', secondCertificateFee: 'Unpaid',
    currentFee: 'Unpaid', remainingSemestersFee: 'Unpaid', certificateFeeCNS: 'Unpaid', certificateFeeCPET: 'Unpaid'
  });

  const [manualOverride, setManualOverride] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchVoucher();
  }, [isOpen, studentId]);

  const fetchVoucher = async () => {
    setLoading(true);
    setError('');
    setHasUnsavedChanges(false);
    try {
      const res = await api.get(`/admin/fees/student/${studentId}/voucher`);
      const { voucher, student } = res.data;
      
      setStudentInfo(voucher.student);
      setFullStudent(student);
      setAcademic(voucher.academic);
      setDates(voucher.dates);
      
      setFormData({
        enrollmentDate: voucher.dates?.enrollmentDate ? new Date(voucher.dates.enrollmentDate).toISOString().split('T')[0] : '',
        durationMonths: student.voucher?.durationMonths || voucher.academic?.totalDuration?.replace(' Months', '') || '',
        courseEndDateOverride: student.voucher?.courseEndDateOverride ? new Date(student.voucher.courseEndDateOverride).toISOString().split('T')[0] : '',
        semesterLengthMonths: student.voucher?.semesterLengthMonths || 3,
        classInstructor: student.voucher?.classInstructor || (voucher.academic?.classInstructor !== '—' ? voucher.academic?.classInstructor : '') || '',
        totalDiplomaEnrollment: student.voucher?.totalDiplomaEnrollment || (voucher.academic?.totalDiplomaEnrollment ? voucher.academic.totalDiplomaEnrollment : '') || '',
        currentDiploma: student.voucher?.currentDiploma || (voucher.academic?.currentDiploma !== '—' ? voucher.academic?.currentDiploma : '') || '',
        notesOverride: voucher.notesOverride || '',
      });

      setFees(voucher.fees || {});
      setLineStatus(voucher.lineStatus || {});
      
      // Setup paid amount
      const computedPaid = calculateAutoPaid(voucher.fees, voucher.lineStatus);
      if (voucher.totals?.paidFee !== undefined && voucher.totals.paidFee !== computedPaid) {
        setManualOverride(true);
        setAmountPaid(voucher.totals.paidFee);
      } else {
        setManualOverride(false);
        setAmountPaid(computedPaid);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load voucher data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAutoPaid = (currentFees, currentStatus) => {
    let paid = 0;
    FEE_FIELDS.forEach(f => {
      if (currentStatus[f.key] === 'Paid') {
        paid += Number(currentFees[f.key]) || 0;
      }
    });
    return paid;
  };

  // Auto update amountPaid when toggling line statuses or changing fees, IF not in manual mode
  useEffect(() => {
    if (!manualOverride) {
      setAmountPaid(calculateAutoPaid(fees, lineStatus));
    }
  }, [fees, lineStatus, manualOverride]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [hasUnsavedChanges]);

  const markChanged = () => setHasUnsavedChanges(true);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    markChanged();
  };

  const handleFeeChange = (key, value) => {
    let val = Number(value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 10000000) val = 10000000;
    
    setFees(prev => ({ ...prev, [key]: val }));
    markChanged();
  };

  const handleStatusToggle = (key) => {
    setLineStatus(prev => ({ ...prev, [key]: prev[key] === 'Paid' ? 'Unpaid' : 'Paid' }));
    markChanged();
  };

  const totalFee = Object.values(fees).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const pendingFee = Math.max(0, totalFee - (Number(amountPaid) || 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        voucher: {
          ...formData,
          durationMonths: formData.durationMonths ? Number(formData.durationMonths) : undefined,
          totalDiplomaEnrollment: formData.totalDiplomaEnrollment ? Number(formData.totalDiplomaEnrollment) : undefined,
          semesterLengthMonths: Number(formData.semesterLengthMonths) || 3,
          fees,
          lineStatus
        },
        amountPaid: Number(amountPaid)
      };

      // Clean empty dates
      if (!payload.voucher.enrollmentDate) delete payload.voucher.enrollmentDate;
      if (!payload.voucher.courseEndDateOverride) delete payload.voucher.courseEndDateOverride;

      await api.put(`/admin/fees/student/${studentId}/voucher`, payload);
      toast.success('Fee details updated successfully');
      setHasUnsavedChanges(false);
      onSuccess(); // triggers refresh in ManageFees
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save fee details');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6" onClick={(e) => { if(e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Fee Voucher</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage academic details and financial breakdown</p>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-indigo-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium text-slate-500">Loading student data...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-center font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Info Text */}
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 text-indigo-800 p-4 rounded-xl text-sm font-medium">
                <Info size={18} className="mt-0.5 flex-shrink-0 text-indigo-500" />
                <p>
                  When a payment slip is approved, the amount is added to Amount Paid automatically. You may also mark individual fee lines as Paid manually. <br/>
                  <span className="text-indigo-600 font-normal">Fields left empty will default to zero.</span>
                </p>
              </div>

              {/* Grid: Academic & Fees */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Col: Student & Academic Info */}
                <div className="space-y-6">
                  
                  {/* Read-Only Info */}
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Student Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Name</label>
                        <div className="font-semibold text-slate-800">{studentInfo.name}</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Student ID</label>
                        <div className="font-semibold text-slate-800">{studentInfo.studentId}</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Reg No</label>
                        <div className="font-semibold text-slate-800">{studentInfo.regNo}</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Current Semester</label>
                        <div className="font-semibold text-slate-800">{academic.currentSemester} of {academic.totalSemesters}</div>
                      </div>
                      {fullStudent?.feeSlipLink && (
                        <div className="col-span-2 mt-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Uploaded Slip Amount</p>
                            <p className="font-bold text-amber-600">Rs. {fullStudent.pendingFeeAmount?.toLocaleString() || '—'}</p>
                          </div>
                          <a 
                            href={fullStudent.feeSlipLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View Slip <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Editable Academic */}
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Academic Overrides</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Enrollment Date</label>
                        <input type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (Months)</label>
                        <input type="number" min="1" name="durationMonths" value={formData.durationMonths} onChange={handleInputChange} placeholder="e.g. 12" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date Override</label>
                        <input type="date" name="courseEndDateOverride" value={formData.courseEndDateOverride} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                        {!formData.courseEndDateOverride && dates.courseEndDate && (
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">
                            Auto: {new Date(dates.courseEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Sem Length (Months)</label>
                        <input type="number" min="1" name="semesterLengthMonths" value={formData.semesterLengthMonths} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Class Instructor</label>
                        <input type="text" name="classInstructor" value={formData.classInstructor} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Diploma</label>
                        <input type="text" name="currentDiploma" value={formData.currentDiploma} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Diploma Enroll</label>
                        <input type="number" min="1" name="totalDiplomaEnrollment" value={formData.totalDiplomaEnrollment} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                      </div>
                    </div>
                  </section>

                </div>

                {/* Right Col: Fee Breakdown */}
                <div className="space-y-6">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2 flex justify-between">
                      <span>Fee Breakdown</span>
                      <span>Amount / Status</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {FEE_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-slate-700 flex-1 truncate" title={field.label}>
                            {field.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rs.</span>
                              <input 
                                type="number" 
                                value={fees[field.key] || ''}
                                onChange={(e) => handleFeeChange(field.key, e.target.value)}
                                className="w-28 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="0"
                              />
                            </div>
                            <button
                              onClick={() => handleStatusToggle(field.key)}
                              className={`w-20 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                                lineStatus[field.key] === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {lineStatus[field.key]}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  {/* Summary Box */}
                  <section className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-600">Total Fee:</span>
                        <span className="font-bold text-slate-900">Rs. {totalFee.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-200">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-600">Amount Paid:</span>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={manualOverride} 
                              onChange={(e) => {
                                setManualOverride(e.target.checked);
                                markChanged();
                                if(!e.target.checked) setAmountPaid(calculateAutoPaid(fees, lineStatus));
                              }} 
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Manual Override
                          </label>
                        </div>
                        {manualOverride ? (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rs.</span>
                            <input 
                              type="number" 
                              value={amountPaid === 0 && !amountPaid.toString().includes('0') ? '' : amountPaid}
                              onChange={(e) => {
                                let val = Number(e.target.value);
                                if (isNaN(val) || val < 0) val = 0;
                                setAmountPaid(val);
                                markChanged();
                              }}
                              className="w-28 pl-7 pr-3 py-1 bg-white border border-slate-300 rounded text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-600">Rs. {Number(amountPaid).toLocaleString()}</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-base pt-1">
                        <span className="font-bold text-slate-800">Pending Balance:</span>
                        <span className={`font-black ${pendingFee > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          Rs. {pendingFee.toLocaleString()}
                        </span>
                      </div>
                      
                      {amountPaid > totalFee && (
                        <div className="text-[11px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 text-center">
                          Warning: Amount Paid is greater than Total Fee!
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Uploaded Slips Box */}
                  {(fullStudent?.feeSlips?.length > 0 || fullStudent?.feeSlipLink) && (
                    <section className="bg-white rounded-xl p-5 border border-slate-200">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Uploaded Slips</h3>
                      <div className="space-y-3">
                        {fullStudent.feeSlips && fullStudent.feeSlips.length > 0 ? (
                          fullStudent.feeSlips.slice().reverse().map((slip, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border border-slate-100 rounded-lg p-3">
                              <div className="flex flex-col">
                                <a href={slip.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">View Slip</a>
                                <span className="text-[10px] text-slate-500">{new Date(slip.uploadedAt).toLocaleString()}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                slip.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                slip.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {slip.status}
                              </span>
                            </div>
                          ))
                        ) : fullStudent.feeSlipLink ? (
                          <div className="flex justify-between items-center text-sm border border-slate-100 rounded-lg p-3">
                            <a href={fullStudent.feeSlipLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Legacy Uploaded Slip</a>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">Archived</span>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={handleClose} 
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditFeeModal;
