"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaTrash, 
  FaPowerOff, 
  FaShieldAlt, 
  FaEllipsisV, 
  FaBars, 
  FaBriefcase, 
  FaUser, 
  FaDatabase, 
  FaTimes,
  FaRedoAlt,
  FaArrowLeft,
  FaPlus
} from 'react-icons/fa';

export default function WorkspaceSettingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workspace_details');
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      setLoading(true);
      const sessionData = localStorage.getItem('vdr_session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.company_id) {
            const wsRes = await fetch(`/api/workspaces?company_id=${session.company_id}&user_id=${session.id}&role=${session.role}`);
            const wsData = await wsRes.json();
            if (wsData.success) {
              setWorkspaces(wsData.workspaces || []);
            }
          }
        } catch (err) {
          console.error("Failed to fetch workspaces", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Close menus on window click
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const deletedWorkspaces = workspaces.filter(ws => ws.status === 'Deleted');
  const activeWorkspaces = workspaces.filter(ws => ws.status !== 'Deleted');

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
        setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, status: 'Active' } : w));
      }
    } catch (err) {
      console.error("Failed to restore workspace", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] relative overflow-hidden font-sans">

      {/* ── MOBILE TOP BAR (Phone / Tablet) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            aria-label="Open Navigation"
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <FaBars size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FaBriefcase size={13} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight">Workspace Settings</h1>
              <p className="text-[10px] text-slate-400 font-semibold">
                {activeTab === 'workspace_details' ? 'Active Workspaces' : 'Trash & Archival'}
              </p>
            </div>
          </div>
        </div>

        {/* Exit back to Workspace */}
        <button
          onClick={() => router.push('/workspace')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
        >
          <FaArrowLeft size={10} />
          <span>Exit</span>
        </button>
      </header>

      {/* ── MOBILE BACKDROP ── */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── PRIMARY DESKTOP & MOBILE SLIDE-OUT SIDEBAR ── */}
      <aside className={`fixed md:relative top-0 left-0 h-full bg-white border-r border-slate-200/80 flex flex-col shrink-0 z-50 transition-all duration-300 shadow-xl md:shadow-none ${
        isMobileMenuOpen 
          ? 'translate-x-0 w-72' 
          : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'
      }`}>

        {/* Top Logo & Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div 
            onClick={() => router.push('/workspace')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[var(--brand)]/20 group-hover:scale-105 transition-transform shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="hidden lg:block md:hidden min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">Settings</h2>
              <p className="text-[11px] text-slate-400 font-semibold">Workspace Management</p>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {/* Workspace Details Button */}
          <button
            onClick={() => {
              setActiveTab('workspace_details');
              setIsMobileMenuOpen(false);
            }}
            title="Workspace Details"
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'workspace_details'
                ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            <FaBriefcase className={`shrink-0 ${activeTab === 'workspace_details' ? 'text-white' : 'text-slate-400'}`} size={16} />
            <span className="truncate flex-1 text-left hidden lg:inline md:hidden inline">
              Workspace Details
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 hidden lg:inline md:hidden inline ${
              activeTab === 'workspace_details' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {activeWorkspaces.length}
            </span>
          </button>

          {/* Trash Workspace Button */}
          <button
            onClick={() => {
              setActiveTab('trash');
              setIsMobileMenuOpen(false);
            }}
            title="Trash Workspaces"
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'trash'
                ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            <FaTrash className={`shrink-0 ${activeTab === 'trash' ? 'text-white' : 'text-slate-400'}`} size={15} />
            <span className="truncate flex-1 text-left hidden lg:inline md:hidden inline">
              Trash & Archival
            </span>
            {deletedWorkspaces.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 hidden lg:inline md:hidden inline ${
                activeTab === 'trash' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {deletedWorkspaces.length}
              </span>
            )}
          </button>
        </nav>

        {/* Exit & Back Bottom Bar */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            onClick={() => router.push('/workspace')}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
            title="Exit to Workspace"
          >
            <FaPowerOff size={15} />
            <span className="hidden lg:inline md:hidden inline">Exit Settings</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">

        {/* Desktop Header */}
        <div className="hidden md:flex h-20 border-b border-slate-200/80 bg-white px-6 lg:px-8 items-center justify-between shadow-xs shrink-0">
          <div>
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'workspace_details' ? 'Workspace Details' : 'Trash & Archival Workspaces'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeTab === 'workspace_details' 
                ? `Manage active virtual data room workspaces (${activeWorkspaces.length} total)` 
                : `Restore or permanently manage deleted workspaces (${deletedWorkspaces.length} items)`}
            </p>
          </div>

          <button
            onClick={() => router.push('/workspace')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FaArrowLeft size={11} />
            <span>Back to Workspaces</span>
          </button>
        </div>

        {/* Mobile Segmented Pill Bar */}
        <div className="md:hidden px-4 pt-4 pb-1 shrink-0">
          <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('workspace_details')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'workspace_details'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeWorkspaces.length})
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                activeTab === 'trash'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trash ({deletedWorkspaces.length})
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">Loading workspace data...</p>
            </div>
          ) : (
            <>
              {/* ── TAB 1: WORKSPACE DETAILS ── */}
              {activeTab === 'workspace_details' && (
                <>
                  {activeWorkspaces.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mb-4">
                        <FaBriefcase size={28} />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">No active workspaces</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6 font-medium">
                        You do not currently have any active data room workspaces.
                      </p>
                      <button
                        onClick={() => router.push('/workspace')}
                        className="px-5 py-2.5 bg-[var(--brand)] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[var(--brand)]/20 hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <FaPlus size={12} /> Create Workspace
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {activeWorkspaces.map((ws) => (
                        <div 
                          key={ws.id} 
                          className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[var(--brand)]/40 transition-all duration-200 group relative"
                        >
                          {/* Card Top Row: Badge + Icon */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Active
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                ID: #{String(ws.id).slice(0, 6)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3.5 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-lg font-bold shrink-0 border border-[var(--brand)]/20 shadow-2xs group-hover:scale-105 transition-transform">
                                <FaShieldAlt size={22} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate group-hover:text-[var(--brand)] transition-colors">
                                  {ws.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {ws.description || "Secure Virtual Data Room"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Bottom Meta Bar */}
                          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs mt-3">
                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                              <FaUser size={12} className="text-slate-400" />
                              <span>{ws.user_count || 0} Members</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-600">
                              <FaDatabase size={12} className="text-slate-400" />
                              <span>{ws.storage_used || "0 KB"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── TAB 2: TRASH & ARCHIVAL ── */}
              {activeTab === 'trash' && (
                <>
                  {deletedWorkspaces.length === 0 ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mb-4">
                        <FaTrash size={26} />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800">Trash is empty</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 font-medium">
                        Deleted workspaces will be archived here for easy recovery before permanent cleanup.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {deletedWorkspaces.map((ws) => (
                        <div 
                          key={ws.id} 
                          className="bg-white/80 border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative opacity-85 hover:opacity-100 hover:shadow-md transition-all"
                        >
                          <div>
                            {/* Card Top Row */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                Deleted
                              </span>

                              {/* Restore Action */}
                              <button
                                onClick={(e) => handleRestore(e, ws.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Restore this workspace"
                              >
                                <FaRedoAlt size={10} />
                                <span>Restore</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-3.5 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-lg font-bold shrink-0">
                                <FaShieldAlt size={22} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-extrabold text-slate-600 text-sm sm:text-base truncate line-through">
                                  {ws.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  Archived workspace
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs mt-3">
                            <span className="text-[11px] font-medium">Ready to restore</span>
                            <span className="text-[11px] font-mono">ID: #{String(ws.id).slice(0, 6)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main>

    </div>
  );
}
