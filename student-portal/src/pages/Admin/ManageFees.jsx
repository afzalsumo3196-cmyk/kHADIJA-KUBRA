import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { 
  Check, Eye, Clock, CheckCircle, Save, Calendar, Users, AlertTriangle, 
  Trash2, Search, DollarSign, TrendingUp, ShieldAlert, Sparkles, 
  Mail, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ExternalLink, Download, GraduationCap, Award, CheckCircle2, Edit2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import FeeBreakdownTable from '../../components/FeeBreakdownTable';
import EditFeeModal from '../../components/Admin/EditFeeModal';
import VoucherPreviewModal from '../../components/Admin/VoucherPreviewModal';

const ManageFees = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deadline, setDeadline] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'defaulters', 'pending', 'paid'
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSlipUrl, setSelectedSlipUrl] = useState(null);
  const [selectedStudentForSlip, setSelectedStudentForSlip] = useState(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [slipActionLoading, setSlipActionLoading] = useState(false);
  const [editModalStudent, setEditModalStudent] = useState(null);
  const [previewModalStudent, setPreviewModalStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: ''
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Schedule Generator State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCourse, setScheduleCourse] = useState('all');
  const [scheduleTotalFee, setScheduleTotalFee] = useState(15000);
  const [scheduleSplitType, setScheduleSplitType] = useState('even'); // 'even' | 'voucher'
  const [scheduleMonthsCount, setScheduleMonthsCount] = useState(3);
  const [scheduleStartMonth, setScheduleStartMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generatingSchedule, setGeneratingSchedule] = useState(false);



  const fetchBankDetails = async () => {
    try {
      const response = await api.get('/admin/settings/BANK_DETAILS');
      if (response.data.success && response.data.value) {
        setBankDetails(response.data.value);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const saveBankDetails = async () => {
    setSavingBankDetails(true);
    try {
      const response = await api.put('/admin/settings/BANK_DETAILS', { value: bankDetails });
      if (response.data.success) {
        toast.success('University Bank details updated successfully!');
        setIsEditingBank(false);
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      toast.error('Failed to update bank details.');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const fetchDeadline = async () => {
    try {
      const response = await api.get('/admin/settings/FEE_DEADLINE');
      if (response.data.success && response.data.value) {
        setDeadline(response.data.value);
      }
    } catch (error) {
      console.error('Error fetching deadline:', error);
    }
  };

  const saveDeadline = async () => {
    setSavingDeadline(true);
    try {
      const response = await api.put('/admin/settings/FEE_DEADLINE', { value: deadline });
      if (response.data.success) {
        toast.success('Fee deadline updated successfully!');
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast.error('Failed to update deadline.');
    } finally {
      setSavingDeadline(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      if (response.data.success) {
        const updatedStudents = response.data.students.map(student => {
          let actualFeeTotal = student.feeTotal !== undefined ? student.feeTotal : 0;
          if ((actualFeeTotal === 0 || actualFeeTotal === 15000) && (!student.feeItems || student.feeItems.length === 0) && student.assignedCourses && student.assignedCourses.length > 0) {
            actualFeeTotal = student.assignedCourses.reduce((sum, course) => sum + (course.fees || 0), 0);
          }
          return {
            ...student,
            feeTotal: actualFeeTotal
          };
        });
        setAllStudents(updatedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDeadline();
    fetchBankDetails();
  }, []);

  // Live schedule preview generator
  const getSchedulePreviewItems = () => {
    const numTotal = Number(scheduleTotalFee) || 15000;
    const numMonths = Math.max(1, Number(scheduleMonthsCount) || 3);

    let startDate = new Date();
    if (scheduleStartMonth) {
      const parts = scheduleStartMonth.split('-');
      if (parts.length >= 2) {
        startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (scheduleSplitType === 'voucher') {
      const startM = monthNames[startDate.getMonth()];
      const startY = startDate.getFullYear();
      const p1 = Math.round(numTotal * 0.20);
      const p2 = Math.round(numTotal * 0.40);
      const p3 = Math.round(numTotal * 0.30);
      const p4 = Math.max(0, numTotal - (p1 + p2 + p3));

      return [
        { title: "Enrollment Date + Fee", term: `${startM} ${startY} (Enrollment)`, amount: p1, status: "Unpaid" },
        { title: "Per Semester Fee", term: "Month 1 - 2", amount: p2, status: "Upcoming" },
        { title: "Remaining / Next Semester Fee", term: "Month 3 - 4", amount: p3, status: "Upcoming" },
        { title: "Certificate Fee (CNS/CPET)", term: "End of Course", amount: p4, status: "Upcoming" }
      ];
    } else {
      const perMonth = Math.floor(numTotal / numMonths);
      const remainder = numTotal - (perMonth * numMonths);
      const preview = [];

      for (let i = 0; i < numMonths; i++) {
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const mName = monthNames[targetDate.getMonth()];
        const yName = targetDate.getFullYear();
        const amt = (i === numMonths - 1) ? (perMonth + remainder) : perMonth;

        preview.push({
          title: `Month ${i + 1} Tuition Fee`,
          term: `${mName} ${yName}`,
          amount: amt,
          status: i === 0 ? "Unpaid" : "Upcoming"
        });
      }
      return preview;
    }
  };

  const targetStudentCount = scheduleCourse === 'all'
    ? allStudents.length
    : allStudents.filter(s => s.programName === scheduleCourse).length;

  const handleGenerateSchedule = async () => {
    if (targetStudentCount === 0) {
      toast.error('No students found for this selected course/cohort.');
      return;
    }

    if (!window.confirm(`Are you sure you want to generate and apply this fee schedule to ${targetStudentCount} student(s)?`)) {
      return;
    }

    setGeneratingSchedule(true);
    try {
      const response = await api.post('/admin/fees/generate-schedule', {
        programName: scheduleCourse,
        totalFee: scheduleTotalFee,
        splitType: scheduleSplitType,
        monthsCount: scheduleMonthsCount,
        startMonth: scheduleStartMonth,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Fee schedule generated successfully!');
        setIsScheduleModalOpen(false);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error generating fee schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to generate fee schedule.');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const handleApprove = async (studentId, overrideAmount = null) => {
    if (overrideAmount === null && !window.confirm("Are you sure you want to approve this fee?")) return;

    setSlipActionLoading(true);
    try {
      const response = await api.put(`/admin/fees/approve/${studentId}`, { amount: overrideAmount });
      if (response.data.success) {
        toast.success(response.data.message || 'Fee approved successfully!');
        
        // Update local state
        setAllStudents(allStudents.map(s => {
          if (s._id === studentId) {
            const addedAmount = overrideAmount !== null ? Number(overrideAmount) : (s.pendingFeeAmount || 0);
            const newPaid = (s.feePaid || 0) + addedAmount;
            const newTotal = s.feeTotal !== undefined ? s.feeTotal : 0;
            return { 
              ...s, 
              feePaid: newPaid,
              pendingFeeAmount: 0,
              feeStatus: newPaid >= newTotal && newTotal > 0 ? 'Paid' : 'Unpaid'
            };
          }
          return s;
        }));
        
        // Close modal if open
        if (selectedStudentForSlip && selectedStudentForSlip._id === studentId) {
          setSelectedSlipUrl(null);
          setSelectedStudentForSlip(null);
          setApproveAmount('');
          setRejectReason('');
        }
      }
    } catch (error) {
      console.error('Error approving fee:', error);
      toast.error('Failed to approve fee.');
    } finally {
      setSlipActionLoading(false);
    }
  };

  const handleResetFee = async (studentId, skipConfirm = false, customReason = '') => {
    if (!skipConfirm && !window.confirm("Are you sure you want to reject this fee slip? The student will need to re-upload.")) return;

    setSlipActionLoading(true);
    try {
      const response = await api.put(`/admin/fees/reset/${studentId}`, { reason: customReason });
      if (response.data.success) {
        toast.success('Fee slip rejected. Status set to Re-upload.');
        setAllStudents(allStudents.map(s => {
          if (s._id === studentId) {
            return { 
              ...s, 
              pendingFeeAmount: 0,
              feeStatus: 'Re-upload'
            };
          }
          return s;
        }));

        if (selectedStudentForSlip && selectedStudentForSlip._id === studentId) {
          setSelectedSlipUrl(null);
          setSelectedStudentForSlip(null);
          setApproveAmount('');
          setRejectReason('');
        }
      }
    } catch (error) {
      console.error('Error resetting fee:', error);
      toast.error('Failed to reset fee.');
    } finally {
      setSlipActionLoading(false);
    }
  };

  const handleSendReminder = (studentName) => {
    toast.success(`Fee reminder notification dispatched to ${studentName}'s portal & email!`, {
      icon: '🔔',
      duration: 4000
    });
  };

  const getTransactionHistory = (student) => {
    const history = [];
    const feePaid = student.feePaid || 0;
    const pendingAmount = student.pendingFeeAmount || 0;
    const regNum = parseInt(student.regNo?.replace(/\D/g, '')) || 123;

    if (feePaid > 0) {
      history.push({
        txnId: `#TXN-${(regNum * 7) % 9000 + 1000}`,
        date: 'Verified Ledger Record',
        amount: feePaid,
        mode: 'Bank Deposit / Online Transfer',
        status: 'Approved',
        isApproved: true,
        isPending: false,
      });
    }

    if (pendingAmount > 0 || (student.feeStatus === 'Pending' && student.feeSlipLink)) {
      history.push({
        txnId: `#TXN-${(regNum * 23) % 9000 + 1000}`,
        date: 'Pending Review',
        amount: pendingAmount || Math.max(0, (student.feeTotal || 15000) - feePaid),
        mode: 'Online Deposit Slip',
        status: 'Pending Approval',
        isApproved: false,
        isPending: true,
      });
    }

    return history;
  };

  const getStudentStatus = (student) => {
    const feeTotal = student.feeTotal !== undefined ? student.feeTotal : 0;
    const feePaid = student.feePaid || 0;
    if (student.feeStatus === 'Re-upload') return 'Re-upload';
    if (feeTotal === 0) return 'Unpaid';
    if (feePaid >= feeTotal) return 'Paid';
    if (student.pendingFeeAmount > 0) return 'Pending';
    return 'Unpaid';
  };

  // Filter Data
  const defaulters = allStudents.filter(s => (s.feeTotal || 0) > 0 && (getStudentStatus(s) === 'Unpaid' || getStudentStatus(s) === 'Re-upload'));
  const pendingStudents = allStudents.filter(s => getStudentStatus(s) === 'Pending').sort((a, b) => {
    const aLatest = a.feeSlips && a.feeSlips.length > 0 ? new Date(a.feeSlips[a.feeSlips.length - 1].uploadedAt).getTime() : 0;
    const bLatest = b.feeSlips && b.feeSlips.length > 0 ? new Date(b.feeSlips[b.feeSlips.length - 1].uploadedAt).getTime() : 0;
    return bLatest - aLatest;
  });
  const paidStudents = allStudents.filter(s => (s.feeTotal || 0) > 0 && getStudentStatus(s) === 'Paid');

  // unique programs list for filtering
  const uniquePrograms = Array.from(new Set(allStudents.map(s => s.programName).filter(Boolean)));

  const baseFilteredStudents = activeTab === 'all' 
    ? allStudents 
    : activeTab === 'defaulters' 
      ? defaulters 
      : activeTab === 'pending'
        ? pendingStudents
        : paidStudents;

  // Filter dynamically by search terms and programs
  const displayedStudents = baseFilteredStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.regNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === 'all' || s.programName === selectedProgram;
    return matchesSearch && matchesProgram;
  });

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedProgram]);

  // Pagination calculations
  const totalStudents = displayedStudents.length;
  const totalPages = Math.ceil(totalStudents / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalStudents);
  const paginatedStudents = displayedStudents.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Calculate statistics
  const totalReceivables = allStudents.reduce((sum, s) => sum + (s.feeTotal || 0), 0);
  const totalCollected = allStudents.reduce((sum, s) => sum + (s.feePaid || 0), 0);
  const totalOutstanding = totalReceivables - totalCollected;
  const pendingApprovalsCount = pendingStudents.length;

  const collectedPercentage = totalReceivables > 0 ? Math.round((totalCollected / totalReceivables) * 100) : 0;

  // Helper to generate dynamic user initials avatar color
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-600 text-blue-100', 
      'bg-indigo-600 text-indigo-100', 
      'bg-purple-600 text-purple-100', 
      'bg-emerald-600 text-emerald-100', 
      'bg-rose-600 text-rose-100',
      'bg-amber-600 text-amber-100'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Loading University Financial Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto pb-16 px-4">
      <Toaster position="top-right" />
      
      {/* Premium University Portal Header */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold tracking-wider uppercase">
              <GraduationCap size={14} className="animate-bounce" /> Academic Accounts
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              University Fee Management Center
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consolidated financial ledger. Track receivables, verify bank deposit slips, schedule payment deadlines, and audit course fee declarations.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Generate Monthly Fee Schedule Button */}
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group shrink-0"
            >
              <Sparkles size={16} className="text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>Generate Monthly Fee Schedule</span>
            </button>

            {/* Active Ledger Summary Badge */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
                {collectedPercentage}%
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</p>
                <p className="text-sm font-bold text-slate-200">Current Semester</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced University Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receivables Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign size={22} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Gross Ledger</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Receivables</p>
            <p className="text-2xl font-black text-slate-800 mt-1.5">Rs. {totalReceivables.toLocaleString()}</p>
          </div>
        </div>

        {/* Collected Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={22} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Collected</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fees Collected</p>
            <p className="text-2xl font-black text-emerald-600 mt-1.5">Rs. {totalCollected.toLocaleString()}</p>
          </div>
        </div>

        {/* Outstanding Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <ShieldAlert size={22} />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Arrears</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding Arrears</p>
            <p className="text-2xl font-black text-rose-600 mt-1.5">Rs. {totalOutstanding.toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Clock size={22} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">To Audit</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-2xl font-black text-amber-600 mt-1.5">{pendingApprovalsCount} Slips</p>
          </div>
        </div>
      </div>

      {/* University Configurations Panel (Deadline & Bank Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deadline Settings */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
              <Calendar className="text-indigo-600" size={20} /> Submission Deadline
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Set the final date for term submissions. Slips submitted after this will flag late warnings.
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700"
            />
            <button
              onClick={saveDeadline}
              disabled={savingDeadline}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              {savingDeadline ? 'Saving...' : <><Save size={16} /> Update Deadline</>}
            </button>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                <Sparkles className="text-emerald-600" size={20} /> Bank Account Details
              </h2>
              <p className="text-xs text-slate-500">
                Official bank details displayed on the student portal for submitting deposits.
              </p>
            </div>
            {isEditingBank ? (
              <button
                onClick={saveBankDetails}
                disabled={savingBankDetails}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-100 cursor-pointer text-xs"
              >
                {savingBankDetails ? 'Saving...' : <><Save size={14} /> Save Details</>}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingBank(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all border border-indigo-100 cursor-pointer text-xs"
              >
                <Edit2 size={14} /> Edit Details
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. Meezan Bank Ltd."
                value={bankDetails.bankName}
                disabled={!isEditingBank}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                className="w-full px-4 py-2.5 disabled:opacity-65 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Title</label>
              <input
                type="text"
                placeholder="e.g. Khadeeja Tul Kubra Institute"
                value={bankDetails.accountTitle}
                disabled={!isEditingBank}
                onChange={(e) => setBankDetails({ ...bankDetails, accountTitle: e.target.value })}
                className="w-full px-4 py-2.5 disabled:opacity-65 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 0123 4567 8901"
                value={bankDetails.accountNumber}
                disabled={!isEditingBank}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                className="w-full px-4 py-2.5 disabled:opacity-65 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">IBAN Number</label>
              <input
                type="text"
                placeholder="e.g. PK12 MEZN 0001 2345 6789"
                value={bankDetails.iban}
                disabled={!isEditingBank}
                onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                className="w-full px-4 py-2.5 disabled:opacity-65 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Panel */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          
          {/* Custom Designed University Tab Bar */}
          <div className="flex flex-wrap gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-max max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              All Students ({allStudents.length})
            </button>
            
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending Review ({pendingStudents.length})
            </button>

            <button
              onClick={() => setActiveTab('defaulters')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'defaulters' 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-100' 
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Unpaid ({defaulters.length})
            </button>
            
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'paid' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Fully Approved ({paidStudents.length})
            </button>
          </div>

          {/* Search & Program Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700"
              />
            </div>
            
            {/* Program Filter */}
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">All Departments / Programs</option>
              {uniquePrograms.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Records Ledger Table */}
        <div className="border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
          {displayedStudents.length === 0 ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-400">
                <Users size={36} />
              </div>
              <p className="text-base font-bold text-slate-700">No records match filters</p>
              <p className="text-xs text-slate-400 mt-2">
                Modify search parameters or check other tabs for active student fee records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-5 pl-8">Student Particulars</th>
                    <th className="p-5">Registration Code</th>
                    <th className="p-5">Ledger Status</th>
                    <th className="p-5">Financial Summary</th>
                    <th className="p-5 text-center">Verified Receipt Slip</th>
                    <th className="p-5 pr-8 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => {
                    const feeTotal = student.feeTotal !== undefined ? student.feeTotal : 0;
                    const feePaid = student.feePaid || 0;
                    const remainingBalance = feeTotal - feePaid;
                    const status = getStudentStatus(student);
                    const isExpanded = expandedStudentId === student._id;

                    const initials = student.name
                      ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'ST';

                    return (
                      <React.Fragment key={student._id}>
                        {/* Table Row */}
                        <tr className={`hover:bg-slate-50/60 transition-colors ${isExpanded ? 'bg-slate-50/30' : ''}`}>
                          {/* Student Details with Avatar initials */}
                          <td className="p-5 pl-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(student.name)}`}>
                                {initials}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm leading-snug flex items-center gap-2">
                                  {student.name}
                                  {status === 'Pending' && student.feeSlipLink && (
                                    <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200" title="Slip Uploaded">
                                      Slip
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{student.programName || 'Not Assigned'}</div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Roll No */}
                          <td className="p-5">
                            <div className="font-bold text-slate-600 text-xs tracking-wide">
                              {student.regNo}
                            </div>
                            <div className="mt-1">
                              {student.voucher?.fees ? (
                                <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Voucher Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                                  Not Set
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Fee Status Badge */}
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 
                              status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 
                              status === 'Re-upload' ? 'bg-purple-50 text-purple-700 border border-purple-200/50 animate-pulse' :
                              'bg-rose-50 text-rose-700 border border-rose-200/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status === 'Paid' ? 'bg-emerald-500' : 
                                status === 'Pending' ? 'bg-amber-500 animate-ping' : 
                                status === 'Re-upload' ? 'bg-purple-500 animate-bounce' :
                                'bg-rose-500'
                              }`} />
                              {status === 'Pending' ? 'Pending Audit' : status === 'Re-upload' ? 'Re-upload Required' : status}
                            </span>
                          </td>
                          
                          {/* Financials details */}
                          <td className="p-5">
                            <div className="text-xs font-bold text-slate-900">
                              Rs. {remainingBalance.toLocaleString()} <span className="text-slate-400 font-normal">due</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              of Rs. {feeTotal.toLocaleString()} total
                            </div>
                            {status === 'Pending' && student.pendingFeeAmount > 0 && (
                              <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md mt-1">
                                Filed Slip: Rs. {student.pendingFeeAmount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          
                          {/* Slip Link (Inline preview popup setup) */}
                          <td className="p-5 text-center">
                            {student.feeSlipLink && status !== 'Unpaid' ? (
                              <button 
                                onClick={() => {
                                  setSelectedSlipUrl(student.feeSlipLink);
                                  setSelectedStudentForSlip(student);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-all text-[11px] border border-indigo-100 cursor-pointer"
                              >
                                <Eye size={13} /> Review Slip
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium italic text-[11px]">No deposits filed</span>
                            )}
                          </td>
                          
                          {/* Action Panel */}
                          <td className="p-5 pr-8 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Toggle expandable breakdown */}
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : student._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors text-[11px] border border-slate-200 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {isExpanded ? 'Hide' : 'Details'}
                              </button>

                              {/* Edit Fee Button */}
                              <button
                                onClick={() => setEditModalStudent(student._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors text-[11px] border border-indigo-200 cursor-pointer"
                                title="Edit Fee Voucher"
                              >
                                <Edit2 size={13} /> Edit Fee
                              </button>

                              {/* Print Voucher Button */}
                              <button
                                onClick={() => setPreviewModalStudent(student._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors text-[11px] border border-slate-200 cursor-pointer"
                                title="Print Voucher"
                              >
                                <ExternalLink size={13} /> Voucher
                              </button>

                              {/* Approved Action */}
                              {status === 'Pending' && (
                                <button
                                  onClick={() => handleApprove(student._id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-[11px] shadow-sm cursor-pointer"
                                >
                                  <Check size={13} /> Approve
                                </button>
                              )}

                              {/* Remind Defaulters (Mock email dispatcher) */}
                              {status === 'Unpaid' && feeTotal > 0 && (
                                <button
                                  onClick={() => handleSendReminder(student.name)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold transition-colors text-[11px] border border-amber-200/50 cursor-pointer"
                                  title="Send Email Reminder"
                                >
                                  <Mail size={13} /> Remind
                                </button>
                              )}

                              {/* Reset action */}
                              {status === 'Paid' && (
                                <button
                                  onClick={() => handleResetFee(student._id)}
                                  className="inline-flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-all border border-rose-100 cursor-pointer"
                                  title="Reset student payment status"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Collapsible courses & transaction history drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan="6" className="p-6 pl-14 pr-8">
                              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-inner grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
                                
                                {/* Official Fee Voucher Breakdown Table */}
                                <div className="lg:col-span-7 space-y-4">
                                  <FeeBreakdownTable 
                                    feeItems={student.feeItems} 
                                    title="Fee Voucher Breakdown" 
                                    subtitle={`Installment schedule for ${student.name} (${student.regNo})`}
                                  />
                                </div>
                                
                                {/* Transaction Ledger List */}
                                <div className="lg:col-span-5 space-y-4">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <Award size={16} className="text-emerald-600" />
                                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-800">Transaction History Logs</h4>
                                    </div>
                                    {student.feeSlipLink && (
                                      <button
                                        onClick={() => {
                                          setSelectedSlipUrl(student.feeSlipLink);
                                          setSelectedStudentForSlip(student);
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                      >
                                        <Eye size={12} /> View Slip
                                      </button>
                                    )}
                                  </div>
                                  
                                  {getTransactionHistory(student).length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                                      No transaction deposit records filed by this student yet.
                                    </div>
                                  ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-[11px] text-left border-collapse min-w-[500px]">
                                          <thead>
                                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest font-bold border-b border-slate-200 text-[9px]">
                                              <th className="p-3 pl-4">Txn Code</th>
                                              <th className="p-3">Filed Date</th>
                                              <th className="p-3">Amount</th>
                                              <th className="p-3 text-center">Deposit Status</th>
                                              <th className="p-3 pr-4 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                                            {getTransactionHistory(student).map((tx) => (
                                              <tr key={tx.txnId} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 pl-4 font-mono font-bold text-emerald-800">{tx.txnId}</td>
                                                <td className="p-3 text-slate-400 font-semibold">{tx.date}</td>
                                                <td className="p-3 font-extrabold text-slate-900">Rs. {Number(tx.amount).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                  {tx.isApproved ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                      <CheckCircle2 size={11} className="text-emerald-600" />
                                                      Approved
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                                      <Clock size={11} className="text-amber-600" />
                                                      Pending Approval
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-3 pr-4 text-right">
                                                  <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                      const action = e.target.value;
                                                      if (action === 'view') {
                                                        setSelectedSlipUrl(student.feeSlipLink);
                                                        setSelectedStudentForSlip(student);
                                                      } else if (action === 'approve') {
                                                        handleApprove(student._id);
                                                      } else if (action === 'reject') {
                                                        handleResetFee(student._id, true);
                                                      }
                                                      e.target.value = "";
                                                    }}
                                                    className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer transition-all"
                                                  >
                                                    <option value="" disabled>⚡ Select Action ▾</option>
                                                    {student.feeSlipLink && <option value="view">👁️ View Slip</option>}
                                                    {tx.isPending && <option value="approve">✅ Approve Deposit</option>}
                                                    {tx.isPending && <option value="reject">❌ Reject Deposit</option>}
                                                    {tx.isApproved && <option value="reject">🔄 Reset / Re-upload</option>}
                                                  </select>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {displayedStudents.length > 0 && (
            <div className="p-4 sm:p-5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Left: Summary and Records info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                <span>
                  Showing <strong className="text-slate-800">{totalStudents > 0 ? startIndex + 1 : 0}</strong> to{' '}
                  <strong className="text-slate-800">{endIndex}</strong> of{' '}
                  <strong className="text-slate-900 font-bold">{totalStudents}</strong> students
                </span>

                {/* Rows Per Page Dropdown */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-slate-400 font-medium">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>

              {/* Right: Page Navigation Buttons */}
              <div className="flex items-center gap-1.5">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                  title="First Page"
                >
                  <ChevronsLeft size={15} />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                  title="Previous Page"
                >
                  <ChevronLeft size={15} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold text-xs">...</span>
                    ) : (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          safeCurrentPage === pageNum
                            ? 'bg-slate-900 text-white shadow-sm scale-105'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                  title="Next Page"
                >
                  <ChevronRight size={15} />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                  title="Last Page"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Modern Lightbox Modal to Review Fee Slips Inline */}
      {selectedSlipUrl && selectedStudentForSlip && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 md:p-10 animate-backdrop-enter">
          <div className="relative bg-white w-full h-full max-w-7xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200/50 animate-modal-enter">
            
            {/* Left: Interactive Slip Display */}
            <div className="bg-slate-950 p-6 flex flex-col justify-center items-center flex-1 h-full relative">
              <div className="absolute top-6 left-6 flex gap-2 z-10">
                <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/5">
                  Deposit Voucher Preview
                </span>
              </div>
              
              <div className="w-full h-full max-h-[80vh] flex items-center justify-center p-2">
                {selectedSlipUrl.endsWith('.pdf') ? (
                  <iframe 
                    src={selectedSlipUrl} 
                    className="w-full h-full border-0 rounded-2xl shadow-2xl"
                    title="PDF Fee Slip"
                  />
                ) : (
                  <img 
                    src={selectedSlipUrl} 
                    alt="Receipt Slip" 
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                )}
              </div>

              {/* Quick links to download or open */}
              <div className="mt-6 flex gap-3 z-10">
                <a 
                  href={selectedSlipUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} /> Open in New Tab
                </a>
                <a 
                  href={selectedSlipUrl} 
                  download 
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-colors cursor-pointer"
                >
                  <Download size={13} /> Download File
                </a>
              </div>
            </div>
            
            {/* Right: Reconciliation Detail Info & Quick Action Panel */}
            <div className="p-8 md:w-100 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between h-full overflow-y-auto">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Audit Desk</h3>
                    <p className="text-xs text-slate-400">Reconcile transaction details</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedSlipUrl(null);
                      setSelectedStudentForSlip(null);
                    }}
                    className="p-2 bg-slate-200 hover:bg-slate-300/80 rounded-full transition-colors text-slate-600 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Student info box */}
                <div className="space-y-6 text-xs">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depositor Particulars</p>
                    <div className="font-extrabold text-slate-800 text-base leading-tight">
                      {selectedStudentForSlip.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Registration ID: {selectedStudentForSlip.regNo}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded w-max">
                      {selectedStudentForSlip.programName}
                    </div>
                  </div>
                  
                  {/* Financial Audit Stats */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Financial Reconciliation</p>
                    <div className="flex justify-between font-semibold text-slate-500 text-xs">
                      <span>Total Term Fees:</span>
                      <span className="font-bold text-slate-800">Rs. {(selectedStudentForSlip.feeTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-500 text-xs">
                      <span>Total Paid Already:</span>
                      <span className="font-bold text-emerald-600">Rs. {(selectedStudentForSlip.feePaid || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-3 text-sm">
                      <span>Claimed Deposit Amount:</span>
                      <span className="text-amber-600">Rs. {(selectedStudentForSlip.pendingFeeAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer Audit CTA buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => handleApprove(selectedStudentForSlip._id)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-100 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <CheckCircle2 size={16} /> Approve Deposit Slip
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Reject this slip and request student to re-upload?")) {
                      handleResetFee(selectedStudentForSlip._id, true);
                      setSelectedSlipUrl(null);
                      setSelectedStudentForSlip(null);
                    }
                  }}
                  className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl transition-colors border border-rose-200 text-xs uppercase tracking-wider cursor-pointer"
                >
                  Reject & Request Re-upload
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Bulk Fee Schedule Generator Modal */}
      {isScheduleModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-backdrop-enter">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-modal-enter">
            
            {/* Modal Header */}
            <div className="p-6 md:p-7 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    Automated Ledger Control
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                    Bulk Month-wise Fee Schedule Generator
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Generate structured installment timelines and fee voucher line items across student cohorts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-7 space-y-6">
              
              {/* Target Course / Cohort Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-indigo-600" /> Target Academic Cohort / Course
                  </label>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {scheduleCourse === 'all' 
                      ? `${allStudents.length} Students Total` 
                      : `${allStudents.filter(s => s.programName === scheduleCourse).length} Students Enrolled`}
                  </span>
                </div>
                <select
                  value={scheduleCourse}
                  onChange={(e) => setScheduleCourse(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value="all">⚡ All Departments / Programs (Bulk Apply to Entire Student Body)</option>
                  {uniquePrograms.map(prog => (
                    <option key={prog} value={prog}>🎓 {prog}</option>
                  ))}
                </select>
              </div>

              {/* Total Course Fee & Start Month Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Course Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <DollarSign size={15} className="text-emerald-600" /> Total Course Fee (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={scheduleTotalFee}
                      onChange={(e) => setScheduleTotalFee(Number(e.target.value))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>

                {/* Start Month */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar size={15} className="text-blue-600" /> Start Billing Month
                  </label>
                  <input
                    type="month"
                    value={scheduleStartMonth}
                    onChange={(e) => setScheduleStartMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Fee Split Strategy Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fee Installment Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Even Monthly Split */}
                  <div
                    onClick={() => setScheduleSplitType('even')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      scheduleSplitType === 'even'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">📅 Even Monthly Split</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        scheduleSplitType === 'even' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {scheduleSplitType === 'even' && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Distribute the total fee evenly across selected consecutive calendar months.
                    </p>
                  </div>

                  {/* Predefined Voucher Template */}
                  <div
                    onClick={() => setScheduleSplitType('voucher')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      scheduleSplitType === 'voucher'
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">📑 Predefined Voucher Template</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        scheduleSplitType === 'voucher' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {scheduleSplitType === 'voucher' && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Voucher breakdown: Initial Enrollment + Semester Terms + Certificate Fee.
                    </p>
                  </div>
                </div>
              </div>

              {/* Installment Months Count (if Even Split) */}
              {scheduleSplitType === 'even' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Number of Consecutive Installment Months
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[2, 3, 4, 6, 8, 12].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setScheduleMonthsCount(m)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          scheduleMonthsCount === m
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Live Schedule Allocation Preview
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {getSchedulePreviewItems().length} Line Items Total
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                        <th className="p-2.5 pl-4">Item Title</th>
                        <th className="p-2.5">Timeline / Month</th>
                        <th className="p-2.5 text-right">Instalment Amount</th>
                        <th className="p-2.5 pr-4 text-center">Initial Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {getSchedulePreviewItems().map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 pl-4 font-bold text-slate-800">{item.title}</td>
                          <td className="p-2.5 text-slate-500 font-semibold">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                              {item.term}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900">
                            Rs. {Number(item.amount).toLocaleString()}
                          </td>
                          <td className="p-2.5 pr-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.status === 'Unpaid' 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-200 font-bold text-slate-900">
                        <td colSpan="2" className="p-2.5 pl-4 text-slate-600">
                          Total Scheduled Allocation
                        </td>
                        <td className="p-2.5 text-right text-emerald-800 font-black">
                          Rs. {Number(scheduleTotalFee).toLocaleString()}
                        </td>
                        <td className="p-2.5 pr-4 text-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">100% Balanced</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl">
              <div className="text-xs text-slate-500">
                Will update <strong className="text-slate-900 font-bold">{targetStudentCount}</strong> student financial record(s).
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={generatingSchedule || targetStudentCount === 0}
                  onClick={handleGenerateSchedule}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-200 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingSchedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Applying Schedule to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Generate & Apply Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      <EditFeeModal 
        studentId={editModalStudent}
        isOpen={!!editModalStudent}
        onClose={() => setEditModalStudent(null)}
        onSuccess={fetchStudents}
      />

      <VoucherPreviewModal
        studentId={previewModalStudent}
        isOpen={!!previewModalStudent}
        onClose={() => setPreviewModalStudent(null)}
      />
    </div>
  );
};

export default ManageFees;
