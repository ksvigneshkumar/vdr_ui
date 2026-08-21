/**
 * redactionProcessor.js
 * Applies redactions to non-PDF files natively in the browser.
 */

/**
 * Applies semantic redaction to file bytes based on file type.
 * @param {ArrayBuffer} fileBytes - The original file bytes.
 * @param {string} fileExt - The file extension (e.g., 'docx', 'xlsx', 'pptx', 'txt').
 * @param {Array} selections - The selection data containing redactionTargets.
 * @returns {Promise<Uint8Array>} - The mutated file bytes.
 */
export async function applyNativeRedactions(fileBytes, fileExt, selections) {
  if (!selections || selections.length === 0) {
    return new Uint8Array(fileBytes);
  }

  const ext = fileExt.toLowerCase();

  if (ext === "text" || ext === "txt") {
    return applyTextRedaction(fileBytes, selections);
  }

  if (ext === "excel" || ext === "xls" || ext === "xlsx" || ext === "csv") {
    return await applyExcelRedaction(fileBytes, selections, ext);
  }

  if (ext === "pptx") {
    return await applyPowerPointRedaction(fileBytes, selections);
  }

  if (ext === "word" || ext === "docx") {
    return await applyWordRedaction(fileBytes, selections);
  }

  // Fallback (or unsupported like .doc, .ppt which we can't reliably edit in browser)
  console.warn(`Native redaction for ${ext} is not implemented. Returning original file.`);
  return new Uint8Array(fileBytes);
}

/* ─────────────────────────────────────────────────────────────────────────────
   TXT Redaction
───────────────────────────────────────────────────────────────────────────── */
function applyTextRedaction(fileBytes, selections) {
  const decoder = new TextDecoder("utf-8");
  let text = decoder.decode(fileBytes);
  
  let chars = Array.from(text);

  for (const sel of selections) {
    const target = sel.redactionTarget;
    if (target?.type === "text" && target.matchedText) {
      const searchChars = Array.from(target.matchedText).filter(c => !/\s/.test(c));
      if (searchChars.length === 0) continue;
      
      let occurrenceCount = 0;
      let targetOccurrence = target.matchOccurrenceIndex !== undefined ? target.matchOccurrenceIndex : -1;

      for (let i = 0; i <= chars.length - searchChars.length; i++) {
        // Skip searching if current char is whitespace
        if (/\s/.test(chars[i])) continue;

        let match = true;
        let pSearch = 0;
        let pDoc = i;

        while (pSearch < searchChars.length && pDoc < chars.length) {
          if (/\s/.test(chars[pDoc])) {
            pDoc++;
            continue;
          }
          if (chars[pDoc] !== searchChars[pSearch]) {
            match = false;
            break;
          }
          pSearch++;
          pDoc++;
        }

        if (match && pSearch === searchChars.length) {
          if (targetOccurrence === -1 || occurrenceCount === targetOccurrence) {
            chars[i] = target.replacement || "████████";
            for (let j = i + 1; j < pDoc; j++) {
              if (!/\s/.test(chars[j])) {
                 chars[j] = "";
              }
            }
            if (targetOccurrence !== -1) break;
          }
          occurrenceCount++;
        }
      }
    }
  }

  const encoder = new TextEncoder();
  return encoder.encode(chars.join(""));
}

/* ─────────────────────────────────────────────────────────────────────────────
   XLSX / CSV Redaction
───────────────────────────────────────────────────────────────────────────── */
async function applyExcelRedaction(fileBytes, selections, ext) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(fileBytes, { type: "array" });

  for (const sel of selections) {
    const target = sel.redactionTarget;
    if (target?.type === "excel" && target.cells) {
      for (const cell of target.cells) {
        const sheet = workbook.Sheets[cell.sheet];
        if (sheet && sheet[cell.address]) {
          sheet[cell.address].v = target.replacement || "REDACTED";
          sheet[cell.address].t = "s"; // Force to string type
          // Remove formatted text so SheetJS regenerates it
          if (sheet[cell.address].w) {
            delete sheet[cell.address].w;
          }
        }
      }
    }
  }

  // Choose bookType
  let bookType = "xlsx";
  if (ext === "csv") bookType = "csv";
  if (ext === "xls") bookType = "xls"; // SheetJS community may just output basic BIFF8 or fail, but we'll attempt it.

  const outArrayBuffer = XLSX.write(workbook, { type: "array", bookType });
  return new Uint8Array(outArrayBuffer);
}

