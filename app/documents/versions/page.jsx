"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaHistory, FaDownload, FaHistory as FaRestore, FaEllipsisH } from 'react-icons/fa';
import { useDialog } from '@/components/ui/DialogProvider';

export default function DocumentVersionsPage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
            data.versions.forEach(v => {
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
            setVersions(data.versions);
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

    const handleDownload = async (version, type) => {
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

    const handleView = (version) => {
        handleDownload(version, 'view');
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '--';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-50">
            <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FaHistory className="text-xl text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Document Versions</h1>
                    <p className="text-sm font-medium text-slate-500">View and restore historical document versions.</p>
                </div>
            </div>

            {error && <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">{error}</div>}

            {Object.keys(groupedVersions).length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg border border-slate-200">
                    <FaHistory className="text-4xl text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No historical versions</h3>
                    <p className="text-sm text-slate-500">Documents that are updated will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.values(groupedVersions).map(group => (
                        <div key={group.document_id} className="bg-white rounded-lg border border-slate-200 shadow-sm relative">
                            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[15px]">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    {group.name}
                                </h3>
                            </div>
                            <div className="overflow-x-auto no-scrollbar pb-24">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider">Version</th>
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider">Comment</th>
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider">Uploaded By</th>
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider">Size</th>
                                            <th className="py-3 px-5 font-bold text-[12px] text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {group.versions.map((v, index) => {
                                            // Split the list in half: top half opens downwards, bottom half opens upwards
                                            const dropdownPositionClass = index >= group.versions.length / 2 ? 'bottom-full mb-1' : 'top-full mt-1';
                                            return (
                                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors relative">
                                                <td className="py-3 px-5">
                                                    <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                                                        V{v.version_number}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-[13px] text-slate-600 font-medium">
                                                    {v.upload_comment || '-'}
                                                </td>
                                                <td className="py-3 px-5 text-[13px] text-slate-700 font-medium">
                                                    {v.uploaded_by_name}
                                                </td>
                                                <td className="py-3 px-5 text-[13px] text-slate-500">
                                                    {new Date(v.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-5 text-[13px] text-slate-500">
                                                    {formatBytes(v.file_size_bytes)}
                                                </td>
                                                <td className="py-3 px-5 text-right relative">
                                                    <div className="flex items-center justify-end">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownId(activeDropdownId === v.id ? null : v.id);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${activeDropdownId === v.id ? 'bg-[var(--brand)] text-white shadow-md' : 'text-slate-400 hover:text-[var(--brand)] hover:bg-slate-100'}`}
                                                            title="Actions"
                                                        >
                                                            <FaEllipsisH className="text-[15px]" />
                                                        </button>
                                                        
                                                        {activeDropdownId === v.id && (
                                                            <>
                                                                <div 
                                                                    className="fixed inset-0 z-40" 
                                                                    onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); }}
                                                                ></div>
                                                                <div 
                                                                    className={`absolute right-0 ${dropdownPositionClass} w-48 bg-white border border-slate-200 rounded-xl shadow-md py-2 z-[9999] flex flex-col`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button 
                                                                        onClick={() => {
                                                                            handleDownload(v, 'original');
                                                                            setActiveDropdownId(null);
                                                                        }} 
                                                                        disabled={downloading[v.id]}
                                                                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-3 transition-colors disabled:opacity-50" 
                                                                    >
                                                                        <FaDownload className="text-[14px]" />
                                                                        Download
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            handleRestore(v.id);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                        disabled={restoringId === v.id}
                                                                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--brand)] flex items-center gap-3 transition-colors disabled:opacity-50"
                                                                    >
                                                                        <FaRestore className="text-[14px]" />
                                                                        {restoringId === v.id ? 'Restoring...' : 'Restore Version'}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
