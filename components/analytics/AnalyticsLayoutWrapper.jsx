"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsSidebar from '@/components/analytics/AnalyticsSidebar';

export default function AnalyticsLayoutWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const rawSession = localStorage.getItem('vdr_session');
        if (!rawSession) {
            router.push('/login');
            return;
        }
        
        const session = JSON.parse(rawSession);
        if (session.role !== 'admin' && session.role !== 'super_admin') {
            router.push('/documents'); // Or wherever their home/dashboard is
        }
    }, [router]);

    return (
        <div className="flex-1 flex flex-col md:flex-row w-full h-full min-w-0 overflow-hidden pt-16 md:pt-0 relative">
            <AnalyticsSidebar isOpen={isSidebarOpen} />

            {/* Main Content Area */}
            <main className="flex-1 bg-white relative flex flex-col min-w-0 transition-all duration-300 h-full">
                {/* Toggle button */}
                <div
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute top-6 left-0 -ml-3.5 z-30 hidden md:flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-full shadow-[0_2px_8px_rgb(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.12)] cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-105 hover:bg-gray-50 transition-all duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </div>

                <div className="flex-1 overflow-y-auto w-full h-full pb-24 md:pb-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
