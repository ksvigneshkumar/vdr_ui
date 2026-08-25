"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  FaBars,
  FaSearch,
  FaUserShield,
  FaSignOutAlt,
  FaCog,
  FaBell,
  FaBuilding,
  FaTags,
  FaEnvelope,
  FaDatabase,
  FaTimes,
  FaArrowRight,
  FaThLarge,
} from 'react-icons/fa';

export default function Header({ onOpenSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchContainerRef = useRef(null);

  const [session, setSession] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [searchData, setSearchData] = useState({
    organizations: [],
    plans: [],
    templates: [],
  });

  const fetchSearchIndex = async () => {
    try {
      const [orgsRes, plansRes, tplsRes] = await Promise.all([
        fetch('/api/business-owner/organizations').catch(() => ({ ok: false })),
        fetch('/api/business-owner/plans').catch(() => ({ ok: false })),
        fetch('/api/business-owner/email-templates').catch(() => ({ ok: false })),
      ]);

      const orgs = orgsRes.ok ? (await orgsRes.json()).organizations || [] : [];
      const plans = plansRes.ok ? (await plansRes.json()).plans || [] : [];
      const templates = tplsRes.ok ? (await tplsRes.json()).templates || [] : [];

      setSearchData({ organizations: orgs, plans, templates });
    } catch (err) {
      console.error('Failed to index search items:', err);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('vdr_session');
    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch (err) {
        console.error('Failed to parse session:', err);
      }
    }

    const fetchPending = async () => {
      try {
        const res = await fetch('/api/request-workspace?status=pending', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.requests) {
            setPendingRequests(data.requests);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pending requests:', err);
      }
    };

    fetchPending();
    fetchSearchIndex();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const s = localStorage.getItem('vdr_session');
      const session = s ? JSON.parse(s) : null;
      if (session) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session, reason: 'Business Owner logout' }),
        }).catch(() => {});
      }
    } catch (_) {}
    localStorage.removeItem('vdr_session');
    document.cookie = "vdr_super_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    router.push('/business-owner/login');
  };

  const getPageTitle = () => {
    if (pathname === '/business-owner') return 'System Overview';
    if (pathname?.startsWith('/business-owner/organizations')) return 'Organizations';
    if (pathname?.startsWith('/business-owner/storage')) return 'Storage & Quotas';
    if (pathname?.startsWith('/business-owner/plans')) return 'Subscription Plans';
    if (pathname?.startsWith('/business-owner/purchase')) return 'Purchase Plans';
    if (pathname?.startsWith('/business-owner/email-templates')) return 'Email Templates';
    if (pathname?.startsWith('/business-owner/settings')) return 'Settings';
    return 'Business Owner Portal';
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    router.push(`/business-owner/organizations?q=${encodeURIComponent(q)}`);
  };

  const query = searchQuery.trim().toLowerCase();

  const matchingOrgs = query
    ? searchData.organizations.filter(
        (o) =>
          o.name?.toLowerCase().includes(query) ||
          o.adminEmail?.toLowerCase().includes(query) ||
          o.plan?.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchingPlans = query
    ? searchData.plans.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.price?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingTemplates = query
    ? searchData.templates.filter(
        (t) =>
          t.name?.toLowerCase().includes(query) ||
          t.subject?.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const portalPages = [
    { title: 'System Overview', path: '/business-owner', desc: 'Platform health and metrics', icon: FaThLarge },
    { title: 'Organizations', path: '/business-owner/organizations', desc: 'Manage enterprise tenants', icon: FaBuilding },
    { title: 'Storage & Quotas', path: '/business-owner/storage', desc: 'Manage storage limits and usage', icon: FaDatabase },
    { title: 'Subscription Plans', path: '/business-owner/plans', desc: 'Configure SaaS pricing tiers', icon: FaTags },
    { title: 'Email Templates', path: '/business-owner/email-templates', desc: 'Customize transactional emails', icon: FaEnvelope },
    { title: 'Workspace Requests', path: '/admin/workspace-requests', desc: 'Approve new tenant registrations', icon: FaBuilding },
    { title: 'Settings & Branding', path: '/business-owner/settings', desc: 'Configure platform settings', icon: FaCog },
  ];

  const matchingPages = query
    ? portalPages.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.desc.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasAnyResults = matchingOrgs.length > 0 || matchingPlans.length > 0 || matchingTemplates.length > 0 || matchingPages.length > 0;

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 relative">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <FaBars />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Desktop Search Input with Realtime Quick Search Dropdown */}
        <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-80">
          <form onSubmit={handleSearchSubmit} className="relative">
            <button
              type="submit"
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-[var(--brand)] transition-colors cursor-pointer"
              title="Search"
            >
              <FaSearch className="text-sm" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                fetchSearchIndex();
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchOpen(false);
              }}
              placeholder="Search organizations, plans, pages..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-9 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </form>

          {/* Quick Search Dropdown Modal */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200 max-h-[460px] flex flex-col">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Search Suggestions</span>
                <span className="text-[11px] text-slate-400">Press Enter to search all</span>
              </div>

              <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100">
                {/* Organizations Section */}
                {matchingOrgs.length > 0 && (
                  <div className="py-2 first:pt-0 last:pb-0">
                    <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Organizations
                    </span>
                    {matchingOrgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(`/business-owner/organizations?q=${encodeURIComponent(org.name)}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-brand-soft flex items-center justify-center text-[var(--brand)] text-xs shrink-0">
                            <FaBuilding />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors truncate">
                              {org.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{org.adminEmail}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 ml-2">
                          {org.plan}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Plans Section */}
                {matchingPlans.length > 0 && (
                  <div className="py-2 first:pt-0 last:pb-0">
                    <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Subscription Plans
                    </span>
                    {matchingPlans.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push('/business-owner/plans');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs shrink-0">
                            <FaTags />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors truncate">
                              {p.name} Tier
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{p.description || 'Virtual data room tier'}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 shrink-0 ml-2">
                          {p.price}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Email Templates Section */}
                {matchingTemplates.length > 0 && (
                  <div className="py-2 first:pt-0 last:pb-0">
                    <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Templates
                    </span>
                    {matchingTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push('/business-owner/email-templates');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 text-xs shrink-0">
                            <FaEnvelope />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors truncate">
                              {t.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{t.subject}</p>
                          </div>
                        </div>
                        <FaArrowRight className="text-xs text-slate-300 group-hover:text-[var(--brand)] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Pages */}
                {matchingPages.length > 0 && (
                  <div className="py-2 first:pt-0 last:pb-0">
                    <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Portal Pages
                    </span>
                    {matchingPages.map((pg, idx) => {
                      const Icon = pg.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(pg.path);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs shrink-0">
                              <Icon />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors truncate">
                                {pg.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{pg.desc}</p>
                            </div>
                          </div>
                          <FaArrowRight className="text-xs text-slate-300 group-hover:text-[var(--brand)] shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {!hasAnyResults && (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs font-semibold text-slate-700 mb-1">No direct items match "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mb-3">Press Enter to search all organizations for this term.</p>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="px-3.5 py-1.5 bg-[var(--brand)] text-white text-xs font-bold rounded-lg hover:bg-[var(--brand-dark)] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <FaSearch className="text-[10px]" />
                      <span>Search Organizations</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View all in organizations button */}
              {hasAnyResults && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2 px-3 bg-[var(--brand)]/10 hover:bg-[var(--brand)] hover:text-white text-[var(--brand)] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Search all organizations for "{searchQuery}"</span>
                    <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setIsMobileSearchOpen(!isMobileSearchOpen);
            fetchSearchIndex();
          }}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 hover:text-slate-900 md:hidden transition-all"
          aria-label="Toggle mobile search"
        >
          <FaSearch className="text-sm" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 hover:text-slate-900 transition-all"
            aria-label="Workspace request notifications"
          >
            <FaBell className="text-base" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--brand)] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-sm py-2 z-50 text-slate-700 max-h-[420px] flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">Workspace Requests</p>
                    {pendingRequests.length > 0 && (
                      <span className="bg-[var(--brand)]/10 text-[var(--brand)] text-xs px-2 py-0.5 rounded-full font-semibold">
                        {pendingRequests.length} Pending
                      </span>
                    )}
                  </div>
                  <Link
                    href="/admin/workspace-requests"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[var(--brand)] font-semibold hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                  {pendingRequests.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      <p>No pending workspace requests</p>
                    </div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{req.company_name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Requested by <span className="font-medium text-slate-700">{req.admin_name}</span> ({req.admin_email})
                            </p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded font-medium uppercase">
                              Plan: {req.plan_id}
                            </span>
                          </div>
                          <Link
                            href="/admin/workspace-requests"
                            onClick={() => setShowNotifications(false)}
                            className="px-3 py-1.5 bg-[var(--brand)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--brand-dark)] transition-colors shrink-0 shadow-2xs"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] px-4 py-2 rounded-xl transition-all shadow-md"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              <FaUserShield />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[13px] font-bold text-white block leading-tight">
                {session?.name || 'Demo Admin'}
              </span>
              <span className="text-[11px] text-white/80 font-medium block">
                Business Owner
              </span>
            </div>
          </button>

          {/* Dropdown Card */}
          {showDropdown && (
            <>
              <div
                onClick={() => setShowDropdown(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-sm py-2 z-50 text-slate-700">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">
                    {session?.name || 'Anushiya Selvaraj'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {session?.email || 'owner@pibivdr.com'}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/business-owner/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <FaCog className="text-slate-400" />
                    <span>Profile &amp; Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors font-medium text-left"
                  >
                    <FaSignOutAlt className="text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-0 top-16 bg-white border-b border-slate-200 p-3 shadow-md z-40 md:hidden animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">
                <FaSearch />
              </span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organizations, plans..."
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-full shadow-2xs"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <FaTimes />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
