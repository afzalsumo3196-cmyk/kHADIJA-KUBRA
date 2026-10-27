import React, { useState, useEffect } from 'react';
import { Award, Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printCert, setPrintCert] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/portal/certificates');
        if (res.data.success) {
          setCertificates(res.data.certificates);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch certificates.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();

    const handleAfterPrint = () => setPrintCert(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrint = (cert) => {
    setPrintCert(cert);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in-up max-w-6xl mx-auto print:hidden">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Records</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">My Certificates</h2>
          <p className="mt-2 text-slate-500 max-w-2xl">
            View, download, and verify your official digital certificates and diplomas.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-semibold">{error}</div>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-110 transition-transform">
                  <Award size={24} />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                  <CheckCircle2 size={12} /> {cert.status}
                </span>
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Academic</p>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{cert.certificateType || cert.courseTitle}</h3>
                {cert.courseTitle && cert.courseTitle !== 'N/A' && <p className="text-sm font-medium text-slate-600">{cert.courseTitle}</p>}
                <p className="text-sm font-medium text-slate-500">Issued: {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                {cert.fileUrl ? (
                  <a 
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95"
                  >
                    <Download size={16} /> View / Download File
                  </a>
                ) : (
                  <button 
                    onClick={() => handlePrint(cert)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95"
                  >
                    <Download size={16} /> Download / Print
                  </button>
                )}
              </div>
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="col-span-full mt-8 rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
                 <Award size={28} />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Looking for a specific certificate?</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Certificates are generated automatically within 14 days of course completion. If you are missing a certificate, please contact the administration.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Layout */}
      {printCert && (
        <div className="hidden print:flex fixed inset-0 bg-white items-center justify-center p-8 z-50">
          <div className="border-[12px] border-double border-emerald-800 p-16 text-center w-full max-w-4xl max-h-[90vh] bg-emerald-50/30">
            <h1 className="text-5xl font-black text-slate-900 mb-4 uppercase tracking-widest">Certificate of Completion</h1>
            <p className="text-xl text-slate-600 italic mb-12">This certifies that</p>
            <h2 className="text-4xl font-extrabold text-emerald-700 border-b-2 border-emerald-200 pb-4 inline-block px-12 mb-12">{printCert.studentName}</h2>
            <p className="text-xl text-slate-600 italic mb-8">has successfully completed the program</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-16">{printCert.courseTitle}</h3>
            
            <div className="flex justify-between items-end mt-20 pt-8 border-t border-emerald-200">
              <div className="text-left">
                <p className="font-bold text-slate-800">Date Issued</p>
                <p className="text-slate-600">{new Date(printCert.issueDate || printCert.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <Award size={64} className="text-emerald-700 mb-2 opacity-20" />
                <p className="font-bold text-slate-800">Official Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Certificates;
