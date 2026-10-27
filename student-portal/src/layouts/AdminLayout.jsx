import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    Headphones, 
    ClipboardList, 
    Award, 
    LogOut,
    Menu,
    X,
    Shield,
    MessageSquareWarning,
    FileText,
    BookOpen,
    Star,
    CalendarCheck,
    BellRing,
    Settings,
    Trash2,
    FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Or wherever auth is managed

const adminMenuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Courses', path: '/admin/courses', icon: BookOpen },
  { name: 'Course Outlines', path: '/admin/outlines', icon: FileText },
  { name: 'Students', path: '/admin/students', icon: Users },
  { name: 'Manage Teachers', path: '/admin/teachers', icon: Users },
  { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
  { name: 'Certificates', path: '/admin/certificates', icon: Award },
  { name: 'Transcripts', path: '/admin/transcripts', icon: FileText },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
  { name: 'Manage Notices', path: '/admin/notices', icon: BellRing },
  { name: 'Old Students Fees', path: '/admin/fees', icon: ClipboardList },
];

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { logout } = useAuth ? useAuth() : { logout: () => {} }; // graceful fallback
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-6">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Panel</p>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">KTK Institute</h2>
          </div>
        </div>

        <nav className="space-y-2">
          {adminMenuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 w-full"
      >
        <LogOut size={20} className="shrink-0" />
        <span>Log Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans selection:bg-blue-500/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 border-r border-slate-200 bg-white shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <Shield size={24} className="text-blue-600" />
          <span className="font-extrabold text-slate-900">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 text-slate-600 focus:outline-none">
              <Settings size={22} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <NavLink to="/admin/file-hub" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium text-slate-700">
                  <FolderOpen size={18} /> Central File Hub
                </NavLink>
                <NavLink to="/admin/recycle-bin" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium text-slate-700">
                  <Trash2 size={18} /> Recycle Bin
                </NavLink>
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 text-slate-600">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16 h-screen overflow-y-auto relative">
        {/* Desktop Top Header with Settings Gear */}
        <header className="hidden md:flex justify-end items-center px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="relative">
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)} 
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
            >
              <Settings size={24} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <NavLink to="/admin/file-hub" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium text-slate-700">
                  <FolderOpen size={18} /> Central File Hub
                </NavLink>
                <NavLink to="/admin/recycle-bin" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium text-slate-700">
                  <Trash2 size={18} /> Recycle Bin
                </NavLink>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
