"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    FaArrowLeft, 
    FaShieldAlt, 
    FaSave, 
    FaCheck, 
    FaTimes, 
    FaUsers, 
    FaCog, 
    FaComments, 
    FaFolder, 
    FaLock 
} from "react-icons/fa";
import { useDialog } from "@/components/ui/DialogProvider";

const PERMISSION_SECTIONS = [
    {
        label: "Workspace",
        scope: "workspace",
        description: "Control access to navigation modules and group management",
        icon: FaUsers,
        subPerms: [
            { 
                key: "can_access_groups", 
                label: "Groups", 
                desc: "Can access the Groups module and manage group settings", 
                icon: FaUsers,
                nested: [
                    { key: "can_add_members", label: "Add Members", desc: "Can invite & add users to groups" },
                    { key: "can_remove_members", label: "Remove Members", desc: "Can remove users from groups" },
                    { key: "can_create_group", label: "Create Group", desc: "Can create new groups" },
                    { key: "can_delete_group", label: "Delete Group", desc: "Can delete existing groups" }
                ] 
            },
            { 
                key: "can_access_settings", 
                label: "Settings", 
                desc: "Can access the Settings module and workspace configurations", 
                icon: FaCog,
                nested: [
                    { key: "can_access_branding", label: "Branding", desc: "Can customize workspace branding" },
                    { key: "can_access_watermarks", label: "Watermarks", desc: "Can configure document watermarks" },
                    { key: "can_access_nda", label: "NDA Access", desc: "Can view and configure NDA settings and signers" }
                ] 
            },
            { 
                key: "can_access_qa", 
                label: "Q&A Module", 
                desc: "Can access the Q&A due diligence inquiry module", 
                icon: FaComments,
                nested: [
                    { key: "can_ask_qa", label: "Ask Questions", desc: "Can raise new document-linked questions" },
                    { key: "can_answer_qa", label: "Answer & Suggest", desc: "Can submit suggested answers and collaborate" }
                ] 
            },
        ],
    },
];

const DEFAULT_PERMS = { 
    can_view: false, 
    can_edit: false, 
    can_download: false, 
    can_delete: false, 
    can_add_members: false, 
    can_remove_members: false 
};