/* ─────────────────────────────────────────────────────────────────────────────
   PPTX Redaction
───────────────────────────────────────────────────────────────────────────── */
async function applyPowerPointRedaction(fileBytes, selections) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(fileBytes);

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  // Group selections by slideIndex to minimize XML parsing
  const slideMap = new Map();
  for (const sel of selections) {
    const target = sel.redactionTarget;
    if (target?.type === "pptx") {
      const idx = target.slideIndex;
      if (!slideMap.has(idx)) slideMap.set(idx, []);
      slideMap.get(idx).push(target);
    }
  }

  for (const [slideIndex, targets] of slideMap.entries()) {
    const slideNum = slideIndex + 1;
    const slidePath = `ppt/slides/slide${slideNum}.xml`;
    const xmlFile = zip.file(slidePath);
    if (!xmlFile) continue;

    const xmlStr = await xmlFile.async("string");
    const doc = parser.parseFromString(xmlStr, "application/xml");

    // PowerPoint paragraphs are grouped in <p:sp> (shapes) -> <a:txBody> -> <a:p>
    const spTrees = doc.querySelectorAll("sp");
    let globalBlockIndex = 0;

    spTrees.forEach((sp) => {
      const txBody = sp.querySelector("txBody");
      if (!txBody) return;

      const paras = txBody.querySelectorAll("p");
      paras.forEach((p) => {
        // Does this paragraph contain any text?
        const runs = p.querySelectorAll("t");
        const textContent = Array.from(runs).map(t => t.textContent).join("").trim();
        
        if (textContent) {
          // Check if this block index is targeted by any selection
          for (const target of targets) {
            const targetIdx = target.blockIndices ? target.blockIndices.indexOf(globalBlockIndex) : -1;
            if (targetIdx !== -1) {
              const exactMatch = target.exactMatches ? target.exactMatches[targetIdx] : null;

              if (!exactMatch) {
                // Fallback: Replace all text in this paragraph.
                const allRuns = p.querySelectorAll("r");
                let first = true;
                allRuns.forEach(r => {
                  if (first) {
                    const tNode = r.querySelector("t");
                    if (tNode) tNode.textContent = target.replacement || "████████";
                    first = false;
                  } else {
                    r.parentNode.removeChild(r);
                  }
                });
              } else {
                // Precise substring replacement
                const tNodes = Array.from(p.querySelectorAll("t"));
                if (tNodes.length > 0) {
                  let fullText = "";
                  const charMap = [];

                  for (const node of tNodes) {
                    const text = node.textContent || "";
                    for (let i = 0; i < text.length; i++) {
                      charMap.push({ node, localIndex: i });
                    }
                    fullText += text;
                  }

                  const searchChars = Array.from(exactMatch).filter(c => !/\s/.test(c));
                  if (searchChars.length > 0) {
                    for (let i = 0; i <= charMap.length - searchChars.length; i++) {
                      if (/\s/.test(fullText[i])) continue;

                      let match = true;
                      let pSearch = 0;
                      let pDoc = i;

                      while (pSearch < searchChars.length && pDoc < charMap.length) {
                        const docChar = fullText[pDoc];
                        if (/\s/.test(docChar)) {
                          pDoc++;
                          continue;
                        }
                        if (docChar !== searchChars[pSearch]) {
                          match = false;
                          break;
                        }
                        pSearch++;
                        pDoc++;
                      }

                      if (match && pSearch === searchChars.length) {
                        for (let j = i; j < pDoc; j++) {
                          const mapInfo = charMap[j];
                          if (mapInfo.node.textContent) {
                            if (!mapInfo.node._replacementChars) {
                              mapInfo.node._replacementChars = Array.from(mapInfo.node.textContent);
                            }
                            if (!/\s/.test(fullText[j])) {
                              mapInfo.node._replacementChars[mapInfo.localIndex] = (j === i) ? target.replacement || "████████" : "";
                            }
                          }
                        }
                      }
                    }

                    for (const node of tNodes) {
                      if (node._replacementChars) {
                        node.textContent = node._replacementChars.join("");
                        delete node._replacementChars;
                      }
                    }
                  }
                }
              }
              break;
            }
          }
          globalBlockIndex++;
        }
      });
    });

    const modifiedXml = serializer.serializeToString(doc);
    zip.file(slidePath, modifiedXml);
  }

  return await zip.generateAsync({ type: "uint8array" });
}

