"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaTimes,
    FaRedo,
    FaCheckCircle,
    FaExclamationCircle,
    FaFileAlt,
    FaFilePdf,
    FaFileExcel,
    FaFileWord,
    FaFileImage,
    FaFileArchive,
    FaCloudUploadAlt,
    FaSpinner,
    FaPlus,
    FaShieldAlt
} from 'react-icons/fa';

// Helper to format bytes cleanly
export function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Consistent Blue/Slate file icons
function getFileIcon(fileName) {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FaFilePdf className="text-blue-600 text-base flex-shrink-0" />;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FaFileExcel className="text-blue-600 text-base flex-shrink-0" />;
    if (['docx', 'doc', 'txt'].includes(ext)) return <FaFileWord className="text-blue-600 text-base flex-shrink-0" />;
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return <FaFileImage className="text-blue-600 text-base flex-shrink-0" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FaFileArchive className="text-blue-600 text-base flex-shrink-0" />;
    return <FaFileAlt className="text-blue-500 text-base flex-shrink-0" />;
}

const MAX_CONCURRENT_UPLOADS = 2; // Optimal concurrency to avoid network congestion

export default function BulkUploadModal({
    isOpen,
    onClose,
    session,
    currentFolderId,
    files = [],
    deletedIds = new Set(),
    getActiveDisplayIndex,
    onUploadSuccess,
    showToast,
    initialFiles = []
}) {
    const [queue, setQueue] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const xhrMapRef = useRef(new Map()); // id -> XMLHttpRequest

    // Initial files passed (e.g. from window drop)
    useEffect(() => {
        if (isOpen && initialFiles && initialFiles.length > 0) {
            addFilesToQueue(initialFiles);
        }
    }, [isOpen, initialFiles]);

    // Cleanup active XHRs on unmount
    useEffect(() => {
        return () => {
            xhrMapRef.current.forEach((xhr) => {
                try { xhr.abort(); } catch (_) { }
            });
            xhrMapRef.current.clear();
        };
    }, []);

    // Calculate base index prefix for current folder
    const calculateIndexInfo = useCallback(() => {
        let prefix = '';
        if (currentFolderId) {
            const parentFolder = files.find(f => f.id === currentFolderId);
            if (parentFolder && getActiveDisplayIndex) {
                const pDisplay = getActiveDisplayIndex(parentFolder);
                if (pDisplay && pDisplay !== '—' && pDisplay !== '99') {
                    prefix = `${pDisplay}.`;
                }
            }
        }

        const peers = files.filter(f => f.parentId === currentFolderId && !deletedIds.has(f.id));
        const baseIndex = peers.reduce((m, it) => {
            const lastPart = it.index ? it.index.toString().split('.').pop() : '0';
            return Math.max(m, parseInt(lastPart, 10) || 0);
        }, 0) + 1;

        return { prefix, baseIndex };
    }, [currentFolderId, files, deletedIds, getActiveDisplayIndex]);

    // Add selected/dropped files to the upload queue
    const addFilesToQueue = useCallback((newFilesList) => {
        const fileArray = Array.from(newFilesList || []);
        if (fileArray.length === 0) return;

        const newItems = fileArray.map((file, idx) => {
            // Check for conflict
            const conflictFile = files.find(f => 
                f.name === file.name && 
                f.type !== 'folder' && 
                f.parentId === currentFolderId && 
                !deletedIds.has(f.id)
            );

            return {
                id: `up-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}`,
                file,
                name: file.name,
                size: file.size,
                sizeFormatted: formatFileSize(file.size),
                progress: 0,
                status: conflictFile ? 'conflict' : 'waiting', // 'conflict' | 'waiting' | 'uploading' | 'completed' | 'failed' | 'cancelled'
                conflictDocId: conflictFile ? conflictFile.id : null,
                isNewVersion: false,
                uploadComment: '',
                error: null,
                speed: 0,
                speedFormatted: '',
                etaFormatted: '',
                loadedBytes: 0,
                startTime: null
            };
        });

        setQueue(prev => [...prev, ...newItems]);
    }, [files, currentFolderId, deletedIds]);

    // Upload a single file item with real-time progress (MOCKED FOR FRONTEND DEMO)
    const uploadSingleItem = useCallback((item, fileIndexOffset = 0) => {
        return new Promise((resolve) => {
            if (!session) {
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', error: 'No active session' } : q));
                return resolve(false);
            }

            const { prefix, baseIndex } = calculateIndexInfo();
            const targetIndex = `${prefix}${baseIndex + fileIndexOffset}`;

            // Mark as uploading
            setQueue(prev => prev.map(q => q.id === item.id ? {
                ...q,
                status: 'uploading',
                progress: 0,
                error: null,
                startTime: Date.now()
            } : q));

            // Simulate progress
            let currentProgress = 0;
            const progressInterval = setInterval(() => {
                currentProgress += 20; // 20% every 200ms = 1 second total
                
                if (currentProgress < 100) {
                    setQueue(prev => prev.map(q => q.id === item.id ? {
                        ...q,
                        progress: currentProgress,
                        loadedBytes: (item.size * currentProgress) / 100,
                        speedFormatted: '1.2 MB/s',
                        etaFormatted: 'few seconds'
                    } : q));
                } else {
                    clearInterval(progressInterval);
                    
                    const completeUpload = (dataUrl) => {
                        if (typeof window !== "undefined") {
                            if (!window.__mockDocuments) window.__mockDocuments = [];
                            window.__mockDocuments.push({
                                id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                                name: item.name,
                                type: "file",
                                size_bytes: item.size,
                                created_at: new Date().toISOString(),
                                parentId: currentFolderId || null,
                                version: item.isNewVersion ? "V2" : "V1",
                                index: targetIndex,
                                is_bookmarked: false,
                                is_downloaded: false,
                                is_deleted: false,
                                dataUrl: dataUrl || null
                            });
                            try { localStorage.setItem("vdr_mock_documents", JSON.stringify(window.__mockDocuments)); } catch(e){}
                        }
                        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 100, status: 'completed', loadedBytes: item.size, speedFormatted: '', etaFormatted: '' } : q));
                        resolve(true);
                    };

                    if (item.file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            completeUpload(e.target.result);
                        };
                        reader.onerror = () => {
                            completeUpload(null);
                        };
                        reader.readAsDataURL(item.file);
                    } else {
                        completeUpload(null);
                    }
                }
            }, 200);

            // Store the interval to allow cancellation (abort) if needed
            xhrMapRef.current.set(item.id, { abort: () => clearInterval(progressInterval) });
        });
    }, [session, currentFolderId, calculateIndexInfo]);

    // Queue worker engine - runs concurrently while queue has 'waiting' items
    useEffect(() => {
        if (!isOpen || queue.length === 0) return;

        const activeUploading = queue.filter(q => q.status === 'uploading');
        const waitingItems = queue.filter(q => q.status === 'waiting');

        if (activeUploading.length < MAX_CONCURRENT_UPLOADS && waitingItems.length > 0) {
            const slotsAvailable = MAX_CONCURRENT_UPLOADS - activeUploading.length;
            const itemsToStart = waitingItems.slice(0, slotsAvailable);

            itemsToStart.forEach((item, index) => {
                const completedCount = queue.filter(q => q.status === 'completed').length;
                uploadSingleItem(item, completedCount + index);
            });
        }
    }, [queue, isOpen, uploadSingleItem]);

    // Cancel individual upload
    const handleCancelItem = (id) => {
        const xhr = xhrMapRef.current.get(id);
        if (xhr) {
            xhr.abort();
        } else {
            setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));
        }
    };

    // Retry individual failed/cancelled upload
    const handleRetryItem = (id) => {
        setQueue(prev => prev.map(q => q.id === id ? {
            ...q,
            status: 'waiting',
            progress: 0,
            error: null,
            loadedBytes: 0,
            speedFormatted: '',
            etaFormatted: ''
        } : q));
    };

    // Cancel all remaining uploads
    const handleCancelAll = () => {
        xhrMapRef.current.forEach(xhr => {
            try { xhr.abort(); } catch (_) { }
        });
        xhrMapRef.current.clear();
        setQueue(prev => prev.map(q => (q.status === 'waiting' || q.status === 'uploading') ? { ...q, status: 'cancelled' } : q));
    };

    // Retry all failed uploads
    const handleRetryAllFailed = () => {
        setQueue(prev => prev.map(q => q.status === 'failed' ? {
            ...q,
            status: 'waiting',
            progress: 0,
            error: null,
            loadedBytes: 0
        } : q));
    };

    // Overall metrics calculation
    const totalFiles = queue.length;
    const completedFiles = queue.filter(q => q.status === 'completed').length;
    const uploadingFiles = queue.filter(q => q.status === 'uploading').length;
    const waitingFiles = queue.filter(q => q.status === 'waiting').length;
    const failedFiles = queue.filter(q => q.status === 'failed').length;
    const cancelledFiles = queue.filter(q => q.status === 'cancelled').length;

    const totalBytes = useMemo(() => queue.reduce((sum, it) => sum + (it.size || 0), 0), [queue]);
    const loadedBytesTotal = useMemo(() => {
        return queue.reduce((sum, it) => {
            if (it.status === 'completed') return sum + it.size;
            return sum + (it.loadedBytes || 0);
        }, 0);
    }, [queue]);

    const overallPercentage = useMemo(() => {
        if (totalFiles === 0) return 0;
        if (totalBytes > 0) {
            return Math.min(100, Math.round((loadedBytesTotal / totalBytes) * 100));
        }
        return Math.round((completedFiles / totalFiles) * 100);
    }, [totalFiles, totalBytes, loadedBytesTotal, completedFiles]);

    const isAllDone = totalFiles > 0 && (completedFiles + failedFiles + cancelledFiles === totalFiles);
    const hasActiveUploads = uploadingFiles > 0 || waitingFiles > 0;

    // Trigger parent refresh & toast once all complete
    const notifiedRef = useRef(false);
    useEffect(() => {
        if (isAllDone && !notifiedRef.current) {
            notifiedRef.current = true;
            if (completedFiles > 0 && onUploadSuccess) {
                onUploadSuccess(completedFiles);
            }
            if (completedFiles > 0 && showToast) {
                showToast(`Successfully uploaded ${completedFiles} file${completedFiles > 1 ? 's' : ''}`);
            } else if (failedFiles > 0 && showToast) {
                showToast(`${failedFiles} upload${failedFiles > 1 ? 's' : ''} encountered issues.`, 'error');
            }
        }
        if (!isAllDone) {
            notifiedRef.current = false;
        }
    }, [isAllDone, completedFiles, failedFiles, onUploadSuccess, showToast]);

    // Handle drag events on dropzone (only active when queue is empty)
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFilesToQueue(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFilesToQueue(e.target.files);
            e.target.value = ''; // Reset input to allow re-selecting same files if needed
        }
    };

    const handleCloseModal = () => {
        if (hasActiveUploads) {
            if (window.confirm("Uploads are still in progress. Closing will cancel unfinished uploads. Are you sure?")) {
                handleCancelAll();
                setQueue([]);
                onClose();
            }
        } else {
            setQueue([]);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
            <div
                className="relative bg-white rounded-lg shadow-md w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 transition-all transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* ── MODAL HEADER ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FaCloudUploadAlt className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-tight">
                                {queue.length === 0 ? "Secure Document Upload" : "Uploading Files"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <FaShieldAlt className="text-blue-600 text-[11px]" />
                                AES-256 encrypted • Vault & Original replication
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {queue.length > 0 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <FaPlus className="text-[10px]" /> Add Files
                            </button>
                        )}
                        {queue.length > 0 && hasActiveUploads && (
                            <button
                                onClick={handleCancelAll}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Cancel All
                            </button>
                        )}
                        <button
                            onClick={handleCloseModal}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            title="Close"
                        >
                            <FaTimes className="text-sm" />
                        </button>
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* ── MODAL CONTENT BODY ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ── 1. INITIAL DROPZONE UPLOAD CARD (ONLY SHOWN WHEN QUEUE IS EMPTY) ── */}
                    {queue.length === 0 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${isDragOver
                                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                                    : 'border-slate-300 bg-slate-50/60 hover:bg-blue-50/20 hover:border-blue-400'
                                }`}
                        >
                            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 text-2xl flex items-center justify-center">
                                <FaCloudUploadAlt />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-800 hover:text-blue-600">
                                    Click to browse files or drag & drop here
                                </span>
                                <p className="text-xs text-slate-400 mt-1">
                                    Supports PDF, Office docs, images, archives and raw data (unlimited batch size)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── 2. QUEUE PROGRESS & SUMMARY SECTION (SHOWN WHEN FILES ARE IN QUEUE) ── */}
                    {queue.length > 0 && (
                        <div className="space-y-4">
                            {/* Summary Card Header */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Progress</span>
                                            <span className="text-sm font-extrabold text-blue-600">{overallPercentage}%</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {formatFileSize(loadedBytesTotal)} of {formatFileSize(totalBytes)} transferred
                                        </p>
                                    </div>

                                    {/* Counters Badges (All clean Blue/Slate themed) */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                                        <span className="px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-md">
                                            {totalFiles} Selected
                                        </span>
                                        {completedFiles > 0 && (
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center gap-1">
                                                <FaCheckCircle className="text-blue-600 text-[10px]" /> {completedFiles} Completed
                                            </span>
                                        )}
                                        {uploadingFiles > 0 && (
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center gap-1 animate-pulse">
                                                <FaSpinner className="animate-spin text-blue-600 text-[10px]" /> {uploadingFiles} Uploading
                                            </span>
                                        )}
                                        {waitingFiles > 0 && (
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                                                {waitingFiles} Waiting
                                            </span>
                                        )}
                                        {failedFiles > 0 && (
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md flex items-center gap-1">
                                                <FaExclamationCircle className="text-blue-600 text-[10px]" /> {failedFiles} Failed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Main Overall Progress Bar (Blue theme) */}
                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${overallPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Failed items bulk retry bar if any */}
                            {failedFiles > 0 && (
                                <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-slate-100 rounded-xl text-xs text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FaExclamationCircle className="text-blue-600 text-sm" />
                                        <span>{failedFiles} file(s) encountered an issue. Other files uploaded normally.</span>
                                    </div>
                                    <button
                                        onClick={handleRetryAllFailed}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        <FaRedo className="text-[10px]" /> Retry Failed
                                    </button>
                                </div>
                            )}

                            {/* ── 3. INDIVIDUAL FILE QUEUE LIST ── */}
                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                {queue.map((item) => {
                                    const isUploading = item.status === 'uploading';
                                    const isCompleted = item.status === 'completed';
                                    const isFailed = item.status === 'failed';
                                    const isCancelled = item.status === 'cancelled';
                                    const isWaiting = item.status === 'waiting';

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-3.5 rounded-xl border border-slate-100 bg-white transition-all hover:bg-slate-50/40"
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                {/* Left: Icon, Name, Size */}
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    {getFileIcon(item.name)}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                                                            {item.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                                            <span>{item.sizeFormatted}</span>
                                                            {isUploading && item.speedFormatted && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-blue-600 font-semibold">{item.speedFormatted}</span>
                                                                </>
                                                            )}
                                                            {isUploading && item.etaFormatted && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{item.etaFormatted}</span>
                                                                </>
                                                            )}
                                                            {isFailed && item.error && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-blue-700 font-semibold truncate">{item.error}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Status Pill & Actions (Unified Blue styling) */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {isCompleted && (
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md flex items-center gap-1">
                                                            <FaCheckCircle className="text-blue-600 text-[10px]" /> Completed
                                                        </span>
                                                    )}
                                                    {isUploading && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md flex items-center gap-1">
                                                            <FaSpinner className="animate-spin text-blue-600 text-[10px]" /> {item.progress}%
                                                        </span>
                                                    )}
                                                    {isWaiting && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md">
                                                            Waiting
                                                        </span>
                                                    )}
                                                    {isFailed && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md flex items-center gap-1">
                                                                <FaExclamationCircle className="text-blue-600 text-[10px]" /> Failed
                                                            </span>
                                                            <button
                                                                onClick={() => handleRetryItem(item.id)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                                title="Retry"
                                                            >
                                                                <FaRedo className="text-xs" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {isCancelled && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] font-semibold rounded-md">
                                                                Cancelled
                                                            </span>
                                                            <button
                                                                onClick={() => handleRetryItem(item.id)}
                                                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                                title="Retry"
                                                            >
                                                                <FaRedo className="text-xs" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Cancel Button (Visible when waiting or uploading) */}
                                                    {(isWaiting || isUploading) && (
                                                        <button
                                                            onClick={() => handleCancelItem(item.id)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                            title="Cancel upload"
                                                        >
                                                            <FaTimes className="text-xs" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Conflict Resolution UI */}
                                            {item.status === 'conflict' && (
                                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-xs font-semibold text-yellow-800 mb-2">
                                                        A document with this name already exists in this folder.
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Version Comment (optional, e.g., 'Updated financial data')"
                                                            value={item.uploadComment || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, uploadComment: val } : q));
                                                            }}
                                                            className="w-full px-3 py-1.5 text-xs border border-yellow-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        />
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button
                                                                onClick={() => {
                                                                    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'waiting', isNewVersion: true } : q));
                                                                }}
                                                                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-md transition-colors"
                                                            >
                                                                Upload as New Version
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'waiting', isNewVersion: false, conflictDocId: null } : q));
                                                                }}
                                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-md transition-colors"
                                                            >
                                                                Upload as New Document
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelItem(item.id)}
                                                                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Item Progress Bar (Clean Blue) */}
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-200 ${isCancelled ? 'bg-slate-300' : 'bg-blue-600'
                                                        }`}
                                                    style={{ width: `${isCompleted ? 100 : item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── MODAL FOOTER ── */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        {isAllDone && completedFiles > 0 ? (
                            <span className="text-blue-700 font-bold flex items-center gap-1.5">
                                <FaCheckCircle className="text-blue-600" /> All uploads finished successfully
                            </span>
                        ) : hasActiveUploads ? (
                            <span className="text-slate-600 font-medium">
                                Uploading in background • Do not refresh the page
                            </span>
                        ) : (
                            <span>{queue.length} items in queue</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={handleCloseModal}
                            className="px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isAllDone ? "Done" : "Close"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
