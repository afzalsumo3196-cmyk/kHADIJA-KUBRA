import React, { useState, useEffect } from 'react';
import { Loader2, FolderOpen, ExternalLink, Search, Filter } from 'lucide-react';
import api from '../../api/axios';

const CentralFileHub = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchFileHub = async () => {
      try {
        const res = await api.get('/admin/file-hub');
        if (res.data.success) {
          setFiles(res.data.files);
        }
      } catch (err) {
        console.error('Failed to fetch file hub data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFileHub();
  }, []);

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || f.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-fade-in-up max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-blue-600 font-bold">Document Management</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Central File Hub</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-2xl">
            A centralized repository of all uploaded documents across the institute. Search and filter through CNICs, Photos, Degrees, and more.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or document type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-700 cursor-pointer flex-1"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file, idx) => (
                <div key={`${file.userId}-${idx}`} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* File Preview Thumbnail */}
                  <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {file.type === 'Profile Photo' ? (
                      <img src={`http://localhost:5000/${file.url.replace(/\\/g, '/')}`} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <FolderOpen size={48} className="text-blue-300 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    {/* View Overlay */}
                    <a 
                      href={`http://localhost:5000/${file.url.replace(/\\/g, '/')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                    >
                      <span className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <ExternalLink size={16} /> View Document
                      </span>
                    </a>
                  </div>
                  
                  {/* Meta Data */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{file.type}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${file.role === 'teacher' ? 'text-purple-600 bg-purple-50' : 'text-emerald-600 bg-emerald-50'}`}>
                        {file.role}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 line-clamp-1" title={file.name}>{file.name}</h4>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
                <FolderOpen size={48} className="text-slate-300" />
                <p className="font-medium text-lg">No documents found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralFileHub;
