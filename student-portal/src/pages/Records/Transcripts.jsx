import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Loader2, AlertCircle, ExternalLink, CalendarDays, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const Transcripts = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for tabs, defaulting to empty
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const response = await api.get('/portal/transcripts');
        let fetchedTranscripts = [];
        if (Array.isArray(response.data)) {
          fetchedTranscripts = response.data;
        } else if (response.data.success) {
          fetchedTranscripts = response.data.transcripts;
        }
        setTranscripts(fetchedTranscripts);
        
        // Dynamically set active tab to the first available semester transcript
        if (fetchedTranscripts.length > 0) {
          const sortedSemesters = fetchedTranscripts
            .map(t => t.semester)
            .sort((a, b) => {
              const numA = parseInt(a, 10);
              const numB = parseInt(b, 10);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return a.localeCompare(b);
            });
          setActiveTab(sortedSemesters[0]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch transcripts');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscripts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
        <p className="text-emerald-700 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Records...</p>
      </div>
    );
  }

  // Filter transcript for the currently selected semester
  const activeTranscript = transcripts.find(t => t.semester === activeTab);

  // Only show semesters that are actually uploaded
  const allTabs = transcripts
    .map(t => t.semester)
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto pb-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-emerald-700 font-semibold">Academic Record</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Award className="text-emerald-500" size={32} />
              Semester Transcripts
            </h1>
            <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
              Select a semester tab below to view or download your securely uploaded grade reports.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 shadow-sm max-w-md flex items-center gap-3">
          <AlertCircle size={24} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      {allTabs.length > 0 && (
        <div className="bg-slate-100/50 p-2 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {allTabs.map(tabId => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tabId 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transparent'
                }`}
              >
                <CalendarDays size={16} className={activeTab === tabId ? 'text-emerald-500' : 'text-slate-400'} />
                {['1', '2', '3', '4', '5', '6', '7', '8'].includes(tabId) ? `Sem ${tabId}` : tabId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="mt-8">
        {allTabs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm animate-fade-in flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Transcripts Not Available</h3>
            <p className="text-slate-500 mt-2 font-medium">
              No academic transcripts have been uploaded to your profile yet.
            </p>
          </div>
        ) : !activeTranscript ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm animate-fade-in flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Transcript Not Available</h3>
            <p className="text-slate-500 mt-2 font-medium">
              Transcript for Semester {activeTab} has not been uploaded yet.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-md transition-all animate-fade-in relative overflow-hidden group">
            <div className="absolute -right-16 -top-16 w-40 h-40 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
            
            <div className="relative flex items-start gap-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex shrink-0 items-center justify-center border border-emerald-100">
                <BookOpen size={32} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400 font-bold mb-1">Result Uploaded</p>
                <h2 className="text-3xl font-extrabold text-slate-900">Semester {activeTranscript.semester} Transcript</h2>
                <p className="text-sm text-slate-500 font-medium mt-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Securely Hosted on Cloudinary
                </p>
              </div>
            </div>

            <div className="relative">
              <a 
                href={activeTranscript.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:bg-emerald-700 active:scale-95"
              >
                <ExternalLink size={20} /> View / Download PDF
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 mb-4">
           <Award size={24} />
        </div>
        <h4 className="text-base font-bold text-slate-900">Official Records</h4>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          These documents are securely hosted and verified by administration. If you notice any discrepancies, please contact the helpdesk immediately.
        </p>
      </div>
    </div>
  );
};

export default Transcripts;
