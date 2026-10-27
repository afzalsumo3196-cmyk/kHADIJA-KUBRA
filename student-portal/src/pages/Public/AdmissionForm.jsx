import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  Layers, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Globe2, 
  Building2, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Eye, 
  HelpCircle,
  Award
} from 'lucide-react';
import api from '../../api/axios';

const ENROLLMENT_COURSES = [
  { 
    id: 'Aalima Course (3.5 Years)', 
    title: 'Aalima Course', 
    duration: '3.5 Years', 
    badge: 'Comprehensive',
    desc: 'Complete Islamic scholarship, Quranic Tafseer, Hadith sciences & Fiqh jurisprudence.' 
  },
  { 
    id: 'Tafsir-e-Quran Course (6 Months to 2 Years)', 
    title: 'Tafsir-e-Quran Course', 
    duration: '6 Months to 2 Years', 
    badge: 'Specialized',
    desc: 'Deep linguistic, contextual exegesis and translation of the Holy Quran.' 
  },
  { 
    id: 'UK/USA Diplomas (6 Months to 1.5 Years)', 
    title: 'UK/USA Diplomas', 
    duration: '6 Months to 1.5 Years', 
    badge: 'International',
    desc: 'Internationally recognized Islamic studies diploma accredited by global boards.' 
  },
  { 
    id: 'American Degree (1 to 1.5 Years)', 
    title: 'American Degree', 
    duration: '1 to 1.5 Years', 
    badge: 'Degree Track',
    desc: 'Higher academic degree program recognized by American Board accreditation agencies.' 
  },
];

const ENROLLMENT_PLANS = [
  { 
    id: 'Course: 2 - 3 Months', 
    title: 'Course Track', 
    duration: '2 - 3 Months',
    badge: 'Short Term',
    desc: 'Accelerated foundation and certificate study program.'
  },
  { 
    id: 'Diploma: 6 Months - 1 Year', 
    title: 'Diploma Track', 
    duration: '6 Months - 1 Year',
    badge: 'Professional Diploma',
    desc: 'Intermediate specialization with professional certifications.'
  },
  { 
    id: 'Degree: USA Meta Arees American Board Agency Degrees (1 Year to 1.5 Years)', 
    title: 'Degree Track', 
    duration: '1 Year to 1.5 Years',
    badge: 'USA Meta Arees Approved',
    desc: 'Full American Board agency accredited Islamic degree curriculum.'
  },
];

