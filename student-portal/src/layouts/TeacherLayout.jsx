import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Headphones, 
    ClipboardList, 
    LogOut,
    Menu,
    X,
    GraduationCap,
    Users,
    FileSignature,
    Book,
    PenTool,
    UserCircle,
    FileText,
    HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const teacherMenuItems = [
  { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
  { name: 'My Profile', path: '/teacher/profile', icon: UserCircle },
  { name: 'Course Outlines', path: '/teacher/outlines', icon: FileText },
  { name: 'My Lectures', path: '/teacher/lectures', icon: Headphones },
  { name: 'My Quizzes', path: '/teacher/quizzes', icon: ClipboardList },
  { name: 'Notes', path: '/teacher/notes', icon: Book },
  { name: 'Assignments', path: '/teacher/assignments', icon: PenTool },
  { name: 'Attendance', path: '/teacher/attendance', icon: Users },
  { name: 'Grades', path: '/teacher/grades', icon: FileSignature },
  // [LIVE_QUESTIONS_DISABLED] { name: 'Live Questions', path: '/teacher/live-questions', icon: HelpCircle }
];

const TeacherLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth ? useAuth() : { logout: () => {} };
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Faculty Portal</p>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">KTK Institute</h2>
          </div>
        </div>

        <nav className="space-y-1">
          {teacherMenuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/teacher'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={16} className="shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 w-full"
      >
        <LogOut size={16} className="shrink-0" />
        <span>Log Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans selection:bg-indigo-500/30 faculty-portal-theme">
      <aside className="hidden md:block w-60 shrink-0 border-r border-slate-200 bg-white shadow-sm">
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-indigo-600" />
          <span className="font-extrabold text-sm text-slate-900">Faculty Portal</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 text-slate-600">
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14 h-screen overflow-y-auto">
        <div className="flex-1 p-3.5 md:p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
