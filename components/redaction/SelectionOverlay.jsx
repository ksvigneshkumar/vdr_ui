import React, { useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function SelectionOverlay({
  tool,
  selections,
  onAddSelection,
  onRemoveSelection,
  onUpdateSelection, // For resizing
  children,
}) {
  const overlayRef = useRef(null);
  const [dragBox, setDragBox] = useState(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const getRelativePos = (e, el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (tool !== "select") return;

    // Check if clicking on a resize handle
    if (e.target.dataset.resizeHandle) {
      e.stopPropagation();
      const selId = e.target.dataset.selId;
      const handle = e.target.dataset.handle;
      const sel = selections.find((s) => s.id == selId);
      if (sel) {
        resizeRef.current = {
          id: selId,
          handle,
          startX: e.clientX,
          startY: e.clientY,
          startSel: { ...sel },
        };
      }
      return;
    }

    e.preventDefault();
    const pos = getRelativePos(e, overlayRef.current);
    dragRef.current = { startX: pos.x, startY: pos.y };
    setDragBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (tool !== "select") return;

    if (resizeRef.current) {
      const { id, handle, startX, startY, startSel } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newX = startSel.x;
      let newY = startSel.y;
      let newW = startSel.w;
      let newH = startSel.h;

      if (handle.includes("e")) newW += dx;
      if (handle.includes("s")) newH += dy;
      if (handle.includes("w")) {
        newX += dx;
        newW -= dx;
      }
      if (handle.includes("n")) {
        newY += dy;
        newH -= dy;
      }

      if (newW < 10) newW = 10;
      if (newH < 10) newH = 10;

      if (onUpdateSelection) {
        onUpdateSelection(id, { x: newX, y: newY, w: newW, h: newH });
      }
      return;
    }

    if (!dragRef.current) return;
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

  const handleMouseUp = (e) => {
    if (tool !== "select") return;

    if (resizeRef.current) {
      resizeRef.current = null;
      return;
    }

    if (!dragRef.current) return;

    const finalBox = { ...dragBox };
    dragRef.current = null;
    setDragBox(null);

    if (finalBox.w < 4 || finalBox.h < 4) return;

    const selectedText = window.getSelection()?.toString() || "";
    window.getSelection()?.removeAllRanges();

    onAddSelection({
      text: selectedText,
      x: finalBox.x,
      y: finalBox.y,
      w: finalBox.w,
      h: finalBox.h,
    });
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {children}
      <div
        ref={overlayRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          cursor: tool === "select" ? "crosshair" : "default",
          zIndex: 10,
          userSelect: tool === "select" ? "none" : "auto",
          pointerEvents: tool === "select" ? "auto" : "none",
        }}
      >
        {selections.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: "rgba(0,0,0,0.52)",
              border: "2px solid rgba(220,38,38,0.85)",
              boxSizing: "border-box",
              pointerEvents: tool === "select" ? "auto" : "none",
            }}
          >
            {/* ── Redaction preview label (shown when semantic target is known) ── */}
            {s.redactionTarget && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  padding: "2px 6px",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#e2e8f0",
                    fontFamily: "monospace",
                    letterSpacing: s.redactionTarget.type === "excel" ? 0 : 2,
                    background: "rgba(0,0,0,0.55)",
                    padding: "1px 6px",
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  {s.redactionTarget.type === "excel"
                    ? `REDACTED: ${
                        s.redactionTarget.cells?.map((c) => c.address).join(", ") || "—"
                      }`
                    : "████████"}
                </span>
              </div>
            )}

            {tool === "select" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSelection(s.id);
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
                    zIndex: 3,
                  }}
                >
                  <FaTimes size={8} />
                </button>
                {/* Resize handle (bottom-right) */}
                <div
                  data-resize-handle="true"
                  data-sel-id={s.id}
                  data-handle="se"
                  style={{
                    position: "absolute",
                    bottom: -5,
                    right: -5,
                    width: 10,
                    height: 10,
                    background: "#dc2626",
                    cursor: "se-resize",
                    zIndex: 3,
                  }}
                />
              </>
            )}
          </div>
        ))}
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
  );
}
