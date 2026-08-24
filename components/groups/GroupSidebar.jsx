
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

const GROUP_ICON = (
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
);

const TRASH_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

export default function GroupsSidebar({ isOpen = true, onToggle }) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupRole, setNewGroupRole] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [canCreateGroup, setCanCreateGroup] = useState(false);
    const [canDeleteGroup, setCanDeleteGroup] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            // Mock groups specifically requested from image 1
            const mockGroups = [
                { id: "grp-1", name: "kln grp", role: "admin" },
                { id: "grp-2", name: "admin grp 1", role: "admin" },
                { id: "grp-3", name: "sub admin grp 1", role: "sub_admin" },
                { id: "grp-4", name: "new grp", role: "external_user" },
                { id: "grp-5", name: "users grp 1", role: "external_user" }
            ];
            
            setNavItems(mockGroups.map(g => ({
                id: g.id, name: g.name, href: `/groups/${g.id}`, role: g.role || ''
            })));
            
            setCanCreateGroup(true);
            setCanDeleteGroup(true);
            setIsLoading(false);
        };

        fetchGroups();
    }, []);

    const handleDeleteGroup = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        const { error } = await supabase
            .from("groups")
            .delete()
            .eq("id", deleteTarget.id);
        if (!error) {
            setNavItems(prev => prev.filter(g => g.id !== deleteTarget.id));
        }
        setIsDeleting(false);
        setDeleteTarget(null);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const session = JSON.parse(localStorage.getItem('vdr_session'));
            // const { data, error } = await supabase.from('groups').insert({
            //     name: newGroupName.trim(),
            //     description: newGroupDescription.trim() || null,
            //     company_id: session?.company_id,
            //     created_by: session?.id
            // }).select().single();
            const { data, error } = await supabase.from('groups').insert({
                name: newGroupName.trim(),
                description: newGroupDescription.trim() || null,
                role: newGroupRole,                    // ← இந்த line add
                company_id: session?.company_id,
                workspace_id: session?.active_workspace_id || null,
                created_by: session?.id
            }).select().single();

            if (!error && data) {
                setNavItems(prev => [{
                    id: data.id,
                    name: data.name,
                    href: `/groups/${data.id}`,
                    role: data.role || ''
                }, ...prev]);
                setIsAddGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupDescription('');
                setNewGroupRole('external_user');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col border-r border-gray-200 bg-white shrink-0 h-full font-sans transition-all duration-300 ${!isOpen ? '-translate-x-full w-0 border-none opacity-0 overflow-hidden' : 'translate-x-0 w-64 opacity-100'}`}>
                <div className="flex-1 overflow-y-auto w-64">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Active Members</h2>
                    </div>

                    <nav className="py-3 space-y-1">
                        {isLoading ? (
                            <div className="p-6 space-y-4 animate-pulse"><div className="h-4 bg-gray-100 rounded w-full"></div></div>
                        ) : (
                            navItems.map((item, index) => {
                                const active = pathname === item.href;
                                return (
                                    <div key={item.id}>
                                        <Link
                                            href={item.href}
                                            className={`group flex items-center justify-between mx-3 px-3.5 py-2.5 rounded-xl transition-all ${active
                                                ? 'bg-[var(--brand-50)] text-[var(--brand)] font-bold'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--brand)]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${active ? 'text-[var(--brand)]' : 'text-gray-400 group-hover:text-[var(--brand)]'}`}>
                                                    {GROUP_ICON}
                                                </svg>
                                                <span className="text-[14px] font-sans truncate max-w-[120px]">{item.name}</span>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {canDeleteGroup && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setDeleteTarget({ id: item.id, name: item.name });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete group"
                                                    >
                                                        {TRASH_ICON}
                                                    </button>
                                                )}
                                                {item.role && (() => {
                                                    const roleLabels = {
                                                        super_admin:   'Super Admin',
                                                        admin:         'Admin',
                                                        sub_admin:     'Sub Admin',
                                                        user:          'User',
                                                        external_user: 'External User',
                                                    };
                                                    return (
                                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                                                            {roleLabels[item.role] || item.role}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </nav>
                </div>

                {canCreateGroup && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/30 w-64">
                        <button onClick={() => setIsAddGroupModalOpen(true)} className="w-full py-2.5 bg-[var(--brand)] text-white rounded-lg font-bold font-sans text-[13px] hover:bg-[var(--brand-dark)] transition-all flex items-center justify-center gap-2 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Groups
                        </button>
                    </div>
                )}
            </aside>

            {/* Mobile-Only Dropdown Navigation Bar */}
            <div className="flex lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 items-center justify-between shadow-sm shrink-0 w-full font-sans">
                <div className="relative w-full">
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <span>{navItems.find(item => item.href === pathname)?.name || 'Select Group'}</span>
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
                                <span>Switch Group</span>
                                {canCreateGroup && (
                                    <button onClick={(e) => { e.stopPropagation(); setMobileDropdownOpen(false); setIsAddGroupModalOpen(true); }} className="text-[var(--brand)] hover:underline flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Add
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-3 text-center text-xs text-gray-500 animate-pulse">Loading...</div>
                                ) : (
                                    navItems.map((item) => {
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
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                    </span>
                                                    <span className="truncate max-w-[150px]">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.role && <span className="text-[9px] uppercase text-gray-400 font-bold">{item.role.replace('_', ' ')}</span>}
                                                    {isActive && <span className="text-[var(--brand)] text-xs font-bold">✓</span>}
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-md font-sans">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                {TRASH_ICON}
                            </div>
                            <h3 className="text-[16px] font-bold font-sans text-gray-800">Delete Group</h3>
                        </div>
                        <p className="text-[14px] font-sans text-gray-600 mb-1">
                            Are you sure you want to delete
                        </p>
                        <p className="text-[14px] font-bold font-sans text-gray-900 mb-5">
                            "{deleteTarget.name}"?
                        </p>
                        <p className="text-[12px] font-sans text-red-500 mb-6">
                            ⚠ This action cannot be undone. All members in this group will be unlinked.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold font-sans text-[13px] hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold font-sans text-[13px] hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Group Modal ───────────────────────────────────────── */}
            {isAddGroupModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-md animate-in zoom-in-95 duration-200 font-sans">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold font-sans text-gray-800 uppercase">Create New Group</h3>
                            <button onClick={() => setIsAddGroupModalOpen(false)} className="text-gray-400 hover:text-black font-sans">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Group Name</label>
                                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Enter group name..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Role</label>
                                <select
                                    value={newGroupRole}
                                    onChange={e => setNewGroupRole(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans"
                                >
                                    <option value="" disabled>Select Role</option>
                                    {/* admin — visible only to super_admin */}
                                    {currentUserRole === 'super_admin' && (
                                        <option value="admin">Admin</option>
                                    )}
                                    {/* sub_admin — visible to admin & super_admin */}
                                    {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
                                        <option value="sub_admin">Sub Admin</option>
                                    )}
                                    {/* external_user — visible to all */}
                                    <option value="external_user">External User</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Description</label>
                                <textarea value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} placeholder="Description (Optional)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none text-black font-sans" rows="3" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAddGroupModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold font-sans">Cancel</button>
                                <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isSubmitting} className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-lg font-bold font-sans disabled:opacity-50">
                                    {isSubmitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
