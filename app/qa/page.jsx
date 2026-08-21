"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { useDialog } from '@/components/ui/DialogProvider';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import {
  fetchQnAThreads,
  createQuestionThread,
  submitSuggestedAnswer,
  publishOfficialAnswer,
  setThreadStatus,
  downloadAttachment
} from "@/services/qaService";
import {
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaSearch,
  FaChevronRight,
  FaRegFolder,
  FaRegFileAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaPaperclip,
  FaUserShield,
  FaUsers,
  FaUser,
  FaTimes,
  FaLock,
  FaShieldAlt,
  FaClock,
  FaCheck,
  FaCommentDots,
  FaAward,
  FaGlobe
} from "react-icons/fa";

function QAPageContent() {
  const searchParams = useSearchParams();
  const fileIdParam = searchParams.get('fileId');
  const folderIdParam = searchParams.get('folderId');
  const { showConfirm, showAlert } = useDialog();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'my_questions' | 'pending_review' | 'group'
  const [activeFolderId, setActiveFolderId] = useState(folderIdParam || null);
  const [activeDocId, setActiveDocId] = useState(fileIdParam || null);

  const [session, setSession] = useState(null);
  const [qaData, setQaData] = useState([]);
  const [sidebarItems, setSidebarItems] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Ask Modal State
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askSubject, setAskSubject] = useState("");
  const [askDescription, setAskDescription] = useState("");
  const [askFile, setAskFile] = useState(null);
  const [isSubmittingAsk, setIsSubmittingAsk] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);

  // Thread Modal State
  const [selectedThread, setSelectedThread] = useState(null);
  const [activeReplyMode, setActiveReplyMode] = useState("suggest"); // 'suggest' | 'official' | 'comment'
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'open' | 'in_review' | 'answered' | 'closed'
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Q&A Permissions State
  const [qaPermissions, setQaPermissions] = useState({
    canAccess: false,
    canAsk: false,
    canAnswer: false,
    isSuperAdmin: false,
    checked: false
  });

  // 1. Initialize Session & Permissions
  useEffect(() => {
    const rawSession = localStorage.getItem('vdr_session');
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        setSession(parsed);
        checkUserQAPermissions(parsed);
      } catch (e) {
        console.error("Error parsing session:", e);
      }
    }
  }, []);

  const checkUserQAPermissions = async (curSession) => {
    setQaPermissions({
      canAccess: true,
      canAsk: true,
      canAnswer: true,
      isSuperAdmin: true,
      checked: true
    });
  };

  // 2. Fetch Directory Tree (Filtered by Permissions)
  const fetchSidebarData = async () => {
    setSidebarItems([]);
  };

  // 3. Fetch Controlled Q&A Data
  const loadQAData = async () => {
    setLoading(true);
    const mockData = [
      { id: 1, displayId: "1", subject: "null", fileName: "Folder / General", creatorName: "Vishwa Bhai", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "-", createdAt: "8/11/2026, 3:26:06 PM", status: "submitted" },
      { id: 2, displayId: "2", subject: "gfhvh", fileName: "Folder / General", creatorName: "dhanush", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "-", createdAt: "8/11/2026, 3:07:59 PM", status: "submitted" },
      { id: 3, displayId: "3", subject: "doubts", fileName: "Advanced EEG Epilep...", creatorName: "Vishwa Bhai", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "-", createdAt: "8/11/2026, 2:30:38 PM", status: "submitted" },
      { id: 4, displayId: "4", subject: "solve plm", fileName: "test15.pdf", creatorName: "dhanush", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "dhanush", createdAt: "8/11/2026, 10:49:39 AM", status: "submitted" },
      { id: 5, displayId: "5", subject: "jo", fileName: "RAG_GenAI_Overvie...", creatorName: "anusiya", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "Vairajothi P", createdAt: "8/6/2026, 2:24:01 PM", status: "submitted" },
      { id: 6, displayId: "6", subject: "Explain module", fileName: "Git.pdf", creatorName: "abhishek", groupName: "Anyone", documentOwnerName: "Anyone", officialAnswer: "vani", createdAt: "8/6/2026, 10:16:37 AM", status: "submitted" }
    ];
    setQaData(mockData);
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchSidebarData();
      loadQAData();
    }
  }, [session, activeDocId, activeFolderId]);

  // Resolve target details when opening Ask Modal
  const openAskModal = () => {
    if (activeDocId) {
      const doc = sidebarItems.find(i => i.id === activeDocId && i.type === 'file');
      setSelectedDocDetails({ type: 'file', id: activeDocId, name: doc?.name || "Selected Document" });
    } else if (activeFolderId) {
      const folder = sidebarItems.find(i => i.id === activeFolderId && i.type === 'folder');
      setSelectedDocDetails({ type: 'folder', id: activeFolderId, name: folder?.name || "Selected Folder" });
    } else {
      setSelectedDocDetails({ type: 'general', id: null, name: "Workspace Documents" });
    }
    setAskSubject("");
    setAskDescription("");
    setAskFile(null);
    setIsAskModalOpen(true);
  };

  // Handle Ask Query Submit
  const handleAskSubmit = async () => {
    if (!askSubject.trim() || !askDescription.trim()) {
      await showAlert("Please enter both subject and question description.");
      return;
    }
    setIsSubmittingAsk(true);
    try {
      await createQuestionThread(session, {
        fileId: activeDocId || null,
        folderId: activeFolderId || null,
        subject: askSubject,
        description: askDescription,
        attachmentFile: askFile
      });

      setIsAskModalOpen(false);
      setAskSubject("");
      setAskDescription("");
      setAskFile(null);
      await loadQAData();
    } catch (err) {
      console.error("Failed to create question:", err);
      await showAlert("Failed to submit question: " + err.message, 'Error');
    } finally {
      setIsSubmittingAsk(false);
    }
  };

  // Handle Suggestion Submit (Group member / internal discussion)
  const handleSuggestedSubmit = async () => {
    if (!replyText.trim() && !replyFile) {
      await showAlert("Please enter a suggested answer or attach a file.");
      return;
    }
    setIsSubmittingReply(true);
    try {
      await submitSuggestedAnswer(session, {
        threadId: selectedThread.id,
        text: replyText,
        attachmentFile: replyFile
      });

      setReplyText("");
      setReplyFile(null);
      setActionSuccessMsg("Suggested answer added successfully!");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadQAData();
    } catch (err) {
      console.error("Error submitting suggestion:", err);
      await showAlert("Failed to submit suggestion: " + err.message, 'Error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Document Owner Official Answer (Option 1: Pick suggestion)
  const handleSelectOfficialSuggestion = async (messageId) => {
    if (!(await showConfirm("Are you sure you want to approve this response as the single Official Answer for the creator?"))) return;
    setIsSubmittingReply(true);
    try {
      await publishOfficialAnswer(session, {
        threadId: selectedThread.id,
        messageId: messageId
      });

      setActionSuccessMsg("Official answer published successfully!");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadQAData();
    } catch (err) {
      console.error("Error publishing official answer:", err);
      await showAlert("Failed to publish official answer: " + err.message, 'Error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Document Owner Official Answer (Option 2: Write fresh answer)
  const handleWriteOfficialAnswer = async () => {
    if (!replyText.trim() && !replyFile) {
      await showAlert("Please enter the official answer text or attach a file.");
      return;
    }
    if (!(await showConfirm("Publish this as the single verified Official Answer to the question creator?"))) return;
    setIsSubmittingReply(true);
    try {
      await publishOfficialAnswer(session, {
        threadId: selectedThread.id,
        answerText: replyText,
        attachmentFile: replyFile
      });

      setReplyText("");
      setReplyFile(null);
      setActionSuccessMsg("Official answer published successfully!");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadQAData();
    } catch (err) {
      console.error("Error publishing official answer:", err);
      await showAlert("Failed to publish official answer: " + err.message, 'Error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Thread Status Change (Close / Reopen)
  const handleToggleStatus = async (newStatus) => {
    try {
      await setThreadStatus(session, selectedThread.id, newStatus);
      await loadQAData();
    } catch (err) {
      console.error("Error updating status:", err);
      await showAlert("Failed to update status.");
    }
  };

  // Handle CSV Export
  const handleExport = async () => {
    if (qaData.length === 0) {
      await showAlert("No Q&A data to export.");
      return;
    }
    const headers = ["ID", "Subject", "Target Document", "Asked By", "Group", "Document Owner", "Status", "Official Answer", "Asked On"];
    const csvRows = [headers.join(",")];

    qaData.forEach(item => {
      const row = [
        item.displayId,
        `"${(item.subject || "").replace(/"/g, '""')}"`,
        `"${(item.fileName || "").replace(/"/g, '""')}"`,
        `"${(item.creatorName || "").replace(/"/g, '""')}"`,
        `"${(item.groupName || "").replace(/"/g, '""')}"`,
        `"${(item.documentOwnerName || "").replace(/"/g, '""')}"`,
        `"${(item.status || "").toUpperCase()}"`,
        `"${(item.officialAnswer || "Pending Review").replace(/"/g, '""')}"`,
        `"${(item.createdAt || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `VDR_QA_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering Logic
  const filteredQaData = qaData.filter(item => {
    // 1. Tab filter
    if (activeTab === "my_questions" && !item.isCreator) return false;
    if (activeTab === "pending_review" && (!item.isDocOwner || item.status === "answered" || item.status === "closed")) return false;
    if (activeTab === "group" && !item.isGroupMember) return false;

    // 2. Status filter
    if (filterStatus !== 'all' && item.status.toLowerCase() !== filterStatus.toLowerCase()) return false;

    // 3. Search filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchDoc = item.fileName?.toLowerCase().includes(q);
      const matchCreator = item.creatorName?.toLowerCase().includes(q);
      if (!matchSubject && !matchDoc && !matchCreator) return false;
    }

    // 4. Date filter
    if (filterDateRange !== 'all') {
      const itemDate = new Date(item.rawDate);
      const now = new Date();
      if (filterDateRange === 'today') {
        if (itemDate.toDateString() !== now.toDateString()) return false;
      } else if (filterDateRange === 'last7') {
        const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (filterDateRange === 'last30') {
        const diffDays = Math.ceil(Math.abs(now - itemDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) return false;
      } else if (filterDateRange === 'custom') {
        if (customStartDate && itemDate < new Date(customStartDate)) return false;
        if (customEndDate && itemDate > new Date(new Date(customEndDate).setHours(23, 59, 59))) return false;
      }
    }

    return true;
  });

  if (qaPermissions.checked && !qaPermissions.canAccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[85vh] p-6 bg-[#F8F9FB]">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-lg flex items-center justify-center mb-5 shadow-xs">
            <FaLock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Q&A Access Restricted</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Your assigned group does not currently have permission to access the Q&A due diligence module. Please ask your workspace administrator to enable Q&A access in the Permissions Matrix.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-[var(--brand)] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[var(--brand-secondary)] transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full bg-[#F8F9FB] font-sans">

      {/* â”€â”€ SIDEBAR: DIRECTORY TREE â”€â”€ */}
      <div className="w-[280px] bg-white border-r border-slate-200/80 flex flex-col h-full py-6 shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10">
        <div className="px-6 mb-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <FaShieldAlt className="text-[var(--brand)] w-4 h-4" />
            Q&A Directory
          </h2>
        </div>

        <div className="px-5 mb-5">
          <div className="relative group">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[var(--brand)] transition-colors" />
            <input
              type="text"
              placeholder="Search documents..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="px-6 mb-2 flex items-center gap-2 text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]"></div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Workspace Scope</span>
        </div>

        <div className="flex flex-col px-3 gap-0.5 overflow-y-auto flex-1">
          {/* Show all button */}
          <button
            onClick={() => { setActiveDocId(null); setActiveFolderId(null); }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 mb-1 cursor-pointer ${!activeDocId && !activeFolderId
              ? "bg-[var(--brand)]/10 text-[var(--brand)] font-bold shadow-sm border border-[var(--brand)]/20"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
              }`}
          >
            <FaRegFolder className={`w-3.5 h-3.5 ${!activeDocId && !activeFolderId ? 'text-[var(--brand)]' : 'text-slate-400'}`} />
            <span className="truncate flex-1 text-left">All Data Room Items</span>
          </button>

          {(() => {
            const searchTerm = sidebarSearch.trim().toLowerCase();
            const doesNodeMatch = (node) => {
              if (node.name.toLowerCase().includes(searchTerm)) return true;
              const children = sidebarItems.filter(c => c.parentId === node.id);
              return children.some(c => doesNodeMatch(c));
            };

            const rootItems = sidebarItems
              .filter(item => !item.parentId)
              .filter(item => !searchTerm || doesNodeMatch(item));

            return rootItems.map((item) => {
              const renderSidebarItem = (node, depth = 0) => {
                const isFolder = node.type === 'folder';
                const isExpanded = !!expandedFolders[node.id];
                const isActive = (node.type === 'file' && activeDocId === node.id) || (node.type === 'folder' && activeFolderId === node.id);
                const hasChildren = sidebarItems.some((child) => child.parentId === node.id);

                return (
                  <div key={node.id} className="flex flex-col gap-0.5 w-full">
                    <button
                      onClick={() => {
                        if (isFolder) {
                          setExpandedFolders(prev => ({ ...prev, [node.id]: !prev[node.id] }));
                          setActiveFolderId(node.id);
                          setActiveDocId(null);
                        } else {
                          setActiveDocId(node.id);
                          setActiveFolderId(null);
                        }
                      }}
                      style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}
                      className={`flex items-center gap-2 py-2 pr-3 rounded-lg text-xs transition-all duration-200 cursor-pointer group ${isActive
                        ? "bg-[var(--brand)]/10 text-[var(--brand)] font-bold shadow-sm border border-[var(--brand)]/20"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium"
                        }`}
                    >
                      {isFolder ? (
                        <FaChevronRight className={`w-2 h-2 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-[var(--brand)]' : 'text-slate-400 group-hover:text-slate-500'}`} />
                      ) : (
                        <div className="w-2 h-2 flex-shrink-0" />
                      )}

                      {isFolder
                        ? <FaRegFolder className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-slate-400'}`} />
                        : <FaRegFileAlt className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-slate-400'}`} />
                      }
                      <span className="truncate flex-1 text-left" title={node.name}>{node.name}</span>
                    </button>

                    {isFolder && (isExpanded || searchTerm) && hasChildren && (
                      <div className="flex flex-col gap-0.5 mt-0.5 relative before:absolute before:left-[1.35rem] before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-200/60">
                        {sidebarItems
                          .filter((child) => child.parentId === node.id)
                          .filter((child) => !searchTerm || doesNodeMatch(child))
                          .map((child) => renderSidebarItem(child, depth + 1))}
                      </div>
                    )}
                  </div>
                );
              };

              return renderSidebarItem(item);
            });
          })()}
        </div>
      </div>

      {/* â”€â”€ MAIN CONTENT AREA â”€â”€ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB]">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-20">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] shadow-xs">
              <FaCommentDots className="w-5 h-5" />
            </div>
            <div>

              <h1 className="text-base font-bold text-slate-800">Q&A Management</h1>



            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {qaPermissions.canAsk && (
              <button
                onClick={openAskModal}
                className="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>ASK QUERY</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="h-9 px-3.5 text-[12px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FaDownload className="w-3 h-3 text-slate-500" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={loadQAData}
              className="h-9 w-9 flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 hover:text-[var(--brand)] rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters & Perspective Tabs Bar */}
        <div className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 flex-nowrap overflow-x-auto min-w-0 font-sans">

          {/* Segmented Pill Tabs */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 items-center gap-1 shrink-0">
            {[
              { key: 'all', label: 'All Visible', count: qaData.length },
              { key: 'my_questions', label: 'My Inquiries', count: qaData.filter(i => i.isCreator).length },
              { key: 'pending_review', label: 'Pending Approval', count: qaData.filter(i => i.isDocOwner && i.status !== 'answered' && i.status !== 'closed').length },
              { key: 'group', label: 'Group Inquiries', count: qaData.filter(i => i.isGroupMember).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`h-8 px-3 text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer font-sans whitespace-nowrap ${activeTab === tab.key
                  ? "bg-white text-[var(--brand)] font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 min-w-[18px] text-center rounded-full text-[11px] font-semibold leading-none font-sans ${activeTab === tab.key ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'bg-slate-200/80 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Controls Toolbar */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap font-sans">
            <div className="relative flex items-center shrink-0">
              <FaSearch className="absolute left-3 w-3 h-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Search queries..."
                className="h-8.5 pl-8 pr-3 text-xs font-sans text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 w-44 font-medium transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8.5 px-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-[var(--brand)] cursor-pointer transition-all shrink-0"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_review">Under Review</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="h-8.5 px-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-[var(--brand)] cursor-pointer transition-all shrink-0"
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            {filterDateRange === 'custom' && (
              <div className="flex items-center gap-1 bg-slate-50 px-2 h-8.5 border border-slate-200 rounded-xl shrink-0 font-sans">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-xs font-sans bg-transparent text-slate-700 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-xs font-sans bg-transparent text-slate-700 focus:outline-none"
                />
              </div>
            )}

            {(tableSearch || filterStatus !== 'all' || filterDateRange !== 'all') && (
              <button
                onClick={() => {
                  setTableSearch('');
                  setFilterStatus('all');
                  setFilterDateRange('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="h-8.5 px-2.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0 font-sans whitespace-nowrap"
                title="Reset Filters"
              >
                <FaTimes className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>



        {/* â”€â”€ TABLE VIEW â”€â”€ */}
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/80 overflow-hidden relative">

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-30">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>
              </div>
            )}

            {/* Scrollable Container with responsive min-width */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead className="bg-slate-50/90 border-b border-slate-300">
                  <tr>
                    <th className="w-12 px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">S.NO</th>
                    <th className="w-[240px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SUB & DOC</th>
                    <th className="w-[140px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ASKED BY</th>
                    <th className="w-[140px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">DOC OWNER</th>
                    <th className="w-[120px] px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">STATUS</th>
                    <th className="w-[140px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">RESPONSE</th>
                    <th className="w-[120px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">DATE</th>
                    <th className="w-[100px] px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredQaData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedThread(item)}
                    >
                      <td className="w-12 px-4 py-4 text-xs font-bold text-slate-400 text-center">{index + 1}</td>

                      <td className="w-[240px] px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800 truncate" title={item.subject}>{item.subject}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate" title={item.fileName}>
                            <FaRegFileAlt className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.fileName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="w-[140px] px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200/60 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {item.creatorName.charAt(0).toLowerCase()}
                          </div>
                          <span className="text-xs text-slate-600">{item.creatorName}</span>
                        </div>
                      </td>

                      <td className="w-[140px] px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wide w-fit">
                          <FaGlobe className="w-3 h-3 text-slate-400" />
                          {item.documentOwnerName}
                        </div>
                      </td>

                      <td className="w-[120px] px-5 py-4 whitespace-nowrap flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60">
                          <FaExclamationCircle className="w-3 h-3 text-amber-500" />
                          {item.status || "Submitted"}
                        </span>
                      </td>

                      <td className="w-[140px] px-4 py-4 whitespace-nowrap">
                        {item.officialAnswer && item.officialAnswer !== "-" ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200/60 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {item.officialAnswer.charAt(0).toLowerCase()}
                            </div>
                            <span className="text-xs text-slate-600 truncate max-w-[100px]">{item.officialAnswer}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 pl-3">-</span>
                        )}
                      </td>

                      <td className="w-[120px] px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {item.createdAt}
                      </td>

                      <td className="w-[100px] px-4 py-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedThread(item); }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-[var(--brand)] text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredQaData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FaCommentDots className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">No Questions Found</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {qaData.length > 0 ? "No questions match your filter criteria." : "Select a document or folder to raise a confidential question."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* â”€â”€ MODAL: ASK NEW QUERY â”€â”€ */}
      {isAskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-md w-[560px] max-w-full flex flex-col overflow-hidden border border-slate-200">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Raise Controlled Query</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit a confidential question linked to this item</p>
              </div>
              <button onClick={() => setIsAskModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Target Item info box */}
            <div className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                  {selectedDocDetails?.type === 'folder' ? <FaRegFolder className="w-4 h-4" /> : <FaRegFileAlt className="w-4 h-4" />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Item</span>
                  <span className="text-xs font-semibold text-slate-800 truncate">{selectedDocDetails?.name}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={askSubject}
                  onChange={(e) => setAskSubject(e.target.value)}
                  placeholder="e.g., Clarification regarding revenue projections in Section 3"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900">Question Description <span className="text-red-500">*</span></label>
                <textarea
                  value={askDescription}
                  onChange={(e) => setAskDescription(e.target.value)}
                  placeholder="Provide detailed context for the document owner and subject matter experts..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] min-h-[100px]"
                />
              </div>

              {/* Attachment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Supporting Attachment (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-xs text-slate-700 font-medium">
                    <FaPaperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[220px]">{askFile ? askFile.name : "Attach reference file"}</span>
                    <input type="file" className="hidden" onChange={(e) => setAskFile(e.target.files[0])} />
                  </label>
                  {askFile && (
                    <button onClick={() => setAskFile(null)} className="text-xs text-red-500 hover:underline cursor-pointer">Remove</button>
                  )}
                </div>
              </div>

              {/* Confidentiality Notice */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
                <FaLock className="w-3.5 h-3.5 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>
                  This question will remain confidential. It will be reviewed by your assigned group members and the document owner before an official answer is finalized.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setIsAskModalOpen(false)}
                disabled={isSubmittingAsk}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAskSubmit}
                disabled={isSubmittingAsk || !askSubject.trim() || !askDescription.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-secondary)] rounded-xl transition-all shadow-md shadow-[var(--brand)]/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingAsk ? "Submitting..." : "Submit Question"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* â”€â”€ MODAL: CONTROLLED THREAD & ANSWER WORKSPACE â”€â”€ */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-md w-[740px] max-w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

            {/* Header */}
            <div className="p-6 border-b border-slate-200/80 bg-slate-50/60 flex items-start justify-between">
              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${selectedThread.status === 'answered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedThread.status === 'in_review'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedThread.status === 'closed'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                    {selectedThread.status === 'answered' && <FaCheckCircle className="w-3 h-3" />}
                    {selectedThread.status === 'in_review' && <FaClock className="w-3 h-3" />}
                    {selectedThread.status === 'open' && <FaExclamationCircle className="w-3 h-3" />}
                    {selectedThread.status === 'closed' && <FaLock className="w-3 h-3" />}
                    {selectedThread.status === 'in_review' ? 'Under Review' : selectedThread.status.toUpperCase()}
                  </span>

                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <FaRegFileAlt className="w-3 h-3 text-slate-400" /> {selectedThread.fileName}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedThread.subject}
                </h3>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                  <span>Asked by <strong className="text-slate-700">{selectedThread.creatorName}</strong> ({selectedThread.groupName})</span>
                  <span>â€¢</span>
                  <span>Reviewer: <strong className="text-slate-700">{selectedThread.documentOwnerName}</strong></span>
                  <span>â€¢</span>
                  <span>{selectedThread.createdAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedThread.isDocOwner && (
                  <button
                    onClick={() => handleToggleStatus(selectedThread.status === 'closed' ? 'open' : 'closed')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    title={selectedThread.status === 'closed' ? "Reopen Question" : "Close Question"}
                  >
                    {selectedThread.status === 'closed' ? "Reopen Question" : "Close Question"}
                  </button>
                )}
                <button onClick={() => setSelectedThread(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Banner if action performed */}
            {actionSuccessMsg && (
              <div className="bg-emerald-500 text-white text-xs font-bold px-6 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
                <FaCheck className="w-3.5 h-3.5" />
                {actionSuccessMsg}
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-[#FAFBFD]">

              {/* 1. QUESTION DETAIL CARD */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FaUser className="w-3 h-3" /> Question Description
                </span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedThread.description || selectedThread.subject}
                </p>
                {selectedThread.attachmentPath && (
                  <button
                    onClick={() => downloadAttachment(selectedThread.attachmentPath, selectedThread.attachmentName)}
                    className="mt-2 flex items-center gap-2 text-xs text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 px-3 py-1.5 rounded-lg w-max font-semibold transition-colors cursor-pointer"
                  >
                    <FaPaperclip className="w-3 h-3" />
                    <span>Download Attachment: {selectedThread.attachmentName || "File"}</span>
                  </button>
                )}
              </div>

              {/* 2. OFFICIAL ANSWER SECTION (Visible to everyone) */}
              {selectedThread.officialAnswer ? (
                <div className="p-5 bg-slate-50/80 rounded-lg border border-slate-200/90 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">
                        <FaAward className="w-3 h-3" />
                      </div>
                      <span>Single Verified Official Answer</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Approved by {selectedThread.officialAnsweredBy} â€¢ {selectedThread.officialAnsweredAt}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    {selectedThread.officialAnswer}
                  </p>

                  {selectedThread.officialMsg?.attachment_path && (
                    <button
                      onClick={() => downloadAttachment(selectedThread.officialMsg.attachment_path, selectedThread.officialMsg.attachment_name)}
                      className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg w-max font-semibold transition-colors cursor-pointer border border-slate-200/60"
                    >
                      <FaPaperclip className="w-3 h-3" />
                      <span>Official Attachment: {selectedThread.officialMsg.attachment_name}</span>
                    </button>
                  )}
                </div>
              ) : (
                /* When NOT yet answered */
                selectedThread.isCreator && !selectedThread.isDocOwner && !selectedThread.isAdmin ? (
                  <div className="p-5 bg-blue-50/50 border border-blue-200/80 rounded-lg flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                      <FaClock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-900">Query is Under Internal Review</span>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        Group subject-matter experts and the document owner are evaluating this question. Once verified, the single approved official answer will appear here.
                      </p>
                    </div>
                  </div>
                ) : null
              )}

              {/* 3. INTERNAL COLLABORATION & SUGGESTED REPLIES (Hidden from pure Creator) */}
              {(selectedThread.isDocOwner || selectedThread.isGroupMember || selectedThread.isAdmin) && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                        Internal Discussion & Suggested Answers
                      </h4>
                    </div>
                  </div>

                  {/* List of suggested answers */}
                  <div className="flex flex-col gap-3">
                    {selectedThread.suggestions?.map((sug, idx) => (
                      <div
                        key={sug.id || idx}
                        className={`p-4 rounded-xl border transition-all ${sug.is_official
                          ? 'bg-slate-100/70 border-slate-300 ring-1 ring-slate-300'
                          : 'bg-white border-slate-200 shadow-xs'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {sug.sender?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{sug.sender}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-500 font-medium">
                              {sug.sender_role === 'doc_owner' ? 'Document Owner' : 'Group Member'}
                            </span>
                            {sug.is_official && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-white font-bold flex items-center gap-1">
                                <FaCheck className="w-2 h-2" /> Chosen Official Answer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(sug.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {sug.text}
                        </p>

                        {sug.attachment_path && (
                          <button
                            onClick={() => downloadAttachment(sug.attachment_path, sug.attachment_name)}
                            className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg w-max font-medium transition-colors cursor-pointer"
                          >
                            <FaPaperclip className="w-3 h-3 text-slate-400" />
                            <span>{sug.attachment_name || "Attachment"}</span>
                          </button>
                        )}

                        {/* Document Owner action on suggestion */}
                        {selectedThread.isDocOwner && !sug.is_official && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleSelectOfficialSuggestion(sug.id)}
                              disabled={isSubmittingReply}
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white border border-slate-200 rounded-lg transition-all cursor-pointer"
                            >
                              <FaAward className="w-3 h-3" />
                              <span>Select as Official Answer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!selectedThread.suggestions || selectedThread.suggestions.length === 0) && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No suggested replies proposed yet. Group members can collaborate here.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom: Response Composer */}
            <div className="p-5 border-t border-slate-200 bg-white">
              {/* If user is purely Question Creator (and not owner/admin), prevent self answering */}
              {selectedThread.isCreator && !selectedThread.isDocOwner && !selectedThread.isAdmin ? (
                <div className="text-center text-xs text-slate-500 py-2">
                  <span>You raised this question. The official verified answer will be published by the document owner above.</span>
                </div>
              ) : selectedThread.status === 'closed' ? (
                <div className="text-center text-xs text-slate-400 py-2 font-medium">
                  This thread is closed. Reopen to submit new replies.
                </div>
              ) : (
                /* Group Member & Document Owner Response forms */
                <div className="flex flex-col gap-3">

                  {/* Mode switcher for Document Owner */}
                  {selectedThread.isDocOwner && (
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button
                        onClick={() => setActiveReplyMode("suggest")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeReplyMode === "suggest"
                          ? "bg-slate-300 text-slate-800 shadow-xs"
                          : "text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800"
                          }`}
                      >
                        Internal Discussion / Suggestion
                      </button>
                      <button
                        onClick={() => setActiveReplyMode("official")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${activeReplyMode === "official"
                          ? "bg-slate-300 text-slate-800 shadow-xs"
                          : "text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800"
                          }`}
                      >
                        <FaAward className="w-3 h-3" />
                        Write & Publish Official Answer
                      </button>
                    </div>
                  )}

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      selectedThread.isDocOwner && activeReplyMode === "official"
                        ? "Type the finalized Official Answer to be published to the question creator..."
                        : "Type your suggested answer or internal comment for the group and document owner..."
                    }
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none min-h-[70px] ${selectedThread.isDocOwner && activeReplyMode === "official"
                      ? "border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-slate-50/40"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                      }`}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors text-xs text-slate-600 font-medium">
                        <FaPaperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[160px]">{replyFile ? replyFile.name : "Attach File"}</span>
                        <input type="file" className="hidden" onChange={(e) => setReplyFile(e.target.files[0])} />
                      </label>
                      {replyFile && (
                        <button onClick={() => setReplyFile(null)} className="text-xs text-red-500 hover:underline cursor-pointer">Remove</button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedThread.isDocOwner && activeReplyMode === "official" ? (
                        <button
                          onClick={handleWriteOfficialAnswer}
                          disabled={isSubmittingReply || (!replyText.trim() && !replyFile)}
                          className="px-5 py-2 text-xs font-bold text-white bg-[var(--brand)] rounded-xl transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >

                          {isSubmittingReply ? "Publishing..." : "Publish Official Answer"}
                        </button>
                      ) : (
                        <button
                          onClick={handleSuggestedSubmit}
                          disabled={isSubmittingReply || (!replyText.trim() && !replyFile)}
                          className="px-5 py-2 text-xs font-bold text-white bg-[var(--brand)] rounded-xl transition-all shadow-md shadow-[var(--brand)]/20 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingReply ? "Submitting..." : "Submit Suggestion"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function QAPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin" /></div>}>
      <QAPageContent />
    </Suspense>
  );
}

