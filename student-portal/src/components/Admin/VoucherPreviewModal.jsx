import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { X, Download, Printer, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import VoucherTemplate from '../VoucherTemplate';
import { generateVoucherPdf } from '../../utils/voucherPdf';

const VoucherPreviewModal = ({ studentId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [voucherRes, bankRes, deadlineRes] = await Promise.all([
          api.get(`/admin/fees/student/${studentId}/voucher`),
          api.get('/admin/settings/BANK_DETAILS'),
          api.get('/admin/settings/FEE_DEADLINE')
        ]);
        
        setVoucherData(voucherRes.data);
        if (bankRes.data.success) setBankDetails(bankRes.data.value);
        if (deadlineRes.data.success) setDeadline(deadlineRes.data.value);
        
      } catch (err) {
        console.error(err);
        setError('Failed to fetch voucher data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, studentId]);

  useEffect(() => {
    if (!containerRef.current || loading) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableWidth = entry.contentRect.width;
        // 794 is the exact width of the template. Add slight padding margin if needed, but we'll use exact width.
        const s = Math.min(1, availableWidth / 794);
        setScale(s);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen, loading]);

  const handleDownload = async () => {
    if (isDownloading || !voucherData) return;
    
    setIsDownloading(true);
    const toastId = toast.loading('Generating PDF...');
    
    try {
      await generateVoucherPdf(voucherData, bankDetails, deadline);
      toast.success('Downloaded successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      {/* Hide modal styling from print, only show the print-area */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; transform: none !important; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (No Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Voucher Preview</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Review and generate PDF voucher</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || error || isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || error || isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
            <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-200 p-2 sm:p-6 flex justify-center no-print">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-indigo-500 w-full">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium text-slate-500">Loading voucher template...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 w-full">
              <AlertCircle size={48} className="mb-4" />
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-center font-medium">
                {error}
              </div>
            </div>
          ) : (
            <>
              {/* Scaled Preview for UI */}
              <div style={{ height: `${1123 * scale}px`, width: `${794 * scale}px`, flexShrink: 0 }}>
                <div className="print-container shadow-2xl bg-white border border-slate-300" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  <VoucherTemplate data={voucherData} bankDetails={bankDetails} deadline={deadline} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VoucherPreviewModal;
