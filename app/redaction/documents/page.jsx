"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useDialog } from "@/components/ui/DialogProvider";
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import {
  FaTimes,
  FaLock,
  FaCheck,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";

let pdfjsLib = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    pdfjsLib = pdfjs;
  }

  return pdfjsLib;
};


/**
 * Expands an array of range strings (e.g. ["1-5", "8", "10-12"])
 * into a Set of individual page numbers. Handles multiple ranges.
 */
const expandPageRanges = (ranges = []) => {
  const pages = new Set();

  ranges.forEach((r) => {
    if (!r) return;
    const str = String(r).trim();

    if (str.includes("-")) {
      const [startRaw, endRaw] = str.split("-");
      const start = parseInt(startRaw, 10);
      const end = parseInt(endRaw, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const lo = Math.min(start, end);
        const hi = Math.max(start, end);
        for (let p = lo; p <= hi; p++) pages.add(p);
      }
    } else {
      const n = parseInt(str, 10);
      if (!Number.isNaN(n)) pages.add(n);
    }
  });

  return pages;
};

/**
 * visibility_mode "hide": listed pages are redacted, everything else visible.
 * visibility_mode "show": only listed pages are visible, everything else redacted.
 * Empty range list = fully visible either way.
 */
const isPageRedacted = (pageNum, visibilityMode, pageRanges) => {
  const specifiedPages = expandPageRanges(pageRanges);
  if (specifiedPages.size === 0) return false;

  if (visibilityMode === "hide") {
    return specifiedPages.has(pageNum);
  }
  return !specifiedPages.has(pageNum);
};

export default function RedactionDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const { showAlert } = useDialog();
  const [loading, setLoading] = useState(true);

  // Configuration Drawer State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState("show"); // 'show' or 'hide'
  const [inputValue, setInputValue] = useState("");
  const [pageRanges, setPageRanges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);

  const canvasRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    const loadMockDocuments = () => {
      setLoading(true);
      let docs = [];
      try {
        const stored = localStorage.getItem("vdr_mock_documents");
        if (stored) {
          const parsed = JSON.parse(stored);
          docs = parsed.filter(d => d.type === "file" && !d.is_deleted);
        }
      } catch (e) {
        console.error(e);
      }
      
      if (docs.length === 0) {
        docs = [
          { id: "1", name: "Financial_Report_Q3_2026.pdf", created_at: "2026-08-01T10:00:00Z" },
          { id: "2", name: "Employee_Contracts_Batch.pdf", created_at: "2026-08-05T14:30:00Z" },
          { id: "3", name: "Merger_Acquisition_Draft.pdf", created_at: "2026-08-10T09:15:00Z" },
          { id: "4", name: "Board_Meeting_Minutes.pdf", created_at: "2026-08-12T16:45:00Z" },
          { id: "5", name: "Audit_Findings_2025.pdf", created_at: "2026-08-13T11:20:00Z" },
          { id: "6", name: "Customer_Data_Export.pdf", created_at: "2026-08-14T08:05:00Z" },
        ];
      }
      setDocuments(docs);
      setLoading(false);
    };

    loadMockDocuments();
  }, []);

const openConfigDrawer = async (doc) => {
  setSelectedDoc(doc);
  setIsDrawerOpen(true);
  setSaveSuccess(false);
  setInputValue("");

  const { data, error } = await supabase
    .from("document_redactions")
    .select("*")
    .eq("document_id", doc.id)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (data) {
    setVisibilityMode(data.visibility_mode);
    setPageRanges(data.page_ranges || []);
  } else {
    setVisibilityMode("show");
    setPageRanges([]);
  }
};

  const closeConfigDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedDoc(null), 300); // Wait for transition
  };
const isValidRange = (value) => {
  if (!/^\d+(-\d+)?$/.test(value)) return false;

  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);

    if (start > end) return false;
  }

  return true;
};

const handleAddRange = (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();

    const val = inputValue.trim().replace(/,$/, "");

    if (val) {
      if (isValidRange(val)) {
        if (!pageRanges.includes(val)) {
          setPageRanges((prev) => [...prev, val]);
        }
      } else {
        showAlert("Please enter a valid page range (e.g. 1, 2-5)", "Invalid Range");
      }

      setInputValue("");
    }
  }
};

  const removeRange = (rangeToRemove) => {
    setPageRanges(pageRanges.filter(r => r !== rangeToRemove));
  };

