"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasPermission } from '@/lib/access/permissions';
import { FaEye, FaEdit, FaUpload, FaShieldAlt, FaDownload } from 'react-icons/fa';

export default function AccessPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>}>
            <AccessPageContent />
        </Suspense>
    );
}

function AccessPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlGroupId = searchParams.get('group') || searchParams.get('groupId');

    const [session, setSession] = useState(null);

    // Core Data
    const [groups, setGroups] = useState([]);
    const [folders, setFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [groupMembers, setGroupMembers] = useState({});

    // UI State
    const [loading, setLoading] = useState(true);
    const [pendingChanges, setPendingChanges] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
    const [saving, setSaving] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileItemConfigSheet, setMobileItemConfigSheet] = useState(null);
    const [mobileBulkSheetOpen, setMobileBulkSheetOpen] = useState(false);
    const [mobileGroupDropdownOpen, setMobileGroupDropdownOpen] = useState(false);

    // ── SESSION ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (!raw) { window.location.href = '/login'; return; }

        const s = JSON.parse(raw);
        if (!hasPermission(s.role, 'manage_access')) {
            router.replace('/documents');
            return;
        }
        setSession(s);
    }, [router]);

    // ── FETCH (HITS API INSTEAD OF DB DIRECTLY) ──────────────────────────
    useEffect(() => {
        if (session) fetchAll();
    }, [session]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/access/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setGroups(data.groups);
            setFolders(data.folders);
            setDocuments(data.documents);
            setGroupMembers(data.groupMembers);
            setPermissions(data.permissions);

            if (data.groups?.length > 0) setSelectedGroup(urlGroupId || data.groups[0].id);

        } catch (err) { console.error('Fetch error:', err); }
        finally { setLoading(false); }
    }, [session, urlGroupId]);

    const getDescendantDocs = (folderId) => {
        let descendants = [];
        const findDocs = (fid) => {
            documents.filter(d => d.folder_id === fid).forEach(d => descendants.push(d));
            folders.filter(f => f.parent_folder_id === fid).forEach(f => findDocs(f.id));
        };
        findDocs(folderId);
        return descendants;
    };

    const getFolderBulkState = (groupId, folderId, field) => {
        const desc = getDescendantDocs(folderId);
        if (desc.length === 0) return 'none';

        const hasAll = desc.every(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);
        const hasSome = desc.some(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);

        if (hasAll) return 'all';
        if (hasSome) return 'some';
        return 'none';
    };

    const getBreadcrumbs = () => {
        let crumbs = [];
        let curr = currentFolderId;
        while (curr) {
            const f = folders.find(folder => folder.id === curr);
            if (f) { crumbs.unshift(f); curr = f.parent_folder_id; } else break;
        }
        return crumbs;
    };

    // ── FAST LOCAL TOGGLE ──────────────────────────────────
    const togglePermission = async (groupId, targetId, type, field, overrideTarget = null) => {
        if (type === 'doc' && field === 'can_upload') {
            alert("Upload permission can only be granted to Folders."); return;
        }

        const key = `${groupId}_${type}_${targetId}`;
        const current = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false, can_redact: false, perm_id: null };

        let targetState = overrideTarget !== null ? overrideTarget : !current[field];
        let updated = { ...current, [field]: targetState };

        // CASCADE LOGIC
        if (['can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete'].includes(field) && updated[field]) updated.can_view = true;
        if (field === 'can_download_original' && updated.can_download_original) updated.can_download_secure = true;
        if (field === 'can_view' && updated.can_view && type === 'doc') updated.can_download_secure = true;
        if (field === 'can_view' && !updated.can_view) {
            updated.can_edit = false; updated.can_upload = false; updated.can_download_secure = false; updated.can_download_original = false; updated.can_delete = false;
        }

        if (JSON.stringify(current) === JSON.stringify(updated)) return;

        setPermissions(prev => ({ ...prev, [key]: updated }));
        setPendingChanges(prev => ({
            ...prev,
            [key]: { groupId, targetId, type, updatedState: updated }
        }));
    };

    // ── BATCH SAVE ───────────────────────────────────────────
    const handleSaveAndReturn = async () => {
        const changes = Object.values(pendingChanges);

        if (changes.length === 0) {
            triggerRedirect();
            return;
        }

        setIsSubmitting(true);
        setSaveMessage({ text: '', type: '' });

        try {
            const groupId = changes[0].groupId;

            const res = await fetch('/api/access/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, changes, groupId })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setSaveMessage({ text: '✅ Saved successfully! Redirecting...', type: 'success' });
            setPendingChanges({});

            setTimeout(() => { triggerRedirect(); }, 800);

        } catch (error) {
            console.error("Save failed:", error);
            setSaveMessage({ text: `❌ Failed to save: ${error.message || 'Check connection'}`, type: 'error' });
            setIsSubmitting(false);
        }
    };

    const triggerRedirect = () => {
        if (selectedGroup === 'subadmin') router.push('/groups/subadmin?view=permissions');
        else if (selectedGroup) router.push(`/groups/${selectedGroup}?view=permissions`);
        else router.push('/groups');
    };

    // ── BULK TOGGLES ─────────────────────────────────────────────────────────
    const toggleFolderBulk = async (groupId, folderId, field) => {
        const descendants = getDescendantDocs(folderId);
        if (descendants.length === 0) return;
        const currentState = getFolderBulkState(groupId, folderId, field);
        const targetState = currentState !== 'all';
        await Promise.all(descendants.map(doc => togglePermission(groupId, doc.id, 'doc', field, targetState)));
    };

    const toggleAllForGroup = async (groupId, field) => {
        if (field === 'can_upload') {
            const allFoldersHaveIt = displayFolders.length > 0 && displayFolders.every(f => permissions[`${groupId}_fol_${f.id}`]?.can_upload);
            await Promise.all(displayFolders.map(f => togglePermission(groupId, f.id, 'fol', 'can_upload', !allFoldersHaveIt)));
        } else {
            const allDocsHaveIt = displayDocs.length > 0 && displayDocs.every(doc => permissions[`${groupId}_doc_${doc.id}`]?.[field] === true);
            await Promise.all(displayDocs.map(doc => togglePermission(groupId, doc.id, 'doc', field, !allDocsHaveIt)));
        }
    };

    // ── SORT HELPER ──────────────────────────────────────────────────────────
    const sortItemsByIndex = (a, b) => {
        const aIndex = Number.isFinite(+(a.index_number || a.index)) ? +(a.index_number || a.index) : 999999;
        const bIndex = Number.isFinite(+(b.index_number || b.index)) ? +(b.index_number || b.index) : 999999;
        if (aIndex !== bIndex) return aIndex - bIndex;
        if (a.type && b.type && a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    };

    const accessIndexMap = useMemo(() => {
        const map = new Map();
        const byParent = {};
        folders.forEach(f => {
            const pId = f.parent_folder_id || 'root';
            if (!byParent[pId]) byParent[pId] = [];
            byParent[pId].push({ ...f, _type: 'folder' });
        });
        documents.forEach(d => {
            const pId = d.folder_id || 'root';
            if (!byParent[pId]) byParent[pId] = [];
            byParent[pId].push({ ...d, _type: 'doc' });
        });
        Object.values(byParent).forEach(group =>
            group.sort((a, b) => sortItemsByIndex(
                { index_number: a.index_number, index: a.index, name: a.name, type: a._type },
                { index_number: b.index_number, index: b.index, name: b.name, type: b._type }
            ))
        );

        const assignIndex = (parentId, prefix) => {
            (byParent[parentId] || []).forEach((child, idx) => {
                const displayIndex = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
                const key = child._type === 'folder' ? `folder_${child.id}` : `doc_${child.id}`;
                map.set(key, displayIndex);
                if (child._type === 'folder') assignIndex(child.id, displayIndex);
            });
        };
        assignIndex('root', '');
        return map;
    }, [folders, documents]);

    // ── PERMISSION HELPERS ──
    const PERM_FIELDS = [
        { field: 'can_view', label: 'View', icon: <FaEye />, desc: 'Allow viewing document in viewer' },
        { field: 'can_edit', label: 'Edit', icon: <FaEdit />, desc: 'Allow editing document contents' },
        { field: 'can_upload', label: 'Upload', icon: <FaUpload />, desc: 'Allow uploading files into this folder', folderOnly: true },
        { field: 'can_download_secure', label: 'DL Secure', icon: <FaShieldAlt />, desc: 'Allow downloading protected encrypted HTML' },
        { field: 'can_download_original', label: 'DL Original', icon: <FaDownload />, desc: 'Allow downloading raw original file' },
        { field: 'can_delete', label: 'Delete', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>, desc: 'Allow deleting item' },
        { field: 'can_redact', label: 'Redact', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, desc: 'Allow applying redactions' }
    ];

    const getGrantedPermsCount = (item) => {
        const isFolder = item.type === 'folder' || item._type === 'folder' || !item.name?.includes('.');
        const key = isFolder ? `${selectedGroup}_fol_${item.id}` : `${selectedGroup}_doc_${item.id}`;
        const perm = permissions[key] || {};
        const fields = ['can_view', 'can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete', 'can_redact'];
        return fields.filter(f => perm[f]).length;
    };

    const applyPreset = async (item, preset) => {
        const isFolder = item.type === 'folder' || item._type === 'folder' || !item.name?.includes('.');
        const type = isFolder ? 'fol' : 'doc';
        const id = item.id;

        if (preset === 'full') {
            const updates = { can_view: true, can_edit: true, can_upload: isFolder, can_download_secure: true, can_download_original: true, can_delete: true, can_redact: true };
            for (let [f, val] of Object.entries(updates)) {
                togglePermission(selectedGroup, id, type, f, val);
            }
        } else if (preset === 'view') {
            const updates = { can_view: true, can_edit: false, can_upload: false, can_download_secure: true, can_download_original: false, can_delete: false, can_redact: false };
            for (let [f, val] of Object.entries(updates)) {
                togglePermission(selectedGroup, id, type, f, val);
            }
        } else if (preset === 'block') {
            const updates = { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false, can_redact: false };
            for (let [f, val] of Object.entries(updates)) {
                togglePermission(selectedGroup, id, type, f, val);
            }
        }
    };

    const applyBulkPreset = async (preset) => {
        for (const folder of displayFolders) {
            await applyPreset(folder, preset);
        }
        for (const doc of displayDocs) {
            await applyPreset(doc, preset);
        }
    };

    const activeGroup = groups.find(g => g.id === selectedGroup);
    const sortedFolders = folders.filter(f => f.parent_folder_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);
    const sortedDocs = documents.filter(d => d.folder_id === currentFolderId && d.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);

    const displayFolders = sortedFolders.map(f => ({ ...f, displayIndex: accessIndexMap.get(`folder_${f.id}`) || '—' }));
    const displayDocs = sortedDocs.map(d => ({ ...d, displayIndex: accessIndexMap.get(`doc_${d.id}`) || '—' }));

    if (loading) return <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>;

    return (
        <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
            {/* Mobile backdrop for Groups sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`${sidebarOpen ? 'fixed md:relative inset-y-0 left-0 z-50 w-[280px] shadow-2xl md:shadow-none' : 'w-0'} shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300`}>
                <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Room Groups</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2">
                    {groups.map(group => {
                        const isActive = selectedGroup === group.id;
                        const isExpanded = expandedGroups.has(group.id);
                        const members = groupMembers[group.id] || [];

                        return (
                            <div key={group.id} className="mb-0.5">
                                <button
                                    onClick={() => {
                                        setSelectedGroup(group.id);
                                        if (window.innerWidth < 768) setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-brand text-white shadow-xs' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setExpandedGroups(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n; }); }}
                                        className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/20 transition-transform cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-[12.5px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{group.name}</p>
                                    </div>
                                    <span className={`text-[10px] font-black shrink-0 px-2 py-1 rounded-md mr-1 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {members.length} Users
                                    </span>
                                </button>

                                {isExpanded && members.length > 0 && (
                                    <div className="mt-1 mb-2 ml-4 pl-4 border-l-2 border-slate-100 flex flex-col gap-1">
                                        {members.map(user => (
                                            <div key={user.id} className="flex items-center gap-2 py-1">
                                                <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11.5px] font-semibold text-slate-600 truncate">{user.name || user.email}</p>
                                                    {user.name && <p className="text-[9.5px] text-slate-400 truncate">{user.email}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* ── TOP HEADER (Desktop & Mobile) ── */}
                <div className="flex items-center justify-between px-3 sm:px-7 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-200 bg-white gap-2 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 cursor-pointer" title="Toggle Groups Sidebar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M12 22a4 4 0 0 1-4-4v-4" />
                                <circle cx="12" cy="4" r="2" />
                            </svg>
                        </button>

                        {/* Mobile Group Dropdown Switcher */}
                        <div className="relative md:hidden flex-1 min-w-0">
                            <button
                                onClick={() => setMobileGroupDropdownOpen(!mobileGroupDropdownOpen)}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer truncate max-w-full"
                            >
                                <span className="w-5 h-5 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-[10px] shrink-0">👥</span>
                                <span className="truncate">{activeGroup?.name || 'Select Group'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform shrink-0 ${mobileGroupDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                            </button>

                            {mobileGroupDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-slate-900/10" onClick={() => setMobileGroupDropdownOpen(false)}></div>
                                    <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-scale-up flex flex-col max-h-80 overflow-y-auto">
                                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 mb-1">Switch Group</div>
                                        {groups.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => { setSelectedGroup(g.id); setMobileGroupDropdownOpen(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${selectedGroup === g.id ? 'bg-[var(--brand)] text-white font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                                            >
                                                <span className="truncate">{g.name}</span>
                                                <span className="text-[10px] opacity-75">{(groupMembers[g.id] || []).length} users</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Desktop Group Label */}
                        {activeGroup && (
                            <div className="hidden md:flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--brand)] flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] sm:text-[14px] font-black text-slate-800 truncate">{activeGroup.name}</p>
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Group Access Rules ({(groupMembers[activeGroup.id] || []).length} users)</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-32 sm:w-48 shrink-0">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[var(--brand)] focus:bg-white transition-all shadow-2xs" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-3 sm:px-7 sm:py-5">
                    {!selectedGroup ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                            <p className="text-[13px] font-bold">Select a group to manage access</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {/* Breadcrumbs Navigation */}
                            <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto no-scrollbar">
                                <button onClick={() => setCurrentFolderId(null)} className={`text-xs font-bold whitespace-nowrap cursor-pointer ${currentFolderId === null ? 'text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg' : 'text-slate-400 hover:text-slate-600'}`}>Root Directory</button>
                                {getBreadcrumbs().map(crumb => (
                                    <React.Fragment key={crumb.id}>
                                        <span className="text-slate-300 shrink-0 font-bold">&gt;</span>
                                        <button onClick={() => setCurrentFolderId(crumb.id)} className={`text-xs font-bold whitespace-nowrap cursor-pointer ${currentFolderId === crumb.id ? 'text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg' : 'text-slate-400 hover:text-slate-600'}`}>{crumb.name}</button>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* ── DESKTOP PERMISSION MATRIX TABLE (hidden md:block) ── */}
                            <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[750px] border-collapse text-left">
                                        <thead>
                                            <tr className="bg-slate-100/50 border-b border-slate-200">
                                                <th colSpan="2" className="py-2.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Apply to All Below →</th>
                                                {['can_view', 'can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete', 'can_redact'].map(field => {
                                                    const isAllChecked = field === 'can_upload'
                                                        ? (displayFolders.length > 0 && displayFolders.every(f => permissions[`${selectedGroup}_fol_${f.id}`]?.can_upload))
                                                        : (displayDocs.length > 0 && displayDocs.every(d => permissions[`${selectedGroup}_doc_${d.id}`]?.[field]));

                                                    return (
                                                        <th key={`bulk_${field}`} className="py-2.5 px-3 text-center">
                                                            <button onClick={() => toggleAllForGroup(selectedGroup, field)} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${isAllChecked ? 'bg-[var(--brand)]' : 'bg-slate-200'}`} title={isAllChecked ? 'Uncheck All' : 'Check All'}>
                                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isAllChecked ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                            </button>
                                                        </th>
                                                    );
                                                })}
                                            </tr>

                                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                                <th className="py-3.5 px-4 w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
                                                <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="View Permission">
                                                        <FaEye className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto" />
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Edit Permission">
                                                        <FaEdit className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto" />
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Upload Permission">
                                                        <FaUpload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto" />
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Download Secure Permission">
                                                        <FaShieldAlt className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto" />
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Download Original Permission">
                                                        <FaDownload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto" />
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Delete Permission">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto">
                                                            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                                                        </svg>
                                                    </div>
                                                </th>
                                                <th className="py-3.5 px-3 w-24 text-center">
                                                    <div className="inline-block relative group cursor-pointer" title="Redact Permission">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors mx-auto"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {displayFolders.map(folder => {
                                                const toggles = [
                                                    { field: 'can_view' }, { field: 'can_edit' },
                                                    { field: 'can_upload' }, { field: 'can_download_secure' },
                                                    { field: 'can_download_original' },
                                                    { field: 'can_delete' },
                                                    { field: 'can_redact' },
                                                ];

                                                return (
                                                    <tr key={folder.id} className="group hover:bg-slate-50/60 transition-all duration-150 cursor-pointer" onDoubleClick={() => setCurrentFolderId(folder.id)}>
                                                        <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{folder.displayIndex}</td>
                                                        <td className="py-3.5 px-3" onClick={() => setCurrentFolderId(folder.id)}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 border border-amber-100 text-amber-500">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fcd34d"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                                                </div>
                                                                <div><p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px] group-hover:underline decoration-slate-300 underline-offset-2">{folder.name}</p></div>
                                                            </div>
                                                        </td>

                                                        {toggles.map(({ field }) => {
                                                            if (['can_view', 'can_upload', 'can_delete'].includes(field)) {
                                                                const isActive = permissions[`${selectedGroup}_fol_${folder.id}`]?.[field];
                                                                const isSaving = saving[`${selectedGroup}_fol_${folder.id}_${field}`];
                                                                return (
                                                                    <td key={field} className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                        <button onClick={() => togglePermission(selectedGroup, folder.id, 'fol', field)} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${isActive ? 'bg-[var(--brand)]' : 'bg-slate-200'}`}>
                                                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                                        </button>
                                                                    </td>
                                                                );
                                                            } else {
                                                                return (
                                                                    <td key={field} className="py-3.5 px-3 text-center">
                                                                        <button disabled className="relative w-11 h-6 rounded-full bg-slate-100 cursor-not-allowed mx-auto block opacity-60" title="Not applicable for folders">
                                                                            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                                                                        </button>
                                                                    </td>
                                                                );
                                                            }
                                                        })}
                                                    </tr>
                                                );
                                            })}

                                            {displayDocs.map((doc) => {
                                                const key = `${selectedGroup}_doc_${doc.id}`;
                                                const perm = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false };
                                                const ext = doc.name.split('.').pop().toLowerCase();
                                                const iconClass = 'bg-slate-100 border-slate-200 text-slate-600';

                                                return (
                                                    <tr key={doc.id} className="group hover:bg-slate-50/60 transition-all duration-150">
                                                        <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{doc.displayIndex}</td>
                                                        <td className="py-3.5 px-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border ${iconClass}`}>
                                                                    {ext.toUpperCase().slice(0, 3)}
                                                                </div>
                                                                <p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px]">{doc.name}</p>
                                                            </div>
                                                        </td>

                                                        {[{ field: 'can_view' }, { field: 'can_edit' }, { field: 'can_upload' }, { field: 'can_download_secure' }, { field: 'can_download_original' }, { field: 'can_delete' }, { field: 'can_redact' }].map(({ field }) => {
                                                            if (field === 'can_upload') {
                                                                return (
                                                                    <td key={field} className="py-3.5 px-3 text-center">
                                                                        <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', 'can_upload')} className="relative w-11 h-6 rounded-full bg-slate-100 cursor-not-allowed mx-auto block opacity-60" title="Upload is only for folders">
                                                                            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                                                                        </button>
                                                                    </td>
                                                                );
                                                            }

                                                            const isActive = perm[field];
                                                            const isSaving = saving[`${key}_${field}`];
                                                            return (
                                                                <td key={field} className="py-3.5 px-3 text-center">
                                                                    <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', field)} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${isActive ? 'bg-[var(--brand)]' : 'bg-slate-200'} ${isSaving ? 'opacity-50' : ''}`}>
                                                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── MOBILE ACCESS CONTROL LIST VIEW (flex md:hidden) ── */}
                            <div className="flex md:hidden flex-col gap-2.5 pb-16">
                                {/* Folders List on Mobile */}
                                {displayFolders.map(folder => {
                                    const count = getGrantedPermsCount(folder);
                                    const isFull = count === 7;
                                    const isNone = count === 0;

                                    return (
                                        <div key={folder.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => setCurrentFolderId(folder.id)}>
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-500 shadow-2xs">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fcd34d"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{folder.displayIndex}</span>
                                                        <p className="text-[13px] font-bold text-slate-900 truncate">{folder.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            isFull ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            isNone ? 'bg-slate-100 text-slate-400 border border-slate-200' :
                                                            'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                            {isFull ? '● Full Access' : isNone ? '○ No Access' : `● ${count}/7 Permissions`}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">Tap to open</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Direct Manage Button */}
                                            <button
                                                onClick={() => setMobileItemConfigSheet(folder)}
                                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs border border-slate-200/60"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                                <span>Access</span>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Documents List on Mobile */}
                                {displayDocs.map(doc => {
                                    const count = getGrantedPermsCount(doc);
                                    const isFull = count >= 6;
                                    const isNone = count === 0;
                                    const ext = doc.name.split('.').pop().toLowerCase();
                                    const iconClass = 'bg-slate-100 border-slate-200 text-slate-600';

                                    return (
                                        <div key={doc.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => setMobileItemConfigSheet(doc)}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black border ${iconClass} shadow-2xs`}>
                                                    {ext.toUpperCase().slice(0, 3)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{doc.displayIndex}</span>
                                                        <p className="text-[13px] font-bold text-slate-900 truncate">{doc.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            isFull ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            isNone ? 'bg-slate-100 text-slate-400 border border-slate-200' :
                                                            'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                            {isFull ? '● Full Access' : isNone ? '○ No Access' : `● ${count}/7 Permissions`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Direct Manage Button */}
                                            <button
                                                onClick={() => setMobileItemConfigSheet(doc)}
                                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs border border-slate-200/60"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                                <span>Access</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── MOBILE ITEM PERMISSION CONFIGURATION MODAL CARD ── */}
                {mobileItemConfigSheet && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in" onClick={() => setMobileItemConfigSheet(null)}>
                        <div
                            className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl p-5 max-h-[82vh] overflow-y-auto animate-scale-up flex flex-col gap-4 border border-slate-200/80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sheet Header */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{mobileItemConfigSheet.displayIndex}</span>
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{mobileItemConfigSheet.name}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Configure permissions for &quot;{activeGroup?.name}&quot;</p>
                                </div>
                                <button onClick={() => setMobileItemConfigSheet(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">✕</button>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => applyPreset(mobileItemConfigSheet, 'full')} className="flex-1 py-2 px-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer text-center shadow-2xs">Full Access</button>
                                <button onClick={() => applyPreset(mobileItemConfigSheet, 'view')} className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center">View Only</button>
                                <button onClick={() => applyPreset(mobileItemConfigSheet, 'block')} className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer text-center">Revoke All</button>
                            </div>

                            {/* Permissions List with Descriptions & Switches */}
                            <div className="flex flex-col gap-2.5 py-1">
                                {PERM_FIELDS.map(p => {
                                    const isFolder = mobileItemConfigSheet.type === 'folder' || mobileItemConfigSheet._type === 'folder' || !mobileItemConfigSheet.name?.includes('.');
                                    const key = isFolder ? `${selectedGroup}_fol_${mobileItemConfigSheet.id}` : `${selectedGroup}_doc_${mobileItemConfigSheet.id}`;
                                    const perm = permissions[key] || {};
                                    const isUpload = p.field === 'can_upload';
                                    if (isUpload && !isFolder) return null;

                                    const isFolderDisabled = isFolder && !['can_view', 'can_upload', 'can_delete'].includes(p.field);
                                    const isActive = isFolder && !isFolderDisabled ? perm[p.field] : (!isFolder ? perm[p.field] : false);

                                    return (
                                        <div key={p.field} className={`flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 ${isFolderDisabled ? 'opacity-60 grayscale' : ''}`}>
                                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 text-sm">
                                                    {p.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800">{p.label}</p>
                                                    <p className="text-[11px] text-slate-400 leading-tight truncate">{p.desc}</p>
                                                </div>
                                            </div>

                                            {isFolderDisabled ? (
                                                <button disabled className="relative w-11 h-6 rounded-full bg-slate-200 shrink-0 cursor-not-allowed" title="Not applicable for folders">
                                                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => togglePermission(selectedGroup, mobileItemConfigSheet.id, isFolder ? 'fol' : 'doc', p.field)}
                                                    className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 cursor-pointer ${isActive ? 'bg-[var(--brand)]' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <button 
                                onClick={async () => {
                                    setMobileItemConfigSheet(null);
                                    if (Object.keys(pendingChanges).length > 0) {
                                        await handleSaveAndReturn();
                                    }
                                }} 
                                className="w-full py-3 bg-[var(--brand)] text-white rounded-2xl text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* ── FLOATING SAVE BUTTON ── */}
                {Object.keys(pendingChanges).length > 0 && (
                    <div className="fixed bottom-6 right-4 sm:right-6 z-40">
                        <button
                            onClick={handleSaveAndReturn}
                            disabled={isSubmitting}
                            className="px-5 py-3 bg-[var(--brand)] hover:opacity-90 text-white text-sm font-bold rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                            {!isSubmitting && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}

                {/* ── TOAST NOTIFICATIONS ── */}
                {saveMessage.text && (
                    <div className="fixed bottom-24 right-4 sm:right-6 z-50 pointer-events-auto px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 animate-fade-in-up bg-slate-900 text-white">
                        {saveMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
}
