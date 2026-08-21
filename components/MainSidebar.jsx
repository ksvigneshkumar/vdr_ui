"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav-items';
import WorkspaceStatusBadge from '@/components/workspaces/WorkspaceStatusBadge';
import WorkspacePendingOverlay from '@/components/workspaces/WorkspacePendingOverlay';

export default function MainSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasGroupsAccess, setHasGroupsAccess] = useState(true);
  const [hasSettingsAccess, setHasSettingsAccess] = useState(true);
  const [hasQaAccess, setHasQaAccess] = useState(true);
  const [session, setSession] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isGroupsActive = pathname?.startsWith('/groups');

  useEffect(() => {
    const rawSession = localStorage.getItem('vdr_session');
    if (!rawSession) {
       const mockSession = { id: 'demo', name: 'Demo User', role: 'admin' };
       setSession(mockSession);
       setIsAdmin(true);
       return;
    }
    const sessionObj = JSON.parse(rawSession);
    setSession(sessionObj);
    setIsAdmin(sessionObj.role === 'admin' || sessionObj.role === 'super_admin');
    setIsSuperAdmin(sessionObj.role === 'super_admin');
  }, []);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200/80 z-[60] flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </Link>
          <span className="font-black text-gray-900 tracking-tight text-lg">SecureVDR</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 focus:outline-none">
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>
      </div>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 z-[50]" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 md:relative md:w-20 md:h-screen md:top-0 bg-white/95  border-r border-gray-200/80 flex flex-col md:items-center py-6 md:py-6 shrink-0 z-[55] shadow-md md:shadow-[4px_0_24px_rgba(28,127,159,0.06)] transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Top Logo — PiBi gradient icon (Desktop only) */}
        <Link href="/dashboard" className="hidden md:flex w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] rounded-xl items-center justify-center mb-8 hover:shadow-sm hover:scale-105 transition-all duration-300 shadow-[var(--brand)]/30 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </Link>

      {/* Nav Items */}
      <div className="flex flex-col gap-2 md:gap-1.5 flex-1 w-full px-4 md:px-0 mt-4 md:mt-0 md:items-center">
        {NAV_ITEMS.map((item) => {
          if (item.key === 'groups' && !hasGroupsAccess) return null;
          if (item.key === 'settings' && !hasSettingsAccess) return null;
          if (item.key === 'analytics' && !isAdmin && !isSuperAdmin) return null;
          if (item.key === 'qa' && !hasQaAccess) return null;
          const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative md:w-12 md:h-12 w-full py-2.5 px-3 md:p-0 flex items-center md:justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-[var(--brand)]/10 md:bg-transparent' : 'hover:bg-slate-50 md:hover:bg-transparent'}`}
              >
                {/* Active state for icon */}
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                  ? 'bg-[var(--brand)] text-white shadow-md [&_img]:invert [&_img]:mix-blend-screen'
                  : 'text-gray-400 group-hover:text-[var(--brand)] md:group-hover:bg-[var(--brand)]/8 [&_img]:mix-blend-multiply'
                  }`}>
                  {item.icon}
                </div>
                <span className={`md:hidden ml-4 font-bold text-[15px] ${isActive ? 'text-[var(--brand)]' : 'text-gray-600 group-hover:text-[var(--brand)]'}`}>
                  {item.label}
                </span>
                {/* Tooltip */}
                <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>



        {/* Profile / Sign Out Menu */}
        <div className="flex flex-col md:items-center w-full px-4 md:px-0 md:mt-auto relative md:mb-4">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full md:w-12 h-12 rounded-xl flex items-center md:justify-center text-gray-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-300 px-3 md:px-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="md:hidden ml-4 font-semibold text-[15px]">Profile & Logout</span>
          </button>

          {showProfileMenu && session && (
            <div className="absolute bottom-16 md:bottom-4 left-4 right-4 md:right-auto md:left-full md:ml-4 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-slate-100 p-2 z-50">
              <div className="px-3 py-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[13px] font-black text-[var(--brand)] shrink-0">
                  {session.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-slate-800 truncate">{session.name}</p>
                  <p className="text-[11px] font-semibold text-slate-400 truncate capitalize">{session.role.replace('_', ' ')}</p>
                </div>
              </div>
              {session.request_status && (
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <WorkspaceStatusBadge status={session.request_status} />
                </div>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('vdr_session');
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-rose-500 hover:bg-rose-50 rounded-lg transition-colors font-bold group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform text-rose-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}







// "use client";

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import {
//   FaCog,
//   FaShieldAlt,
//   FaHome,
//   FaUsers
// } from "react-icons/fa";

// import {
//   FiShield,
//   FiFolder,
//   FiSettings,
//   FiHome
// } from "react-icons/fi";

// export default function MainSidebar() {
//   const pathname = usePathname();
//   const [user, setUser] = useState(null);
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         if (typeof window !== 'undefined') {
//           const storedUser = localStorage.getItem('user');
//           if (storedUser) {
//             const parsedUser = JSON.parse(storedUser);
//             // Validate that parsedUser has required fields
//             if (parsedUser && typeof parsedUser === 'object' && parsedUser.name && parsedUser.role) {
//               setUser(parsedUser);
//             } else {
//               // Clear invalid user data
//               localStorage.removeItem('users');
//               setUser(null);
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error loading user from localStorage:', error);
//         // Clear corrupted data
//         if (typeof window !== 'undefined') {
//           localStorage.removeItem('user');
//         }
//         setUser(null);
//       } finally {
//         setIsMounted(true);
//       }
//     };

//     loadUser();
//   }, []);

//   // Get initials from user name
//   const getInitials = (name) => {
//     if (!name || typeof name !== 'string') return 'U';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0))
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const isDocumentsActive = pathname?.startsWith('/documents');
//   const isSettingsActive = pathname?.startsWith('/settings');
//   const isGroupsActive = pathname?.startsWith('/groups');

//   return (
//     <aside className="w-16 md:w-20 bg-white border-r border-gray-200 flex flex-col justify-between items-center py-6 h-full shrink-0 select-none z-50 shadow-sm">
//       <div className="flex flex-col items-center gap-8 w-full">
//         <Link href="/" className="group relative flex items-center justify-center">
//           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-md shadow-gray-950/10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
//             <FiShield className="text-white text-lg" strokeWidth={2.8} />
//           </div>
//           <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//             SecureVDR Home
//           </span>
//         </Link>
//         <div className="w-8 h-[1px] bg-gray-200" />
//         <nav className="flex flex-col items-center gap-4 w-full px-2">
//           <Link
//             href="/documents"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isDocumentsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}
//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isDocumentsActive
//               ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//               : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FiFolder className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" strokeWidth={2.8} />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//               Documents Vault
//             </span>
//           </Link>
//           <Link
//             href="/groups"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isGroupsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}

//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isGroupsActive
//                 ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//                 : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FaUsers className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//               VDR Groups
//             </span>
//           </Link>
//           <Link
//             href="/settings"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isSettingsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}

//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isSettingsActive
//               ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//               : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FiSettings className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" strokeWidth={2.8} />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//               VDR Settings
//             </span>
//           </Link>
//         </nav>
//       </div>

//       <div className="flex flex-col items-center gap-4 w-full">
//         <Link
//           href="/"
//           className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
//         >
//           <FiHome className="text-lg" strokeWidth={2.8} />
//           <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//             Exit to Landing
//           </span>
//         </Link>

//         {/* Dynamic User Profile */}
//         {isMounted && (
//           <div className="group relative w-10 h-10 flex items-center justify-center cursor-pointer">
//             <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-200 shadow-sm hover:border-gray-400 transition-all duration-300">
//               {user ? getInitials(user.name) : 'U'}
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-sm z-50">
//               {user ? `${user.name} (${user.role})` : 'User'}
//             </span>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// }