"use client";

import React, { useEffect, useState } from 'react';
import { fetchGroupsAnalytics, fetchUserGroupsByGroupIdsAnalytics, fetchLoginHistoryForCompanyAnalytics, fetchUsersByIdsAnalytics } from '../actions';
import { X, List, BarChart2 } from "lucide-react";

export default function GroupUsersPage() {
    const [rawGroups, setRawGroups] = useState([]);
    const [rawUserGroups, setRawUserGroups] = useState([]);
    const [rawLoginHistory, setRawLoginHistory] = useState([]);
    const [processedGroups, setProcessedGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic states
    const [sortOrder, setSortOrder] = useState('asc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [userLoginList, setUserLoginList] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
    const [modalView, setModalView] = useState('table'); // 'table', 'chart'

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

                // Fetch groups
                const { data: groupsData, error: groupsError } = await fetchGroupsAnalytics(companyId);
                
                if (groupsError) throw groupsError;

                const groupIds = (groupsData || []).map(g => g.id);
                setRawGroups(groupsData || []);

                // Fetch user_groups
                if (groupIds.length > 0) {
                    const { data: userGroupsData, error: ugError } = await fetchUserGroupsByGroupIdsAnalytics(groupIds);
                    if (ugError) throw ugError;
                    setRawUserGroups(userGroupsData || []);
                }

                // Fetch login history
                const { data: loginHistoryData, error: lhError } = await fetchLoginHistoryForCompanyAnalytics(companyId);
                
                if (lhError) throw lhError;
                setRawLoginHistory(loginHistoryData || []);

            } catch (err) {
                console.error("Failed to load group users data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // 2. Process Data (Filter by Date, Calculate Count, Sort)
    useEffect(() => {
        let history = rawLoginHistory;

        // Apply Date Filters
        if (startDate) {
            const start = new Date(startDate).getTime();
            history = history.filter(h => new Date(h.created_at).getTime() >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            history = history.filter(h => new Date(h.created_at).getTime() <= end.getTime());
        }

        // Map and Calculate Counts
        let mapped = rawGroups.map(group => {
            const groupUsers = rawUserGroups
                .filter(ug => ug.group_id === group.id)
                .map(ug => ug.user_id);
            
            const loginCount = history
                .filter(log => groupUsers.includes(log.user_id))
                .length;

            return { id: group.id, name: group.name, loginCount };
        });

        // Sort
        if (sortOrder === 'asc') {
            mapped.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            mapped.sort((a, b) => b.name.localeCompare(a.name));
        }

        setProcessedGroups(mapped);
        setCurrentPage(1); // Reset to page 1 on filter/sort changes
    }, [rawGroups, rawUserGroups, rawLoginHistory, startDate, endDate, sortOrder]);

    // 3. Pagination Logic
    const totalItems = processedGroups.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentDisplayedGroups = processedGroups.slice(startIndex, endIndex);

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    // 4. Export Logic
    const handleExport = () => {
        const csvHeader = "Group Name,Login Count\n";
        const csvBody = processedGroups.map(g => `"${g.name}",${g.loginCount}`).join('\n');
        const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'group_users_analytics.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // 5. Open Modal Logic
    const handleOpenLoginModal = async (group) => {
        if (group.loginCount === 0) return; // Optional: maybe we still open to show empty, but it's empty anyway
        setSelectedGroup(group);
        setShowLoginModal(true);
        setLoadingModal(true);
        setUserLoginList([]);
        setModalView('table');

        try {
            // Apply Date Filters to rawLoginHistory
            let history = rawLoginHistory;
            if (startDate) {
                const start = new Date(startDate).getTime();
                history = history.filter(h => new Date(h.created_at).getTime() >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                history = history.filter(h => new Date(h.created_at).getTime() <= end.getTime());
            }

            // Get user IDs for this group
            const groupUserIds = rawUserGroups
                .filter(ug => ug.group_id === group.id)
                .map(ug => ug.user_id);

            if (groupUserIds.length === 0) {
                setLoadingModal(false);
                return;
            }

            // Fetch user details
            const { data: usersData, error: usersError } = await fetchUsersByIdsAnalytics(groupUserIds);

            if (usersError) throw usersError;

            const userMap = {};
            (usersData || []).forEach(u => { userMap[u.id] = u; });

            // Calculate counts and last login per user
            const userCountMap = {};
            const lastLoginMap = {};

            history.forEach(log => {
                if (groupUserIds.includes(log.user_id)) {
                    userCountMap[log.user_id] = (userCountMap[log.user_id] || 0) + 1;
                    if (!lastLoginMap[log.user_id] || new Date(log.created_at) > new Date(lastLoginMap[log.user_id])) {
                        lastLoginMap[log.user_id] = log.created_at;
                    }
                }
            });

            const loginList = Object.entries(userCountMap)
                .map(([uid, count]) => ({
                    ...(userMap[uid] || { name: "Unknown", email: "" }),
                    count,
                    lastLogin: lastLoginMap[uid] || null,
                }))
                .sort((a, b) => b.count - a.count); // sort by count descending

            setUserLoginList(loginList);
        } catch (err) {
            console.error("Failed to load login details:", err);
        } finally {
            setLoadingModal(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 bg-white min-h-full font-sans w-full max-w-full overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Groups & Users</h1>
                <button 
                    onClick={handleExport}
                    className="flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 border border-orange-300 rounded text-xs font-semibold text-gray-700 hover:bg-orange-50 transition-colors"
                >
                    EXPORT
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    </svg>
                </button>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="hidden sm:block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 shrink-0">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium">Start Date</span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-b border-gray-300 pb-1 text-sm text-gray-700 outline-none focus:border-[var(--brand)] bg-transparent"
                        />
                    </div>
                    <span className="text-gray-400 text-sm mt-3">-</span>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium">End Date</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border-b border-gray-300 pb-1 text-sm text-gray-700 outline-none focus:border-[var(--brand)] bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="w-full text-sm">
                {/* Table Header */}
                <div className="grid grid-cols-2 px-4 py-3 text-gray-700 font-semibold border-b border-gray-100">
                    <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-gray-900 select-none"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title="Click to sort"
                    >
                        Group Name
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                            className={`text-gray-400 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                        >
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                        </svg>
                    </div>
                    <div>Login Count</div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col relative min-h-[150px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--brand)] rounded-full animate-spin"></div>
                        </div>
                    ) : currentDisplayedGroups.length > 0 ? (
                        currentDisplayedGroups.map((group, index) => (
                            <div 
                                key={group.id} 
                                className={`grid grid-cols-2 px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
                            >
                                <div className="text-gray-500">{group.name}</div>
                                <div 
                                    className="text-blue-600 underline cursor-pointer hover:text-blue-800 font-medium"
                                    onClick={() => handleOpenLoginModal(group)}
                                >
                                    {group.loginCount}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            No groups found for the selected filters.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 sm:gap-6 py-4 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Items per page:</span>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border-b border-gray-300 pb-0.5 text-gray-500 outline-none bg-transparent cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    
                    <div className="text-gray-500">
                        {totalItems > 0 ? `${startIndex + 1}-${endIndex} of ${totalItems}` : '0 of 0'}
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || totalItems === 0}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalItems === 0}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Login Detail Modal ── */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-md w-[95%] sm:w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUp 0.2s ease" }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-[15px] font-bold text-gray-900">Logins</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    {selectedGroup?.name} &middot; {selectedGroup?.loginCount} total logins &middot; {userLoginList.length} users
                                </p>
                            </div>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="px-6 pt-6">
                            {/* Toggle Group */}
                            <div className="flex bg-gray-100/80 rounded-md p-1 w-fit border border-gray-200/50 shadow-inner">
                                <button 
                                    className={`px-3 py-1.5 rounded-sm flex items-center justify-center transition-all ${modalView === 'table' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalView('table')}
                                >
                                    <List size={16} />
                                </button>
                                <button 
                                    className={`px-3 py-1.5 rounded-sm flex items-center justify-center transition-all ${modalView === 'chart' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalView('chart')}
                                >
                                    <BarChart2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-auto flex-1 relative min-h-[350px]">
                            {loadingModal ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-[var(--brand)] rounded-full animate-spin"></div>
                                </div>
                            ) : userLoginList.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[13px] text-gray-400">No login data found for this group</p>
                            ) : modalView === 'table' ? (
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                                            <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {userLoginList.map((u, i) => (
                                            <tr key={i} className="hover:bg-rose-50/30 transition-colors">
                                                <td className="px-5 py-3 text-[12px] text-gray-400">{i + 1}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                                            {(u.name || u.email || "?")[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-medium text-gray-800 leading-tight">{u.name || "Unknown"}</p>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{u.email || ""}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                                                    {u.lastLogin
                                                        ? new Date(u.lastLogin).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                                                        : "—"}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="inline-flex items-center justify-center min-w-[30px] h-6 px-2.5 bg-rose-50 text-rose-600 text-[12px] font-bold rounded-full">
                                                        {u.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                (() => {
                                    const maxCount = Math.max(...userLoginList.map(d => d.count), 1);
                                    let tickStep = Math.ceil(maxCount / 5);
                                    if (tickStep === 0) tickStep = 1;
                                    const yTicks = Array.from({length: Math.ceil(maxCount / tickStep) + 1}, (_, i) => i * tickStep);
                                    const chartMax = yTicks[yTicks.length - 1] || 1;

                                    return (
                                        <div className="w-full h-[350px] flex flex-col pt-4 px-6 pb-6">
                                            <div className="flex justify-center items-center gap-2 mb-8 text-xs text-gray-500">
                                                <div className="w-8 h-3 bg-rose-400 opacity-80 rounded-[1px]"></div>
                                                <span>Total Logins</span>
                                            </div>
                                            <div className="flex-1 flex w-full relative pl-8">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] text-gray-500 tracking-wider">
                                                    Logins
                                                </div>
                                                
                                                <div className="flex flex-col justify-between text-[11px] text-gray-400 w-8 items-end pr-3 pb-8 h-full z-10 bg-white absolute left-6 top-0 bottom-0">
                                                    {yTicks.slice().reverse().map(tick => (
                                                        <span key={tick} className="leading-none transform translate-y-[5px]">{tick}</span>
                                                    ))}
                                                </div>

                                                <div className="flex-1 relative h-full flex flex-col ml-14 border-l border-gray-200 overflow-x-auto scrollbar-hide">
                                                    <div className="min-w-max h-full relative flex flex-col px-4">
                                                        {/* Background lines */}
                                                        <div className="absolute inset-0 pb-8 flex flex-col justify-between z-0 w-full pointer-events-none">
                                                            {yTicks.map((_, i) => (
                                                                <div key={i} className="w-full h-[1px] border-b border-dashed border-gray-200"></div>
                                                            ))}
                                                        </div>

                                                        {/* Bars */}
                                                        <div className="flex-1 pb-8 flex items-end justify-start gap-6 z-10">
                                                            {userLoginList.map((d, i) => (
                                                                <div key={i} className="flex flex-col items-center group relative h-full justify-end w-16 shrink-0">
                                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-[11px] px-2 py-1 rounded transition-opacity whitespace-nowrap pointer-events-none z-20">
                                                                        {d.name}: {d.count}
                                                                    </div>
                                                                    <div 
                                                                        className="w-10 bg-rose-400/90 transition-all duration-500 ease-out hover:bg-rose-500 hover:scale-x-105 cursor-pointer rounded-t-[1px]" 
                                                                        style={{ height: `${(d.count / chartMax) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Bottom Labels */}
                                                        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-start gap-6 border-t border-gray-200 bg-white z-20 px-4">
                                                            {userLoginList.map((d, i) => (
                                                                <div key={i} className="text-[11px] text-gray-500 truncate w-16 text-center shrink-0" title={d.name}>
                                                                    {d.name.split(' ')[0]}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center mt-3 text-sm text-gray-500 font-medium">Users</div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Sorted by highest login count</span>
                            <span className="text-[11px] font-semibold text-rose-500">{selectedGroup?.loginCount || 0} total logins</span>
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
