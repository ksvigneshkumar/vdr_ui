"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaHistory, FaDownload, FaRedo, FaSearch, FaEllipsisV } from 'react-icons/fa';
import { useDialog } from '@/components/ui/DialogProvider';

export default function DocumentVersionsPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [restoringId, setRestoringId] = useState(null);
    const [downloading, setDownloading] = useState({});
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const { showConfirm, showAlert } = useDialog();

    // Group state
    const [groupedVersions, setGroupedVersions] = useState({});

    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (!raw) {
            router.push('/login');
            return;
        }
        setSession(JSON.parse(raw));
    }, [router]);

    useEffect(() => {
        if (!session) return;
        fetchVersions();
    }, [session]);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/documents/versions/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch versions');

            // Group by document
            const grouped = {};
            (data.versions || []).forEach(v => {
                if (!grouped[v.document_id]) {
                    grouped[v.document_id] = {
                        name: v.name,
                        document_id: v.document_id,
                        versions: []
                    };
                }
                grouped[v.document_id].versions.push(v);
            });

            // Sort versions within groups by version_number descending
            Object.values(grouped).forEach(group => {
                group.versions.sort((a, b) => b.version_number - a.version_number);
            });

            setGroupedVersions(grouped);
            setVersions(data.versions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId) => {
        if (!(await showConfirm("Are you sure you want to restore this version? The current version will be archived."))) return;

        try {
            setRestoringId(versionId);
            const res = await fetch('/api/documents/versions/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, version_id: versionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to restore version');

            await showAlert('Version restored successfully!', 'Success');
            fetchVersions();
        } catch (err) {
            await showAlert(err.message, 'Error');
        } finally {
            setRestoringId(null);
        }
    };

    const handleDownload = async (version, type = 'original') => {
        try {
            setDownloading(prev => ({ ...prev, [version.id]: true }));
            const res = await fetch('/api/documents/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId: version.id, actionType: type, isHistoricalVersion: true, session })
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            if (type === 'original') {
                a.download = version.name;
            } else {
                const cleanName = version.name.split('.')[0];
                const suffix = type === 'edit' ? 'Editor' : 'SecureView';
                a.download = `${cleanName}_${suffix}_V${version.version_number}.html`;
            }
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            await showAlert("Error downloading file: " + err.message, 'Error');
        } finally {
            setDownloading(prev => ({ ...prev, [version.id]: false }));
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '--';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const filteredGroups = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return Object.values(groupedVersions);

        return Object.values(groupedVersions).filter(group => {
            const matchesDoc = group.name?.toLowerCase().includes(query);
            const matchesVersion = group.versions.some(v =>
                v.upload_comment?.toLowerCase().includes(query) ||
                v.uploaded_by_name?.toLowerCase().includes(query) ||
                `v${v.version_number}`.includes(query)
            );
            return matchesDoc || matchesVersion;
        });
    }, [groupedVersions, searchQuery]);

    const getFileExt = (filename) => {
        return filename?.split('.').pop().toLowerCase() || 'file';
    };

    const getFileIconClass = (ext) => {
        switch (ext) {
            case 'pdf': return 'bg-rose-50 border-rose-100 text-rose-600';
            case 'xlsx':
            case 'xls':
            case 'csv': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
            case 'docx':
            case 'doc': return 'bg-indigo-50 border-indigo-100 text-indigo-600';
            case 'pptx':
            case 'ppt': return 'bg-amber-50 border-amber-100 text-amber-600';
            default: return 'bg-slate-50 border-slate-200 text-slate-500';
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full gap-3 bg-[#F8F9FB]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400">Loading versions...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FB] text-slate-800 font-sans">
            {/* ── HEADER ── */}
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] shrink-0 shadow-2xs">
                        <FaHistory className="text-base" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Document Versions</h1>
                        <p className="text-xs text-slate-400 font-medium">View and restore previous document iterations</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                        type="text"
                        placeholder="Search document or version..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:bg-white transition-all shadow-2xs"
                    />
                </div>
            </div>

            {error && (
                <div className="mx-4 sm:mx-8 mt-4 p-3.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs font-bold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* ── CONTENT BODY ── */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
                {filteredGroups.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center gap-3 max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
                            <FaHistory />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">No historical versions found</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {searchQuery ? 'Try adjusting your search query.' : 'When files are updated with new versions, they will appear here.'}
                            </p>
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
                        {filteredGroups.map(group => {
                            const ext = getFileExt(group.name);
                            const iconClass = getFileIconClass(ext);

                            return (
                                <div key={group.document_id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs">
                                    {/* Group Title Header */}
                                    <div className="bg-slate-50/70 rounded-t-2xl sm:rounded-t-3xl px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border uppercase shrink-0 shadow-2xs ${iconClass}`}>
                                                {ext.slice(0, 3)}
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-sm truncate">{group.name}</h3>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shrink-0 shadow-2xs">
                                            {group.versions.length} {group.versions.length === 1 ? 'version' : 'versions'}
                                        </span>
                                    </div>

                                    {/* ── DESKTOP TABLE VIEW (hidden md:block) ── */}
                                    <div className="hidden md:block overflow-visible rounded-b-2xl sm:rounded-b-3xl">
                                        <table className="w-full text-left border-collapse min-w-[650px]">
                                            <thead>
                                                <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                                    <th className="py-3 px-6 w-24">Version</th>
                                                    <th className="py-3 px-4">Comment</th>
                                                    <th className="py-3 px-4">Uploaded By</th>
                                                    <th className="py-3 px-4">Date & Time</th>
                                                    <th className="py-3 px-4">Size</th>
                                                    <th className="py-3 px-6 text-right w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {group.versions.map((v, idx) => {
                                                    const isNearBottom = group.versions.length > 1 && idx >= Math.max(1, group.versions.length - 2);

                                                    return (
                                                        <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="py-3.5 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-[var(--brand)] text-white shadow-2xs' : 'bg-slate-100 text-slate-700'}`}>
                                                                        V{v.version_number}
                                                                    </span>
                                                                    {idx === 0 && (
                                                                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                            Latest
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 max-w-xs truncate">
                                                                {v.upload_comment || <span className="text-slate-400 font-normal italic">No comment</span>}
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                                                        {(v.uploaded_by_name || 'U').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-700">{v.uploaded_by_name || 'User'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                                                                {new Date(v.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </td>
                                                            <td className="py-3.5 px-4 text-xs font-mono font-semibold text-slate-500">
                                                                {formatBytes(v.file_size_bytes)}
                                                            </td>
                                                            <td className="py-3.5 px-6 text-right" onClick={e => e.stopPropagation()}>
                                                                <div className="relative inline-flex items-center justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveDropdownId(activeDropdownId === v.id ? null : v.id);
                                                                        }}
                                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                                                            activeDropdownId === v.id 
                                                                                ? 'bg-[var(--brand)] text-white shadow-sm ring-2 ring-[var(--brand)]/30 scale-105' 
                                                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
                                                                        }`}
                                                                        title="Actions"
                                                                    >
                                                                        <FaEllipsisV size={14} />
                                                                    </button>

                                                                    {activeDropdownId === v.id && (
                                                                        <>
                                                                            {/* Backdrop to close when clicking outside */}
                                                                            <div 
                                                                                className="fixed inset-0 z-40" 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveDropdownId(null);
                                                                                }} 
                                                                            />

                                                                            {/* Dropdown Action Menu */}
                                                                            <div
                                                                                className={`absolute right-0 ${
                                                                                    isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                                                                                } z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 w-44 flex flex-col animate-scale-up whitespace-nowrap`}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                {/* 1. DOWNLOAD */}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActiveDropdownId(null);
                                                                                        handleDownload(v, 'original');
                                                                                    }}
                                                                                    disabled={downloading[v.id]}
                                                                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                                                                                >
                                                                                    <FaDownload className="text-xs text-slate-500" />
                                                                                    <span>{downloading[v.id] ? 'Downloading...' : 'Download'}</span>
                                                                                </button>

                                                                                {/* 2. RESTORE */}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActiveDropdownId(null);
                                                                                        handleRestore(v.id);
                                                                                    }}
                                                                                    disabled={restoringId === v.id}
                                                                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                                                                                >
                                                                                    <FaRedo className={`text-xs ${restoringId === v.id ? 'animate-spin text-[var(--brand)]' : 'text-slate-500'}`} />
                                                                                    <span>{restoringId === v.id ? 'Restoring...' : 'Restore Version'}</span>
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ── MOBILE CARDS VIEW (block md:hidden) ── */}
                                    <div className="block md:hidden p-3 divide-y divide-slate-100 rounded-b-2xl sm:rounded-b-3xl overflow-visible">
                                        {group.versions.map((v, idx) => {
                                            const isNearBottom = group.versions.length > 1 && idx >= Math.max(1, group.versions.length - 2);

                                            return (
                                                <div key={v.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2.5">
                                                    {/* Card Header: Version Badge, Latest Pill, Size, Date */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${idx === 0 ? 'bg-[var(--brand)] text-white shadow-2xs' : 'bg-slate-100 text-slate-700'}`}>
                                                                V{v.version_number}
                                                            </span>
                                                            {idx === 0 && (
                                                                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                    Latest
                                                                </span>
                                                            )}
                                                            <span className="text-xs font-mono font-semibold text-slate-400">
                                                                {formatBytes(v.file_size_bytes)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-semibold text-slate-400">
                                                                {new Date(v.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>

                                                            {/* 3-dots Mobile Menu */}
                                                            <div className="relative inline-flex items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveDropdownId(activeDropdownId === `m-${v.id}` ? null : `m-${v.id}`);
                                                                    }}
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                                                        activeDropdownId === `m-${v.id}` ? 'bg-[var(--brand)] text-white' : 'text-slate-500 hover:bg-slate-100'
                                                                    }`}
                                                                    title="Actions"
                                                                >
                                                                    <FaEllipsisV size={12} />
                                                                </button>

                                                                {activeDropdownId === `m-${v.id}` && (
                                                                    <>
                                                                        <div 
                                                                            className="fixed inset-0 z-40" 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveDropdownId(null);
                                                                            }} 
                                                                        />
                                                                        <div
                                                                            className={`absolute right-0 ${
                                                                                isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                                                                            } z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 w-44 flex flex-col animate-scale-up whitespace-nowrap`}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveDropdownId(null);
                                                                                    handleDownload(v, 'original');
                                                                                }}
                                                                                disabled={downloading[v.id]}
                                                                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                                                                            >
                                                                                <FaDownload className="text-xs text-slate-500" />
                                                                                <span>{downloading[v.id] ? 'Downloading...' : 'Download'}</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveDropdownId(null);
                                                                                    handleRestore(v.id);
                                                                                }}
                                                                                disabled={restoringId === v.id}
                                                                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                                                                            >
                                                                                <FaRedo className={`text-xs ${restoringId === v.id ? 'animate-spin text-[var(--brand)]' : 'text-slate-500'}`} />
                                                                                <span>{restoringId === v.id ? 'Restoring...' : 'Restore Version'}</span>
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Comment & Uploader Box */}
                                                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col gap-1.5">
                                                        {v.upload_comment ? (
                                                            <p className="text-xs font-semibold text-slate-700 italic">
                                                                &ldquo;{v.upload_comment}&rdquo;
                                                            </p>
                                                        ) : (
                                                            <p className="text-[11px] text-slate-400 italic">No comment provided</p>
                                                        )}

                                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                                    {(v.uploaded_by_name || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-slate-600 truncate">{v.uploaded_by_name || 'User'}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
