"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaShieldAlt, FaArrowLeft, FaLayerGroup, FaBuilding, FaUserCheck, FaSignOutAlt } from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('vdr_session');
    if (!raw) {
      router.replace('/login');
      return;
    }
    try {
      const session = JSON.parse(raw);
      const allowedRoles = ['super_admin', 'business_owner', 'admin'];
      if (!session.role || !allowedRoles.includes(session.role)) {
        router.replace('/documents');
        return;
      }
      setUser(session);
      setIsAuthorized(true);
    } catch (err) {
      router.replace('/login');
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm font-medium tracking-wide">Verifying Admin Access…</p>
        </div>
      </div>
    );
  }

  const isBO = user?.role === 'business_owner' || user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <Link
            href={isBO ? "/business-owner" : "/documents"}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-200"
          >
            <FaArrowLeft className="text-xs" />
            <span>{isBO ? "Back to Dashboard" : "Back to Vaults"}</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand)] flex items-center justify-center shadow-2xs text-white">
              <FaShieldAlt className="text-sm" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">PiBi VDR Admin Portal</h1>
              <p className="text-xs text-slate-500 mt-0.5">Workspace Request Approval System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] uppercase tracking-wider">
            {user?.role?.replace('_', ' ')}
          </span>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || user?.email}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
