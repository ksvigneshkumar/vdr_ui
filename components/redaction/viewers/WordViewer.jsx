"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";

import SelectionOverlay from "@/components/redaction/SelectionOverlay";

/**
 * WordViewer
 * Renders DOC / DOCX files using the `docx-preview` library.
 *
 * Props:
 *   url          – signed URL to the file (string)
 *   scale        – zoom level from shared toolbar (number, default 1.5)
 *   searchQuery  – text to highlight from shared toolbar (string)
 *   onNumPages   – callback(n) called once after render to report page count
 *   tool
 *   selections
 *   onAddSelection
 *   onRemoveSelection
 *   onUpdateSelection
 */
export default function WordViewer({
  url,
  scale = 1.5,
  searchQuery = "",
  onNumPages,
  tool,
  selections = [],
  onAddSelection,
  onRemoveSelection,
  onUpdateSelection,
  activeMatchIndex = -1,
  onSearchResults,
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  // ── Initial render ──────────────────────────────────────
  useEffect(() => {
    if (!url || !containerRef.current) return;

    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(null);
      setRendered(false);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        const { renderAsync } = await import("docx-preview");

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        if (cancelled) return;

        await renderAsync(arrayBuffer, containerRef.current, null, {
          className: "docx-viewer",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          debug: false,
        });

        if (!cancelled) {
          setRendered(true);
          // Count page sections rendered by docx-preview
          const sections = containerRef.current?.querySelectorAll(".docx-wrapper > section, .docx section, section.docx");
          const count = sections && sections.length > 0 ? sections.length : 1;
          onNumPages?.(count);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("WordViewer error:", err);
          setError(err.message || "Failed to render Word document.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // ── Apply zoom via CSS transform ─────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = `scale(${scale / 1.5})`;
    containerRef.current.style.transformOrigin = "top center";
  }, [scale]);

  // ── Highlight search matches ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !rendered) return;

    // Remove previous highlights
    containerRef.current.querySelectorAll("mark.vdr-highlight").forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      }
    });

    const query = searchQuery.trim();
    if (!query) {
      onSearchResults?.(0);
      return;
    }

    highlightTextInContainer(containerRef.current, query);

    // Count and report matches
    const marks = containerRef.current.querySelectorAll("mark.vdr-highlight");
    onSearchResults?.(marks.length);
  }, [searchQuery, rendered, onSearchResults]);

  // ── Navigate active search match ─────────────────────────
  useEffect(() => {
    if (!containerRef.current || !rendered) return;
    const marks = containerRef.current.querySelectorAll("mark.vdr-highlight");
    marks.forEach((m, i) => {
      if (i === activeMatchIndex) {
        m.style.background = "#f97316";
        m.style.color = "#fff";
        m.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        m.style.background = "#fef08a";
        m.style.color = "inherit";
      }
    });
  }, [activeMatchIndex, searchQuery, rendered]);

  // ── Semantic redaction detection ────────────────────────────────────────────
  /**
   * Intercepts the raw {x,y,w,h} box from SelectionOverlay, walks all DOM text
   * nodes inside the rendered DOCX that visually overlap the drawn rectangle,
   * and enriches the selection with a `redactionTarget` before forwarding to
   * the parent.  Nothing is modified in the document.
   *
   * Coordinate system:
   *   SelectionOverlay wraps containerRef.current inside
   *     <div style="position: relative; width: 100%">   ← wrapperDiv
   *       {containerRef.current}
   *       <div ref={overlayRef} style="position: absolute; top:0; left:0" />
   *     </div>
   *   sel.x / sel.y are relative to overlayRef, which equals wrapperDiv's rect.
   *   So: containerRef.current.parentElement.getBoundingClientRect() gives the
   *   origin we need to convert absolute text-node rects into sel-space.
   */
  const handleAddSelection = useCallback(
    (rawSel) => {
      const enriched = { ...rawSel };

      try {
        if (containerRef.current) {
          // containerRef is a direct child of SelectionOverlay's relative wrapper.
          const wrapperRect = containerRef.current.parentElement?.getBoundingClientRect();

          if (wrapperRect) {
            const matchInfo = collectTextNodesInBox(
              containerRef.current,
              rawSel,
              wrapperRect
            );

            if (matchInfo && matchInfo.matchedText) {
              enriched.redactionTarget = {
                type: "word",
                matchedText: matchInfo.matchedText,
                matchOccurrenceIndex: matchInfo.matchOccurrenceIndex,
                replacement: "████████",
              };
            }
          }
        }
      } catch (err) {
        console.warn("WordViewer: redaction detection failed:", err);
      }

      onAddSelection(enriched);
    },
    [onAddSelection]
  );

  return (
    <div style={{ width: "100%", minHeight: "400px", position: "relative", overflow: "auto" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.8)",
            zIndex: 5,
          }}
        >
          <FaSpinner
            style={{ width: 24, height: 24, color: "var(--brand)", animation: "spin 0.7s linear infinite" }}
          />
          <span style={{ marginLeft: 10, color: "#64748b", fontSize: 14 }}>Rendering document…</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "24px",
            color: "#dc2626",
            background: "#fff5f5",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            margin: 16,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* docx-preview renders directly into containerRef */}
      <SelectionOverlay
        tool={tool}
        selections={selections}
        onAddSelection={handleAddSelection}
        onRemoveSelection={onRemoveSelection}
        onUpdateSelection={onUpdateSelection}
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            background: "#fff",
            padding: "0 16px",
            transition: "transform 0.15s ease",
          }}
        />
      </SelectionOverlay>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .docx-viewer {
          font-family: "Times New Roman", Times, serif;
          color: #1e293b;
          line-height: 1.6;
        }
        .docx-viewer section.docx {
          box-shadow: 0 1px 8px rgba(0,0,0,0.12);
          margin: 16px auto !important;
          border-radius: 4px;
        }
        mark.vdr-highlight {
          background: #fef08a;
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOM helpers for semantic redaction detection
───────────────────────────────────────────────────────────────────────────── */

/**
 * Walk all non-empty text nodes inside `container`, find those whose visual
 * bounding rect (in coordinates relative to `wrapperRect`) overlaps `sel`,
 * and return their concatenated text content.
 *
 * Returns null when no text is found (so the caller can skip adding a target).
 */
function collectTextNodesInBox(container, sel, wrapperRect) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const parts = [];
  let node;
  let globalTextPrefix = "";
  let matchStartGlobalOffset = -1;

  while ((node = walker.nextNode())) {
    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      
      let nodeOverlaps = false;
      for (const r of rects) {
        const rx = r.left - wrapperRect.left;
        const ry = r.top - wrapperRect.top;
        if (rectsOverlap({ x: rx, y: ry, w: r.width, h: r.height }, sel)) {
          nodeOverlaps = true;
          break;
        }
      }

      const text = node.nodeValue;

      if (nodeOverlaps) {
        let minOffset = text.length;
        let maxOffset = -1;
        
        for (let i = 0; i < text.length; i++) {
          if (/\s/.test(text[i])) continue;
          
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          
          const charRects = range.getClientRects();
          let charOverlaps = false;
          
          for (let j = 0; j < charRects.length; j++) {
            const cr = charRects[j];
            const crx = cr.left - wrapperRect.left;
            const cry = cr.top - wrapperRect.top;
            
            if (rectsOverlap({ x: crx, y: cry, w: cr.width, h: cr.height }, sel)) {
              charOverlaps = true;
              break;
            }
          }
          
          if (charOverlaps) {
            if (i < minOffset) minOffset = i;
            if (i > maxOffset) maxOffset = i;
          }
        }
        
        if (maxOffset >= minOffset) {
          if (matchStartGlobalOffset === -1) {
            matchStartGlobalOffset = globalTextPrefix.length + minOffset;
          }
          parts.push(text.substring(minOffset, maxOffset + 1));
        }
      }
      
      globalTextPrefix += text;
    } catch {
      // Ignore Range API errors on detached / shadow-DOM nodes
    }
  }

  const matchedText = parts.length > 0 ? parts.join(" ") : null;
  if (!matchedText) return null;

  // Calculate occurrence index based on non-whitespace text
  const strippedDocBeforeMatch = globalTextPrefix.substring(0, matchStartGlobalOffset).replace(/\s/g, "");
  const strippedMatch = matchedText.replace(/\s/g, "");
  
  // We need to count how many times strippedMatch could have matched before this point.
  // Let's just collect all text to find the full occurrence count.
  // Actually, wait, globalTextPrefix currently contains the entire document because the while loop finishes!
  const fullStrippedDoc = globalTextPrefix.replace(/\s/g, "");
  
  let matchOccurrenceIndex = 0;
  let idx = fullStrippedDoc.indexOf(strippedMatch);
  while (idx !== -1 && idx < strippedDocBeforeMatch.length) {
    matchOccurrenceIndex++;
    idx = fullStrippedDoc.indexOf(strippedMatch, idx + 1);
  }

  return { matchedText, matchOccurrenceIndex };
}

/** True when rectangle a and rectangle b overlap (all coords: x,y = top-left). */
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Walk all text nodes in `container` and wrap matches of `query`
 * in <mark class="vdr-highlight"> elements.
 */
function highlightTextInContainer(container, query) {
  const re = new RegExp(escapeRegExp(query), "gi");
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue || "";
    if (!re.test(value)) return;
    re.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = re.exec(value)) !== null) {
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
      }
      const mark = document.createElement("mark");
      mark.className = "vdr-highlight";
      mark.textContent = match[0];
      frag.appendChild(mark);
      lastIndex = re.lastIndex;
    }

    if (lastIndex < value.length) {
      frag.appendChild(document.createTextNode(value.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
