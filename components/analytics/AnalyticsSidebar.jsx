"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const ANALYTICS_NAV_ITEMS = [
    { name: 'Group insights', href: '/analytics/group-insights' },
    { name: 'Folder activity', href: '/analytics/folder-activity' },
    { name: 'File activity', href: '/analytics/file-activity' },
    { name: 'Group & Users', href: '/analytics/group-users' },
];

export default function AnalyticsSidebar({ isOpen = true }) {
    const pathname = usePathname();
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const mobileDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
                setMobileDropdownOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const activeItem = ANALYTICS_NAV_ITEMS.find(item => pathname.startsWith(item.href)) || ANALYTICS_NAV_ITEMS[0];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col border-r border-gray-200 bg-white shrink-0 h-full font-sans transition-all duration-300 ${!isOpen ? '-translate-x-full w-0 border-none opacity-0 overflow-hidden' : 'translate-x-0 w-64 opacity-100'} z-10`}>
                <div className="flex-1 overflow-y-auto w-64 scrollbar-hide">
                    <div className="p-5 border-b border-gray-100 items-center justify-between">
                        <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Analytics</h2>
                    </div>

                    <nav className="flex flex-col py-2 w-full">
                        {ANALYTICS_NAV_ITEMS.map((item) => {
                            const active = pathname.startsWith(item.href);
                            return (
                                <div key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`group flex items-center justify-between px-6 py-3 transition-all rounded-none mx-0 ${active
                                            ? 'bg-[var(--brand-50)] border-r-2 border-[var(--brand)] text-[var(--brand)] font-bold ring-0'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--brand)]'
                                            }`}
                                    >
                                        <span className="text-[14px] font-sans truncate">{item.name}</span>
                                    </Link>
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Mobile/Tablet Dropdown Navigation Bar */}
            <div className="flex lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 items-center justify-between shadow-sm shrink-0 w-full font-sans">
                <div className="relative w-full" ref={mobileDropdownRef}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMobileDropdownOpen(prev => !prev);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 bg-slate-100/80 active:bg-slate-200/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center shadow-sm shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                            </div>
                            <span>{activeItem?.name || 'Analytics'}</span>
                        </div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
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
                        <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex justify-between items-center">
                                <span>Switch Analytics View</span>
                            </div>
                            <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                                {ANALYTICS_NAV_ITEMS.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
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
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                                </span>
                                                <span className="truncate max-w-[150px]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isActive && <span className="text-[var(--brand)] text-xs font-bold">✓</span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
