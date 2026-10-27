import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, CreditCard, Building2, Download, FileText, Loader2, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../api/axios';
import FeeBreakdownTable from '../../components/FeeBreakdownTable';
import { generateVoucherPdf, formatDate, formatRs } from '../../utils/voucherPdf';

const PayFees = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [feeAmount, setFeeAmount] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  
  const [voucherData, setVoucherData] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchMyFees();
  }, []);

  const fetchMyFees = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      if (profileRes.data.success) {
        const regNo = profileRes.data.student.regNo;
        
        // Fetch both old fee info and new voucher data
        const [feeRes, voucherRes] = await Promise.all([
          api.get(`/fees/student/${regNo}`),
          api.get('/fees/my-voucher').catch(() => ({ data: { success: false } }))
        ]);

        if (feeRes.data.success) {
          setStudentInfo(feeRes.data.student);
          // Set feeAmount fallback to pendingFee from voucher if available
          setBankDetails(feeRes.data.bankDetails);
        }
        
        if (voucherRes.data?.success && voucherRes.data?.voucher) {
          setVoucherData(voucherRes.data.voucher);
          if (voucherRes.data.deadline) setDeadline(voucherRes.data.deadline);
          if (voucherRes.data.bankDetails) setBankDetails(voucherRes.data.bankDetails);
          // Auto-fill amount with pending fee from voucher if > 0
          if (voucherRes.data.voucher.totals?.pendingFee > 0) {
            setAmount(voucherRes.data.voucher.totals.pendingFee.toString());
          } else {
            setAmount(feeRes.data?.feeAmount?.toString() || '');
          }
        } else {
          setAmount(feeRes.data?.feeAmount?.toString() || '');
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.message || 'Fees jama karwane ki tareeq guzar chuki hai!');
      } else {
        setError('Failed to fetch fee details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Selected file is too large! Maximum size allowed is 10MB.');
        setFile(null);
        e.target.value = '';
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a fee slip to upload.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected file is too large! Maximum size allowed is 10MB.');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('studentId', studentInfo.id);
    formData.append('amount', amount);
    formData.append('feeSlip', file);

    try {
      const response = await api.post('/fees/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setSuccess(true);
        setStudentInfo({ ...studentInfo, feeStatus: 'Pending' });
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.message || 'Fees jama karwane ki tareeq guzar chuki hai!');
      } else {
        setError('Failed to upload slip. Please try again later.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading || !voucherData) return;
    
    setIsDownloading(true);
    const toastId = toast.loading('Generating PDF...');
    
    try {
      const stu = voucherData.student || {};
      const safeId = (stu.studentId || stu.regNo || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Fee_Voucher_${safeId}.pdf`;
      
      await generateVoucherPdf(voucherData, bankDetails, deadline);
      toast.success('Downloaded successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const showUploadSection = () => {
    if (studentInfo?.feeStatus === 'Unpaid' || studentInfo?.feeStatus === 'Re-upload') return true;
    if (voucherData && voucherData.totals?.pendingFee > 0) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <CreditCard className="mr-3 text-emerald-600" /> Pay Fees
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Online Fee Submission</h2>
          <p className="text-emerald-100/80 text-sm">Upload your fee slip and specify the amount you are paying.</p>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start animate-fade-in">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex flex-col items-center text-center animate-fade-in">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <h3 className="text-xl font-bold mb-1">Fee Slip Uploaded Successfully!</h3>
              <p className="text-emerald-700 text-sm">Your fee status has been marked as <strong>Pending</strong>. It will be updated once the administration approves it.</p>
            </div>
          )}

          {/* Student Info & Upload Section */}
          {studentInfo && !success && (
            <div className="animate-fade-in space-y-6">
              {/* Student Details Card (Existing) */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-200">Student Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Name</p>
                    <p className="font-semibold text-slate-800">{studentInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Roll Number</p>
                    <p className="font-semibold text-slate-800">{studentInfo.regNo}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Program</p>
                    <p className="font-semibold text-slate-800">{studentInfo.programName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Current Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      studentInfo.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 
                      studentInfo.feeStatus === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                      studentInfo.feeStatus === 'Re-upload' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {studentInfo.feeStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee Voucher Card */}
              {voucherData ? (
                <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="text-emerald-600" size={20} /> Fee Voucher
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Voucher No: <span className="font-mono font-medium">{voucherData.voucherNumber}</span></p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        voucherData.totals?.pendingFee === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {voucherData.totals?.pendingFee === 0 ? 'CLEARED' : 'DUES PENDING'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Total Fee</p>
                        <p className="font-bold text-slate-800">{formatRs(voucherData.totals?.totalFee)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Paid Fee</p>
                        <p className="font-bold text-emerald-600">{formatRs(voucherData.totals?.paidFee)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Pending Fee</p>
                        <p className="font-bold text-rose-600">{formatRs(voucherData.totals?.pendingFee)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Due Date</p>
                        <p className="font-bold text-slate-800">{formatDate(deadline)}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-70 shadow-md shadow-emerald-200"
                    >
                      {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      Download Voucher (PDF)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">Your fee voucher has not been issued yet. Please contact the administration if you believe this is an error.</p>
                </div>
              )}

              {/* Status Messages & Upload Logic */}
              {studentInfo.feeStatus === 'Paid' && !showUploadSection() ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-emerald-800 font-medium">Your fees for this semester have already been paid and approved.</p>
                </div>
              ) : studentInfo.feeStatus === 'Pending' ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-amber-800 font-medium mb-4">Your fee slip is currently under review by the administration. Please wait for approval.</p>
                  <p className="text-xs text-amber-600 bg-amber-100/50 p-2 rounded-lg inline-block">Uploading another slip is disabled while your current slip is pending.</p>
                </div>
              ) : (
                <>
                  {studentInfo.feeStatus === 'Re-upload' && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      <span>Your previously submitted slip was rejected. Please re-upload a valid fee deposit receipt.</span>
                    </div>
                  )}

                  {studentInfo.feeStatus === 'Paid' && showUploadSection() && (
                    <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex flex-col items-center gap-2 text-sm font-medium shadow-sm text-center">
                      <p>Your previous slip was approved, but you still have an outstanding balance.</p>
                      <p className="font-bold text-lg">Outstanding balance: {formatRs(voucherData?.totals?.pendingFee)}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Official Fee Breakdown Table (Fallback if no voucher) */}
                    {!voucherData && (
                      <FeeBreakdownTable 
                        feeItems={studentInfo?.feeItems} 
                        title="Your Official Fee Voucher"
                        subtitle="Breakdown of semester instalments, enrollment and certification dues"
                      />
                    )}

                    {/* Official Bank Account Details */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <Building2 size={16} className="text-emerald-600" />
                        <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-800">Institute Bank Deposit Details</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</p>
                          <p className="font-bold text-slate-900 mt-0.5">{bankDetails?.bankName || 'Meezan Bank Ltd.'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Account Title</p>
                          <p className="font-bold text-slate-900 mt-0.5">{bankDetails?.accountTitle || 'Khadeeja Tul Kubra Institute'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Account Number</p>
                          <p className="font-mono font-bold text-emerald-800 mt-0.5">{bankDetails?.accountNumber || '0123 4567 8901'}</p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">IBAN</p>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">{bankDetails?.iban || 'PK12 MEZN 0001 2345 6789'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-800 mb-2">Upload Paid Fee Slip</label>
                    <p className="text-xs text-slate-500 mb-4">Please enter the exact amount you deposited and attach the receipt.</p>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit Amount (Rs.)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-500 font-bold">Rs.</span>
                        <input
                          type="number"
                          placeholder="e.g. 12000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors mb-6">
                      <input
                        type="file"
                        id="feeSlip"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="feeSlip" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <span className="text-emerald-600 font-semibold mb-1">Click to browse slip image/PDF</span>
                        <span className="text-slate-500 text-sm">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                      {file && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium">
                          Selected: {file.name}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all disabled:opacity-70 flex items-center justify-center"
                    >
                      {uploading ? 'Uploading Slip...' : 'Submit Fee Slip'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayFees;
