"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import MainSidebar from '@/components/MainSidebar';

export default function TeamsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    const verifyAccess = async () => {
      const raw = localStorage.getItem("vdr_session");
      if (!raw) {
        router.push('/login');
        return;
      }
      const session = JSON.parse(raw);
      setSessionUser(session);
      setLoading(false);
    };

    verifyAccess();
  }, [router]);

  // Click outside to close mobile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
        setMobileDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen w-full bg-[#F8FAFC] pt-16 md:pt-0">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-medium">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  // The custom Teams shield-with-person icon
  const TEAMS_SHIELD_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M6 16.5c0-2 2.5-3 6-3s6 1 6 3" />
    </svg>
  );

  const navLinks = [
    {
      name: "Manage Admin",
      href: "/teams/manage-admin",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      name: "Manage Users",
      href: "/teams/manage-users",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      name: "Manage Groups",
      href: "/teams/manage-groups",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4z" />
        </svg>
      )
    }
  ];

  const activeLink = navLinks.find(item => item.href === pathname) || navLinks[0];

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col md:flex-row overflow-hidden font-sans relative pt-16 md:pt-0">
      {/* Main Global Sidebar */}
      <MainSidebar />

      {/* Teams Sub-Sidebar (Desktop Only - Original vertical layout) */}
      <nav className="hidden md:flex w-60 lg:w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 z-10 shadow-xs md:shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
        {/* Header with Teams icon and label */}
        <div className="p-5 lg:p-6 border-b border-slate-100 items-center flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center shadow-xs shrink-0">
            {TEAMS_SHIELD_ICON}
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">Teams</h1>
            <p className="text-[11px] text-slate-400 font-semibold">Access Management</p>
          </div>
        </div>

        {/* Navigation Options for Desktop */}
        <div className="flex flex-col overflow-y-auto p-3 gap-1.5 no-scrollbar shrink-0">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-3.5 py-2.5 rounded-xl text-xs md:text-[13px] font-semibold transition-all duration-150 flex items-center gap-2.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-slate-900 font-bold bg-slate-100/90 border border-slate-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--brand)] rounded-r-full" />
                )}

                <span className={`shrink-0 transition-colors ${isActive ? 'text-[var(--brand)]' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Page Content Area */}
      <div className="flex-1 overflow-y-auto relative z-10 h-full flex flex-col">
        {/* Mobile-Only Dropdown Navigation Bar */}
        <div className="flex md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 items-center justify-between shadow-2xs shrink-0">
          <div className="relative" ref={mobileDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileDropdownOpen(prev => !prev);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 active:bg-slate-200/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center shadow-2xs shrink-0">
                {activeLink.icon}
              </div>
              <span>{activeLink.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-slate-500 transition-transform ${mobileDropdownOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Mobile Dropdown Popup */}
            {mobileDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-scale-up">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Switch Teams View
                </div>
                <div className="flex flex-col gap-0.5">
                  {navLinks.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileDropdownOpen(false)}
                        className={`px-3 py-2 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${
                          isActive ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-[var(--brand)]' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {isActive && <span className="text-[var(--brand)] text-xs font-bold">✓</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page children */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}


