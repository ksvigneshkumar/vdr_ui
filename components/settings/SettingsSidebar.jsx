"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsSidebar({ isOpen = true }) {
  const pathname = usePathname();

  // ... (keep navItems)
  const navItems = [
    { name: 'Branding', href: '/settings/branding', icon: <><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></> },
    { name: 'Watermark', href: '/settings/watermark', icon: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></> },
    // { name: 'NDA', href: '/settings/nda', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></> },
    // { name: 'Nda Users', href: '/settings/nda-users', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
    // { name: 'Notification Preference...', href: '/settings/notifications', icon: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></> },
    // { name: 'Doc Labels', href: '/settings/doc-labels', icon: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="13" width="8" height="4" rx="1"/></> },
    // { name: 'Doc Settings', href: '/settings/doc-settings', icon: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15h6"/></> },
    // { name: 'Intelligent Search', href: '/settings/search', icon: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></> },
    { name: '2FA', href: '/settings/2fa', icon: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
    // { name: 'Package', href: '/settings/package', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></> },
    // { name: 'Activity Report', href: '/settings/activity-report', icon: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2M8 17h2M14 13h2M14 17h2"/></> },
    // { name: 'QnA >', href: '/settings/qna', icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></> },
    // { name: 'Track Settings', href: '/settings/track', icon: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></> },
  ];

  return (
    <aside className={`${isOpen ? 'w-64 border-r' : 'w-0 border-r-0'} transition-all duration-300 overflow-hidden bg-white border-gray-200 shrink-0 h-full hidden md:block`}>
      <div className="w-64 h-full overflow-y-auto">
      <div className="p-5">
        <h2 className="text-[15px] font-semibold text-gray-800">Settings</h2>
      </div>
      <nav className="flex flex-col py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name === 'Branding' && pathname?.startsWith('/settings/branding'));
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-6 py-2.5 text-[14px] transition-colors ${
                  isActive
                    ? 'text-orange-500 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--brand)]'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'text-orange-500' : 'text-gray-500'}>
                  {item.icon}
                </svg>
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>
      </div>
    </aside>
  );
}
