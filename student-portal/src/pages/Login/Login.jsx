import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, Sparkles, AlertCircle, Eye, EyeOff, GraduationCap, Briefcase, Shield } from 'lucide-react';
import api from '../../api/axios'; // Import our dynamic axios instance
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ regNo: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('student'); // 'student', 'teacher', 'admin'
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API call to our backend
      const response = await api.post('/auth/login', {
        regNo: formData.regNo,
        password: formData.password
      });

      // Redirect to correct dashboard based on role
      const actualRole = response.data.student?.role || 'student';
      
      // Strict role verification check
      if (actualRole !== selectedRole) {
        setError(`Access Denied: You do not have permissions for the selected role (${selectedRole.toUpperCase()}).`);
        setLoading(false);
        return;
      }

      // Use AuthContext to save token and set authenticated state
      login(response.data.token);
      
      if (actualRole === 'admin') {
        navigate('/admin');
      } else if (actualRole === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      // Show backend error message or default message
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styling based on selected role
  const getRoleColors = () => {
    switch (selectedRole) {
      case 'teacher':
        return {
          bgGlow: 'bg-indigo-600/10',
          textActive: 'text-indigo-600',
          bgActive: 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50',
          focusRing: 'focus:border-indigo-500 focus:ring-indigo-500/10',
          label: 'Teacher ID or Email',
          placeholder: 'Enter your teacher ID or email',
          subtitle: 'Log in to your Teacher Console'
        };
      case 'admin':
        return {
          bgGlow: 'bg-blue-600/10',
          textActive: 'text-blue-600',
          bgActive: 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200/50',
          focusRing: 'focus:border-blue-500 focus:ring-blue-500/10',
          label: 'Admin ID or Email',
          placeholder: 'Enter your admin ID or email',
          subtitle: 'Log in to Admin Registry'
        };
      case 'student':
      default:
        return {
          bgGlow: 'bg-emerald-600/10',
          textActive: 'text-emerald-600',
          bgActive: 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50',
          focusRing: 'focus:border-emerald-500 focus:ring-emerald-500/10',
          label: 'Registration ID',
          placeholder: 'e.g. KTK-2026-041',
          subtitle: 'Log in to your Student Portal'
        };
    }
  };

  const colors = getRoleColors();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      {/* Dynamic Background Decorative Glows */}
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl transition-all duration-500 ${colors.bgGlow}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-3xl transition-all duration-500 ${colors.bgGlow}`}></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200/60 relative z-10">
        
        {/* Header & Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mb-3">
             <img src="/KTK-logo.png" alt="KTK Logo" className="h-12 w-12 object-contain" onError={(e) => { e.target.src = "/logo.png" }} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1 font-semibold">{colors.subtitle}</p>
        </div>

        {/* Premium Role Selector Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: 'student', label: 'Student', icon: GraduationCap },
            { id: 'teacher', label: 'Teacher', icon: Briefcase },
            { id: 'admin', label: 'Admin', icon: Shield }
          ].map(roleItem => {
            const IconComponent = roleItem.icon;
            const isSelected = selectedRole === roleItem.id;
            return (
              <button
                key={roleItem.id}
                type="button"
                onClick={() => {
                  setSelectedRole(roleItem.id);
                  setError('');
                }}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border text-xs font-bold transition-all duration-300 ${
                  isSelected 
                    ? `${colors.bgActive} ${colors.textActive} font-extrabold border-indigo-500` 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-950 hover:bg-slate-100/70'
                }`}
              >
                <IconComponent size={18} className={isSelected ? 'scale-110 transition-transform' : ''} />
                {roleItem.label}
              </button>
            );
          })}
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 animate-fade-in-up">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span className="text-sm font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-extrabold text-slate-400 ml-1">{colors.label}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                name="regNo"
                value={formData.regNo}
                onChange={handleChange}
                placeholder={colors.placeholder}
                required
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-850 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${colors.focusRing}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-widest font-extrabold text-slate-400 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-850 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${colors.focusRing}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 text-white font-extrabold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 disabled:hover:translate-y-0 text-sm ${colors.buttonBg}`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Login to Portal <Sparkles size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-slate-400">
          Secure Login • Khadeeja Tul Kubra Islamic Institute
        </div>
      </div>
    </div>
  );
};

export default Login;