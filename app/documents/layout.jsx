"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import MainSidebar from '@/components/MainSidebar';
import { hasPermission } from '@/lib/access/permissions';

function LayoutContent({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [session, setSession] = useState(null);
    const [hasDeleteAccess, setHasDeleteAccess] = useState(false);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const mobileDropdownRef = useRef(null);

    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
            const s = JSON.parse(raw);
            setSession(s);
            checkDeleteAccess(s);
        }
    }, []);

    // Close mobile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
                setMobileDropdownOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Security check
    const checkDeleteAccess = async (userSession) => {
        if (userSession.role === 'super_admin') {
            setHasDeleteAccess(true);
            return;
        }
        try {
            const res = await fetch('/api/user/nav-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session: userSession })
            });
            const data = await res.json();
            if (data.hasDeleteAccess) setHasDeleteAccess(true);
        } catch (err) {
            console.error("Trash access check failed", err);
        }
    };

    const hasAccessControlAccess = session ? hasPermission(session.role, 'manage_access') : false;
    const currentView = searchParams.get('view');

    const isActive = (href) => {
        if (href === '/documents/access') return pathname === '/documents/access';
        if (href === '/documents/versions') return pathname === '/documents/versions';
        if (href.includes('?view=')) return pathname === '/documents' && currentView === href.split('view=')[1];
        if (href === '/documents') return pathname === '/documents' && (!currentView || currentView === 'files');
        return pathname === href;
    };

    const navItems = [
        {
            href: '/documents',
            label: 'Files',
            icon: <img src="/filess.png" alt="Files" className="w-4 h-4 object-contain" />
        },
        ...(hasAccessControlAccess ? [{
            href: '/documents/access',
            label: 'Access Control',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        }] : []),
        {
            href: '/documents/versions',
            label: 'Document Versions',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        },
        {
            href: '/documents?view=downloads',
            label: 'My Downloads',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        },
        {
            href: '/documents?view=bookmarks',
            label: 'Bookmarks',
            icon: <img src="/Bookmark.png" alt="Bookmarks" className="w-[15px] h-[15px] object-contain opacity-80 group-hover:opacity-100" />
        },
        ...(hasDeleteAccess ? [{
            href: '/documents?view=trash',
            label: 'Trash',
            icon: <img src="/treash.png" alt="Trash" className="w-[15px] h-[15px] object-contain opacity-80 group-hover:opacity-100" />
        }] : [])
    ];

    const activeItem = navItems.find(item => isActive(item.href)) || navItems[0];

    return (
        <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-[#F8F9FB] font-sans pt-16 md:pt-0">
            <MainSidebar />

            {/* Desktop Sub-Sidebar (Original untouched layout) */}
            <nav className="hidden md:flex w-[240px] shrink-0 bg-white border-r border-slate-200 flex-col h-full z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">
                <div className="px-6 py-6 border-b border-slate-100 items-center hover:opacity-80 transition-opacity">
                    <span className="text-[15px] font-black text-brand tracking-tight">VDR Vault</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col space-y-1 no-scrollbar">
                    {navItems.map(item => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                                    active ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-brand-soft hover:text-brand'
                                }`}
                            >
                                <span className={active ? 'text-white [&>img]:brightness-0 [&>img]:invert' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content + Mobile Dropdown View Bar */}
            <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
                {/* Mobile Dropdown View Switcher & Notification Header (Mobile Only) */}
                <div className="flex md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 items-center justify-between shadow-2xs shrink-0">
                    <div className="relative" ref={mobileDropdownRef}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMobileDropdownOpen(prev => !prev);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/90 active:bg-slate-200/70 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-900 transition-all cursor-pointer shadow-2xs"
                        >
                            <div className="w-6 h-6 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center shadow-xs shrink-0 [&>img]:brightness-0 [&>img]:invert">
                                {activeItem.icon}
                            </div>
                            <span>{activeItem.label}</span>
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

                        {/* Mobile Dropdown Popover */}
                        {mobileDropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-scale-up">
                                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                                    Switch View
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {navItems.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileDropdownOpen(false)}
                                                className={`px-3 py-2 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${
                                                    active ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className={active ? 'text-[var(--brand)]' : 'text-slate-400'}>
                                                        {item.icon}
                                                    </span>
                                                    <span>{item.label}</span>
                                                </div>
                                                {active && <span className="text-[var(--brand)] text-xs font-bold">✓</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Right: Notification Bell + Avatar */}
                    <div className="flex items-center gap-2.5">
                        <button className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center text-[11px] font-bold text-white shadow-2xs">
                            {session?.name ? session.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'AK'}
                        </div>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}

export default function DocumentsLayout({ children }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center w-full h-screen bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}