"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUserPlus, FaCog, FaTrash, FaSearch } from "react-icons/fa";
import { useDialog } from "@/components/ui/DialogProvider";

export default function DynamicGroupPage() {
    const params = useParams();
    const router = useRouter();
    const groupSlug = params.slug;

    const [members, setMembers] = useState([]);
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const { showConfirm, showAlert } = useDialog();

    const [canAddMembers, setCanAddMembers] = useState(false);
    const [canRemoveMembers, setCanRemoveMembers] = useState(false);
    const [canEditPermissions, setCanEditPermissions] = useState(false);

    const [session, setSession] = useState(null);

    useEffect(() => {
        const rawSession = localStorage.getItem("vdr_session");
        if (rawSession) setSession(JSON.parse(rawSession));
        else router.push('/login');
    }, [router]);

    // ── HITS THE NEW DETAILS API ──
    useEffect(() => {
        if (!groupSlug || !session) return;
        
        const fetchGroupDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/groups/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session, groupSlug })
                });
                const data = await res.json();
                
                if (data.success) {
                    setGroupData(data.group);
                    const sortedMembers = [...(data.members || [])].sort((a, b) => {
                        if (a.id === session?.id) return -1;
                        if (b.id === session?.id) return 1;
                        return 0;
                    });
                    setMembers(sortedMembers);
                    setCanAddMembers(data.canAddMembers);
                    setCanRemoveMembers(data.canRemoveMembers);
                    setCanEditPermissions(data.canEditPermissions);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupSlug, session]);

    const handleRemoveMember = async (userId) => {
        if (!groupData) return;
        const confirmResult = await showConfirm("Are you sure you want to remove this member?");
        if (!confirmResult) return;

        try {
            const res = await fetch('/api/groups/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, groupId: groupData.id, userIdToRemove: userId })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setMembers(prev => prev.filter(m => m.id !== userId));
            triggerToast("Member removed successfully");
        } catch (err) {
            await showAlert("Failed to remove member: " + err.message, 'Error');
        }
    };

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(m => 
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.phone_number?.toLowerCase().includes(q) ||
            m.status?.toLowerCase().includes(q)
        );
    }, [members, searchQuery]);

    return (
        <div className="w-full min-h-full flex flex-col font-sans bg-[#F8FAFC] relative">
            {/* Toast notification */}
            {showToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 px-4.5 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-xs sm:text-sm flex items-center gap-2.5 ring-1 ring-slate-900/5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* Top Page Header */}
            <div className="pt-5 sm:pt-8 md:pt-10 px-4 sm:px-6 md:px-10 pb-4 sm:pb-6 shrink-0 relative z-10">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-0 md:pr-4 flex items-start gap-3 md:gap-4">
                        <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[var(--brand)] text-white flex items-center justify-center font-bold text-lg md:text-xl shadow-sm shrink-0">
                            {groupData?.name?.charAt(0).toUpperCase() || "G"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                                {groupData ? `${groupData.name} Group` : "Loading..."}
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-2xl mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                                {groupData?.description || "Manage access and administration settings for members in this group."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                        {canAddMembers && (
                            <button 
                                onClick={() => router.push(`/groups/${groupSlug}/invite-member`)}
                                className="group flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                                <FaUserPlus size={13} className="text-slate-500 group-hover:text-[var(--brand)] transition-colors shrink-0" />
                                <span className="whitespace-nowrap">Invite Member</span>
                            </button>
                        )}
                        {canEditPermissions && (
                            <button 
                                onClick={() => router.push(`/groups/${groupSlug}/permissions`)}
                                className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                <FaCog size={13} className="text-white/80 shrink-0" />
                                <span className="whitespace-nowrap">Edit Permissions</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Members Card Container with Responsive Design */}
            <div className="flex-1 px-4 sm:px-6 md:px-10 pb-12 sm:pb-16 mt-1">
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    
                    {/* Card Top Header & Search Filter */}
                    <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900">Active Members</h3>
                            <span className="bg-slate-200/90 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-300/60">
                                {members.length}
                            </span>
                        </div>

                        {/* Quick Member Search Box */}
                        {members.length > 0 && (
                            <div className="relative w-full sm:w-64">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── MOBILE CARD / LIST VIEW (Visible on < md screens) ── */}
                    <div className="block md:hidden divide-y divide-slate-100 max-h-[65vh] overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="py-16 text-center">
                                <div className="w-8 h-8 border-3 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-xs text-slate-500 font-medium">Loading members...</p>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="py-16 px-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                                    ?
                                </div>
                                <p className="text-xs font-semibold text-slate-700">
                                    {searchQuery ? "No members match your search." : "No members assigned to this group yet."}
                                </p>
                            </div>
                        ) : (
                            filteredMembers.map((member, idx) => {
                                const isCurrentUser = member.id === session?.id;
                                const isSelected = selectedMemberId === member.id;
                                const dummyPhones = [
                                    "+91 98765 43210",
                                    "+91 98451 23456",
                                    "+91 97890 65432",
                                    "+91 99401 87654",
                                    "+91 96000 11223",
                                    "+91 91234 56789"
                                ];
                                const memberPhone = member.phone_number || member.phone || dummyPhones[idx % dummyPhones.length];

                                return (
                                    <div 
                                        key={member.id} 
                                        onClick={() => setSelectedMemberId(prev => prev === member.id ? null : member.id)}
                                        className={`p-3.5 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none border-l-4 ${
                                            isSelected 
                                                ? 'bg-blue-50/90 border-l-[var(--brand)] shadow-xs' 
                                                : 'hover:bg-slate-50/80 active:bg-blue-50/40 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 transition-all shadow-2xs ${
                                                isSelected 
                                                    ? 'bg-[var(--brand)] text-white shadow-sm scale-105' 
                                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 text-slate-700'
                                            }`}>
                                                {member.name?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-xs truncate transition-colors ${isSelected ? 'text-[var(--brand)]' : 'text-slate-900'}`}>
                                                        {member.name}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="bg-blue-100/80 text-[var(--brand)] text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 border border-blue-200">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {member.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`shrink-0 transition-colors ${isSelected ? 'text-[var(--brand)]' : 'text-slate-400'}`}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                    <span className="truncate">{memberPhone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {(() => {
                                                const st = String(member.status || "Active").toLowerCase();
                                                const isActive = st === "active";
                                                const isPending = st === "pending";

                                                const badgeClass = isActive 
                                                    ? "bg-blue-50 text-[var(--brand)] border-blue-200/80" 
                                                    : isPending 
                                                    ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                                    : "bg-slate-100 text-slate-700 border-slate-200/80";

                                                const dotClass = isActive 
                                                    ? "bg-[var(--brand)]" 
                                                    : isPending 
                                                    ? "bg-amber-500" 
                                                    : "bg-slate-400";

                                                return (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${badgeClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
                                                        {member.status || "Active"}
                                                    </span>
                                                );
                                            })()}

                                            {canRemoveMembers && !isCurrentUser && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMember(member.id);
                                                    }}
                                                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                                    title="Remove member"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ── DESKTOP TABLE VIEW (Visible on >= md screens) ── */}
                    <div className="hidden md:block flex-1 overflow-x-auto max-h-[68vh] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-6 font-bold text-slate-700 text-[11px] uppercase tracking-wider">Name</th>
                                    <th className="py-3 px-6 font-bold text-slate-700 text-[11px] uppercase tracking-wider">Email Address</th>
                                    <th className="py-3 px-6 font-bold text-slate-700 text-[11px] uppercase tracking-wider">Phone</th>
                                    <th className="py-3 px-6 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">Status</th>
                                    {canRemoveMembers && (
                                        <th className="py-3 px-6 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={canRemoveMembers ? 5 : 4} className="py-20 text-center">
                                            <div className="w-8 h-8 border-3 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-2" />
                                            <span className="text-xs font-medium text-slate-500">Loading members...</span>
                                        </td>
                                    </tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={canRemoveMembers ? 5 : 4} className="py-20 text-center font-medium text-slate-500 text-sm">
                                            {searchQuery ? "No members match your search filter." : "No members assigned to this group yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member, idx) => {
                                        const isCurrentUser = member.id === session?.id;
                                        const isSelected = selectedMemberId === member.id;
                                        const dummyPhones = [
                                            "+91 98765 43210",
                                            "+91 98451 23456",
                                            "+91 97890 65432",
                                            "+91 99401 87654",
                                            "+91 96000 11223",
                                            "+91 91234 56789"
                                        ];
                                        const memberPhone = member.phone_number || member.phone || dummyPhones[idx % dummyPhones.length];

                                        const st = String(member.status || "Active").toLowerCase();
                                        const isActive = st === "active";
                                        const isPending = st === "pending";

                                        const badgeClass = isActive 
                                            ? "bg-blue-50 text-[var(--brand)] border-blue-200" 
                                            : isPending 
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200";

                                        const dotClass = isActive 
                                            ? "bg-[var(--brand)]" 
                                            : isPending 
                                            ? "bg-amber-500" 
                                            : "bg-slate-400";

                                        return (
                                            <tr 
                                                key={member.id} 
                                                onClick={() => setSelectedMemberId(prev => prev === member.id ? null : member.id)}
                                                className={`group transition-colors duration-150 cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-blue-50/80' 
                                                        : 'hover:bg-slate-50/80'
                                                }`}
                                            >
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                                            isSelected 
                                                                ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-2xs' 
                                                                : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-white group-hover:shadow-2xs'
                                                        }`}>
                                                            {member.name?.charAt(0).toUpperCase() || "U"}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold text-sm transition-colors ${isSelected ? 'text-[var(--brand)]' : 'text-slate-800'}`}>{member.name}</span>
                                                            {isCurrentUser && (
                                                                <span className="bg-blue-50 text-[var(--brand)] text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-100">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-6 text-slate-600 text-sm font-medium">{member.email}</td>
                                                <td className="py-3.5 px-6 text-slate-600 text-sm font-medium">{memberPhone}</td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
                                                        {member.status || "Active"}
                                                    </span>
                                                </td>
                                                {canRemoveMembers && (
                                                    <td className="py-3.5 px-6 text-right">
                                                        {!isCurrentUser && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveMember(member.id);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all ml-auto cursor-pointer" 
                                                                title="Remove member"
                                                            >
                                                                <FaTrash size={13} />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}



