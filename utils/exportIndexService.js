import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Helper to compute dot-separated hierarchical index and build an ordered tree list
 * of all folders and documents in the VDR.
 */
export function buildHierarchicalIndexList(files = [], deletedIds = new Set()) {
    const activeItems = files.filter(f => !deletedIds.has(f.id) && f.is_deleted !== true);

    // 1. Map items by parentId
    const byParent = new Map();
    activeItems.forEach(item => {
        const pId = item.parentId || 'root';
        if (!byParent.has(pId)) byParent.set(pId, []);
        byParent.get(pId).push(item);
    });

    // 2. Sort function matching VDR index order
    const sortSiblings = (a, b) => {
        const isAFolder = a.type === 'folder';
        const isBFolder = b.type === 'folder';
        if (isAFolder && !isBFolder) return -1;
        if (!isAFolder && isBFolder) return 1;
        const partsA = (a.index || '999999').toString().split('.').map(n => parseInt(n, 10) || 0);
        const partsB = (b.index || '999999').toString().split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < len; i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) return numA - numB;
        }
        return (a.name || '').localeCompare(b.name || '');
    };

    const result = [];

    // 3. Recursive DFS traversal
    const traverse = (parentId, depth, parentIndexPath) => {
        const children = byParent.get(parentId) || [];
        children.sort(sortSiblings);

        children.forEach((child, idx) => {
            let displayIndex = '';
            if (child.type === 'folder') {
                if (depth === 0) {
                    displayIndex = `${idx + 1}`;
                } else {
                    displayIndex = parentIndexPath ? `${parentIndexPath}.${idx + 1}` : `${idx + 1}`;
                }
            } else {
                if (child.index && child.index !== '99' && child.index !== '999') {
                    displayIndex = child.index.toString();
                } else if (parentIndexPath) {
                    displayIndex = `${parentIndexPath}.${idx + 1}`;
                } else {
                    displayIndex = `${idx + 1}`;
                }
            }

            const fileExt = (child.name || '').split('.').pop().toUpperCase();
            const typeLabel = child.type === 'folder'
                ? 'Folder'
                : ['PDF', 'XLSX', 'XLS', 'CSV', 'DOCX', 'DOC', 'TXT', 'PNG', 'JPG'].includes(fileExt)
                ? fileExt
                : 'Document';

            result.push({
                id: child.id,
                indexNumber: displayIndex || '—',
                name: child.name || 'Untitled',
                typeLabel: typeLabel,
                isFolder: child.type === 'folder',
                depth: depth
            });

            if (child.type === 'folder') {
                traverse(child.id, depth + 1, displayIndex);
            }
        });
    };

    traverse('root', 0, '');
    return result;
}

/**
 * 1. EXPORT TO EXCEL (.xlsx)
 * Clean hierarchy format: Index | Folder / Document | Type
 */