/* ─────────────────────────────────────────────────────────────────────────────
   DOCX Redaction
───────────────────────────────────────────────────────────────────────────── */
async function applyWordRedaction(fileBytes, selections) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(fileBytes);

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  // Targets to look for
  const targets = selections
    .map(s => s.redactionTarget)
    .filter(t => t?.type === "word" && t.matchedText);

  if (targets.length === 0) {
    return new Uint8Array(fileBytes);
  }

  // XML files in DOCX that may contain document text
  const textFiles = Object.keys(zip.files).filter(name => 
    name === "word/document.xml" || 
    name.startsWith("word/header") || 
    name.startsWith("word/footer")
  );

  for (const filePath of textFiles) {
    const xmlStr = await zip.files[filePath].async("string");
    const doc = parser.parseFromString(xmlStr, "application/xml");

    // Collect all <w:t> nodes
    const wTNodes = Array.from(doc.getElementsByTagName("w:t"));
    if (wTNodes.length === 0) continue;

    // Build a contiguous string of the entire file's text,
    // mapping each character index back to its parent <w:t> node.
    let fullText = "";
    const charMap = []; // Maps global index -> { node, localIndex }

    for (const node of wTNodes) {
      const text = node.textContent || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, localIndex: i });
      }
      fullText += text;
    }

    // Since matchedText might not be exact (whitespace differences from DOM extraction),
    // we process each target and find its occurrences in fullText.
    let modified = false;

    for (const target of targets) {
      const searchStr = target.matchedText.trim();
      if (!searchStr) continue;

      // To handle whitespace discrepancies, we could use regex ignoring spaces, 
      // but for accuracy and simplicity, we search for the exact string first.
      // If the DOM text was "John   Smith" but XML is "John Smith", we might miss it.
      // A robust approach: search for the non-whitespace characters.
      
      const searchChars = Array.from(searchStr).filter(c => !/\s/.test(c));
      if (searchChars.length === 0) continue;

      let occurrenceCount = 0;
      let targetOccurrence = target.matchOccurrenceIndex !== undefined ? target.matchOccurrenceIndex : -1;

      // Sliding window search across the charMap
      for (let i = 0; i <= charMap.length - searchChars.length; i++) {
        // Optimization: skip if current char is whitespace
        if (/\s/.test(fullText[charMap[i].localIndex])) continue; // Wait, charMap[i] points to fullText? fullText[i] is the char!
        // The array is charMap. length of charMap == length of fullText.
        if (/\s/.test(fullText[i])) continue;

        let match = true;
        let pSearch = 0;
        let pDoc = i;

        while (pSearch < searchChars.length && pDoc < charMap.length) {
          const docChar = fullText[pDoc];
          if (/\s/.test(docChar)) {
            pDoc++; // skip whitespace in document
            continue;
          }
          if (docChar !== searchChars[pSearch]) {
            match = false;
            break;
          }
          pSearch++;
          pDoc++;
        }

        if (match && pSearch === searchChars.length) {
          if (targetOccurrence === -1 || occurrenceCount === targetOccurrence) {
            // Found a match from index `i` to `pDoc - 1`
            // We apply the replacement string to the FIRST character's node,
            // and delete the characters from the rest.
            const replaceChar = "█";

            for (let j = i; j < pDoc; j++) {
              const mapInfo = charMap[j];
              if (mapInfo.node.textContent) {
                // We'll process replacements by modifying a tracked array of strings per node
                if (!mapInfo.node._replacementChars) {
                  mapInfo.node._replacementChars = Array.from(mapInfo.node.textContent);
                }
                // Replace the first character of the match with the full replacement block
                // and the rest with empty strings.
                if (!/\s/.test(fullText[j])) {
                  mapInfo.node._replacementChars[mapInfo.localIndex] = (j === i) ? target.replacement || "████████" : "";
                }
              }
            }
            modified = true;
            if (targetOccurrence !== -1) break;
          }
          occurrenceCount++;
        }
      }
    }

    // Apply the tracked character arrays back to the XML nodes
    if (modified) {
      for (const node of wTNodes) {
        if (node._replacementChars) {
          node.textContent = node._replacementChars.join("");
          delete node._replacementChars; // cleanup
        }
      }

      const modifiedXml = serializer.serializeToString(doc);
      zip.file(filePath, modifiedXml);
    }
  }

  return await zip.generateAsync({ type: "uint8array" });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
