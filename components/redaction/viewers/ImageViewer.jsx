"use client";

import React, { useState, useEffect } from "react";
import SelectionOverlay from "@/components/redaction/SelectionOverlay";

/**
 * ImageViewer
 * Renders PNG / JPG / JPEG images with zoom controlled by the shared toolbar.
 *
 * Props:
 *   url         – signed URL to the image (string)
 *   name        – document name for alt text (string)
 *   scale       – zoom level from shared toolbar (number, default 1.5)
 *   onNumPages  – callback(1) — images are a single "page"
 *   tool
 *   selections
 *   onAddSelection
 *   onRemoveSelection
 *   onUpdateSelection
 *
 * Note: Search is not supported for images. The toolbar Search button
 * is disabled by the parent when fileType === "image".
 */
export default function ImageViewer({ 
  url, 
  name, 
  scale = 1.5, 
  onNumPages,
  tool,
  selections = [],
  onAddSelection,
  onRemoveSelection,
  onUpdateSelection,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Report single page to toolbar on mount
  useEffect(() => {
    onNumPages?.(1);
  }, []);

  // Map toolbar scale (default 1.5) → image transform scale
  // At toolbar scale=1.5 → image at 100%; steps are ±0.25
  const imageScale = scale / 1.5;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Image container */}
      <div
        style={{
          width: "100%",
          overflow: "auto",
          padding: 24,
          background: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: 300,
          position: "relative"
        }}
      >
        <SelectionOverlay
          tool={tool}
          selections={selections}
          onAddSelection={onAddSelection}
          onRemoveSelection={onRemoveSelection}
          onUpdateSelection={onUpdateSelection}
        >
          {error ? (
            <div style={{ color: "#dc2626", padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Failed to load image.</p>
              <a href={url} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", fontSize: 13 }}>
                Open image in a new tab
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={name || "Document image"}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              style={{
                maxWidth: "100%",
                transform: `scale(${imageScale})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
                display: "block",
                boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                borderRadius: 4,
                opacity: loaded ? 1 : 0,
              }}
            />
          )}

          {!loaded && !error && (
            <div style={{ position: "absolute", color: "#94a3b8", fontSize: 14 }}>
              Loading image…
            </div>
          )}
        </SelectionOverlay>
      </div>
    </div>
  );
}