export default function PermissionsPage() {
    const params = useParams();
    const router = useRouter();
    const groupSlug = params.slug;

    const [groupData, setGroupData] = useState(null);
    const [perms, setPerms] = useState({});
    const [permsLoading, setPermsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Floating Notification Card state
    const [toastMsg, setToastMsg] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const { showAlert } = useDialog();
    const [session, setSession] = useState(null);

    useEffect(() => {
        const rawSession = localStorage.getItem("vdr_session");
        if (rawSession) setSession(JSON.parse(rawSession));
        else router.push('/login');
    }, [router]);

    // ── HITS DETAILS API FOR GROUP INFO ──
    useEffect(() => {
        if (!groupSlug || !session) return;
        const fetchGroup = async () => {
            try {
                const res = await fetch('/api/groups/details', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session, groupSlug })
                });
                const data = await res.json();
                if (data.success) setGroupData(data.group);
            } catch (e) {
                console.error(e);
            }
        };
        fetchGroup();
    }, [groupSlug, session]);

    // ── HITS PERMISSIONS API ──
    useEffect(() => {
        if (!groupData || !session) return;
        const loadPerms = async () => {
            setPermsLoading(true);
            try {
                const res = await fetch('/api/groups/permissions', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'fetch', session, groupId: groupData.id })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                const built = {};
                PERMISSION_SECTIONS.forEach(({ scope }) => {
                    const row = data.rawPermissions?.find((r) => r.scope === scope);
                    built[scope] = {
                        enabled: !!row,
                        can_add_members: row?.can_add_members ?? false,
                        can_remove_members: row?.can_remove_members ?? false,
                        can_create_group: row?.can_create_group ?? false,
                        can_delete_group: row?.can_delete_group ?? false,
                        can_access_documents: row?.can_access_documents ?? false,
                        can_access_groups: row?.can_access_groups ?? false,
                        can_access_edit_permissions: row?.can_access_edit_permissions ?? false,
                        can_access_settings: row?.can_access_settings ?? false,
                        can_access_branding: row?.can_access_branding ?? false,
                        can_access_watermarks: row?.can_access_watermarks ?? false,
                        can_access_nda: row?.can_access_nda ?? false,
                        can_access_qa: row?.can_access_qa ?? false,
                        can_ask_qa: row?.can_ask_qa ?? false,
                        can_answer_qa: row?.can_answer_qa ?? false,
                        existingId: row?.id ?? null,
                    };
                });

                const filesRow = data.rawPermissions?.find((r) => r.scope === "files");
                built["files"] = {
                    enabled: !!filesRow,
                    can_create_folder: filesRow?.can_create_folder ?? false,
                    can_merge_folder: filesRow?.can_merge_folder ?? false,
                    can_delete_folder: filesRow?.can_delete_folder ?? false,
                    existingId: filesRow?.id ?? null,
                };

                setPerms(built);
            } catch (err) { 
                console.error(err); 
            } finally { 
                setPermsLoading(false); 
            }
        };
        loadPerms();
    }, [groupData, session]);

    const triggerToast = (msg) => { 
        setToastMsg(msg); 
        setShowToast(true); 
        setHasUnsavedChanges(true);
    };

    const toggleSection = (scope) => {
        setPerms((prev) => {
            const current = prev[scope] || { ...DEFAULT_PERMS, enabled: false, existingId: null };
            return { 
                ...prev, 
                [scope]: { 
                    ...current, 
                    enabled: !current.enabled, 
                    ...(!current.enabled ? {} : { can_view: false, can_edit: false, can_download: false, can_delete: false, can_add_members: false, can_remove_members: false }) 
                } 
            };
        });
        triggerToast(`Toggled ${scope} access control`);
    };

    const toggleSubPerm = (scope, key) => {
        setPerms((prev) => ({ 
            ...prev, 
            [scope]: { 
                ...prev[scope], 
                [key]: !prev[scope]?.[key] 
            } 
        }));
        triggerToast("Updated permissions");
    };

    // ── SAVES VIA PERMISSIONS API ──
    const handleSubmitPermissions = async () => {
        if (!groupData) return;
        setSaving(true);
        try {
            const ALL_SECTIONS = [...PERMISSION_SECTIONS, { scope: "files" }];
            const toDeleteIds = [];
            const toUpsert = [];

            for (const { scope } of ALL_SECTIONS) {
                const s = perms[scope];
                if (!s) continue;

                if (!s.enabled && !s.can_access_edit_permissions) {
                    if (s.existingId) toDeleteIds.push(s.existingId);
                    continue;
                }

                const payload = {
                    company_id: groupData.company_id, 
                    group_id: groupData.id, 
                    scope,
                    can_view: false, 
                    can_add_members: s.can_add_members || false, 
                    can_remove_members: s.can_remove_members || false,
                    can_create_group: s.can_create_group || false, 
                    can_delete_group: s.can_delete_group || false,
                    can_access_documents: s.can_access_documents || false, 
                    can_access_groups: s.can_access_groups || false,
                    can_access_edit_permissions: s.can_access_edit_permissions || false, 
                    can_access_settings: s.can_access_settings || false,
                    can_access_branding: s.can_access_branding || false, 
                    can_access_watermarks: s.can_access_watermarks || false, 
                    can_access_nda: s.can_access_nda || false,
                    can_access_qa: s.can_access_qa || false, 
                    can_ask_qa: s.can_ask_qa || false, 
                    can_answer_qa: s.can_answer_qa || false,
                    folder_id: null, 
                    document_id: null, 
                    can_create_folder: s.can_create_folder || false, 
                    can_merge_folder: s.can_merge_folder || false, 
                    can_delete_folder: s.can_delete_folder || false,
                };
                if (s.existingId) { 
                    payload.id = s.existingId; 
                    payload.updated_at = new Date().toISOString(); 
                }
                toUpsert.push(payload);
            }

            const res = await fetch('/api/groups/permissions', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'save', 
                    session, 
                    groupId: groupData.id, 
                    permissionsPayload: { toDeleteIds, toUpsert } 
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setToastMsg("Permissions saved successfully!");
            setShowToast(true);
            setHasUnsavedChanges(false);
            setTimeout(() => router.push(`/groups/${groupSlug}`), 1200);
        } catch (err) { 
            await showAlert("Failed to save permissions: " + err.message, 'Error'); 
        } finally { 
            setSaving(false); 
        }
    };

    const handleToggleEditPerm = async () => {
        const ws = perms["workspace"] || { enabled: false, existingId: null };
        const isOn = !!ws.can_access_edit_permissions;
        const newVal = !isOn;
        setPerms((prev) => ({ 
            ...prev, 
            workspace: { 
                ...prev.workspace, 
                can_access_edit_permissions: newVal 
            } 
        }));
        triggerToast("Press Save Permissions to confirm edit toggle");
    };

    const ws = perms["workspace"] || { enabled: false, existingId: null };
    const isEditPermOn = !!ws.can_access_edit_permissions;

    return (
        <div className="w-full min-h-full flex flex-col font-sans bg-[#F8FAFC] relative">
            
            {/* ── CLEAN LIGHT FLOATING CONFIRMATION & ACTION CARD ── */}
            {showToast && (
                <div className="fixed bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[94%] sm:w-auto max-w-lg animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-200">
                    <div className="bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5 rounded-2xl p-3 sm:px-4.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[var(--brand)] border border-blue-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                                <FaShieldAlt className="text-sm" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                                    {toastMsg}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                                    Click "Save" to apply changes to this group
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={handleSubmitPermissions}
                                disabled={saving}
                                className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FaCheck className="text-[11px]" />
                                )}
                                <span>Save</span>
                            </button>

                            <button 
                                onClick={() => setShowToast(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Dismiss"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Page Header */}
            <div className="pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6 md:px-10 pb-4 sm:pb-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button 
                        onClick={() => router.push(`/groups/${groupSlug}`)} 
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                    >
                        <FaArrowLeft size={13} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">
                            {groupData?.name || "Group"} &rsaquo; Permissions
                        </p>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 truncate">
                            <span className="w-8 h-8 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center shadow-xs shrink-0 text-sm">
                                <FaShieldAlt size={14} />
                            </span>
                            <span>Edit Permissions</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-4 sm:px-6 md:px-10 pb-20 sm:pb-16">
                <div className="max-w-4xl space-y-5 sm:space-y-6">
                    {permsLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-3 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin mb-3" />
                            <p className="text-xs text-slate-500 font-medium">Loading group permissions...</p>
                        </div>
                    ) : (
                        <>
                            {/* ── CARD 1: Edit Permissions Access ── */}
                            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
                                <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                                            <FaLock size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm sm:text-base text-slate-900">Edit Permissions Access</p>
                                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                                                Allow this group to access and modify permission settings for other groups
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleToggleEditPerm} 
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${
                                            isEditPermOn ? "bg-[var(--brand)]" : "bg-slate-200"
                                        }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            isEditPermOn ? "translate-x-5" : "translate-x-0"
                                        }`} />
                                    </button>
                                </div>
                            </div>

                            {/* ── CARD 2: Scope Sections (Workspace Access Control) ── */}
                            {PERMISSION_SECTIONS.map(({ label, scope, description, icon: ScopeIcon, subPerms }) => {
                                const s = perms[scope] || { enabled: false, ...DEFAULT_PERMS, existingId: null };
                                return (
                                    <div key={scope} className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
                                        
                                        {/* Section Header */}
                                        <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[var(--brand)] flex items-center justify-center shrink-0 shadow-2xs">
                                                    <ScopeIcon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm sm:text-base text-slate-900">{label} Access Control</p>
                                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => toggleSection(scope)} 
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${
                                                    s.enabled ? "bg-[var(--brand)]" : "bg-slate-200"
                                                }`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    s.enabled ? "translate-x-5" : "translate-x-0"
                                                }`} />
                                            </button>
                                        </div>

                                        {/* Sub-Modules Body */}
                                        {s.enabled && (
                                            <div className="p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {subPerms.map((sub) => {
                                                    const isModuleOn = !!s[sub.key];
                                                    const SubIcon = sub.icon || FaCog;

                                                    return (
                                                        <div 
                                                            key={sub.key} 
                                                            className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                                                                isModuleOn 
                                                                    ? "border-slate-300 shadow-2xs bg-white" 
                                                                    : "border-slate-200 bg-slate-50/40"
                                                            }`}
                                                        >
                                                            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                                        isModuleOn ? "bg-blue-50 text-[var(--brand)]" : "bg-slate-100 text-slate-400"
                                                                    }`}>
                                                                        <SubIcon size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className={`font-bold text-xs sm:text-sm ${isModuleOn ? "text-slate-900" : "text-slate-600"}`}>
                                                                            {sub.label} Module
                                                                        </h4>
                                                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                                                                            {sub.desc}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <button 
                                                                    onClick={() => toggleSubPerm(scope, sub.key)} 
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                        isModuleOn ? "bg-emerald-500" : "bg-slate-300"
                                                                    }`}
                                                                >
                                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                        isModuleOn ? 'translate-x-4' : 'translate-x-0'
                                                                    }`} />
                                                                </button>
                                                            </div>

                                                            {/* Granular Checkboxes */}
                                                            {isModuleOn && sub.nested && sub.nested.length > 0 && (
                                                                <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 animate-in fade-in duration-200">
                                                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">
                                                                        Granular Permissions
                                                                    </h5>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                                        {sub.nested.map((n) => (
                                                                            <label 
                                                                                key={n.key} 
                                                                                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none group ${
                                                                                    s[n.key] 
                                                                                        ? "bg-white border-blue-200 shadow-2xs" 
                                                                                        : "bg-transparent border-transparent hover:bg-white/60"
                                                                                }`}
                                                                            >
                                                                                <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        checked={!!s[n.key]} 
                                                                                        onChange={() => toggleSubPerm(scope, n.key)} 
                                                                                        className="peer w-4 h-4 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none transition-all cursor-pointer" 
                                                                                    />
                                                                                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <span className={`block text-xs font-bold transition-colors truncate ${
                                                                                        s[n.key] ? "text-slate-900" : "text-slate-600"
                                                                                    }`}>
                                                                                        {n.label}
                                                                                    </span>
                                                                                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                                                        {n.desc}
                                                                                    </span>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* ── CARD 3: File Access Control ── */}
                            {(() => {
                                const fs = perms["files"] || { enabled: false, can_create_folder: false, can_merge_folder: false, can_delete_folder: false, existingId: null };
                                const folderPerms = [
                                    { key: "can_create_folder", label: "Create Folder", desc: "Can create new folders in the workspace" },
                                    { key: "can_merge_folder", label: "Merge Folder", desc: "Can merge folders together" },
                                    { key: "can_delete_folder", label: "Delete Folder", desc: "Can permanently delete folders" }
                                ];

                                return (
                                    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300">
                                        <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                                                    <FaFolder size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm sm:text-base text-slate-900">File Access Control</p>
                                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                                                        Manage folder-level permissions for this group
                                                    </p>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    setPerms((prev) => ({ 
                                                        ...prev, 
                                                        files: { 
                                                            ...(prev.files || {}), 
                                                            enabled: !fs.enabled 
                                                        } 
                                                    }));
                                                    triggerToast("Toggled file access control");
                                                }} 
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${
                                                    fs.enabled ? "bg-[var(--brand)]" : "bg-slate-200"
                                                }`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    fs.enabled ? "translate-x-5" : "translate-x-0"
                                                }`} />
                                            </button>
                                        </div>

                                        {fs.enabled && (
                                            <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4 sm:p-5">
                                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 sm:mb-4">
                                                        Granular Permissions
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                        {folderPerms.map((fp) => (
                                                            <label 
                                                                key={fp.key} 
                                                                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none group ${
                                                                    fs[fp.key] 
                                                                        ? "bg-white border-blue-200 shadow-2xs" 
                                                                        : "bg-transparent border-transparent hover:bg-white/60"
                                                                }`}
                                                            >
                                                                <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={!!fs[fp.key]} 
                                                                        onChange={() => {
                                                                            setPerms((prev) => ({ 
                                                                                ...prev, 
                                                                                files: { 
                                                                                    ...prev.files, 
                                                                                    [fp.key]: !prev.files?.[fp.key] 
                                                                                } 
                                                                            }));
                                                                            triggerToast("Updated file permissions");
                                                                        }} 
                                                                        className="peer w-4 h-4 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none transition-all cursor-pointer" 
                                                                    />
                                                                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className={`block text-xs font-bold transition-colors truncate ${
                                                                        fs[fp.key] ? "text-slate-900" : "text-slate-600"
                                                                    }`}>
                                                                        {fp.label}
                                                                    </span>
                                                                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                                        {fp.desc}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Bottom Page Actions Bar */}
                            <div className="flex flex-row items-center gap-3 pt-4 sm:pt-6">
                                <button 
                                    type="button" 
                                    onClick={() => router.push(`/groups/${groupSlug}`)} 
                                    className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmitPermissions} 
                                    disabled={saving || permsLoading} 
                                    className="flex-1 sm:flex-none px-8 py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaSave size={14} />
                                            <span>Save Permissions</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
