import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe2, Award, ArrowRight, Mail, Phone, PhoneCall, ShieldAlert, X, Star, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const LandingPage = () => {
  const [reviews, setReviews] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  const certificates = [
    '/1(1).jpeg', '/1(2).jpeg', '/1(3).jpeg', '/1(4).jpeg', '/1(5).jpeg',
    '/1(6).jpeg', '/1(7).jpeg', '/1(8).jpeg'
  ];

  useEffect(() => {
    api.get('/public/reviews')
      .then(res => {
        if (res.data.success) {
          setReviews(res.data.reviews);
        }
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
      });
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">KHADEEJA TUL KUBRA</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Islamic Institute</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admission" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 bg-slate-50 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 active:scale-95">
              Online Admission
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95">
              Student Portal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-emerald-900/80 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 text-sm font-semibold text-emerald-200 backdrop-blur-md mb-6 animate-fade-in-up">
            <Award size={16} /> Excellence in Islamic Education
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Nurturing Minds with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Divine Knowledge</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Join Khadeeja Tul Kubra Islamic Institute for a transformative journey that seamlessly blends traditional Islamic scholarship with modern academic excellence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Link to="/admission" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-emerald-900 shadow-xl transition-all hover:bg-emerald-50 hover:-translate-y-1">
              Online Admission <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/25 border border-emerald-400/30 px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-emerald-500/40 hover:-translate-y-1">
              Login to Student Portal
            </Link>
          </div>
        </div>
      </section>

      {/* About Us / Affiliations */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm uppercase tracking-widest text-emerald-600 font-bold mb-3">About Us</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Global Collaborations & Affiliations</h3>
            <p className="mt-4 text-slate-500 text-lg">We are proud to be affiliated with internationally recognized organizations, ensuring our students receive a globally accepted standard of education.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <a 
              href="https://usmetaareesuniversity.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-3xl bg-slate-50 border border-slate-100 p-8 text-center hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group block hover:-translate-y-1"
            >
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">USA Meta Arees</h4>
              <p className="text-emerald-700 font-medium bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-100 inline-block mb-4">
                USA Meta Arees with Khadeeja Tul Kubra Islamic Institute
              </p>
              <div className="text-xs text-indigo-600 font-bold group-hover:underline flex items-center justify-center gap-1">
                Visit Official Website &rarr;
              </div>
            </a>

            <a 
              href="https://share.google/P7Fu9x2HNuxUeMfR0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-3xl bg-slate-50 border border-slate-100 p-8 text-center hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group block hover:-translate-y-1"
            >
              <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">UK Medic Pro</h4>
              <p className="text-emerald-700 font-medium bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-100 inline-block mb-4">
                UK Medic Pro with Khadeeja Tul Kubra Islamic Institute
              </p>
              <div className="text-xs text-indigo-600 font-bold group-hover:underline flex items-center justify-center gap-1">
                Visit Official Website &rarr;
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Verified Certifications */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm uppercase tracking-widest text-emerald-600 font-bold mb-3">Accreditations</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Our Verified Certifications & Accreditations</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {certificates.map((imgSrc, index) => (
              <div
                key={index}
                onClick={() => setLightboxImg(imgSrc)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <img src={imgSrc} alt={`Certificate ${index + 1}`} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-6 right-6 text-white hover:text-emerald-400 transition-colors bg-slate-800/50 rounded-full p-2">
            <X size={32} />
          </button>
          <img src={lightboxImg} alt="Certificate Enlarged" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl animate-modal-enter" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Student Testimonials */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm uppercase tracking-widest text-emerald-600 font-bold mb-3">Testimonials</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">What Our Students Say</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, i) => {
              const rating = review.rating || 5;
              return (
                <div key={review._id || i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <Star
                          key={starVal}
                          size={16}
                          className={starVal <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                    <div className="text-emerald-500/20 absolute top-6 right-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed relative z-10 mb-6">"{review.quote}"</p>
                    
                    {review.adminReply && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 relative z-10 mb-6">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Admin Reply
                        </p>
                        <p className="text-sm text-emerald-900 font-medium leading-relaxed">{review.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 uppercase">
                      {review.name ? review.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{review.name}</h5>
                      <p className="text-xs text-slate-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {reviews.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <p className="text-slate-500 font-medium">No student testimonials available yet.</p>
                <p className="text-xs text-slate-400 mt-1">If you are an active student, you can submit your review via the Student Portal.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">KHADEEJA TUL KUBRA</h1>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mt-1">Islamic Institute</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">Empowering the ummah through authentic knowledge and contemporary education.</p>
          </div>

          {/* Contact Us - UPDATED SECTION */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-5 text-sm">
              {/* Email */}
              <li className="flex items-center gap-3 group">
                <Mail size={18} className="text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" />
                <a href="mailto:khadeejatulkubraislamicinstitu@gmail.com" className="hover:text-emerald-400 transition-colors break-all leading-tight">
                  khadeejatulkubraislamicinstitu@gmail.com
                </a>
              </li>

              {/* Admission Department */}
              <li className="flex items-start gap-3 group">
                <Phone size={18} className="text-emerald-500 shrink-0 mt-0.5 group-hover:text-emerald-400 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Admission Department</span>
                  <a href="tel:+923100386730" className="hover:text-emerald-400 transition-colors font-medium">0310-0386730</a>
                </div>
              </li>

              {/* Helpline No */}
              <li className="flex items-start gap-3 group">
                <PhoneCall size={18} className="text-emerald-500 shrink-0 mt-0.5 group-hover:text-emerald-400 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Helpline No</span>
                  <a href="tel:+923164092870" className="hover:text-emerald-400 transition-colors font-medium">0316-4092870</a>
                </div>
              </li>

              {/* Complain To Director */}
              <li className="flex items-start gap-3 group">
                <ShieldAlert size={18} className="text-emerald-500 shrink-0 mt-0.5 group-hover:text-emerald-400 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Complain To Director</span>
                  <a href="tel:+923164095546" className="hover:text-emerald-400 transition-colors font-medium">0316-4095546</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Connect With Us</h4>
            <a
              href="https://www.instagram.com/p/DZYLRjIN0_D/?igsh=MWNxcWlnYWZua3o3dg=="
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 font-bold hover:text-emerald-400 transition-colors inline-flex items-center gap-2"
            >
              Follow us on Instagram <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 text-center text-xs">
          <p>© {new Date().getFullYear()} Khadeeja Tul Kubra Islamic Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;