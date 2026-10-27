import React, { useState, useRef, useEffect, useContext } from "react";
import { Bell, Menu, PhoneCall, LogOut, User, Settings, Trash2, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Header = ({ onMobileMenuToggle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState({ name: 'Student', email: 'student@example.com', role: 'student' });
  const dropdownRef = useRef(null);
  const { logout } = useContext(AuthContext);

  // Jab dropdown ke bahar click ho to automatic close karne ke liye hook
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Fetch user info
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch (e) {}
      }
    };
    loadUser();

    window.addEventListener('storage', loadUser);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 gap-4">
        {/* Left Section: Menu Toggle & Logo */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          {/* Mobile Hamburger Menu */}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:text-emerald-700 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Increased Logo Container Size */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 overflow-hidden transition-transform duration-300 hover:scale-105">
              <img
                src="/logo.png"
                alt="Khadeeja Tul Kubra Logo"
                className="h-full w-full object-contain p-0.5"
              />
            </div>

            {/* Institute Name - Fixed spacing, typography, and mobile wrapping */}
            <div className="flex flex-col justify-center">
              <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-slate-900 leading-tight line-clamp-1 sm:line-clamp-none">
                KHADEEJA TUL KUBRA
              </h1>
              <p className="text-[10px] sm:text-xs md:text-[12px] font-bold text-emerald-600 tracking-wider uppercase mt-0.5">
                Islamic Institute
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Helpline, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Helpline - Hidden on smaller screens to keep header clean */}
          <a href="tel:03100386730" className="hidden lg:flex items-center gap-2 rounded-full bg-slate-100/90 px-4 py-2 border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50 cursor-pointer">
            <PhoneCall size={16} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              Helpline: 0310 038 6730
            </span>
          </a>

          {/* Notification Bell */}
          <button className="relative inline-flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:text-emerald-700">
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
          </button>

          {/* 👤 Profile Avatar with Interactive Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="block h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-[26px] border-2 border-emerald-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-400 cursor-pointer focus:outline-none active:scale-95"
            >
              <img
                src={userData?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar"}
                alt="User avatar"
                className="h-full w-full object-cover bg-slate-50"
              />
            </button>

            {/* Premium Dropdown Box */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 py-2 z-50 origin-top-right transition-all">
                {/* User Status Section */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                    Active {userData?.role || 'Scholar'}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                    {userData?.name || 'Student'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    {userData?.email || ''}
                  </p>
                </div>

                {/* Quick Menu Links */}
                <div className="p-1 border-b border-slate-100">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer">
                    <User size={15} className="text-slate-400" />
                    My Profile Portal
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer">
                    <Settings size={15} className="text-slate-400" />
                    Account Settings
                  </button>
                  
                  {userData?.role === 'admin' && (
                    <>
                      <Link to="/admin/recycle-bin" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer mt-1">
                        <Trash2 size={15} className="text-red-500" />
                        Recycle Bin
                      </Link>
                      <Link to="/admin/file-hub" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-left cursor-pointer">
                        <FolderOpen size={15} className="text-blue-500" />
                        Central File Hub
                      </Link>
                    </>
                  )}
                </div>

                {/* Logout Trigger */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 text-left cursor-pointer"
                  >
                    <LogOut size={15} />
                    Log Out Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
