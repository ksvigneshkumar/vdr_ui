"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
    LogIn, Download, Eye, FileSearch, MessageCircleQuestion,
    RefreshCw, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X
} from "lucide-react";
import { fetchGroupsAnalytics, fetchUserGroupsByGroupIdAnalytics, fetchUsersByIdsAnalytics, fetchLoginHistoryFilteredAnalytics, fetchDocumentEditLogsFilteredAnalytics, fetchDocumentsByIdsAnalytics, fetchDocumentAccessLogsFilteredAnalytics, fetchQnaMessagesAnalytics, fetchQnaThreadsAnalytics } from '../actions';

// ─── All 5 series from the screenshot ─────────────────────────────────────────
const SERIES = [
    { key: "logins", label: "Total Login Occurrences", color: "#f87171" },
    { key: "questions", label: "Total Questions Asked", color: "#60a5fa" },
    // { key: "fenceViews", label: "Total Fence Document Views", color: "#fbbf24" },
    { key: "docViews", label: "Total Document Views", color: "#5eead4" },
    { key: "downloads", label: "Total Document Downloads", color: "#34d399" },
];

// ─── Custom Calendar Range Picker ──────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function CalendarRangePicker({ value, onApply, onClear }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [rangeStart, setRangeStart] = useState(null); // Date object
    const [rangeEnd, setRangeEnd] = useState(null); // Date object
    const [hoverDate, setHoverDate] = useState(null);
    const [open, setOpen] = useState(false);

    const fmt = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";
    const fmtDisplay = (d) => d ? `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : "";

    // Build calendar days for current view
    const calDays = useMemo(() => {
        const first = new Date(viewYear, viewMonth, 1);
        const last = new Date(viewYear, viewMonth + 1, 0);
        const days = [];
        for (let i = 0; i < first.getDay(); i++) days.push(null);
        for (let d = 1; d <= last.getDate(); d++) days.push(new Date(viewYear, viewMonth, d));
        return days;
    }, [viewYear, viewMonth]);

    const handleDayClick = (day) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(day); setRangeEnd(null);
        } else {
            if (day < rangeStart) { setRangeStart(day); setRangeEnd(null); }
            else { setRangeEnd(day); }
        }
    };

    const isInRange = (day) => {
        if (!day) return false;
        const end = rangeEnd || hoverDate;
        if (rangeStart && end) {
            const lo = rangeStart < end ? rangeStart : end;
            const hi = rangeStart < end ? end : rangeStart;
            return day > lo && day < hi;
        }
        return false;
    };
    const isStart = (day) => day && rangeStart && fmt(day) === fmt(rangeStart);
    const isEnd = (day) => day && (rangeEnd || hoverDate) && fmt(day) === fmt(rangeEnd || hoverDate);
    const isToday = (day) => day && fmt(day) === fmt(today);

    const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

    const handleApply = () => {
        if (rangeStart) {
            const end = rangeEnd || rangeStart; // single date → same day
            onApply(fmt(rangeStart), fmt(end));
            setOpen(false);
        }
    };
    const handleClear = () => { setRangeStart(null); setRangeEnd(null); onClear(); setOpen(false); };

    const label = value || "Date range";

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-[13px] font-medium shadow-sm transition-all ${value ? "border-rose-300 text-rose-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
            >
                <CalendarDays size={14} className={value ? "text-rose-400" : "text-gray-400"} />
                <span>{label}</span>
                {value && (
                    <span role="button" onClick={e => { e.stopPropagation(); handleClear(); }} className="ml-1 text-rose-400 hover:text-rose-600">
                        <X size={12} />
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute top-full mt-2 left-0 sm:left-auto z-40 bg-white border border-gray-200 rounded-lg shadow-md p-4 select-none max-w-[calc(100vw-32px)] overflow-x-auto sm:max-w-none"
                    style={{ minWidth: "min(300px, calc(100vw - 32px))" }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-[13px] font-bold text-gray-800">{MONTHS[viewMonth]} {viewYear}</span>
                        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {calDays.map((day, i) => {
                            if (!day) return <div key={`e${i}`} />;
                            const start = isStart(day);
                            const end = isEnd(day);
                            const inRng = isInRange(day);
                            const todayD = isToday(day);
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    onMouseEnter={() => rangeStart && !rangeEnd && setHoverDate(day)}
                                    onMouseLeave={() => setHoverDate(null)}
                                    className={`relative h-8 w-full text-[12px] font-medium transition-colors
                                        ${start || end
                                            ? "bg-rose-500 text-white rounded-lg z-10"
                                            : inRng
                                                ? "bg-rose-50 text-rose-700 rounded-none"
                                                : todayD
                                                    ? "text-rose-500 font-bold rounded-lg hover:bg-gray-100"
                                                    : "text-gray-700 rounded-lg hover:bg-gray-100"
                                        }
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected range display */}
                    <div className="mt-3 px-1 text-[11px] text-gray-500 min-h-[18px]">
                        {rangeStart && !rangeEnd && <span>Start: <b>{fmtDisplay(rangeStart)}</b> — pick end date</span>}
                        {rangeStart && rangeEnd && <span><b>{fmtDisplay(rangeStart)}</b> → <b>{fmtDisplay(rangeEnd)}</b></span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button onClick={handleClear} className="flex-1 py-1.5 text-[12px] font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Clear
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!rangeStart}
                            className="flex-1 py-1.5 text-[12px] font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── SVG Line Chart with hover tooltip ────────────────────────────────────────