export function exportIndexToExcel(files = [], deletedIds = new Set(), companyName = '') {
    const hierarchicalList = buildHierarchicalIndexList(files, deletedIds);

    const rows = hierarchicalList.map(item => {
        const indentString = '    '.repeat(item.depth);
        return {
            'Index': item.indexNumber,
            'Folder / Document': `${indentString}${item.name}`,
            'Type': item.typeLabel
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
        { wch: 12 }, // Index
        { wch: 60 }, // Folder / Document
        { wch: 15 }  // Type
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Document Index');

    const fileName = 'VDR_Document_Index.xlsx';
    XLSX.writeFile(workbook, fileName);
    return fileName;
}

/**
 * 2. EXPORT TO PDF (.pdf)
 * Clean, minimalist, monochrome professional legal/financial Virtual Data Room Index.
 * Executive typography, crisp separator rules, simple plain-text type labels, and "Page X of Y" footer.
 */
export async function exportIndexToPDF(files = [], deletedIds = new Set(), companyName = '') {
    const hierarchicalList = buildHierarchicalIndexList(files, deletedIds);

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Minimalist Executive Monochrome Slate & Charcoal Palette
    const colors = {
        black: rgb(0.09, 0.11, 0.15),       // #171E27 Primary Charcoal/Black
        textDark: rgb(0.15, 0.18, 0.22),    // #262E38 Regular Dark Text
        textMuted: rgb(0.40, 0.45, 0.52),   // #667385 Charcoal / Slate Secondary
        lineDark: rgb(0.20, 0.25, 0.30),    // #33404D Header Border Rule
        lineLight: rgb(0.82, 0.86, 0.90),   // #D1DBE5 Footer / Header Line
        lineSubtle: rgb(0.93, 0.95, 0.97)   // #EDF1F5 Ultra-light Row Separator
    };

    const sanitize = (str = '') => {
        return str
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, "-")
            .replace(/[\u2026]/g, "...")
            .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
    };

    const truncateText = (text, maxChars) => {
        const cleaned = sanitize(text);
        if (cleaned.length <= maxChars) return cleaned;
        return cleaned.substring(0, maxChars - 3) + '...';
    };

    const drawTableHeader = (targetPage, topY) => {
        targetPage.drawText("INDEX", {
            x: 48,
            y: topY - 12,
            size: 8.5,
            font: fontBold,
            color: colors.textMuted
        });
        targetPage.drawText("FOLDER / DOCUMENT TITLE", {
            x: 110,
            y: topY - 12,
            size: 8.5,
            font: fontBold,
            color: colors.textMuted
        });
        targetPage.drawText("TYPE", {
            x: 495,
            y: topY - 12,
            size: 8.5,
            font: fontBold,
            color: colors.textMuted
        });

        targetPage.drawLine({
            start: { x: 45, y: topY - 20 },
            end: { x: 550, y: topY - 20 },
            thickness: 1.25,
            color: colors.lineDark
        });

        return topY - 38;
    };

    const pages = [];
    let page = pdfDoc.addPage([595.28, 841.89]);
    pages.push(page);

    const totalFolders = hierarchicalList.filter(item => item.isFolder).length;
    const totalDocs = hierarchicalList.filter(item => !item.isFolder).length;

    // Cover Page Header (Minimalist Legal / Financial VDR Header)
    page.drawText("VIRTUAL DATA ROOM COMPLIANCE INDEX", {
        x: 45,
        y: 785,
        size: 15,
        font: fontBold,
        color: colors.black
    });

    page.drawText(`${sanitize(companyName || 'CONFIDENTIAL DATA ROOM')}   •   ${dateStr}`, {
        x: 45,
        y: 765,
        size: 9.5,
        font: fontRegular,
        color: colors.textMuted
    });

    const summaryText = `Total Folders: ${totalFolders}   |   Total Documents: ${totalDocs}`;
    const summaryWidth = fontRegular.widthOfTextAtSize(summaryText, 9.5);
    page.drawText(summaryText, {
        x: 550 - summaryWidth,
        y: 765,
        size: 9.5,
        font: fontRegular,
        color: colors.textMuted
    });

    page.drawLine({
        start: { x: 45, y: 748 },
        end: { x: 550, y: 748 },
        thickness: 1.5,
        color: colors.lineDark
    });

    let y = drawTableHeader(page, 735);

    const addNewPage = () => {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        pages.push(newPage);

        newPage.drawText("VIRTUAL DATA ROOM COMPLIANCE INDEX", {
            x: 45,
            y: 805,
            size: 8.5,
            font: fontBold,
            color: colors.textMuted
        });
        const rightText = sanitize(companyName || 'CONFIDENTIAL');
        const rWidth = fontRegular.widthOfTextAtSize(rightText, 8.5);
        newPage.drawText(rightText, {
            x: 550 - rWidth,
            y: 805,
            size: 8.5,
            font: fontRegular,
            color: colors.textMuted
        });

        newPage.drawLine({
            start: { x: 45, y: 792 },
            end: { x: 550, y: 792 },
            thickness: 0.75,
            color: colors.lineLight
        });

        return drawTableHeader(newPage, 782);
    };

    for (let i = 0; i < hierarchicalList.length; i++) {
        const item = hierarchicalList[i];

        if (y < 65) {
            y = addNewPage();
            page = pages[pages.length - 1];
        }

        const indentX = 110 + (item.depth * 16);
        const maxChars = Math.max(20, Math.floor((475 - indentX) / 5.2));
        const displayName = truncateText(item.name, maxChars);
        const indexText = sanitize(item.indexNumber || '—');

        if (item.isFolder) {
            const isTopFolder = item.depth === 0;

            if (isTopFolder && i > 0 && y < 770) {
                y -= 6;
                if (y < 65) {
                    y = addNewPage();
                    page = pages[pages.length - 1];
                }
            }

            page.drawText(indexText, {
                x: 48,
                y: y + 3,
                size: isTopFolder ? 10 : 9.5,
                font: fontBold,
                color: isTopFolder ? colors.black : colors.textDark
            });

            page.drawText(displayName, {
                x: indentX,
                y: y + 3,
                size: isTopFolder ? 10 : 9.5,
                font: fontBold,
                color: isTopFolder ? colors.black : colors.textDark
            });

            page.drawText("FOLDER", {
                x: 495,
                y: y + 3,
                size: 8.5,
                font: fontBold,
                color: colors.textMuted
            });

            if (!isTopFolder) {
                page.drawLine({
                    start: { x: 45, y: y - 7 },
                    end: { x: 550, y: y - 7 },
                    thickness: 0.5,
                    color: colors.lineSubtle
                });
            }
        } else {
            page.drawText(indexText, {
                x: 48,
                y: y + 3,
                size: 9,
                font: fontRegular,
                color: colors.textMuted
            });

            page.drawText(displayName, {
                x: indentX,
                y: y + 3,
                size: 9.5,
                font: fontRegular,
                color: colors.textDark
            });

            const extText = (item.typeLabel || 'DOC').toUpperCase();
            page.drawText(extText, {
                x: 495,
                y: y + 3,
                size: 8.5,
                font: fontRegular,
                color: colors.textMuted
            });

            page.drawLine({
                start: { x: 45, y: y - 7 },
                end: { x: 550, y: y - 7 },
                thickness: 0.5,
                color: colors.lineSubtle
            });
        }

        y -= 22;
    }

    if (hierarchicalList.length === 0) {
        page.drawText("No folders or documents found in this index.", {
            x: 48,
            y: y,
            size: 10,
            font: fontRegular,
            color: colors.textMuted
        });
    }

    const totalPages = pages.length;
    pages.forEach((p, idx) => {
        p.drawLine({
            start: { x: 45, y: 45 },
            end: { x: 550, y: 45 },
            thickness: 0.75,
            color: colors.lineLight
        });

        p.drawText("CONFIDENTIAL   •   VIRTUAL DATA ROOM INDEX", {
            x: 45,
            y: 28,
            size: 8,
            font: fontRegular,
            color: colors.textMuted
        });

        const pageText = `Page ${idx + 1} of ${totalPages}`;
        const textWidth = fontRegular.widthOfTextAtSize(pageText, 8);
        p.drawText(pageText, {
            x: 550 - textWidth,
            y: 28,
            size: 8,
            font: fontRegular,
            color: colors.textMuted
        });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    try {
        window.open(url, '_blank');
    } catch (e) {
        console.warn('Popup preview blocked by browser:', e);
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = 'VDR_Document_Index.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 60000);

    return 'VDR_Document_Index.pdf';
}
