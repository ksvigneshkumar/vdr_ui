"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaPowerOff, FaShieldAlt, FaEllipsisV, FaBars, FaBriefcase, FaUser, FaDatabase } from 'react-icons/fa';

export default function WorkspaceSettingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workspace_details');
  const [workspaces, setWorkspaces] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Secondary slider state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const sessionData = localStorage.getItem('vdr_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.company_id) {
          try {
            const wsRes = await fetch(`/api/workspaces?company_id=${session.company_id}&user_id=${session.id}&role=${session.role}`);
            const wsData = await wsRes.json();
            if (wsData.success) {
              setWorkspaces(wsData.workspaces || []);
            }
          } catch (err) {
            console.error("Failed to fetch workspaces", err);
          }
        }
      }
    };
    fetchWorkspaces();
  }, []);

  const deletedWorkspaces = workspaces.filter(ws => ws.status === 'Deleted');
  const activeWorkspaces = workspaces.filter(ws => ws.status === 'Active');

  const handleRestore = async (e, wsId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/workspaces/${wsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' })
      });
      if (res.ok) {
        setWorkspaces(workspaces.map(w => w.id === wsId ? { ...w, status: 'Active' } : w));
      }
    } catch (err) {
      console.error("Failed to restore workspace", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">

      {/* Mobile Header (Hamburger) */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500">
            <FaBars size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Settings</h1>
        </div>
      </div>

      {/* Primary Thin Sidebar (Like MainSidebar) */}
      <aside className={`fixed md:relative top-0 left-0 h-screen w-20 bg-white  border-r border-gray-200/80 flex flex-col items-center py-6 shrink-0 z-50 shadow-[4px_0_24px_rgba(28,127,159,0.06)] transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Top Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] rounded-xl flex items-center justify-center mb-8 shadow-[var(--brand)]/30 shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push('/dashboard')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Nav Items (Primary Icons) */}
        <div className="flex flex-col gap-3 flex-1 w-full items-center">

          {/* Workspace Button */}
          <button
            onClick={() => {
              setActiveTab('workspace_details');
              setIsSidebarOpen(true);
            }}
            title="Workspace Details"
            className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
          >
            <div className={`absolute left-0 w-1 h-7 rounded-r-full shadow-sm transition-colors duration-300 ${activeTab === 'workspace_details' ? 'bg-gradient-to-b from-[var(--brand)] to-[var(--brand-secondary)]' : 'bg-transparent'}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'workspace_details'
              ? 'bg-[var(--brand)]/12 text-[var(--brand)]'
              : 'text-gray-400 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
              }`}>
              <FaBriefcase size={18} />
            </div>
            {/* Tooltip */}
            <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
              Workspace Details
            </span>
          </button>

          {/* Trash Button */}
          <button
            onClick={() => {
              setActiveTab('trash');
              setIsSidebarOpen(true);
            }}
            title="Trash Workspace"
            className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
          >
            <div className={`absolute left-0 w-1 h-7 rounded-r-full shadow-sm transition-colors duration-300 ${activeTab === 'trash' ? 'bg-gradient-to-b from-[var(--brand)] to-[var(--brand-secondary)]' : 'bg-transparent'}`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'trash'
              ? 'bg-[var(--brand)]/12 text-[var(--brand)]'
              : 'text-gray-400 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
              }`}>
              <FaTrash size={18} />
            </div>
            {/* Tooltip */}
            <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
              Trash Workspace
            </span>
          </button>

        </div>

        {/* Back / Exit Button */}
        <div className="flex flex-col items-center mt-auto relative mb-4">
          <button
            onClick={() => router.push('/workspace')}
            title="Back to Workspace"
            className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
          >
            <FaPowerOff size={18} />
            <span className="absolute left-16 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
              Exit
            </span>
          </button>
        </div>
      </aside>

      {/* Secondary Sidebar (The Slider) */}
      <aside
        className={`bg-white border-r border-gray-200 shadow-sm flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-40 ${isSidebarOpen ? 'w-64 pt-16 md:pt-0' : 'w-0'
          }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 whitespace-nowrap opacity-100 transition-opacity duration-300">
          <h2 className="text-xl font-bold text-slate-800">Workspace Setting</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2 whitespace-nowrap">
          {activeTab === 'workspace_details' && (
            <button
              onClick={() => {
                setActiveTab('workspace_details');
                if (window.innerWidth < 768) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-[13px] tracking-wide bg-[var(--brand)] text-white shadow-md`}
            >
              <FaBriefcase className="text-white" size={16} />
              Workspace Details
            </button>
          )}

          {activeTab === 'trash' && (
            <button
              onClick={() => {
                setActiveTab('trash');
                if (window.innerWidth < 768) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-[13px] tracking-wide bg-[var(--brand)] text-white shadow-md`}
            >
              <FaTrash className="text-white" size={16} />
              Trash Workspace
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 bg-slate-50">

        {/* Header */}
        <div className="h-16 md:h-20 border-b border-gray-200 bg-white flex items-center px-6 md:px-8 shadow-sm shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">
            {activeTab === 'workspace_details' && 'Workspace Details'}
            {activeTab === 'trash' && 'Trash Workspace'}
          </h2>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${(activeTab === 'trash' && deletedWorkspaces.length === 0) ||
          (activeTab === 'workspace_details' && activeWorkspaces.length === 0)
          ? 'flex items-center justify-center' : ''
          }`}>

          {/* TRASH TAB */}
          {activeTab === 'trash' && (
            <>
              {deletedWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FaTrash size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">No workspace</h3>
                  <p className="text-slate-500 max-w-sm">
                    Any workspaces you delete will appear here. Currently, there are no items in the trash.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {deletedWorkspaces.map((ws) => (
                    <div key={ws.id} className="group">
                      <div className="h-48 bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col relative opacity-75">
                        <div className="flex justify-between items-start mb-4 relative">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                            Deleted
                          </span>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === ws.id ? null : ws.id);
                              }}
                              className="text-slate-400 hover:text-[var(--brand)] transition-colors p-1.5 rounded-full hover:bg-[var(--brand)]/10"
                            >
                              <FaEllipsisV size={14} />
                            </button>
                            {openMenuId === ws.id && (
                              <div
                                className="absolute right-0 top-full w-32 bg-white rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 z-10 py-1 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-[var(--brand)]/10 hover:text-[var(--brand)] transition-colors"
                                  onClick={(e) => handleRestore(e, ws.id)}
                                >
                                  Restore
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                          <div className="text-slate-800 mb-2 opacity-60">
                            <FaShieldAlt size={32} className="text-slate-400" />
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm text-center line-clamp-2 mb-2 line-through">
                            {ws.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* WORKSPACE DETAILS TAB */}
          {activeTab === 'workspace_details' && (
            <>
              {activeWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FaBriefcase size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">No active workspaces</h3>
                  <p className="text-slate-500 max-w-sm">
                    There are no active workspaces found.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeWorkspaces.map((ws) => (
                    <div key={ws.id} className="group">
                      <div className="h-48 bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4 relative">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-emerald-50 text-emerald-600">
                            Active
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                          <div className="text-[var(--brand)] mb-2">
                            <FaShieldAlt size={32} className="opacity-80" />
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm text-center line-clamp-2 mb-2">
                            {ws.name}
                          </h3>
                        </div>

                        {/* Bottom Row: User Count */}
                        <div className="absolute bottom-5 left-5 flex items-center gap-1.5 text-slate-500">
                          <FaUser size={12} className="opacity-70" />
                          <span className="text-[11px] font-bold">
                            {ws.user_count || 0} Users
                          </span>
                        </div>

                        {/* Bottom Row: Storage */}
                        <div className="absolute bottom-5 right-5 flex items-center gap-1.5 text-slate-500">
                          <FaDatabase size={12} className="opacity-70 text-blue-500" />
                          <span className="text-[11px] font-bold">
                            0 KB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
