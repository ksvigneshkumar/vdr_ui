"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { fetchUsersByCompany, fetchFoldersAnalytics, fetchDocumentsAnalytics, fetchDocumentAccessLogsAnalytics, fetchDocumentEditLogsAnalytics } from '../actions';
import { X, List, BarChart2, Filter, RotateCcw, Clock, Shield, Search } from "lucide-react";

export default function FileActivityPage() {
    // Raw Data States
    const [rawDocuments, setRawDocuments] = useState([]);
    const [rawFolders, setRawFolders] = useState([]);
    const [rawUsers, setRawUsers] = useState([]);
    const [rawAccessLogs, setRawAccessLogs] = useState([]);
    const [rawEditLogs, setRawEditLogs] = useState([]);
    const [processedFiles, setProcessedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Multidimensional Filter States
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedUserEmail, setSelectedUserEmail] = useState('all');
    const [selectedActivityType, setSelectedActivityType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // UI Dropdown States
    const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'view', 'download_original', 'download_secure', 'total'
    const [selectedFile, setSelectedFile] = useState(null);
    const [modalData, setModalData] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const [modalView, setModalView] = useState('table'); // 'table', 'chart'

    // Helper: format duration in seconds into readable HH:MM:SS or MM:SS
    const formatDuration = (totalSecs) => {
        if (!totalSecs || totalSecs <= 0) return '0s';
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    // 1. Fetch Raw Data Once
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const sessionRaw = localStorage.getItem('vdr_session');
                if (!sessionRaw) return;
                const session = JSON.parse(sessionRaw);
                const companyId = session.company_id;
                if (!companyId) return;

                // Fetch Users
                const { data: usersData, error: usersError } = await fetchUsersByCompany(companyId);
                if (usersError) throw usersError;
                setRawUsers(usersData || []);

                // Fetch Folders
                const { data: foldersData, error: foldersError } = await fetchFoldersAnalytics(companyId, session.active_workspace_id);
                if (foldersError) throw foldersError;
                setRawFolders(foldersData || []);

                // Fetch Documents
                const { data: documentsData, error: docsError } = await fetchDocumentsAnalytics(companyId, session.active_workspace_id);
                if (docsError) throw docsError;
                setRawDocuments(documentsData || []);

                const docIds = (documentsData || []).map(d => d.id);

                if (docIds.length > 0) {
                    // Fetch Access Logs (Views & Duration)
                    const { data: accessLogs, error: accessError } = await fetchDocumentAccessLogsAnalytics(docIds);
                    if (accessError) throw accessError;
                    setRawAccessLogs(accessLogs || []);

                    // Fetch Edit Logs (Downloads, Uploads, Deletes, IP Addresses)
                    const { data: editLogs, error: editError } = await fetchDocumentEditLogsAnalytics(docIds);
                    if (editError) throw editError;
                    setRawEditLogs(editLogs || []);
                }
            } catch (err) {
                console.error("Failed to load file activity data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Create user ID to Email / User object mapping
    const userMap = useMemo(() => {
        const map = {};
        rawUsers.forEach(u => { map[u.id] = u; });
        return map;
    }, [rawUsers]);

    // Unique email list for filter dropdown
    const userEmailsList = useMemo(() => {
        const emails = rawUsers.map(u => u.email).filter(Boolean);
        return [...new Set(emails)].sort();
    }, [rawUsers]);

    // Activity types list
    const activityTypes = [
        { id: 'all', label: 'All Activities' },
        { id: 'view', label: 'View (Duration Tracking)' },
        { id: 'DOWNLOAD_ORIGINAL', label: 'Download Original' },
        { id: 'DOWNLOAD_SECURE', label: 'Download Secure' },
        { id: 'UPLOAD', label: 'Upload' },
        { id: 'DELETE', label: 'Delete' }
    ];

    // Reset all filters
    const handleResetFilters = () => {
        setSelectedFolder('all');
        setSelectedUserEmail('all');
        setSelectedActivityType('all');
        setStartDate('');
        setEndDate('');
    };

    // 2. Process Data (Multidimensional Filter, Calculate Duration, Sort)
    useEffect(() => {
        let docs = rawDocuments;

        // 1. Folder Scope Filter
        if (selectedFolder !== 'all') {
            docs = docs.filter(d => d.folder_id === selectedFolder);
        }

        // 2. User Email Filter Helper
        const matchesUserEmail = (userId) => {
            if (selectedUserEmail === 'all') return true;
            const u = userMap[userId];
            return u && u.email.toLowerCase() === selectedUserEmail.toLowerCase();
        };

        // 3. Date Range Filter Helpers
        let startMs = startDate ? new Date(startDate).getTime() : 0;
        let endMs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const matchesDate = (timestamp) => {
            if (!timestamp) return true;
            const t = new Date(timestamp).getTime();
            return t >= startMs && t <= endMs;
        };

        // Filter Raw Access Logs (Views)
        let filteredAccessLogs = rawAccessLogs.filter(log =>
            matchesUserEmail(log.user_id) && matchesDate(log.opened_at)
        );

        // Filter Raw Edit Logs
        let filteredEditLogs = rawEditLogs.filter(log =>
            matchesUserEmail(log.user_id) && matchesDate(log.changed_at)
        );

        // 4. Activity Type Filter
        if (selectedActivityType !== 'all') {
            if (selectedActivityType === 'view') {
                filteredEditLogs = [];
            } else {
                filteredAccessLogs = [];
                filteredEditLogs = filteredEditLogs.filter(log => {
                    if (selectedActivityType === 'DOWNLOAD_ORIGINAL') {
                        return log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD';
                    }
                    if (selectedActivityType === 'DOWNLOAD_SECURE') {
                        return log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF';
                    }
                    return log.action_type === selectedActivityType;
                });
            }
        }

        // Map and Calculate Counts & Active Duration
        let mapped = docs.map(doc => {
            const docViews = filteredAccessLogs.filter(log => log.document_id === doc.id);
            const viewCount = docViews.length;

            const totalDurationSeconds = docViews.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);

            const docEdits = filteredEditLogs.filter(log => log.document_id === doc.id);

            const downloadOriginalCount = docEdits.filter(log =>
                log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD'
            ).length;

            const downloadSecureCount = docEdits.filter(log =>
                log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF'
            ).length;

            const uploadCount = docEdits.filter(log => log.action_type === 'UPLOAD').length;
            const deleteCount = docEdits.filter(log => log.action_type === 'DELETE').length;

            const totalActivityCount = viewCount + downloadOriginalCount + downloadSecureCount + uploadCount + deleteCount;

            return {
                id: doc.id,
                name: doc.name,
                folderId: doc.folder_id,
                viewCount,
                totalDurationSeconds,
                formattedDuration: formatDuration(totalDurationSeconds),
                downloadOriginalCount,
                downloadSecureCount,
                uploadCount,
                deleteCount,
                totalActivityCount
            };
        });

        // Filter out docs with 0 activities if specific filters (like email/activity) are applied
        if (selectedUserEmail !== 'all' || selectedActivityType !== 'all' || startDate || endDate) {
            mapped = mapped.filter(d => d.totalActivityCount > 0);
        }

        // Sort
        if (sortOrder === 'asc') {
            mapped.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            mapped.sort((a, b) => b.name.localeCompare(a.name));
        }

        setProcessedFiles(mapped);
        setCurrentPage(1);
    }, [rawDocuments, rawAccessLogs, rawEditLogs, selectedFolder, selectedUserEmail, selectedActivityType, startDate, endDate, sortOrder, userMap]);

    // 3. Pagination Logic
    const totalItems = processedFiles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentDisplayedFiles = processedFiles.slice(startIndex, endIndex);

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    // 4. Export Logic
    const handleExport = () => {
        const csvHeader = "File Name,View Count,Viewing Duration (Secs),Formatted Duration,Download Original Count,Download Secure Count,Total Activity Count\n";
        const csvBody = processedFiles.map(f =>
            `"${f.name}",${f.viewCount},${f.totalDurationSeconds},"${f.formattedDuration}",${f.downloadOriginalCount},${f.downloadSecureCount},${f.totalActivityCount}`
        ).join('\n');

        const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'file_activity_audit_logs.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // 5. Modal Logic
    const handleOpenModal = async (file, type) => {
        if (type === 'view' && file.viewCount === 0) return;
        if (type === 'download_original' && file.downloadOriginalCount === 0) return;
        if (type === 'download_secure' && file.downloadSecureCount === 0) return;
        if (type === 'total' && file.totalActivityCount === 0) return;

        setSelectedFile(file);
        setModalType(type);
        setShowModal(true);
        setLoadingModal(true);
        setModalData([]);
        setModalView('table');

        try {
            // Apply Date and Email Filters for the specific file
            let filteredViews = rawAccessLogs.filter(log => log.document_id === file.id);
            let filteredEdits = rawEditLogs.filter(log => log.document_id === file.id);

            if (selectedUserEmail !== 'all') {
                filteredViews = filteredViews.filter(log => {
                    const u = userMap[log.user_id];
                    return u && u.email.toLowerCase() === selectedUserEmail.toLowerCase();
                });
                filteredEdits = filteredEdits.filter(log => {
                    const u = userMap[log.user_id];
                    return u && u.email.toLowerCase() === selectedUserEmail.toLowerCase();
                });
            }

            if (startDate) {
                const start = new Date(startDate).getTime();
                filteredViews = filteredViews.filter(log => new Date(log.opened_at).getTime() >= start);
                filteredEdits = filteredEdits.filter(log => new Date(log.changed_at).getTime() >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filteredViews = filteredViews.filter(log => new Date(log.opened_at).getTime() <= end.getTime());
                filteredEdits = filteredEdits.filter(log => new Date(log.changed_at).getTime() <= end.getTime());
            }

            let logsToShow = [];

            if (type === 'view') {
                logsToShow = filteredViews.map(log => {
                    const matchEdit = filteredEdits.find(e => e.action_type === 'VIEW' && e.user_id === log.user_id && Math.abs(new Date(e.changed_at) - new Date(log.opened_at)) < 30000);
                    return {
                        ...log,
                        timestamp: log.opened_at,
                        typeLabel: 'View',
                        durationSecs: log.duration_seconds || 0,
                        durationFormatted: log.duration_formatted || formatDuration(log.duration_seconds || 0),
                        ipAddress: matchEdit?.metadata?.ip_address || log.ip_address || '—'
                    };
                });
            } else if (type === 'download_original') {
                logsToShow = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Original',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
            } else if (type === 'download_secure') {
                logsToShow = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Secure',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
            } else if (type === 'total') {
                const views = filteredViews.map(log => {
                    const matchEdit = filteredEdits.find(e => e.action_type === 'VIEW' && e.user_id === log.user_id && Math.abs(new Date(e.changed_at) - new Date(log.opened_at)) < 30000);
                    return {
                        ...log,
                        timestamp: log.opened_at,
                        typeLabel: 'View',
                        durationSecs: log.duration_seconds || 0,
                        durationFormatted: log.duration_formatted || formatDuration(log.duration_seconds || 0),
                        ipAddress: matchEdit?.metadata?.ip_address || log.ip_address || '—'
                    };
                });
                const dlOrig = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Original',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                const dlSec = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Secure',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                const uploads = filteredEdits
                    .filter(log => log.action_type === 'UPLOAD')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Upload',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                const deletes = filteredEdits
                    .filter(log => log.action_type === 'DELETE')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Delete',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                logsToShow = [...views, ...dlOrig, ...dlSec, ...uploads, ...deletes];
            }

            // Sort chronologically descending (newest first)
            logsToShow.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const mappedData = logsToShow.map(log => ({
                ...log,
                user: userMap[log.user_id] || { name: 'Unknown User', email: log.user_id ? '—' : 'System' }
            }));

            setModalData(mappedData);
        } catch (err) {
            console.error("Error loading modal data:", err);
        } finally {
            setLoadingModal(false);
        }
    };

    const getModalTitle = () => {
        if (modalType === 'view') return 'Document Viewing Activity & Duration';
        if (modalType === 'download_original') return 'Download Original Activity';
        if (modalType === 'download_secure') return 'Download Secure Activity';
        return 'Total Activity Audit Log';
    };

    const getModalCount = () => {
        if (!selectedFile) return 0;
        if (modalType === 'view') return selectedFile.viewCount;
        if (modalType === 'download_original') return selectedFile.downloadOriginalCount;
        if (modalType === 'download_secure') return selectedFile.downloadSecureCount;
        return selectedFile.totalActivityCount;
    };

    const hasActiveFilters = selectedFolder !== 'all' || selectedUserEmail !== 'all' || selectedActivityType !== 'all' || startDate !== '' || endDate !== '';

    return (
        <div className="p-8 bg-white min-h-full font-sans">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">File Activity Audit Logs</h1>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 border border-orange-300 rounded text-xs font-semibold text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                        EXPORT CSV
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Multidimensional Filter Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <Filter size={14} className="text-orange-500" />
                        Multidimensional Audit Filters
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium transition-colors"
                        >
                            <RotateCcw size={12} />
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* 1. Folder Scope Filter */}
                    <div className="relative flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Folder Scope</span>
                        <div
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 cursor-pointer shadow-sm hover:border-gray-400"
                            onClick={() => { setIsFolderDropdownOpen(!isFolderDropdownOpen); setIsUserDropdownOpen(false); setIsActivityDropdownOpen(false); }}
                        >
                            <span className="truncate pr-2 font-medium">
                                {selectedFolder === 'all'
                                    ? 'All Folders'
                                    : rawFolders.find(f => f.id === selectedFolder)?.name || 'Selected Folder'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                        {isFolderDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm rounded-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                <div
                                    className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 font-medium"
                                    onClick={() => { setSelectedFolder('all'); setIsFolderDropdownOpen(false); }}
                                >
                                    All Folders
                                </div>
                                {rawFolders.map(folder => (
                                    <div
                                        key={folder.id}
                                        className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 truncate"
                                        onClick={() => { setSelectedFolder(folder.id); setIsFolderDropdownOpen(false); }}
                                        title={folder.name}
                                    >
                                        {folder.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. User Email Filter */}
                    <div className="relative flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">User Email</span>
                        <div
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 cursor-pointer shadow-sm hover:border-gray-400"
                            onClick={() => { setIsUserDropdownOpen(!isUserDropdownOpen); setIsFolderDropdownOpen(false); setIsActivityDropdownOpen(false); }}
                        >
                            <span className="truncate pr-2 font-medium">
                                {selectedUserEmail === 'all' ? 'All Users' : selectedUserEmail}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                        {isUserDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm rounded-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                <div
                                    className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 font-medium"
                                    onClick={() => { setSelectedUserEmail('all'); setIsUserDropdownOpen(false); }}
                                >
                                    All Users
                                </div>
                                {userEmailsList.map(email => (
                                    <div
                                        key={email}
                                        className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 truncate"
                                        onClick={() => { setSelectedUserEmail(email); setIsUserDropdownOpen(false); }}
                                        title={email}
                                    >
                                        {email}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Activity Type Filter */}
                    <div className="relative flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Activity Type</span>
                        <div
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 cursor-pointer shadow-sm hover:border-gray-400"
                            onClick={() => { setIsActivityDropdownOpen(!isActivityDropdownOpen); setIsFolderDropdownOpen(false); setIsUserDropdownOpen(false); }}
                        >
                            <span className="truncate pr-2 font-medium">
                                {activityTypes.find(a => a.id === selectedActivityType)?.label || 'All Activities'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isActivityDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                        {isActivityDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm rounded-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                {activityTypes.map(act => (
                                    <div
                                        key={act.id}
                                        className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 font-medium"
                                        onClick={() => { setSelectedActivityType(act.id); setIsActivityDropdownOpen(false); }}
                                    >
                                        {act.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Start Date */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Start Date</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-500 shadow-sm"
                        />
                    </div>

                    {/* 5. End Date */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">End Date</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-500 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        File Name
                        <svg
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`text-gray-400 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                        >
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                        </svg>
                    </div>
                    <div>View Count</div>
                    <div>Viewing Duration</div>
                    <div>Download Original</div>
                    <div>Download Secure</div>
                    <div>Total Activity</div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col relative min-h-[250px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                        </div>
                    ) : currentDisplayedFiles.length > 0 ? (
                        currentDisplayedFiles.map((file, index) => (
                            <div
                                key={file.id}
                                className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-200 items-center bg-white hover:bg-slate-50 transition-colors"
                            >
                                <div className="text-slate-800 font-bold truncate pr-4 text-[13px]" title={file.name}>{file.name}</div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(file, 'view')}
                                >
                                    {file.viewCount}
                                </div>
                                <div className="text-slate-500 font-mono text-[13px] flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400" />
                                    {file.formattedDuration}
                                </div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(file, 'download_original')}
                                >
                                    {file.downloadOriginalCount}
                                </div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(file, 'download_secure')}
                                >
                                    {file.downloadSecureCount}
                                </div>
                                <div
                                    className="text-slate-800 cursor-pointer hover:text-slate-900 hover:underline font-bold text-[13px]"
                                    onClick={() => handleOpenModal(file, 'total')}
                                >
                                    {file.totalActivityCount}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            No files or activities match the selected filter criteria.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-white text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-gray-700 outline-none bg-white cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="text-gray-600 font-medium">
                        {totalItems > 0 ? `${startIndex + 1}-${endIndex} of ${totalItems}` : '0 of 0'}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || totalItems === 0}
                            className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalItems === 0}
                            className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Activity Detail Bottom Sheet ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease-out" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] w-full max-w-4xl mx-auto max-h-[85vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >

                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                        `}</style>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 pt-8 border-b border-slate-100 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getModalTitle()}</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {selectedFile?.name} &middot; <span className="font-semibold text-emerald-600">{getModalCount()} activities</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between bg-white z-10 relative">
                            {/* Toggle Group */}
                            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                                <button
                                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${modalView === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalView('table')}
                                >
                                    <List size={14} />
                                    Table View
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${modalView === 'chart' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalView('chart')}
                                >
                                    <BarChart2 size={14} />
                                    User Distribution
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 relative min-h-[350px] px-6 pb-6">
                            {loadingModal ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            ) : modalData.length === 0 ? (
                                <p className="py-12 text-center text-xs text-gray-400">No activity logs found for the selected filter parameters.</p>
                            ) : modalView === 'table' ? (
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 bg-slate-100 border-b border-gray-400 z-10">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-400">
                                        {modalData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                                            {(d.user.name || d.user.email || "?")[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-900 leading-tight">{d.user.name || "Unknown User"}</p>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{d.user.email || ""}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                                                        d.typeLabel === 'View' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                        d.typeLabel?.includes('Original') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {d.typeLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700 font-mono">
                                                    {d.typeLabel === 'View' ? (
                                                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                                            <Clock size={12} className="text-orange-500" />
                                                            {d.durationFormatted || formatDuration(d.durationSecs)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono text-slate-600">
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 border border-slate-200">
                                                        <Shield size={10} className="text-slate-400" />
                                                        {d.ipAddress || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {d.timestamp
                                                        ? new Date(d.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                (() => {
                                    const userCounts = {};
                                    modalData.forEach(log => {
                                        const uid = log.user_id;
                                        if (uid) {
                                            if (!userCounts[uid]) userCounts[uid] = { user: log.user, count: 0 };
                                            userCounts[uid].count++;
                                        }
                                    });
                                    const chartData = Object.values(userCounts).sort((a, b) => b.count - a.count);
                                    const maxCount = Math.max(...chartData.map(d => d.count), 1);

                                    return (
                                        <div className="w-full h-[320px] flex flex-col pt-4 px-4 pb-6">
                                            <div className="flex-1 flex items-end justify-around border-b border-gray-200 gap-4">
                                                {chartData.map((d, i) => (
                                                    <div key={i} className="flex flex-col items-center flex-1 max-w-[60px] group relative">
                                                        <span className="text-[10px] font-bold text-gray-600 mb-1">{d.count}</span>
                                                        <div
                                                            className="w-full bg-orange-400 rounded-t-md hover:bg-orange-500 transition-all"
                                                            style={{ height: `${Math.max(10, (d.count / maxCount) * 200)}px` }}
                                                        ></div>
                                                        <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center" title={d.user.name}>
                                                            {d.user.name.split(' ')[0]}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Recorded with IP & active viewing duration metrics</span>
                            <span className="text-[11px] font-semibold text-orange-600">{getModalCount()} Total Activity Logs</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
