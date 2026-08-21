"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import {
  FaLock,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaSearchMinus,
  FaSearchPlus,
  FaMousePointer,
  FaSearch,
  FaSave,
  FaTimes,
  FaCheck,
  FaFileAlt,
  FaUndo,
} from "react-icons/fa";
import WordViewer from "@/components/redaction/viewers/WordViewer";
import ExcelViewer from "@/components/redaction/viewers/ExcelViewer";
import PowerPointViewer from "@/components/redaction/viewers/PowerPointViewer";
import TextViewer from "@/components/redaction/viewers/TextViewer";
import ImageViewer from "@/components/redaction/viewers/ImageViewer";
import { applyNativeRedactions } from "@/utils/redactionProcessor";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Color Helpers
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const hexToRgba = (hex, alpha) => {
  let c = (hex || "#000000").substring(1);
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

const hexToPdfColor = (hex, rgb) => {
  let c = (hex || "#000000").substring(1);
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   File-type detection helper
   Returns: "pdf" | "word" | "excel" | "ppt" | "pptx" | "text" | "image" | "unknown"
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const getFileType = (filePath) => {
  if (!filePath) return "unknown";
  const ext = filePath.split(".").pop().toLowerCase().trim();
  if (ext === "pdf")  return "pdf";
  if (ext === "doc" || ext === "docx") return "word";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return ext;
  if (ext === "ppt")  return "ppt";
  if (ext === "pptx") return "pptx";
  if (ext === "txt")  return "text";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  return "unknown";
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PDF.js loader (same as original)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let pdfjsLib = null;

const loadPdfJs = async () => {
  if (typeof window !== "undefined" && !pdfjsLib) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    pdfjsLib = pdfjs;
  }

  return pdfjsLib;
};


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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Unique id helper for selections
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _selId = 0;
const nextSelId = () => ++_selId;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Main viewer component
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DocumentViewerContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("id");

  /* â”€â”€ refs â”€â”€ */
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const overlayRef = useRef(null);
  const pdfRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, rect }

  /* â”€â”€ document / loading state (original) â”€â”€ */
  const [doc, setDoc] = useState(null);
  const [redaction, setRedaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);

  /* â”€â”€ multi-format support â”€â”€ */
  const [fileType, setFileType] = useState("pdf"); // detected file type
  const [fileUrl, setFileUrl] = useState(null);   // signed URL for non-PDF viewers

  /* â”€â”€ new toolbar / tool state â”€â”€ */
  const [scale, setScale] = useState(1.5);
  const [tool, setTool] = useState("pointer"); // "pointer" | "select"
  const [redactionColor, setRedactionColor] = useState("#000000");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [pdfRenderTrigger, setPdfRenderTrigger] = useState(0);

  /* â”€â”€ text-region selections â”€â”€ */
  const [selections, setSelections] = useState([]); // [{id, page, text, x, y, w, h}]
  const [dragBox, setDragBox] = useState(null); // live drag rectangle

  /* â”€â”€ save dialog â”€â”€ */
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState(null); // "overwrite" | "new"
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Existing redaction logic (unchanged)
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const isPageRedacted = useCallback(
    (pageNum) => {
      if (!redaction) return false;
      const { visibility_mode, page_ranges } = redaction;
      const specifiedPages = expandPageRanges(page_ranges);
      if (specifiedPages.size === 0) return false;
      if (visibility_mode === "hide") return specifiedPages.has(pageNum);
      return !specifiedPages.has(pageNum);
    },
    [redaction]
  );

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Init: load doc metadata + redaction rules
     + check for existing redacted PDF
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (!docId) {
      queueMicrotask(() => {
        setError("No document specified.");
        setLoading(false);
      });
      return;
    }

    const init = async () => {
      setLoading(true);
      setError(null);
      setRedactionColor("#000000");

      try {
        const raw = localStorage.getItem("vdr_session");
        if (!raw) throw new Error("Session not found");
        const session = JSON.parse(raw);

        // 1. Fetch document metadata
        let docData = null;
        try {
          const stored = localStorage.getItem("vdr_mock_documents");
          if (stored) {
             const docs = JSON.parse(stored);
             docData = docs.find(d => d.id === docId);
          }
        } catch(e) {}

        if (!docData) throw new Error("Document not found.");
        
        if (!docData.file_path) docData.file_path = docData.name;
        setDoc(docData);

        // 2 & 3 & 4. Mock redaction & selections
        setRedaction({ visibility_mode: "show", page_ranges: [] });
        setSelections([]);

        let resolvedUrl = docData.dataUrl;
        if (!resolvedUrl) {
           resolvedUrl = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDM4Cj4+CnN0cmVhbQpCVEQKL0YxIDE4IFRmCjAgNTAgVGQKKE1vY2sgUERGIEZpbGUpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDEwIDEwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDE2NyAwMDAwMCBuIAowMDAwMDAwMjc1IDAwMDAwIG4gCjAwMDAwMDAzNTkgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQ4CiUlRU9GCg==";
        }

        // 5. Detect file type from path; route to appropriate viewer
        const detectedType = getFileType(docData.file_path || docData.name || "");
        setFileType(detectedType);

        if (detectedType === "pdf") {
          // â”€â”€ Existing PDF.js path (unchanged) â”€â”€
          const pdfjs = await loadPdfJs();
          if (!pdfjs) throw new Error("PDF.js failed to load");

          const pdf = await pdfjs.getDocument(resolvedUrl).promise;
          pdfRef.current = pdf;

          setNumPages(docData.total_pages || pdf.numPages);
          setCurrentPage(1);
        } else {
          // â”€â”€ Non-PDF: store URL; specific viewer component handles rendering â”€â”€
          setFileUrl(resolvedUrl);
        }
      } catch (err) {
        console.error("Error loading document viewer:", err);
        setError(err.message || "Failed to load document.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [docId]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Render page onto canvas + text layer
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfRef.current || !currentPage) return;
      if (isPageRedacted(currentPage)) return;

      setPageLoading(true);
      try {
        const page = await pdfRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        // Canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;

        // Text layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          textLayerRef.current.style.width = `${viewport.width}px`;
          textLayerRef.current.style.height = `${viewport.height}px`;

          const textContent = await page.getTextContent();

          // Use the pdf.js renderTextLayer API (works with pdfjs-dist legacy)
          const textLayerFrag = document.createDocumentFragment();
          const textLayerItems = [];

          textContent.items.forEach((item) => {
            if (!item.str) return;
            const span = document.createElement("span");
            span.textContent = item.str;
            const tx = pdfjsLib.Util.transform(
              viewport.transform,
              item.transform
            );
            const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
            const angle = Math.atan2(tx[1], tx[0]);
            span.style.cssText = `
              position: absolute;
              left: ${tx[4]}px;
              top: ${tx[5] - fontHeight}px;
              font-size: ${fontHeight}px;
              line-height: 1;
              transform-origin: 0% 0%;
              transform: rotate(${angle}rad) scaleX(${
              item.width > 0
                ? (item.width * viewport.scale) /
                  (item.str.length * fontHeight * 0.6 || 1)
                : 1
            });
              white-space: pre;
              color: transparent;
              cursor: text;
              user-select: text;
            `;
            textLayerFrag.appendChild(span);
            textLayerItems.push(span);
          });

          textLayerRef.current.appendChild(textLayerFrag);
        }
      } catch (err) {
        console.error("Error rendering page:", err);
      } finally {
        setPageLoading(false);
        setPdfRenderTrigger((t) => t + 1);
      }
    };

    renderPage();
  }, [currentPage, scale, isPageRedacted]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Page navigation (original)
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const goToPage = (n) => {
    if (n < 1 || n > numPages) return;
    setCurrentPage(n);
    setActiveMatchIndex(0);
    setTotalMatches(0);
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     PDF Search Effect
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    if (fileType !== "pdf" || !textLayerRef.current) return;

    const spans = textLayerRef.current.querySelectorAll("span");
    spans.forEach((span) => {
      if (span.hasAttribute("data-original-text")) {
        span.textContent = span.getAttribute("data-original-text");
      }
    });

    if (!searchQuery) {
      queueMicrotask(() => setTotalMatches(0));
      return;
    }

    const query = searchQuery.toLowerCase();
    let matchCount = 0;

    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    spans.forEach((span) => {
      if (!span.hasAttribute("data-original-text")) {
        span.setAttribute("data-original-text", span.textContent);
      }
      const text = span.getAttribute("data-original-text");
      if (!text) return;

      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(query);
      if (index === -1) {
        span.textContent = text;
        return;
      }

      let newHtml = "";
      let lastIndex = 0;
      while (index !== -1) {
        newHtml += escapeHtml(text.substring(lastIndex, index));
        const isCurrentMatch = matchCount === activeMatchIndex;
        const bgColor = isCurrentMatch ? "#f97316" : "#fef08a";
        newHtml += `<mark style="background-color: ${bgColor}; color: inherit; padding: 0; border-radius: 2px;" ${
          isCurrentMatch ? 'data-active-match="true"' : ""
        }>${escapeHtml(text.substring(index, index + query.length))}</mark>`;

        matchCount++;
        lastIndex = index + query.length;
        index = lowerText.indexOf(query, lastIndex);
      }
      newHtml += escapeHtml(text.substring(lastIndex));
      span.innerHTML = newHtml;
    });

    queueMicrotask(() => setTotalMatches(matchCount));

    if (matchCount > 0) {
      const activeMark = textLayerRef.current.querySelector(
        'mark[data-active-match="true"]'
      );
      if (activeMark) {
        activeMark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [searchQuery, activeMatchIndex, fileType, pdfRenderTrigger]);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Zoom helpers
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));
  const zoomIn = () => setScale((s) => Math.min(4.0, +(s + 0.25).toFixed(2)));

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Drag-to-select on overlay div
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const getRelativePos = (e, el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleOverlayMouseDown = (e) => {
    if (tool !== "select") return;
    e.preventDefault();
    const pos = getRelativePos(e, overlayRef.current);
    dragRef.current = { startX: pos.x, startY: pos.y };
    setDragBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleOverlayMouseMove = (e) => {
    if (tool !== "select" || !dragRef.current) return;
    const pos = getRelativePos(e, overlayRef.current);
    const dx = pos.x - dragRef.current.startX;
    const dy = pos.y - dragRef.current.startY;
    setDragBox({
      x: dx >= 0 ? dragRef.current.startX : pos.x,
      y: dy >= 0 ? dragRef.current.startY : pos.y,
      w: Math.abs(dx),
      h: Math.abs(dy),
    });
  };

  const handleOverlayMouseUp = (e) => {
    if (tool !== "select" || !dragRef.current) return;
    const pos = getRelativePos(e, overlayRef.current);
    const dx = pos.x - dragRef.current.startX;
    const dy = pos.y - dragRef.current.startY;
    const finalBox = {
      x: dx >= 0 ? dragRef.current.startX : pos.x,
      y: dy >= 0 ? dragRef.current.startY : pos.y,
      w: Math.abs(dx),
      h: Math.abs(dy),
    };

    dragRef.current = null;
    setDragBox(null);

    if (finalBox.w < 4 || finalBox.h < 4) return; // ignore tiny clicks

    // Capture selected text from browser selection
    const selectedText = window.getSelection()?.toString() || "";
    window.getSelection()?.removeAllRanges();

    onAddSelection({
        page: currentPage,
        text: selectedText,
        x: finalBox.x,
        y: finalBox.y,
        w: finalBox.w,
        h: finalBox.h,
    });
  };

  const onAddSelection = (sel) => {
    setSelections((prev) => [
      ...prev,
      { id: Date.now().toString(), page: currentPage, color: redactionColor, ...sel },
    ]);
  };

  const removeSelection = (id) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSelection = (id, newProps) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...newProps } : s))
    );
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Save Redaction â€” Save as New File
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const saveAsNewFile = async () => {
    const raw = localStorage.getItem("vdr_session");
    if (!raw) throw new Error("Session not found");
    const session = JSON.parse(raw);

    // 1. Get original PDF bytes (support original_file_path & secure_ to original_ fallback)
    let storagePath = doc.original_file_path || doc.file_path;
    if (storagePath && storagePath.includes("secure_") && !doc.original_file_path) {
      storagePath = storagePath.replace("secure_", "original_");
    }

    let { data: urlData, error: urlError } = await supabase.storage
      .from("original-files")
      .createSignedUrl(storagePath, 3600);

    if (urlError && doc.file_path && doc.file_path.includes("secure_")) {
      const candidate = doc.file_path.replace("secure_", "original_");
      const fallback = await supabase.storage
        .from("original-files")
        .createSignedUrl(candidate, 3600);
      if (!fallback.error && fallback.data) {
        urlData = fallback.data;
        urlError = null;
        storagePath = candidate;
      }
    }

    if (urlError && doc.file_path && storagePath !== doc.file_path) {
      const fallback = await supabase.storage
        .from("original-files")
        .createSignedUrl(doc.file_path, 3600);
      if (!fallback.error && fallback.data) {
        urlData = fallback.data;
        urlError = null;
        storagePath = doc.file_path;
      }
    }

    if (urlError) throw urlError;

    const pdfBytes = await fetch(urlData.signedUrl).then((r) =>
      r.arrayBuffer()
    );

    let redactedBytes;

    if (fileType === "pdf") {
      // 2. Use pdf-lib to burn redaction rectangles
      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (const sel of selections) {
        const pdfPage = pages[sel.page - 1];
        if (!pdfPage) continue;
        const { height: pageHeight } = pdfPage.getSize();

        // Convert from screen-space (top-left origin) to PDF-space (bottom-left origin)
        // Coordinates are at the current scale; convert back to PDF units
        const pdfX = sel.x / scale;
        const pdfY = pageHeight - (sel.y + sel.h) / scale;
        const pdfW = sel.w / scale;
        const pdfH = sel.h / scale;

        pdfPage.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: hexToPdfColor(sel.color, rgb),
          opacity: 1,
        });
      }

      redactedBytes = await pdfDoc.save();
    } else {
      // Non-PDF native redactions
      redactedBytes = await applyNativeRedactions(pdfBytes, fileType, selections);
    }

    // 3. Upload to redacted-files bucket
    const ext = doc.file_path ? doc.file_path.split(".").pop().toLowerCase() : "pdf";
    const fileName = doc.file_path
      ? doc.file_path.split("/").pop().replace(new RegExp(`\\.${ext}$`, "i"), "") + `_redacted.${ext}`
      : `document_${docId}_redacted.${ext}`;
    const redactedPath = `users/${session.id}/${fileName}`;

    // Default to application/octet-stream, then infer by extension
    let contentType = "application/pdf";
    if (ext === "txt") contentType = "text/plain";
    if (ext === "docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === "pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    const { error: uploadError } = await supabase.storage
      .from("redacted-files")
      .upload(redactedPath, new Blob([redactedBytes], { type: contentType }), {
        upsert: true,
        contentType: contentType,
      });
    if (uploadError) throw uploadError;

    // 4. Upsert into redacted_documents
    const { error: dbError } = await supabase
      .from("redacted_documents")
      .upsert(
        {
          document_id: docId,
          redacted_path: redactedPath,
          created_by: session.id,
        },
        { onConflict: "document_id" }
      );
    if (dbError) throw dbError;

    // 5. Persist text-region selections to DB
    // Delete existing first, then insert fresh
    await supabase
      .from("document_text_redactions")
      .delete()
      .eq("document_id", docId);

    if (selections.length > 0) {
      const rows = selections.map((s) => ({
        document_id: docId,
        page_number: s.page,
        selected_text: s.text || null,
        x: s.x,
        y: s.y,
        width: s.w,
        height: s.h,
        created_by: session.id,
      }));
      const { error: insError } = await supabase
        .from("document_text_redactions")
        .insert(rows);
      if (insError) throw insError;
    }
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Save Redaction â€” Overwrite Original
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const overwriteOriginal = async () => {
    const raw = localStorage.getItem("vdr_session");
    if (!raw) throw new Error("Session not found");
    const session = JSON.parse(raw);

    // 1. Get original PDF bytes (support original_file_path & secure_ to original_ fallback)
    let storagePath = doc.original_file_path || doc.file_path;
    if (storagePath && storagePath.includes("secure_") && !doc.original_file_path) {
      storagePath = storagePath.replace("secure_", "original_");
    }

    let { data: urlData, error: urlError } = await supabase.storage
      .from("original-files")
      .createSignedUrl(storagePath, 3600);

    if (urlError && doc.file_path && doc.file_path.includes("secure_")) {
      const candidate = doc.file_path.replace("secure_", "original_");
      const fallback = await supabase.storage
        .from("original-files")
        .createSignedUrl(candidate, 3600);
      if (!fallback.error && fallback.data) {
        urlData = fallback.data;
        urlError = null;
        storagePath = candidate;
      }
    }

    if (urlError && doc.file_path && storagePath !== doc.file_path) {
      const fallback = await supabase.storage
        .from("original-files")
        .createSignedUrl(doc.file_path, 3600);
      if (!fallback.error && fallback.data) {
        urlData = fallback.data;
        urlError = null;
        storagePath = doc.file_path;
      }
    }

    if (urlError) throw urlError;

    const pdfBytes = await fetch(urlData.signedUrl).then((r) =>
      r.arrayBuffer()
    );

    let redactedBytes;
    
    if (fileType === "pdf") {
      // 2. Burn rectangles with pdf-lib
      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (const sel of selections) {
        const pdfPage = pages[sel.page - 1];
        if (!pdfPage) continue;
        const { height: pageHeight } = pdfPage.getSize();
        const pdfX = sel.x / scale;
        const pdfY = pageHeight - (sel.y + sel.h) / scale;
        const pdfW = sel.w / scale;
        const pdfH = sel.h / scale;

        pdfPage.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: hexToPdfColor(sel.color, rgb),
          opacity: 1,
        });
      }

      redactedBytes = await pdfDoc.save();
    } else {
      // Non-PDF native redactions
      redactedBytes = await applyNativeRedactions(pdfBytes, fileType, selections);
    }

    // Default to application/octet-stream, then infer by extension
    const ext = doc.file_path ? doc.file_path.split(".").pop().toLowerCase() : "pdf";
    let contentType = "application/pdf";
    if (ext === "txt") contentType = "text/plain";
    if (ext === "docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === "pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    // 3. Upload back to original-files (overwrite)
    const { error: uploadError } = await supabase.storage
      .from("original-files")
      .upload(
        storagePath,
        new Blob([redactedBytes], { type: contentType }),
        { upsert: true, contentType: contentType }
      );
    if (uploadError) throw uploadError;

    // 4. Persist selections to DB
    await supabase
      .from("document_text_redactions")
      .delete()
      .eq("document_id", docId);

    if (selections.length > 0) {
      const rows = selections.map((s) => ({
        document_id: docId,
        page_number: s.page,
        selected_text: s.text || null,
        x: s.x,
        y: s.y,
        width: s.w,
        height: s.h,
        created_by: session.id,
      }));
      await supabase.from("document_text_redactions").insert(rows);
    }
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Apply save (dispatches to correct handler)
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleApplySave = async () => {
    if (!saveMode) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (saveMode === "new") {
        await saveAsNewFile();
      } else {
        await overwriteOriginal();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveSuccess(false);
        setSaveMode(null);
      }, 1500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(err.message || "Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Loading / error screens (original)
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full py-24">
        <FaSpinner className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-24 text-center">
        <p className="text-rose-600 font-semibold">{error}</p>
      </div>
    );
  }

  const pageIsRedacted = isPageRedacted(currentPage);
  const pageSelections = selections.filter((s) => s.page === currentPage);

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Render
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="flex flex-col items-center w-full h-full bg-[#FAFBFD]">

      
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 12px",
          flexWrap: "wrap",
          zIndex: 10,
        }}
      >
        {/* â”€â”€ Toolbar controls (all file types) â”€â”€ */}
        {(() => {
          // Context-aware label and nav disabled states per file type
          const isMultiPage = numPages > 1;
          const navDisabledPrev = currentPage <= 1;
          const navDisabledNext = currentPage >= numPages;
          const searchDisabled = fileType === "image";
          const pageLabel =
            (fileType === "xls" || fileType === "xlsx" || fileType === "csv") ? "Sheet" :
            fileType === "pptx" || fileType === "ppt" ? "Slide" :
            "Page";

          const selectionDisabled = fileType === "image" || fileType === "unknown";

          return (
            <>
              {/* Prev / Next */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={navDisabledPrev}
                title={`Previous ${pageLabel}`}
                style={toolbarBtnStyle(false, navDisabledPrev)}
              >
                <FaChevronLeft size={12} />
              </button>

              <span style={{ color: "#64748b", fontSize: "12px", minWidth: "80px", textAlign: "center", fontWeight: "500" }}>
                {currentPage} / {numPages || "?"}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={navDisabledNext}
                title={`Next ${pageLabel}`}
                style={toolbarBtnStyle(false, navDisabledNext)}
              >
                <FaChevronRight size={12} />
              </button>

              <div style={toolbarDivider} />

              {/* Zoom */}
              <button onClick={zoomOut} title="Zoom Out" style={toolbarBtnStyle()}>
                <FaSearchMinus size={13} />
              </button>

              <span style={{ color: "#475569", fontSize: "12px", minWidth: "44px", textAlign: "center", fontVariantNumeric: "tabular-nums", fontWeight: "500" }}>
                {Math.round(scale * 100)}%
              </span>

              <button onClick={zoomIn} title="Zoom In" style={toolbarBtnStyle()}>
                <FaSearchPlus size={13} />
              </button>

              <div style={toolbarDivider} />

              {/* Selection Tool */}
              <button
                onClick={() => !selectionDisabled && setTool(tool === "select" ? "pointer" : "select")}
                title={selectionDisabled ? "Selection tool is not supported for images" : "Selection Tool"}
                disabled={selectionDisabled}
                style={toolbarBtnStyle(tool === "select" && !selectionDisabled, selectionDisabled)}
              >
                <FaMousePointer size={13} />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>Selection</span>
              </button>
              
              {/* Color Picker */}
              <div style={{ position: "relative", display: "inline-block", marginLeft: "4px" }}>
                <input
                  type="color"
                  value={redactionColor}
                  onChange={(e) => setRedactionColor(e.target.value)}
                  title="Redaction Color"
                  style={{
                    width: "24px",
                    height: "24px",
                    padding: "0",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: "none",
                  }}
                />
              </div>

              {/* Undo Selection */}
              <button
                onClick={() => setSelections(prev => prev.slice(0, -1))}
                disabled={selections.length === 0}
                title="Undo Last Selection"
                style={toolbarBtnStyle(false, selections.length === 0)}
              >
                <FaUndo size={13} />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>Undo</span>
              </button>

              <div style={toolbarDivider} />

              {/* Search â€” disabled for images */}
              <button
                onClick={() => !searchDisabled && setSearchOpen((o) => !o)}
                title={searchDisabled ? "Search is not supported for images" : "Search"}
                disabled={searchDisabled}
                style={toolbarBtnStyle(searchOpen && !searchDisabled, searchDisabled)}
              >
                <FaSearch size={13} />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>Search</span>
              </button>

              {searchOpen && !searchDisabled && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveMatchIndex(0);
                    }}
                    placeholder="Search textâ€¦"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      color: "#0f172a",
                      fontSize: "12px",
                      padding: "4px 8px",
                      outline: "none",
                      width: "160px",
                    }}
                  />
                  {searchQuery && totalMatches > 0 && (
                    <>
                      <span style={{ fontSize: "11px", color: "#64748b", margin: "0 4px", fontWeight: "500" }}>
                        {activeMatchIndex + 1} / {totalMatches}
                      </span>
                      <button
                        onClick={() => setActiveMatchIndex((prev) => (prev > 0 ? prev - 1 : totalMatches - 1))}
                        style={{ ...toolbarBtnStyle(), padding: "4px 6px", border: "1px solid #e2e8f0" }}
                        title="Previous Match"
                      >
                        <FaChevronLeft size={10} />
                      </button>
                      <button
                        onClick={() => setActiveMatchIndex((prev) => (prev < totalMatches - 1 ? prev + 1 : 0))}
                        style={{ ...toolbarBtnStyle(), padding: "4px 6px", border: "1px solid #e2e8f0" }}
                        title="Next Match"
                      >
                        <FaChevronRight size={10} />
                      </button>
                    </>
                  )}
                  {searchQuery && totalMatches === 0 && (
                    <span style={{ fontSize: "11px", color: "#ef4444", margin: "0 4px", fontWeight: "500" }}>
                      0 / 0
                    </span>
                  )}
                </div>
              )}

              <div style={toolbarDivider} />

              {/* Save Redaction */}
              <button
                onClick={() => {
                  setSaveError(null);
                  setSaveSuccess(false);
                  setSaveMode(null);
                  setShowSaveDialog(true);
                }}
                disabled={selections.length === 0}
                title="Save Redaction"
                style={{
                  ...toolbarBtnStyle(false, selections.length === 0),
                  background: selections.length === 0 ? "transparent" : "#dc2626",
                  color: selections.length === 0 ? "#94a3b8" : "#fff",
                  fontWeight: 600,
                }}
              >
                <FaSave size={13} />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>Save Redaction</span>
              </button>
            </>
          );
        })()}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Close */}
        <button
          onClick={() => window.history.back()}
          title="Close"
          style={toolbarBtnStyle()}
        >
          <FaTimes size={13} />
          <span style={{ fontSize: "11px", marginLeft: "4px" }}>Close</span>
        </button>
      </div>

      {/* â”€â”€ Selections panel (below toolbar) â”€â”€ */}
      {selections.length > 0 && (
        <div
          style={{
            width: "100%",
            background: "#0f172a",
            borderBottom: "1px solid #1e293b",
            padding: "4px 12px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>
            REDACTIONS ({selections.length}):
          </span>
          {selections.map((s) => (
            <span
              key={s.id}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "4px",
                color: "#94a3b8",
                fontSize: "10px",
                padding: "2px 6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              P{s.page} {s.text ? `"${s.text.slice(0, 20)}${s.text.length > 20 ? "â€¦" : ""}"` : `[${Math.round(s.w)}Ã—${Math.round(s.h)}]`}
              <button
                onClick={() => removeSelection(s.id)}
                style={{ color: "#ef4444", cursor: "pointer", lineHeight: 1, background: "none", border: "none", padding: 0 }}
              >
                <FaTimes size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* â”€â”€ Document name / pagination header (original, PDF-only nav buttons kept) â”€â”€ */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-3">
        <h1
          className="text-lg font-bold text-slate-800 truncate"
          title={doc?.name}
        >
          <FaFileAlt className="inline mr-2 text-slate-400" />
          {doc?.name}
        </h1>
        {fileType === "pdf" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {numPages || "?"}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ Page Content â”€â”€ */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-start justify-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-auto p-4 mx-4 mb-4"
        style={{ minHeight: "500px" }}
      >
        {/* â”€â”€ PDF viewer (original, unchanged) â”€â”€ */}
        {fileType === "pdf" && (
          pageIsRedacted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400 w-full">
              <FaLock className="w-10 h-10" />
              <span className="text-base font-semibold text-slate-500">
                This page is redacted
              </span>
            </div>
          ) : (
            <>
              {pageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                  <FaSpinner className="w-5 h-5 text-brand animate-spin" />
                </div>
              )}

              {/* Canvas + text layer + overlay, all stacked */}
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* PDF render canvas */}
                <canvas ref={canvasRef} className="max-w-full h-auto shadow-sm" />

                {/* Text layer (transparent, on top of canvas for selection) */}
                <div
                  ref={textLayerRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    overflow: "hidden",
                    lineHeight: 1,
                    pointerEvents: tool === "select" ? "none" : "auto",
                  }}
                />

                {/* Interaction overlay (captures drag for region selection) */}
                <div
                  ref={overlayRef}
                  onMouseDown={handleOverlayMouseDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={handleOverlayMouseUp}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    cursor: tool === "select" ? "crosshair" : "default",
                    zIndex: 2,
                    userSelect: "none",
                  }}
                >
                  {/* Committed selections for this page */}
                  {pageSelections.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        position: "absolute",
                        left: s.x,
                        top: s.y,
                        width: s.w,
                        height: s.h,
                        background: hexToRgba(s.color, 0.45),
                        border: "2px solid rgba(220,38,38,0.8)",
                        boxSizing: "border-box",
                        cursor: "default",
                      }}
                      title={s.text || "Redacted region"}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(s.id);
                        }}
                        style={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          width: 18,
                          height: 18,
                          background: "#dc2626",
                          border: "none",
                          borderRadius: "50%",
                          color: "#fff",
                          fontSize: 9,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                          zIndex: 3,
                          padding: 0,
                        }}
                      >
                        <FaTimes size={8} />
                      </button>
                    </div>
                  ))}

                  {/* Live drag rectangle */}
                  {dragBox && dragBox.w > 2 && dragBox.h > 2 && (
                    <div
                      style={{
                        position: "absolute",
                        left: dragBox.x,
                        top: dragBox.y,
                        width: dragBox.w,
                        height: dragBox.h,
                        background: "rgba(0,0,0,0.3)",
                        border: "2px dashed rgba(220,38,38,0.9)",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )
        )}

        {/* â”€â”€ Word viewer (DOC / DOCX) â”€â”€ */}
        {(fileType === "word") && fileUrl && (
          <div style={{ width: "100%" }}>
            <WordViewer
              url={fileUrl}
              scale={scale}
              searchQuery={searchQuery}
              activeMatchIndex={activeMatchIndex}
              onSearchResults={(count) => setTotalMatches(count)}
              onNumPages={(n) => setNumPages(n)}
              tool={tool}
              selections={selections}
              onAddSelection={onAddSelection}
              onRemoveSelection={removeSelection}
              onUpdateSelection={updateSelection}
            />
          </div>
        )}

        {/* â”€â”€ Excel viewer (XLS / XLSX / CSV) â”€â”€ */}
        {(fileType === "xls" || fileType === "xlsx" || fileType === "csv") && fileUrl && (
          <div style={{ width: "100%" }}>
            <ExcelViewer
              url={fileUrl}
              currentPage={currentPage - 1}
              scale={scale}
              searchQuery={searchQuery}
              activeMatchIndex={activeMatchIndex}
              onSearchResults={(count) => setTotalMatches(count)}
              onNumPages={(n) => { setNumPages(n); setCurrentPage(1); }}
              tool={tool}
              selections={pageSelections}
              onAddSelection={onAddSelection}
              onRemoveSelection={removeSelection}
              onUpdateSelection={updateSelection}
            />
          </div>
        )}

        {/* â”€â”€ PowerPoint viewer (PPTX) â”€â”€ */}
        {(fileType === "pptx" || fileType === "ppt") && fileUrl && (
          <div style={{ width: "100%" }}>
            <PowerPointViewer
              url={fileUrl}
              fileExt={fileType}
              currentPage={currentPage - 1}
              scale={scale}
              searchQuery={searchQuery}
              activeMatchIndex={activeMatchIndex}
              onSearchResults={(count) => setTotalMatches(count)}
              onNumPages={(n) => { setNumPages(n); setCurrentPage(1); }}
              tool={tool}
              selections={pageSelections}
              onAddSelection={onAddSelection}
              onRemoveSelection={removeSelection}
              onUpdateSelection={updateSelection}
            />
          </div>
        )}

        {/* â”€â”€ Text viewer (TXT) â”€â”€ */}
        {fileType === "text" && fileUrl && (
          <div style={{ width: "100%" }}>
            <TextViewer
              url={fileUrl}
              scale={scale}
              searchQuery={searchQuery}
              activeMatchIndex={activeMatchIndex}
              onSearchResults={(count) => setTotalMatches(count)}
              onNumPages={(n) => setNumPages(n)}
              tool={tool}
              selections={pageSelections}
              onAddSelection={onAddSelection}
              onRemoveSelection={removeSelection}
              onUpdateSelection={updateSelection}
            />
          </div>
        )}

        {/* â”€â”€ Image viewer (PNG / JPG / JPEG) â”€â”€ */}
        {fileType === "image" && fileUrl && (
          <div style={{ width: "100%" }}>
            <ImageViewer
              url={fileUrl}
              name={doc?.name}
              scale={scale}
              onNumPages={(n) => setNumPages(n)}
              tool={tool}
              selections={pageSelections}
              onAddSelection={onAddSelection}
              onRemoveSelection={removeSelection}
              onUpdateSelection={updateSelection}
            />
          </div>
        )}

        {/* â”€â”€ Unknown file type fallback â”€â”€ */}
        {fileType === "unknown" && fileUrl && (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ“„</div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "#334155", marginBottom: 8 }}>
              Preview not available for this file type.
            </p>
            <a
              href={fileUrl}
              download
              style={{
                display: "inline-block",
                padding: "10px 22px",
                background: "var(--brand)",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Download File
            </a>
          </div>
        )}
      </div>

      {/* â”€â”€ Save Redaction Dialog â”€â”€ */}
      {showSaveDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              overflow: "hidden",
              fontFamily: "inherit",
            }}
          >
            {/* Dialog header */}
            <div
              style={{
                background: "var(--brand)",
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}>
                  Apply Redactions
                </div>
                <div style={{ color: "var(--brand-50)", fontSize: "12px", marginTop: "2px", opacity: 0.9 }}>
                  Choose how to save the redacted document
                </div>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{ color: "#ffffff", background: "none", border: "none", cursor: "pointer", lineHeight: 1, opacity: 0.8 }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Options */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Overwrite Original */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: `2px solid ${saveMode === "overwrite" ? "#dc2626" : "#e2e8f0"}`,
                  background: saveMode === "overwrite" ? "#fff5f5" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="overwrite"
                  checked={saveMode === "overwrite"}
                  onChange={() => setSaveMode("overwrite")}
                  style={{ marginTop: "2px", accentColor: "#dc2626" }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>
                    Overwrite Original
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Replace the PDF in <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "3px" }}>original-files</code>. This cannot be undone.
                  </div>
                </div>
              </label>

              {/* Save as New File */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: `2px solid ${saveMode === "new" ? "var(--brand)" : "#e2e8f0"}`,
                  background: saveMode === "new" ? "var(--brand-soft)" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="saveMode"
                  value="new"
                  checked={saveMode === "new"}
                  onChange={() => setSaveMode("new")}
                  style={{ marginTop: "2px", accentColor: "var(--brand)" }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>
                    Save as New File
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Generate a redacted PDF and upload to <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "3px" }}>redacted-files</code>. Original is untouched.
                  </div>
                </div>
              </label>

              {/* Error */}
              {saveError && (
                <div style={{ color: "#dc2626", fontSize: "12px", background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "8px", padding: "8px 12px" }}>
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => { setShowSaveDialog(false); setSaveMode(null); setSaveError(null); }}
                disabled={isSaving}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleApplySave}
                disabled={!saveMode || isSaving || saveSuccess}
                style={{
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: saveSuccess
                    ? "#16a34a"
                    : !saveMode || isSaving
                    ? "#94a3b8"
                    : saveMode === "overwrite"
                    ? "#dc2626"
                    : "var(--brand)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: !saveMode || isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.2s",
                }}
              >
                {isSaving ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Savingâ€¦
                  </>
                ) : saveSuccess ? (
                  <>
                    <FaCheck size={12} /> Saved!
                  </>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ CSS for spinner animation â”€â”€ */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Toolbar style helpers
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toolbarBtnStyle(active = false, disabled = false) {
  return {
    display: "flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: "6px",
    border: "1px solid",
    borderColor: active ? "var(--brand)" : "transparent",
    background: active ? "var(--brand)" : "transparent",
    color: disabled ? "#94a3b8" : active ? "#ffffff" : "#475569",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "12px",
    transition: "all 0.15s",
    gap: "4px",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
}

const toolbarDivider = {
  width: "1px",
  height: "20px",
  background: "#e2e8f0",
  margin: "0 4px",
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Page export (wrapped in Suspense, original)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function DocumentViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full w-full py-24">
          <FaSpinner className="w-6 h-6 text-brand animate-spin" />
        </div>
      }
    >
      <DocumentViewerContent />
    </Suspense>
  );
}
