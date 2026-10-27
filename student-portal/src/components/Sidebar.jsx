import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UserCircle,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Video,
  GraduationCap,
  LayoutDashboard,
  Headphones,
  Award,
  PenTool,
  X,
  MessageSquareWarning,
  ScrollText,
  Star,
  CreditCard
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: UserCircle },
  { name: 'My Courses', path: '/courses', icon: BookOpen },
  { name: 'Online Quizzes', path: '/quizzes', icon: ClipboardList },
  { name: 'Pay Fees', path: '/pay-fees', icon: CreditCard },
  { name: 'Transcripts', path: '/transcripts', icon: ScrollText },
  { name: 'Certificates', path: '/certificates', icon: Award },
  { name: 'Complaint Box', path: '/complaints', icon: MessageSquareWarning },
  { name: 'Submit Review', path: '/submit-review', icon: Star },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  return (
    <>
      <aside className="hidden md:flex w-72 flex-col bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-sm">
        <div className="flex flex-col justify-between h-full px-6 py-8">
          <div>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">Student Portal</p>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 leading-tight">Premium Dashboard</h2>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-800 hover:-translate-y-1'
                    }`
                  }
                >
                  <item.icon size={20} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-600/10 to-slate-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-semibold">Need help?</p>
            <p className="mt-3 text-sm text-slate-600">Connect with our student support desk for academic guidance.</p>
            <a href="tel:03100386730" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-inner hover:bg-emerald-50 transition-colors cursor-pointer">
              📞 0310 038 6730
            </a>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${mobileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full transform overflow-y-auto bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between px-5 py-6">
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">Student Portal</p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900 leading-tight">Premium Dashboard</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-800 hover:-translate-y-1'
                    }`
                  }
                >
                  <item.icon size={20} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-600/10 to-slate-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-semibold">Need help?</p>
            <p className="mt-3 text-sm text-slate-600">Connect with our student support desk for academic guidance.</p>
            <a href="tel:03100386730" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-inner hover:bg-emerald-50 transition-colors cursor-pointer">
              📞 0310 038 6730
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