function LineChart({ data, groupName }) {
    const W = 900, H = 260, PL = 48, PR = 16, PT = 16, PB = 40;
    const chartW = W - PL - PR;
    const chartH = H - PT - PB;
    const svgRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);

    // max across ALL series
    const maxVal = useMemo(() => {
        let m = 1;
        data.forEach(d => SERIES.forEach(s => { if ((d[s.key] || 0) > m) m = d[s.key]; }));
        return Math.ceil(m / 5) * 5 || 10;
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No data found for the selected period
            </div>
        );
    }

    const xStep = chartW / Math.max(data.length - 1, 1);

    // Smooth cubic bezier path for a given series key
    const getPath = (key) => {
        if (data.length === 0) return "";
        const pts = data.map((d, i) => ({
            x: PL + i * xStep,
            y: PT + chartH - ((d[key] || 0) / maxVal) * chartH,
        }));
        let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const cpX = ((prev.x + curr.x) / 2).toFixed(1);
            path += ` C ${cpX} ${prev.y.toFixed(1)}, ${cpX} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
        }
        return path;
    };

    const yTicks = [];
    const step = Math.ceil(maxVal / 5);
    for (let v = 0; v <= maxVal; v += step) yTicks.push(v);

    // Find nearest data point on mouse move
    const handleMouseMove = (e) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleX = W / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const chartMouseX = mouseX - PL;
        const idx = Math.round(chartMouseX / xStep);
        if (idx < 0 || idx >= data.length) return;

        const point = data[idx];
        const svgX = PL + idx * xStep;
        const svgY = PT + chartH - (point.logins / maxVal) * chartH;

        // Convert SVG coords to screen coords for tooltip positioning
        const screenX = rect.left + (svgX / W) * rect.width;
        const screenY = rect.top + (svgY / H) * rect.height;

        setTooltip({ screenX, screenY, point });
    };

    const handleMouseLeave = () => setTooltip(null);

    return (
        <div className="relative">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto cursor-crosshair max-h-[300px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Grid lines */}
                {yTicks.map(v => {
                    const y = PT + chartH - (v / maxVal) * chartH;
                    return (
                        <g key={v}>
                            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
                        </g>
                    );
                })}

                {/* Y-axis label */}
                <text x={12} y={PT + chartH / 2} textAnchor="middle" fontSize="10" fill="#94a3b8"
                    transform={`rotate(-90, 12, ${PT + chartH / 2})`}>
                    Occurrences
                </text>

                {/* X-axis date labels */}
                {data.map((d, i) => {
                    const showEvery = Math.ceil(data.length / 8);
                    if (i % showEvery !== 0 && i !== data.length - 1) return null;
                    const x = PL + i * xStep;
                    return (
                        <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
                            {d.date.slice(5)}
                        </text>
                    );
                })}

                {/* Area fill for logins */}
                <path
                    d={`${getPath("logins")} L ${(PL + (data.length - 1) * xStep).toFixed(1)} ${PT + chartH} L ${PL} ${PT + chartH} Z`}
                    fill="#f87171"
                    opacity="0.06"
                />

                {/* Area fill for downloads */}
                <path
                    d={`${getPath("downloads")} L ${(PL + (data.length - 1) * xStep).toFixed(1)} ${PT + chartH} L ${PL} ${PT + chartH} Z`}
                    fill="#34d399"
                    opacity="0.06"
                />

                {/* All series lines */}
                {SERIES.map(s => (
                    <path
                        key={s.key}
                        d={getPath(s.key)}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.9"
                    />
                ))}

                {/* Dots for active (non-zero) data points on logins */}
                {data.map((d, i) => {
                    if (!d.logins) return null;
                    const x = PL + i * xStep;
                    const y = PT + chartH - (d.logins / maxVal) * chartH;
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="#f87171" opacity="0.9" />;
                })}

                {/* Dots for active (non-zero) data points on downloads */}
                {data.map((d, i) => {
                    if (!d.downloads) return null;
                    const x = PL + i * xStep;
                    const y = PT + chartH - (d.downloads / maxVal) * chartH;
                    return <circle key={`dl_${i}`} cx={x} cy={y} r="2.5" fill="#34d399" opacity="0.9" />;
                })}

                {/* Hover vertical line */}
                {tooltip && (() => {
                    const svg = svgRef.current;
                    if (!svg) return null;
                    const rect = svg.getBoundingClientRect();
                    const scaleX = W / rect.width;
                    const idx = data.findIndex(d => d === tooltip.point);
                    if (idx < 0) return null;
                    const x = PL + idx * xStep;
                    return (
                        <line
                            x1={x} x2={x} y1={PT} y2={PT + chartH}
                            stroke="#f87171" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"
                        />
                    );
                })()}
            </svg>

            {/* Floating Tooltip Card */}
            {tooltip && tooltip.point.logins > 0 && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{ 
                        left: typeof window !== 'undefined' ? Math.min(tooltip.screenX + 14, window.innerWidth - 260) : tooltip.screenX + 14, 
                        top: tooltip.screenY - 10 
                    }}
                >
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 min-w-[180px] max-w-[240px]">
                        {/* Date header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                            <span className="text-[11px] font-bold text-gray-700">{tooltip.point.date}</span>
                            <span className="text-[11px] font-bold text-rose-500">
                                {tooltip.point.logins} login{tooltip.point.logins > 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Group name */}
                        {groupName && (
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] inline-block" />
                                <span className="text-[11px] text-gray-500 font-medium">{groupName}</span>
                            </div>
                        )}

                        {/* Users who logged in */}
                        <div className="flex flex-col gap-1">
                            {(tooltip.point.users || []).slice(0, 5).map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
                                        {(u.name || u.email || "?")[0]}
                                    </div>
                                    <span className="text-[11px] text-gray-700 truncate">{u.name || u.email || "Unknown"}</span>
                                </div>
                            ))}
                            {(tooltip.point.users || []).length > 5 && (
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                    +{tooltip.point.users.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function GroupInsightsPage() {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [showGroupDrop, setShowGroupDrop] = useState(false);

    const [chartData, setChartData] = useState([]);
    const [totalLogins, setTotalLogins] = useState(0);
    const [userLoginList, setUserLoginList] = useState([]);  // per-user: name, lastLogin, count
    const [loadingChart, setLoadingChart] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [totalDownloads, setTotalDownloads] = useState(0);
    const [downloadList, setDownloadList] = useState([]);  // per-user+doc: name, documentName, count
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    const [totalQuestions, setTotalQuestions] = useState(0);
    const [questionList, setQuestionList] = useState([]);  // per-user+doc: name, documentName, count
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);

    const [totalDocViews, setTotalDocViews] = useState(0);
    const [docViewList, setDocViewList] = useState([]);   // per-user+doc: name, documentName, count
    const [showViewsModal, setShowViewsModal] = useState(false);

    const [dateRange, setDateRange] = useState("");
    const [compDays, setCompDays] = useState("comparision days");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerStart, setPickerStart] = useState("");
    const [pickerEnd, setPickerEnd] = useState("");

    // ── Fetch groups ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoadingGroups(true);
                const rawSession = localStorage.getItem("vdr_session");
                if (!rawSession) return;
                const session = JSON.parse(rawSession);

                const { data: groupsData, error } = await fetchGroupsAnalytics(session.company_id);

                if (error) throw error;
                setGroups(groupsData || []);
                if (groupsData && groupsData.length > 0) setSelectedGroup(groupsData[0]);
            } catch (err) {
                console.error("Error fetching groups:", err);
            } finally {
                setLoadingGroups(false);
            }
        };
        fetchGroups();
    }, []);

    // ── Fetch login data for selected group ──────────────────────────────────────
    const fetchLoginData = useCallback(async (group, dateFrom = null, dateTo = null) => {
        if (!group) return;
        try {
            setLoadingChart(true);
            const rawSession = localStorage.getItem("vdr_session");
            if (!rawSession) return;
            const session = JSON.parse(rawSession);

            // Step 1: Get user_ids in this group
            const { data: userGroupsData, error: ugError } = await fetchUserGroupsByGroupIdAnalytics(group.id);
            if (ugError) throw ugError;

            const userIds = (userGroupsData || []).map(ug => ug.user_id);
            if (userIds.length === 0) { setChartData([]); setTotalLogins(0); return; }

            // Step 2: Fetch user names for those user_ids
            const { data: usersData, error: usersError } = await fetchUsersByIdsAnalytics(userIds);
            if (usersError) throw usersError;

            // Build userId → user info map
            const userMap = {};
            (usersData || []).forEach(u => { userMap[u.id] = u; });

            // Step 3: Fetch login_history with date range filter
            const { data: loginData, error: lhError } = await fetchLoginHistoryFilteredAnalytics(userIds, dateFrom, dateTo);
            if (lhError) throw lhError;

            // ── Download logs for this group's users ──────────────────────────
            const { data: dlData } = await fetchDocumentEditLogsFilteredAnalytics(userIds, ["DOWNLOAD_PDF", "DOWNLOAD_SECURE", "DOWNLOAD_ORIGINAL", "DOWNLOAD"], dateFrom, dateTo);

            // Fetch document names for downloaded docs
            const downloadedDocIds = [...new Set((dlData || []).map(d => d.document_id).filter(Boolean))];
            let docNameMap = {};
            if (downloadedDocIds.length > 0) {
                const { data: docsData } = await fetchDocumentsByIdsAnalytics(downloadedDocIds);
                (docsData || []).forEach(doc => { docNameMap[doc.id] = doc.name; });
            }

            // Group by user_id + document_id combination
            const dlMap = {};
            (dlData || []).forEach(log => {
                const key = `${log.user_id}_${log.document_id}`;
                if (!dlMap[key]) {
                    dlMap[key] = {
                        ...(userMap[log.user_id] || { name: "Unknown", email: "" }),
                        documentName: docNameMap[log.document_id] || "Unknown Document",
                        count: 0,
                    };
                }
                dlMap[key].count += 1;
            });

            const dlList = Object.values(dlMap).sort((a, b) => b.count - a.count);

            // Build downloads-per-date map for chart
            const downloadsDateMap = {};
            (dlData || []).forEach(log => {
                const date = log.changed_at ? new Date(log.changed_at).toISOString().slice(0, 10) : "";
                if (date) downloadsDateMap[date] = (downloadsDateMap[date] || 0) + 1;
            });
            // ─────────────────────────────────────────────────────────────────

            // ── Document Access Logs (Views) — group members only ─────────────
            const { data: viewData } = await fetchDocumentAccessLogsFilteredAnalytics(userIds, dateFrom, dateTo);

            // Fetch document names for viewed docs
            const viewedDocIds = [...new Set((viewData || []).map(v => v.document_id).filter(Boolean))];
            const viewDocNameMap = {};
            if (viewedDocIds.length > 0) {
                const { data: viewDocsData } = await fetchDocumentsByIdsAnalytics(viewedDocIds);
                (viewDocsData || []).forEach(doc => { viewDocNameMap[doc.id] = doc.name; });
            }

            // Fetch user details fresh for all viewers (exactly like downloads)
            const viewerUserIds = [...new Set((viewData || []).map(v => v.user_id).filter(Boolean))];
            const viewUserMap = {};
            if (viewerUserIds.length > 0) {
                const { data: viewUsersData } = await fetchUsersByIdsAnalytics(viewerUserIds);
                (viewUsersData || []).forEach(u => { viewUserMap[u.id] = u; });
            }

            // Group by user_id + document_id combination (exactly like downloads)
            const viewMap = {};
            (viewData || []).forEach(log => {
                const key = `${log.user_id}_${log.document_id}`;
                if (!viewMap[key]) {
                    viewMap[key] = {
                        ...(viewUserMap[log.user_id] || { name: "Unknown", email: "" }),
                        documentName: viewDocNameMap[log.document_id] || "Unknown Document",
                        count: 0,
                    };
                }
                viewMap[key].count += 1;
            });

            const viewList = Object.values(viewMap).sort((a, b) => b.count - a.count);

            // Build views-per-date map for chart
            const viewsDateMap = {};
            (viewData || []).forEach(log => {
                const date = log.opened_at ? new Date(log.opened_at).toISOString().slice(0, 10) : "";
                if (date) viewsDateMap[date] = (viewsDateMap[date] || 0) + 1;
            });
            // ─────────────────────────────────────────────────────────────────

            // ── QnA Messages for this group's users ──────────────────────────
            // sender is a name string in qna_messages, so match by user name
            const userNames = Object.values(userMap).map(u => u.name).filter(Boolean);

            let qnaList = [];
            let qnaTotalCount = 0;
            const qnaDateMap = {};

            if (userNames.length > 0) {
                const { data: qnaData } = await fetchQnaMessagesAnalytics(userNames, dateFrom, dateTo);
                qnaTotalCount = (qnaData || []).length;

                // Get unique thread_ids to fetch document names
                const threadIds = [...new Set((qnaData || []).map(m => m.thread_id).filter(Boolean))];
                const threadDocMap = {};
                if (threadIds.length > 0) {
                    const { data: threadsData } = await fetchQnaThreadsAnalytics(threadIds);
                    (threadsData || []).forEach(t => {
                        threadDocMap[t.id] = t.documents?.name || "General / Folder";
                    });
                }

                // Group by sender + document (like Downloads: user + document + count)
                const qnaGroupMap = {};
                (qnaData || []).forEach(msg => {
                    const docName = threadDocMap[msg.thread_id] || "General";
                    const key = `${msg.sender}__${docName}`;
                    if (!qnaGroupMap[key]) {
                        qnaGroupMap[key] = {
                            name: msg.sender,
                            documentName: docName,
                            count: 0,
                            lastAsked: null,
                        };
                    }
                    qnaGroupMap[key].count += 1;
                    if (!qnaGroupMap[key].lastAsked || msg.created_at > qnaGroupMap[key].lastAsked) {
                        qnaGroupMap[key].lastAsked = msg.created_at;
                    }
                    // per-date count for chart
                    const date = msg.created_at ? new Date(msg.created_at).toISOString().slice(0, 10) : "";
                    if (date) qnaDateMap[date] = (qnaDateMap[date] || 0) + 1;
                });

                qnaList = Object.values(qnaGroupMap).sort((a, b) => b.count - a.count);
            }
            // ─────────────────────────────────────────────────────────────────

            // Step 4: Group by date + per-user count & last-login
            const dateMap = {};
            const userCountMap = {};   // user_id → total login count
            const lastLoginMap = {};   // user_id → latest created_at string
            (loginData || []).forEach(log => {
                const date = log.created_at ? new Date(log.created_at).toISOString().slice(0, 10) : "";
                if (!dateMap[date]) dateMap[date] = { count: 0, userSet: new Set() };
                dateMap[date].count += 1;
                dateMap[date].userSet.add(log.user_id);
                userCountMap[log.user_id] = (userCountMap[log.user_id] || 0) + 1;
                // keep the latest created_at per user (data is ordered asc, so last wins)
                lastLoginMap[log.user_id] = log.created_at;
            });

            // Step 5: Build chart array for date range (or last 60 days default)
            const chartEnd = dateTo ? new Date(dateTo) : new Date();
            const chartStart = dateFrom ? new Date(dateFrom) : (() => { const d = new Date(); d.setDate(d.getDate() - 59); return d; })();

            const result = [];
            for (let d = new Date(chartStart); d <= chartEnd; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().slice(0, 10);
                const dayData = dateMap[dateStr];
                const users = dayData
                    ? Array.from(dayData.userSet).map(uid => userMap[uid] || { name: "Unknown", email: "" })
                    : [];
                result.push({
                    date: dateStr,
                    logins: dayData ? dayData.count : 0,
                    users,
                    downloads: downloadsDateMap[dateStr] || 0,
                    questions: qnaDateMap[dateStr] || 0,
                    docViews: viewsDateMap[dateStr] || 0,
                });
            }

            // Step 6: Build sorted per-user login list
            const loginList = Object.entries(userCountMap)
                .map(([uid, count]) => ({
                    ...(userMap[uid] || { name: "Unknown", email: "" }),
                    count,
                    lastLogin: lastLoginMap[uid] || null,
                }))
                .sort((a, b) => b.count - a.count);

            setChartData(result);
            setTotalLogins((loginData || []).length);
            setUserLoginList(loginList);
            setTotalDownloads((dlData || []).length);
            setDownloadList(dlList);
            setTotalQuestions(qnaTotalCount);
            setQuestionList(qnaList);
            setTotalDocViews((viewData || []).length);
            setDocViewList(viewList);
        } catch (err) {
            console.error("Error fetching login data:", err);
        } finally {
            setLoadingChart(false);
        }
    }, []);

    useEffect(() => {
        if (selectedGroup) fetchLoginData(selectedGroup);
    }, [selectedGroup, fetchLoginData]);

    return (
        <div className="p-4 md:p-8 max-w-6xl w-full mx-auto">

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Group Insights</h1>

            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
                    <SlidersHorizontal size={16} />
                </button>

                {/* Group Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowGroupDrop(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:border-gray-300 shadow-sm transition-all min-w-[140px]"
                    >
                        <span className="flex-1 text-left">
                            {loadingGroups ? "Loading..." : selectedGroup ? selectedGroup.name : "Select Group"}
                        </span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {showGroupDrop && !loadingGroups && (
                        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-[160px]">
                            {groups.length === 0 ? (
                                <p className="px-4 py-3 text-[13px] text-gray-400">No groups found</p>
                            ) : groups.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => { setSelectedGroup(g); setShowGroupDrop(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors ${selectedGroup?.id === g.id ? "text-[var(--brand)] font-semibold bg-blue-50/50" : "text-gray-700"
                                        }`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Range Picker */}
                <CalendarRangePicker
                    value={dateRange}
                    onApply={(start, end) => {
                        setDateRange(`${start} → ${end}`);
                        setPickerStart(start);
                        setPickerEnd(end);
                        if (selectedGroup) fetchLoginData(selectedGroup, start, end);
                    }}
                    onClear={() => {
                        setDateRange(""); setPickerStart(""); setPickerEnd("");
                        if (selectedGroup) fetchLoginData(selectedGroup, null, null);
                    }}
                />

                {/* Comparison Days */}
                {/* <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-[13px] text-gray-600">{compDays}</span>
                    <button onClick={() => setCompDays("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={14} />
                    </button>
                </div> */}

                {/* Refresh */}
                <button
                    onClick={() => selectedGroup && fetchLoginData(selectedGroup)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                >
                    <RefreshCw size={16} className={loadingChart ? "animate-spin" : ""} />
                </button>
            </div>

            {/* ── Chart Card ── */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="px-6 pt-5 pb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {SERIES.map(s => (
                        <div key={s.key} className="flex items-center gap-1.5">
                            <span className="w-7 h-[3px] rounded-full inline-block shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{s.label}</span>
                        </div>
                    ))}
                    {selectedGroup && (
                        <span className="ml-auto text-[12px] text-gray-400 font-medium whitespace-nowrap">
                            Group: <span className="text-gray-700 font-semibold">{selectedGroup.name}</span>
                        </span>
                    )}
                </div>

                <div className="px-4 pb-4 relative min-h-[150px] sm:min-h-[200px]">
                    {loadingChart ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-6 h-6 border-2 border-gray-200 border-t-rose-400 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <LineChart data={chartData} groupName={selectedGroup?.name} />
                    )}
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 md:px-6 py-4 md:py-5 mb-8 md:mb-0">
                <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4">Summary</h3>
                <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">

                    {/* Logins — clickable → modal */}
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="flex items-center gap-3 group cursor-pointer text-left hover:opacity-75 transition-opacity"
                    >
                        <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors shrink-0">
                            <LogIn size={16} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">Logins</p>
                            <p className="text-[16px] font-bold text-blue-600 underline hover:text-blue-800">
                                {loadingChart ? "..." : totalLogins}
                            </p>
                        </div>
                    </button>

                    <div className="hidden sm:block w-px h-10 bg-gray-100 self-center" />

                    <button
                        onClick={() => setShowDownloadModal(true)}
                        className="flex items-center gap-3 group cursor-pointer text-left hover:opacity-75 transition-opacity"
                    >
                        <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500 group-hover:bg-violet-100 transition-colors shrink-0">
                            <Download size={16} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">Downloaded</p>
                            <p className="text-[16px] font-bold text-blue-600 underline hover:text-blue-800">
                                {loadingChart ? "..." : totalDownloads}
                            </p>
                        </div>
                    </button>

                    <div className="hidden sm:block w-px h-10 bg-gray-100 self-center" />

                    <button
                        onClick={() => setShowViewsModal(true)}
                        className="flex items-center gap-3 group cursor-pointer text-left hover:opacity-75 transition-opacity"
                    >
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors shrink-0">
                            <Eye size={16} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">Doc Viewed</p>
                            <p className="text-[16px] font-bold text-blue-600 underline hover:text-blue-800">
                                {loadingChart ? "..." : totalDocViews}
                            </p>
                        </div>
                    </button>

                    <div className="hidden sm:block w-px h-10 bg-gray-100 self-center" />

                    <button
                        onClick={() => setShowQuestionsModal(true)}
                        className="flex items-center gap-3 group cursor-pointer text-left hover:opacity-75 transition-opacity"
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors shrink-0">
                            <MessageCircleQuestion size={16} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Questions</p>
                            <p className="text-[16px] font-bold text-blue-600 underline hover:text-blue-800">
                                {loadingChart ? "..." : totalQuestions}
                            </p>
                        </div>
                    </button>

                </div>
            </div>

            {/* ── Doc Views Modal ── */}
            {showViewsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowViewsModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-md w-[95%] sm:w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUp 0.2s ease" }}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-[15px] font-bold text-gray-900">Document Views</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    {selectedGroup?.name} &middot; {totalDocViews} total views
                                </p>
                            </div>
                            <button
                                onClick={() => setShowViewsModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="overflow-auto flex-1">
                            {docViewList.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[13px] text-gray-400">
                                    No document views found for this group
                                </p>
                            ) : (
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                                            <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {docViewList.map((v, i) => (
                                            <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-5 py-3 text-[12px] text-gray-400">{i + 1}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                                            {(v.name || v.email || "?")[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-medium text-gray-800 leading-tight">{v.name || "Unknown"}</p>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[100px]">{v.email || ""}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[12px] text-gray-600 max-w-[150px] truncate" title={v.documentName}>
                                                    {v.documentName}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="inline-flex items-center justify-center min-w-[30px] h-6 px-2.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold rounded-full">
                                                        {v.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Sorted by highest view count</span>
                            <span className="text-[11px] font-semibold text-emerald-500">{totalDocViews} total views</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Questions Asked Modal ── */}
            {showQuestionsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowQuestionsModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-md w-[95%] sm:w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUp 0.2s ease" }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-[15px] font-bold text-gray-900">Questions Asked</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    {selectedGroup?.name} &middot; {totalQuestions} total questions
                                </p>
                            </div>
                            <button
                                onClick={() => setShowQuestionsModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-auto flex-1">
                            {questionList.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[13px] text-gray-400">
                                    No questions found for this group
                                </p>
                            ) : (
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                                            <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {questionList.map((q, i) => (
                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-5 py-3 text-[12px] text-gray-400">{i + 1}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                                            {(q.name || "?")[0]}
                                                        </div>
                                                        <p className="text-[13px] font-medium text-gray-800 leading-tight">{q.name || "Unknown"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[12px] text-gray-600 max-w-[150px] truncate" title={q.documentName}>
                                                    {q.documentName}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="inline-flex items-center justify-center min-w-[30px] h-6 px-2.5 bg-blue-50 text-blue-600 text-[12px] font-bold rounded-full">
                                                        {q.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Sorted by highest question count</span>
                            <span className="text-[11px] font-semibold text-blue-500">{totalQuestions} total questions</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Download Detail Modal ── */}
            {showDownloadModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowDownloadModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-md w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUp 0.2s ease" }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-[15px] font-bold text-gray-900">Downloads</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    {selectedGroup?.name} &middot; {totalDownloads} total downloads
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-auto flex-1">
                            {downloadList.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[13px] text-gray-400">
                                    No download data found for this group
                                </p>
                            ) : (
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                                            <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {downloadList.map((d, i) => (
                                            <tr key={i} className="hover:bg-violet-50/30 transition-colors">
                                                <td className="px-5 py-3 text-[12px] text-gray-400">{i + 1}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                                            {(d.name || d.email || "?")[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-medium text-gray-800 leading-tight">{d.name || "Unknown"}</p>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[100px]">{d.email || ""}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[12px] text-gray-600 max-w-[150px] truncate" title={d.documentName}>
                                                    {d.documentName}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="inline-flex items-center justify-center min-w-[30px] h-6 px-2.5 bg-violet-50 text-violet-600 text-[12px] font-bold rounded-full">
                                                        {d.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Sorted by highest download count</span>
                            <span className="text-[11px] font-semibold text-violet-500">{totalDownloads} total downloads</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Login Detail Modal ── */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-md w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "slideUp 0.2s ease" }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-[15px] font-bold text-gray-900">Logins</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    {selectedGroup?.name} &middot; {totalLogins} total logins &middot; {userLoginList.length} users
                                </p>
                            </div>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="overflow-y-auto flex-1">
                            {userLoginList.length === 0 ? (
                                <p className="px-6 py-10 text-center text-[13px] text-gray-400">No login data found for this group</p>
                            ) : (
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
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Sorted by highest login count</span>
                            <span className="text-[11px] font-semibold text-rose-500">{totalLogins} total logins</span>
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