const AdmissionForm = () => {
  const [formData, setFormData] = useState({
    // Student info fields
    name: '',
    fatherName: '',
    dob: '',
    cnic: '',
    nationality: 'Pakistani',
    religion: 'Islam',
    maritalStatus: 'Single',
    qualification: '',
    country: 'Pakistan',
    city: '',
    number: '',
    fatherPhone: '',
    husbandPhone: '',
    // Course & Plan selections
    course: '',
    enrollmentPlan: '',
  });

  const [files, setFiles] = useState({
    cnicPhoto: null,     // 1. CNIC Front & Back (Image/PDF)
    passportPhoto: null, // 2. Passport-size Photograph (JPEG/PNG)
    documentFile: null,  // 3. Educational Document (PDF Only)
  });

  const [filePreviews, setFilePreviews] = useState({
    cnicPhoto: null,
    passportPhoto: null,
  });

  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState({ cnic: false, number: false });
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' or 'error'
  const [duplicateErrors, setDuplicateErrors] = useState({ cnic: '', number: '' });
  const [submittedData, setSubmittedData] = useState(null);

  // Generate previews when image files change
  useEffect(() => {
    if (files.passportPhoto && files.passportPhoto.type.startsWith('image/')) {
      const url = URL.createObjectURL(files.passportPhoto);
      setFilePreviews((p) => ({ ...p, passportPhoto: url }));
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviews((p) => ({ ...p, passportPhoto: null }));
    }
  }, [files.passportPhoto]);

  useEffect(() => {
    if (files.cnicPhoto && files.cnicPhoto.type.startsWith('image/')) {
      const url = URL.createObjectURL(files.cnicPhoto);
      setFilePreviews((p) => ({ ...p, cnicPhoto: url }));
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviews((p) => ({ ...p, cnicPhoto: null }));
    }
  }, [files.cnicPhoto]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset duplicate error as user edits
    if (duplicateErrors[name]) {
      setDuplicateErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Immediate Duplicate Check on onBlur
  const checkDuplicate = async (fieldName, value) => {
    if (!value || value.trim().length < 5) return;
    
    setCheckingDuplicate((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const res = await api.get(`/public/check-duplicate?${fieldName}=${encodeURIComponent(value.trim())}`);
      if (res.data?.isDuplicate) {
        setDuplicateErrors((prev) => ({
          ...prev,
          [fieldName]: res.data.message,
        }));
        setStatus({
          type: 'error',
          message: `⚠️ Duplicate Alert: ${res.data.message}`,
        });
      } else {
        setDuplicateErrors((prev) => ({
          ...prev,
          [fieldName]: '',
        }));
      }
    } catch (err) {
      console.error('Duplicate check error:', err);
    } finally {
      setCheckingDuplicate((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size validation (Max 8MB)
    const MAX_SIZE_MB = 8;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setStatus({ 
        type: 'error', 
        message: `File size exceeds ${MAX_SIZE_MB}MB. Please compress or choose a smaller file.` 
      });
      e.target.value = '';
      return;
    }

    // Sequence 1: CNIC Front & Back (Image or PDF)
    if (fieldName === 'cnicPhoto') {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) {
        setStatus({ type: 'error', message: 'CNIC file must be an Image (JPG, PNG) or PDF document.' });
        e.target.value = '';
        return;
      }
    }

    // Sequence 2: Passport Photograph (Image only)
    if (fieldName === 'passportPhoto' && !file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Passport Photograph must be an Image format (JPEG/PNG).' });
      e.target.value = '';
      return;
    }

    // Sequence 3: Educational Document (PDF only)
    if (fieldName === 'documentFile' && file.type !== 'application/pdf') {
      setStatus({ type: 'error', message: 'Educational Document must strictly be a PDF document.' });
      e.target.value = '';
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
    setStatus({ type: '', message: '' }); // Clear any previous error
  };

  const removeFile = (fieldName) => {
    setFiles((prev) => ({ ...prev, [fieldName]: null }));
    setFilePreviews((prev) => ({ ...prev, [fieldName]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    // Validate duplicate alerts
    if (duplicateErrors.cnic || duplicateErrors.number) {
      setStatus({ 
        type: 'error', 
        message: 'Duplicate record detected! Please correct your CNIC or Phone Number before submitting.' 
      });
      return;
    }

    // Validate Enrollment Course selection
    if (!formData.course) {
      setStatus({ type: 'error', message: 'Please select an Enrollment Course option from Section 1.' });
      return;
    }

    // Validate Enrollment Plan selection
    if (!formData.enrollmentPlan) {
      setStatus({ type: 'error', message: 'Please select a Current Enrollment Plan from Section 2.' });
      return;
    }

    // Validate Required Files in exact sequence
    if (!files.cnicPhoto || !files.passportPhoto || !files.documentFile) {
      setStatus({ 
        type: 'error', 
        message: 'Please provide all 3 required attachments: 1. CNIC Copy, 2. Passport Photo, and 3. Educational Document PDF.' 
      });
      return;
    }

    setLoading(true);

    const postData = new FormData();
    // Student personal fields
    postData.append('name', formData.name);
    postData.append('fatherName', formData.fatherName);
    postData.append('dob', formData.dob);
    postData.append('cnic', formData.cnic);
    postData.append('nationality', formData.nationality);
    postData.append('religion', formData.religion);
    postData.append('maritalStatus', formData.maritalStatus);
    postData.append('qualification', formData.qualification);
    postData.append('country', formData.country);
    postData.append('city', formData.city);
    postData.append('number', formData.number);
    postData.append('fatherPhone', formData.fatherPhone);
    postData.append('husbandPhone', formData.husbandPhone);

    // Course & Plan
    postData.append('course', formData.course);
    postData.append('enrollmentPlan', formData.enrollmentPlan);
    postData.append('programs', `${formData.course} | ${formData.enrollmentPlan}`);

    // Files (Exact sequence: CNIC, Passport, Document PDF)
    postData.append('cnicPhoto', files.cnicPhoto);
    postData.append('passportPhoto', files.passportPhoto);
    postData.append('documentFile', files.documentFile);

    try {
      const response = await api.post('/public/admission', postData);

      if (response.data.success) {
        setSubmittedData({
          name: formData.name,
          course: formData.course,
          plan: formData.enrollmentPlan,
          cnic: formData.cnic,
          phone: formData.number,
        });
        setStatus({
          type: 'success',
          message: 'Your admission details and files have been successfully submitted and confirmed.',
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit admission form. Please review your details and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      fatherName: '',
      dob: '',
      cnic: '',
      nationality: 'Pakistani',
      religion: 'Islam',
      maritalStatus: 'Single',
      qualification: '',
      country: 'Pakistan',
      city: '',
      number: '',
      fatherPhone: '',
      husbandPhone: '',
      course: '',
      enrollmentPlan: '',
    });
    setFiles({
      cnicPhoto: null,
      passportPhoto: null,
      documentFile: null,
    });
    setFilePreviews({
      cnicPhoto: null,
      passportPhoto: null,
    });
    setDuplicateErrors({ cnic: '', number: '' });
    setStatus({ type: '', message: '' });
    setSubmittedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/20 font-sans selection:bg-emerald-500/20 selection:text-emerald-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-full shadow-sm hover:shadow transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft size={16} /> Back to Home Page
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Official Portal • 2026 Session</span>
          </div>
        </div>

        {/* Premium Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-2xl shadow-emerald-950/20 border border-emerald-800/40 p-6 md:p-10 text-center">
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none"></div>

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            {/* Accreditation Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold tracking-wide uppercase shadow-xs">
                <Sparkles size={12} className="text-emerald-300" /> USA Meta Arees Approved
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[11px] font-bold tracking-wide uppercase shadow-xs">
                <Award size={12} className="text-teal-300" /> UK Medic Pro Approved
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-snug drop-shadow-sm text-white">
              KHADEEJA TUL KUBRA
              <span className="block text-emerald-300 font-extrabold text-xl md:text-2xl mt-1 tracking-wide">
                ISLAMIC INSTITUTE
              </span>
            </h1>

            <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-xl mx-auto">
              Welcome to our official online admission portal. Please fill out the registration form below with accurate academic & personal information.
            </p>

            {/* Steps Guide Indicator */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              {[
                { step: '01', title: 'Course' },
                { step: '02', title: 'Plan' },
                { step: '03', title: 'Personal Info' },
                { step: '04', title: 'Documents' },
              ].map((s, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center backdrop-blur-xs">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{s.step}</span>
                  <p className="text-xs font-bold text-white truncate">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status / Alert Notification */}
        {status.message && (
          <div className={`p-4 md:p-5 rounded-2xl flex items-start gap-3.5 border transition-all duration-300 shadow-sm ${
            status.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50/95 border-rose-200 text-rose-900'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 size={22} className="shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle size={22} className="shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider">
                {status.type === 'success' ? 'Application Status' : 'Attention Required'}
              </p>
              <p className="text-sm font-medium mt-0.5 leading-relaxed">{status.message}</p>
            </div>
          </div>
        )}

        {/* Success View Screen */}
        {status.type === 'success' && submittedData ? (
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-xl shadow-emerald-950/5 text-center space-y-6">
            <div className="inline-flex items-center justify-center h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full shadow-inner ring-8 ring-emerald-50 animate-bounce">
              <CheckCircle2 size={52} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Admission Submitted Successfully
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Welcome, {submittedData.name}!
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your admission application and uploaded documents have been securely recorded. An official verification copy has been emailed to the institute administration for review.
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Selected Course:</span>
                <span className="font-bold text-slate-900 text-right">{submittedData.course}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Study Plan:</span>
                <span className="font-bold text-slate-900 text-right">{submittedData.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">CNIC / ID:</span>
                <span className="font-bold text-slate-900">{submittedData.cnic}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-semibold">Contact Phone:</span>
                <span className="font-bold text-slate-900">{submittedData.phone}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleReset} 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 cursor-pointer text-sm"
              >
                Submit Another Application
              </button>
              <Link 
                to="/" 
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-3.5 rounded-2xl transition-all cursor-pointer text-sm text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          /* Main Clean Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-10">
            
            {/* ---------------------------------------------------- */}
            {/* 1. ENROLLMENT OPTIONS (COURSE SELECTION) */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                    Enrollment Options <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Course Selection *</span>
                  </h3>
                  <p className="text-xs text-slate-500">Select the primary academic program you want to enroll in:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ENROLLMENT_COURSES.map((c) => {
                  const isSelected = formData.course === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setFormData((prev) => ({ ...prev, course: c.id }))}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-500 shadow-md shadow-emerald-500/10 ring-4 ring-emerald-500/10'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {c.title}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">{c.desc}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                        <span className="text-[11px] font-semibold text-emerald-700">{c.badge}</span>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckCircle2 size={13} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 2. CURRENT ENROLLMENT PLAN SELECTION */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                    Current Enrollment Plan Selection <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Study Track *</span>
                  </h3>
                  <p className="text-xs text-slate-500">Choose your study track & timeframe duration:</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {ENROLLMENT_PLANS.map((p) => {
                  const isSelected = formData.enrollmentPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setFormData((prev) => ({ ...prev, enrollmentPlan: p.id }))}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-500 shadow-md shadow-emerald-500/10 ring-4 ring-emerald-500/10'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-emerald-300 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {p.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-800">{p.duration}</p>
                        <p className="text-[11px] text-slate-500 leading-normal">{p.desc}</p>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckCircle2 size={13} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 3. STUDENT INFORMATION FIELDS */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">
                    Student Information Details
                  </h3>
                  <p className="text-xs text-slate-500">Provide verified personal and contact credentials:</p>
                </div>
              </div>

              {/* Personal Details Sub-grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" /> Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Enter student's full name" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Father's Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" /> Father's Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="fatherName" 
                    value={formData.fatherName} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Enter father's name" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" /> Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    name="dob" 
                    value={formData.dob} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* CNIC / National ID with Live Duplicate Check */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-slate-400" /> CNIC / National ID <span className="text-rose-500">*</span>
                    </label>
                    {checkingDuplicate.cnic && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Verifying...
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    name="cnic" 
                    value={formData.cnic} 
                    onChange={handleInputChange} 
                    onBlur={(e) => checkDuplicate('cnic', e.target.value)}
                    required 
                    placeholder="e.g., 35202-xxxxxxx-x" 
                    className={`w-full px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      duplicateErrors.cnic 
                        ? 'bg-rose-50/80 border-2 border-rose-500 text-rose-900 focus:ring-4 focus:ring-rose-500/10' 
                        : 'bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-emerald-600'
                    }`}
                  />
                  {duplicateErrors.cnic && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="shrink-0" /> {duplicateErrors.cnic}
                    </p>
                  )}
                </div>

                {/* Nationality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe2 size={13} className="text-slate-400" /> Nationality <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nationality" 
                    value={formData.nationality} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., Pakistani" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Religion */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-slate-400" /> Religion <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="religion" 
                    value={formData.religion} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., Islam" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Marital Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Marital Status <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    name="maritalStatus" 
                    value={formData.maritalStatus} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                {/* Highest Qualification */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-slate-400" /> Qualification <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="qualification" 
                    value={formData.qualification} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g., Matric, F.A, Bachelor's" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe2 size={13} className="text-slate-400" /> Country <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="country" 
                    value={formData.country} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Country of residence" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" /> City <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="City of residence" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Applicant Phone Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" /> Applicant Phone / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    {checkingDuplicate.number && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Verifying...
                      </span>
                    )}
                  </div>
                  <input 
                    type="tel" 
                    name="number" 
                    value={formData.number} 
                    onChange={handleInputChange} 
                    onBlur={(e) => checkDuplicate('number', e.target.value)}
                    required 
                    placeholder="e.g., +92 300 1234567" 
                    className={`w-full px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      duplicateErrors.number 
                        ? 'bg-rose-50/80 border-2 border-rose-500 text-rose-900 focus:ring-4 focus:ring-rose-500/10' 
                        : 'bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-emerald-600'
                    }`}
                  />
                  {duplicateErrors.number && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} className="shrink-0" /> {duplicateErrors.number}
                    </p>
                  )}
                </div>

                {/* Father's Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" /> Father's Phone / WhatsApp
                  </label>
                  <input 
                    type="tel" 
                    name="fatherPhone" 
                    value={formData.fatherPhone} 
                    onChange={handleInputChange} 
                    placeholder="e.g., +92 300 7654321" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

                {/* Husband's Phone Number */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" /> Husband's Phone / WhatsApp 
                    <span className="text-[11px] font-normal text-slate-400">(optional / if married)</span>
                  </label>
                  <input 
                    type="tel" 
                    name="husbandPhone" 
                    value={formData.husbandPhone} 
                    onChange={handleInputChange} 
                    placeholder="e.g., +92 300 9876543" 
                    className="w-full px-3.5 py-3 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 text-sm font-medium transition-all"
                  />
                </div>

              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 4. FILE UPLOAD SECTION (EXACT SEQUENCE WITH LIVE PREVIEWS) */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">
                    Required File Attachments
                  </h3>
                  <p className="text-xs text-slate-500">Upload all 3 required documents in the exact order below (Max 8MB each):</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. CNIC Front & Back (Image or PDF) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      1. CNIC Front & Back <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Image / PDF</span>
                  </div>

                  {files.cnicPhoto ? (
                    <div className="relative border-2 border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 text-center space-y-2 flex flex-col items-center justify-center min-h-[160px]">
                      {filePreviews.cnicPhoto ? (
                        <img 
                          src={filePreviews.cnicPhoto} 
                          alt="CNIC Preview" 
                          className="h-20 w-32 object-cover rounded-lg shadow-sm border border-emerald-200" 
                        />
                      ) : (
                        <FileText className="h-10 w-10 text-emerald-600" />
                      )}
                      <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                        {files.cnicPhoto.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFile('cnicPhoto')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        required
                        onChange={(e) => handleFileChange(e, 'cnicPhoto')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <CreditCard className="h-9 w-9 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-2" />
                      <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                        Upload CNIC Copy
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Image (JPG/PNG) or PDF</p>
                    </div>
                  )}
                </div>

                {/* 2. Passport-size Photograph (JPEG/PNG) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      2. Passport Photo <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">JPG / PNG</span>
                  </div>

                  {files.passportPhoto ? (
                    <div className="relative border-2 border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 text-center space-y-2 flex flex-col items-center justify-center min-h-[160px]">
                      {filePreviews.passportPhoto ? (
                        <img 
                          src={filePreviews.passportPhoto} 
                          alt="Passport Photo Preview" 
                          className="h-20 w-20 object-cover rounded-full shadow-sm border-2 border-emerald-300" 
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-emerald-600" />
                      )}
                      <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                        {files.passportPhoto.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFile('passportPhoto')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,image/*"
                        required
                        onChange={(e) => handleFileChange(e, 'passportPhoto')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <ImageIcon className="h-9 w-9 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-2" />
                      <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                        Upload Photograph
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Passport size (JPEG/PNG)</p>
                    </div>
                  )}
                </div>

                {/* 3. Educational Document (PDF Only) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      3. Educational Document <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-mono">PDF Only</span>
                  </div>

                  {files.documentFile ? (
                    <div className="relative border-2 border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 text-center space-y-2 flex flex-col items-center justify-center min-h-[160px]">
                      <FileText className="h-10 w-10 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                        {files.documentFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(files.documentFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFile('documentFile')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Change PDF
                      </button>
                    </div>
                  ) : (
                    <div className="relative group border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                      <input 
                        type="file" 
                        accept="application/pdf"
                        required
                        onChange={(e) => handleFileChange(e, 'documentFile')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <FileText className="h-9 w-9 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-2" />
                      <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                        Upload Degree / Certificates
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Single PDF document only</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Submit Action Bar */}
            {/* ---------------------------------------------------- */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button 
                type="submit" 
                disabled={loading || !!duplicateErrors.cnic || !!duplicateErrors.number}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-2xl hover:shadow-emerald-700/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 transition-all cursor-pointer text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing Admission & Files...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Submit Online Admission Application</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-emerald-600" />
                Your personal details & attachments are 256-bit encrypted and safely transferred.
              </p>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default AdmissionForm;