const handleSaveConfig = async () => {
  if (!selectedDoc) return;

  setIsSaving(true);

  try {
    const raw = localStorage.getItem("vdr_session");
    if (!raw) throw new Error("Session not found");

    const session = JSON.parse(raw);

    // Include current input even if Enter wasn't pressed
    let finalRanges = [...pageRanges];

    const val = inputValue.trim().replace(/,$/, "");

    if (
      val &&
      /^\d+(-\d+)?$/.test(val) &&
      !finalRanges.includes(val)
    ) {
      finalRanges.push(val);
    }

    const { error } = await supabase
      .from("document_redactions")
      .upsert(
        {
          document_id: selectedDoc.id,
          visibility_mode: visibilityMode,
          page_ranges: finalRanges,
          created_by: session.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "document_id",
        }
      );

    if (error) throw error;

    // Update UI immediately
    setPageRanges(finalRanges);
    setInputValue("");

    setSaveSuccess(true);

    setTimeout(() => {
      closeConfigDrawer();
    }, 1500);
  } catch (error) {
    console.error("Failed to save configuration:", error);
    await showAlert("Failed to save configuration.", "Error");
  } finally {
    setIsSaving(false);
  }
};

  // The set of page-ranges to apply for preview purposes: whatever is
  // already tagged, PLUS whatever's currently typed but not yet confirmed
  // with Enter. This way "Preview" always reflects what's on screen.
  const getLivePageRanges = useCallback(() => {
    const val = inputValue.trim().replace(/,$/, "");
    if (val && isValidRange(val) && !pageRanges.includes(val)) {
      return [...pageRanges, val];
    }
    return pageRanges;
  }, [inputValue, pageRanges]);

  // Opens the preview modal and loads the PDF binary from the
  // `original-file` bucket (users/{user_id}/{file_path}).
  const openPreview = async () => {
    if (!selectedDoc) return;

    const ext = selectedDoc.file_path ? selectedDoc.file_path.split(".").pop().toLowerCase().trim() : "";
    if (ext !== "pdf") {
      window.open(`/redaction/view?id=${selectedDoc.id}`, "_blank");
      return;
    }

    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setCurrentPage(1);
    setNumPages(0);
    pdfRef.current = null;

    try {
      let storagePath = selectedDoc.original_file_path || selectedDoc.file_path; 
      if (storagePath && storagePath.includes("secure_") && !selectedDoc.original_file_path) {
        storagePath = storagePath.replace("secure_", "original_");
      }

      console.log("========== PREVIEW DEBUG ==========");
      console.log("Bucket:", "original-files");
      console.log("Storage Path:", storagePath);
      console.log("Document Name:", selectedDoc.name);
      console.log("Document Record:", selectedDoc);

      let { data: urlData, error: urlError } = await supabase.storage
        .from("original-files")
        .createSignedUrl(storagePath, 3600);

      if (urlError && selectedDoc.file_path && selectedDoc.file_path.includes("secure_")) {
        const candidate = selectedDoc.file_path.replace("secure_", "original_");
        const fallback = await supabase.storage
          .from("original-files")
          .createSignedUrl(candidate, 3600);
        if (!fallback.error && fallback.data) {
          urlData = fallback.data;
          urlError = null;
          storagePath = candidate;
        }
      }

      if (urlError && selectedDoc.file_path && storagePath !== selectedDoc.file_path) {
        const fallback = await supabase.storage
          .from("original-files")
          .createSignedUrl(selectedDoc.file_path, 3600);
        if (!fallback.error && fallback.data) {
          urlData = fallback.data;
          urlError = null;
          storagePath = selectedDoc.file_path;
        }
      }

      console.log("Signed URL:", urlData);
      console.log("URL Error:", urlError);

      if (urlError) throw urlError;

      const pdfjs = await loadPdfJs();
      if (!pdfjs) throw new Error("PDF.js failed to load");

      const pdf = await pdfjs.getDocument(urlData.signedUrl).promise;
      pdfRef.current = pdf;

      setNumPages(selectedDoc.total_pages || pdf.numPages);
    } catch (err) {
      console.error("Error loading preview:", err);
      setPreviewError(err.message || "Failed to load document preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    pdfRef.current = null;
  };

  const livePageRanges = getLivePageRanges();
  const currentPageRedacted = isPageRedacted(
    currentPage,
    visibilityMode,
    livePageRanges
  );

  // Render the current page onto the canvas whenever the page changes,
  // unless that page is redacted under the live (unsaved) rules.
  useEffect(() => {
    const renderPage = async () => {
      if (!isPreviewOpen || !pdfRef.current || !currentPage) return;
      if (currentPageRedacted) return;

      setPageRendering(true);
      try {
        const page = await pdfRef.current.getPage(currentPage);
        const scale = 1.4;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      } finally {
        setPageRendering(false);
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isPreviewOpen, currentPageRedacted]);

  const goToPage = (n) => {
    if (n < 1 || n > numPages) return;
    setCurrentPage(n);
  };

  return (
    <div className="relative flex w-full h-full bg-[#FAFBFD] overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isDrawerOpen ? 'lg:mr-96' : ''} overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Predefined Documents</h1>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            No documents found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => openConfigDrawer(doc)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col hover:border-[var(--brand)] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug break-words" title={doc.name}>{doc.name}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-[var(--brand)] flex items-center gap-1">Configure Redaction &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Config Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedDoc && (
          <>
            {/* Drawer Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="min-w-0 pr-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Redaction Setup</h2>
                <p className="text-xs text-slate-500 truncate w-56 sm:w-64" title={selectedDoc.name}>{selectedDoc.name}</p>
              </div>
              <button 
                onClick={closeConfigDrawer}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0"
              >
                <FaTimes />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
              
              {/* Document Preview Trigger */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={openPreview}
                  className="w-full h-28 sm:h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:bg-[var(--brand)]/5 transition-colors group p-3"
                >
                  <FaEye className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-slate-400 group-hover:text-[var(--brand)] transition-colors" />
                  <span className="text-xs sm:text-sm font-bold">Preview Document</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">See redaction rules applied live</span>
                </button>
                
                <Link
                  href={`/redaction/documents/viewer?id=${selectedDoc.id}`}
                  className="w-full h-14 sm:h-16 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-center text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:bg-[var(--brand)]/5 transition-colors group gap-2 px-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-[var(--brand)] transition-colors"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span className="text-xs sm:text-sm font-bold">Advanced Redaction Tool</span>
                </Link>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Visibility Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setVisibilityMode('show')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                      visibilityMode === 'show' ? 'bg-white text-[var(--brand)] shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Show Specific Pages
                  </button>
                  <button
                    onClick={() => setVisibilityMode('hide')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                      visibilityMode === 'hide' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Hide Specific Pages
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {visibilityMode === 'show' 
                    ? "Only the pages you specify below will be visible. All other pages will be redacted."
                    : "The pages you specify below will be redacted. All other pages will be visible."}
                </p>
              </div>

              {/* Smart Page Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Page Selection</label>
                
                {/* Tag Container */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pageRanges.map((range) => (
                    <div 
                      key={range} 
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        visibilityMode === 'show' ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <span>Pages {range}</span>
                      <button 
                        onClick={() => removeRange(range)}
                        className={`hover:opacity-70 cursor-pointer ${visibilityMode === 'show' ? 'text-[var(--brand)]' : 'text-rose-500'}`}
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {pageRanges.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No pages specified yet.</span>
                  )}
                </div>

                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleAddRange}
                    placeholder="e.g. 1-3 or 5 (Press Enter)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-all pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
                    Press Enter ↵
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white shrink-0">
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving || saveSuccess}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition-all cursor-pointer ${
                  saveSuccess ? 'bg-emerald-600' : 'bg-[var(--brand)] hover:opacity-90 shadow-xs'
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <FaCheck /> Saved Successfully
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 lg:hidden"
          onClick={closeConfigDrawer}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-[60] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="overflow-hidden min-w-0 pr-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={selectedDoc.name}>
                  {selectedDoc.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Live preview with redaction rules applied</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-slate-100 relative min-h-[280px] sm:min-h-[400px]">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FaSpinner className="w-6 h-6 animate-spin text-[var(--brand)]" />
                  <span className="text-xs sm:text-sm font-medium">Loading document…</span>
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center gap-2 text-rose-500 text-center px-6">
                  <FaLock className="w-8 h-8" />
                  <span className="text-xs sm:text-sm font-semibold">{previewError}</span>
                </div>
              ) : currentPageRedacted ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                  <FaLock className="w-10 h-10" />
                  <span className="text-sm sm:text-base font-semibold text-slate-500">
                    This page is redacted
                  </span>
                </div>
              ) : (
                <>
                  {pageRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/70">
                      <FaSpinner className="w-5 h-5 text-[var(--brand)] animate-spin" />
                    </div>
                  )}
                  <canvas ref={canvasRef} className="max-w-full h-auto shadow-md bg-white rounded-lg" />
                </>
              )}
            </div>

            {/* Modal Footer / Pagination */}
            {!previewLoading && !previewError && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-white flex items-center justify-center gap-4 shrink-0">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs sm:text-sm font-medium text-slate-600">
                  Page {currentPage} of {numPages || "?"}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


