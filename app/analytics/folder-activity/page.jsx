"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { fetchUsersByCompany, fetchFoldersAnalytics, fetchDocumentsAnalytics, fetchDocumentAccessLogsAnalytics, fetchDocumentEditLogsAnalytics } from '../actions';
import { X, List, BarChart2, Filter, RotateCcw, Clock, Shield, Search } from "lucide-react";

export default function FolderActivityPage() {
    // Raw Data States
    const [rawDocuments, setRawDocuments] = useState([]);
    const [rawFolders, setRawFolders] = useState([]);
    const [rawUsers, setRawUsers] = useState([]);
    const [rawAccessLogs, setRawAccessLogs] = useState([]);
    const [rawEditLogs, setRawEditLogs] = useState([]);
    const [processedFolders, setProcessedFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Multidimensional Filter States
    const [selectedFolderScope, setSelectedFolderScope] = useState('all');
    const [selectedUserEmail, setSelectedUserEmail] = useState('all');
    const [selectedActivityType, setSelectedActivityType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // UI Dropdown States
    const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [modalData, setModalData] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const [modalView, setModalView] = useState('table'); // 'table', 'chart'

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
                console.error("Failed to load folder activity data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Create user ID to Email / User mapping
    const userMap = useMemo(() => {
        const map = {};
        rawUsers.forEach(u => { map[u.id] = u; });
        return map;
    }, [rawUsers]);

    // Unique user emails list
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

    const handleResetFilters = () => {
        setSelectedFolderScope('all');
        setSelectedUserEmail('all');
        setSelectedActivityType('all');
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
    };

    // 2. Process Data (Multidimensional Filter, Calculate, Sort)
    useEffect(() => {
        let folders = rawFolders;

        // Search Query Filter
        if (searchQuery.trim() !== '') {
            folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Folder Scope Filter
        if (selectedFolderScope !== 'all') {
            folders = folders.filter(f => f.id === selectedFolderScope);
        }

        // User Email & Date Range Filter Helpers
        const matchesUserEmail = (userId) => {
            if (selectedUserEmail === 'all') return true;
            const u = userMap[userId];
            return u && u.email.toLowerCase() === selectedUserEmail.toLowerCase();
        };

        let startMs = startDate ? new Date(startDate).getTime() : 0;
        let endMs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const matchesDate = (timestamp) => {
            if (!timestamp) return true;
            const t = new Date(timestamp).getTime();
            return t >= startMs && t <= endMs;
        };

        let filteredAccessLogs = rawAccessLogs.filter(log =>
            matchesUserEmail(log.user_id) && matchesDate(log.opened_at)
        );

        let filteredEditLogs = rawEditLogs.filter(log =>
            matchesUserEmail(log.user_id) && matchesDate(log.changed_at)
        );

        // Activity Type Filter
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

        // Pre-map documents to folders
        const folderDocMap = {};
        rawDocuments.forEach(doc => {
            if (!folderDocMap[doc.folder_id]) {
                folderDocMap[doc.folder_id] = new Set();
            }
            folderDocMap[doc.folder_id].add(doc.id);
        });

        // Map and Calculate Counts
        let mapped = folders.map(folder => {
            const docIdsSet = folderDocMap[folder.id] || new Set();

            const folderViews = filteredAccessLogs.filter(log => docIdsSet.has(log.document_id));
            const viewCount = folderViews.length;
            const totalDurationSeconds = folderViews.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);

            const folderEdits = filteredEditLogs.filter(log => docIdsSet.has(log.document_id));

            const downloadEncryptedCount = folderEdits.filter(log =>
                log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF'
            ).length;

            const downloadOriginalCount = folderEdits.filter(log =>
                log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD'
            ).length;

            const totalActivityCount = viewCount + downloadEncryptedCount + downloadOriginalCount;

            return {
                id: folder.id,
                name: folder.name,
                viewCount,
                totalDurationSeconds,
                formattedDuration: formatDuration(totalDurationSeconds),
                downloadEncryptedCount,
                downloadOriginalCount,
                totalActivityCount
            };
        });

        // Sort
        if (sortOrder === 'asc') {
            mapped.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            mapped.sort((a, b) => b.name.localeCompare(a.name));
        }

        setProcessedFolders(mapped);
        setCurrentPage(1);
    }, [rawFolders, rawDocuments, rawAccessLogs, rawEditLogs, searchQuery, selectedFolderScope, selectedUserEmail, selectedActivityType, startDate, endDate, sortOrder, userMap]);

    // 3. Pagination Logic
    const totalItems = processedFolders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentDisplayedFolders = processedFolders.slice(startIndex, endIndex);

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    // 4. Export Logic
    const handleExport = () => {
        const csvHeader = "Folder Name,View Count,Viewing Duration (Secs),Download Secure Count,Download Original Count,Total Activity Count\n";
        const csvBody = processedFolders.map(f =>
            `"${f.name}",${f.viewCount},${f.totalDurationSeconds},${f.downloadEncryptedCount},${f.downloadOriginalCount},${f.totalActivityCount}`
        ).join('\n');

        const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'folder_activity_analytics.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // 5. Modal Logic
    const handleOpenModal = async (folder, type) => {
        if (type === 'view' && folder.viewCount === 0) return;
        if (type === 'download_secure' && folder.downloadEncryptedCount === 0) return;
        if (type === 'download_original' && folder.downloadOriginalCount === 0) return;
        if (type === 'total' && folder.totalActivityCount === 0) return;

        setSelectedFolder(folder);
        setModalType(type);
        setShowModal(true);
        setLoadingModal(true);
        setModalData([]);
        setModalView('table');

        try {
            const folderDocIds = new Set(rawDocuments.filter(d => d.folder_id === folder.id).map(d => d.id));

            let filteredViews = rawAccessLogs.filter(log => folderDocIds.has(log.document_id));
            let filteredEdits = rawEditLogs.filter(log => folderDocIds.has(log.document_id));

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
            } else if (type === 'download_secure') {
                logsToShow = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Secure',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
            } else if (type === 'download_original') {
                logsToShow = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Original',
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
                const dlSec = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_SECURE' || log.action_type === 'DOWNLOAD_PDF')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Secure',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                const dlOrig = filteredEdits
                    .filter(log => log.action_type === 'DOWNLOAD_ORIGINAL' || log.action_type === 'DOWNLOAD')
                    .map(log => ({
                        ...log,
                        timestamp: log.changed_at,
                        typeLabel: 'Download Original',
                        ipAddress: log.metadata?.ip_address || '—'
                    }));
                logsToShow = [...views, ...dlSec, ...dlOrig];
            }

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

    const hasActiveFilters = selectedFolderScope !== 'all' || selectedUserEmail !== 'all' || selectedActivityType !== 'all' || startDate !== '' || endDate !== '' || searchQuery !== '';

    return (
        <div className="p-4 sm:p-8 bg-white min-h-full font-sans w-full max-w-full overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full justify-between">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Folder Activity Audit Logs</h1>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 border border-orange-300 rounded text-xs font-semibold text-gray-700 hover:bg-orange-50 transition-colors self-start sm:self-auto"
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
                        Folder Multidimensional Audit Filters
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
                    {/* Search Folder Name */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Search Folder</span>
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter folder name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-500 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Folder Scope Filter */}
                    <div className="relative flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Folder Scope</span>
                        <div
                            className="flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 cursor-pointer shadow-sm hover:border-gray-400"
                            onClick={() => { setIsFolderDropdownOpen(!isFolderDropdownOpen); setIsUserDropdownOpen(false); setIsActivityDropdownOpen(false); }}
                        >
                            <span className="truncate pr-2 font-medium">
                                {selectedFolderScope === 'all'
                                    ? 'All Folders'
                                    : rawFolders.find(f => f.id === selectedFolderScope)?.name || 'Selected Folder'}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                        {isFolderDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm rounded-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                <div
                                    className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 font-medium"
                                    onClick={() => { setSelectedFolderScope('all'); setIsFolderDropdownOpen(false); }}
                                >
                                    All Folders
                                </div>
                                {rawFolders.map(folder => (
                                    <div
                                        key={folder.id}
                                        className="px-3 py-2 text-xs hover:bg-orange-50 cursor-pointer text-gray-700 truncate"
                                        onClick={() => { setSelectedFolderScope(folder.id); setIsFolderDropdownOpen(false); }}
                                        title={folder.name}
                                    >
                                        {folder.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Email Filter */}
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

                    {/* Start Date */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500 font-semibold uppercase">Start Date</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-500 shadow-sm"
                        />
                    </div>

                    {/* End Date */}
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
            <div className="w-full bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
                <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        Folder Name
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
                    <div>Download Secure</div>
                    <div>Download Original</div>
                    <div>Total Activity Count</div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col relative min-h-[250px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                        </div>
                    ) : currentDisplayedFolders.length > 0 ? (
                        currentDisplayedFolders.map((folder, index) => (
                            <div
                                key={folder.id}
                                className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-200 items-center bg-white hover:bg-slate-50 transition-colors"
                            >
                                <div className="text-slate-800 font-bold truncate pr-4 text-[13px]" title={folder.name}>{folder.name}</div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(folder, 'view')}
                                >
                                    {folder.viewCount}
                                </div>
                                <div className="text-slate-500 font-mono text-[13px] flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400" />
                                    {folder.formattedDuration}
                                </div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(folder, 'download_secure')}
                                >
                                    {folder.downloadEncryptedCount}
                                </div>
                                <div
                                    className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline font-semibold text-[13px]"
                                    onClick={() => handleOpenModal(folder, 'download_original')}
                                >
                                    {folder.downloadOriginalCount}
                                </div>
                                <div
                                    className="text-slate-800 cursor-pointer hover:text-slate-900 hover:underline font-bold text-[13px]"
                                    onClick={() => handleOpenModal(folder, 'total')}
                                >
                                    {folder.totalActivityCount}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            No folders or activity found for the selected filter parameters.
                        </div>
                    )}
                </div>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-6 py-4 bg-white text-xs text-slate-500 gap-4">
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

            {/* ── Activity Detail Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease-out" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-lg sm:rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-[95%] sm:w-full max-w-4xl mx-auto max-h-[85vh] flex flex-col overflow-hidden relative"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUpToCenter 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    >

                        <style>{`
                            @keyframes slideUpToCenter {
                                from { transform: translateY(100px); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                        `}</style>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 pt-8 border-b border-slate-100 bg-white">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Folder Activity Audit Log</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {selectedFolder?.name} &middot; <span className="font-semibold text-emerald-600">{modalData.length} records</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-auto flex-1 relative min-h-[350px] p-6">
                            {loadingModal ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            ) : modalData.length === 0 ? (
                                <p className="py-12 text-center text-xs text-gray-400">No activity data recorded for this folder with current filters.</p>
                            ) : (
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
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Recorded with IP & active viewing duration metrics</span>
                            <span className="text-[11px] font-semibold text-orange-600">{modalData.length} Total Activity Logs</span>
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
