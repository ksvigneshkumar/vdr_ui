"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/business-owner/Sidebar';
import Header from '@/components/business-owner/Header';

export default function BusinessOwnerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if we are on the login page
  const isLoginPage = pathname === '/business-owner/login';

  useEffect(() => {
    // If it's the login page, we don't need to authorize them to view it
    if (isLoginPage) {
      setIsAuthorized(true);
      return;
    }

    const raw = localStorage.getItem('vdr_session');
    if (!raw) {
      router.replace('/business-owner/login');
      return;
    }
    try {
      const session = JSON.parse(raw);
      if (session.role !== 'business_owner' && session.role !== 'super_admin') {
        router.replace('/business-owner/login');
        return;
      }
      setIsAuthorized(true);
    } catch (err) {
      router.replace('/business-owner/login');
    }
  }, [router, isLoginPage]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Verifying Executive Clearance…</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    // Render only the login page without the sidebar and header
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-full bg-[#F8FAFC] text-slate-900 flex overflow-hidden">
      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
