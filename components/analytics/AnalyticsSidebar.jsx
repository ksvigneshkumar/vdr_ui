"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ANALYTICS_NAV_ITEMS = [
    { name: 'Group insights', href: '/analytics/group-insights' },
    { name: 'Folder activity', href: '/analytics/folder-activity' },
    { name: 'File activity', href: '/analytics/file-activity' },
    { name: 'Group & Users', href: '/analytics/group-users' },
];

export default function AnalyticsSidebar({ isOpen = true }) {
    const pathname = usePathname();

    return (
        <aside className={`${isOpen ? 'w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200' : 'w-0 border-r-0 hidden md:flex'} transition-all duration-300 bg-white flex flex-col md:h-screen sticky top-0 shrink-0 font-sans overflow-hidden z-10`}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto w-full scrollbar-hide">
                <div className="hidden md:flex p-5 border-b border-gray-100 items-center justify-between">
                    <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Analytics</h2>
                </div>

                <nav className="flex md:flex-col py-2 px-2 md:px-0 w-max md:w-full">
                    {ANALYTICS_NAV_ITEMS.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                            <div key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`group flex items-center justify-center md:justify-between px-4 md:px-6 py-2.5 md:py-3 transition-all rounded-lg md:rounded-none mx-1 md:mx-0 ${active
                                        ? 'bg-[var(--brand-50)] md:border-r-2 border-[var(--brand)] text-[var(--brand)] font-bold shadow-sm md:shadow-none ring-1 ring-[var(--brand)]/10 md:ring-0'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--brand)]'
                                        }`}
                                >
                                    <span className="text-[13px] md:text-[14px] font-sans whitespace-nowrap md:truncate">{item.name}</span>
                                </Link>
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
