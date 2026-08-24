"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUserPlus, FaArrowLeft, FaPaperPlane, FaEnvelope, FaCheckCircle, FaFileSignature, FaUsers, FaFileUpload, FaSpinner } from "react-icons/fa";

export default function InviteMemberPage() {
    const params = useParams();
    const router = useRouter();
    const groupSlug = params.slug;

    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [inviteMode, setInviteMode] = useState("single"); // 'single' or 'bulk'
    const [inviteEmail, setInviteEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [inviteDescription, setInviteDescription] = useState("");
    const [requireNda, setRequireNda] = useState(true);
    const [inviting, setInviting] = useState(false);

    const [parsingFile, setParsingFile] = useState(false);
    const fileInputRef = useRef(null);

    const [session, setSession] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [generatedLinks, setGeneratedLinks] = useState([]);

    useEffect(() => {
        const rawSession = localStorage.getItem("vdr_session");
        if (rawSession) setSession(JSON.parse(rawSession));
    }, []);

    // ── HITS DETAILS API JUST TO GET THE GROUP NAME ──
    useEffect(() => {
        if (!groupSlug || !session) return;
        const fetchGroup = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/groups/details', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session, groupSlug })
                });
                const data = await res.json();
                if (data.success) setGroupData(data.group);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchGroup();
    }, [groupSlug, session]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setParsingFile(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            let extractedText = "";
            const ext = file.name.split('.').pop().toLowerCase();

            if (['txt', 'csv'].includes(ext)) {
                extractedText = await file.text();
            } else if (['xlsx', 'xls'].includes(ext)) {
                const XLSX = await import('xlsx');
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                extractedText = workbook.SheetNames.map(name =>
                    XLSX.utils.sheet_to_csv(workbook.Sheets[name])
                ).join('\n');
            } else if (['docx'].includes(ext)) {
                const JSZip = (await import('jszip')).default;
                const data = await file.arrayBuffer();
                const zip = new JSZip();
                const loadedZip = await zip.loadAsync(data);
                const docXml = loadedZip.file('word/document.xml');
                if (docXml) {
                    const xmlStr = await docXml.async('string');
                    extractedText = xmlStr.replace(/<[^>]+>/g, ' ');
                }
            } else if (['doc'].includes(ext)) {
                extractedText = await file.text();
            } else if (['pdf'].includes(ext)) {
                const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/legacy/build/pdf.worker.mjs",
                    import.meta.url
                ).toString();
                const data = await file.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data });
                const pdf = await loadingTask.promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    extractedText += content.items.map(item => item.str).join(' ') + '\n';
                }
            } else {
                throw new Error("Unsupported file format");
            }

            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
            const foundEmails = extractedText.match(emailRegex) || [];

            if (foundEmails.length > 0) {
                const uniqueEmails = [...new Set(foundEmails)];
                setBulkEmails(prev => {
                    const existing = prev.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
                    const merged = [...new Set([...existing, ...uniqueEmails])];
                    return merged.join('\n');
                });
                setSuccessMsg(`Extracted ${uniqueEmails.length} unique email(s) from the uploaded file.`);
            } else {
                setErrorMsg("No valid email addresses found in the uploaded file.");
            }
        } catch (err) {
            console.error("File parse error:", err);
            setErrorMsg("Error parsing file. Please check the file format or try another file.");
        } finally {
            setParsingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(""); setSuccessMsg(""); setGeneratedLinks([]);

        let emailsToInvite = [];
        if (inviteMode === "single") {
            if (!inviteEmail.trim()) return setErrorMsg("Please enter a valid email address.");
            emailsToInvite = [inviteEmail.trim()];
        } else {
            if (!bulkEmails.trim()) return setErrorMsg("Please enter at least one email address.");
            emailsToInvite = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
            if (emailsToInvite.length === 0) return setErrorMsg("Please enter valid email addresses.");
        }

        setInviting(true);
        try {
            let successCount = 0;
            let links = [];

            // Simulate backend processing delay
            await new Promise(r => setTimeout(r, 1500));

            for (const email of emailsToInvite) {
                const token = requireNda ? 'mock-token-nda' : 'mock-token-normal';
                const uniqueToken = `${token}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const inviteUrl = `http://localhost:3000/register?token=${uniqueToken}`;
                links.push({ email, url: inviteUrl, nda: requireNda });
                successCount++;
            }

            setSuccessMsg(`Successfully generated ${successCount} invitation link${successCount !== 1 ? 's' : ''}.`);
            setGeneratedLinks(links);
            setInviteEmail(""); setBulkEmails(""); setInviteDescription(""); setRequireNda(true);
        } catch (err) {
            setErrorMsg("Error generating invitation: " + err.message);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden font-sans bg-[#F8FAFC] relative">
            <div className="absolute top-0 left-0 w-full h-96 pointer-events-none" />

            <div className="pt-6 md:pt-10 px-4 md:px-10 pb-4 md:pb-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <button onClick={() => router.push(`/groups/${groupSlug}`)} className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                        <FaArrowLeft size={14} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">
                            {loading ? "Loading..." : groupData?.name || "Group"} &rsaquo; Members
                        </p>
                        <h1 className="text-lg md:text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                            <span className="w-7 h-7 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-xl bg-[var(--brand)] text-white flex items-center justify-center shadow-sm">
                                <FaUserPlus className="text-[12px] md:text-[15px]" />
                            </span>
                            <span className="truncate">Invite Members</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-6 md:pb-12">
                <div className="max-w-2xl mx-auto">
                    {successMsg && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-6 py-4 mb-6 flex items-center gap-3 text-emerald-700 font-medium text-sm"><FaCheckCircle size={16} />{successMsg}</div>}
                    {errorMsg && <div className="bg-rose-50 border border-rose-200 rounded-lg px-6 py-4 mb-6 flex items-center gap-3 text-rose-700 font-medium text-sm">⚠️ {errorMsg}</div>}

                    {generatedLinks.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FaCheckCircle className="text-emerald-500" /> Generated Invite Links
                            </h3>
                            <div className="space-y-3">
                                {generatedLinks.map((linkObj, idx) => (
                                    <div key={idx} className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700">{linkObj.email}</span>
                                            {linkObj.nda && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">NDA Required</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg break-all selection:bg-brand-100">{linkObj.url}</code>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(linkObj.url);
                                                    setSuccessMsg("Link copied to clipboard!");
                                                }}
                                                className="shrink-0 px-4 py-2 bg-[var(--brand)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-5 md:p-8 hover:border-gray-300 transition-all">

                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setInviteMode('single')}
                                className={`flex-1 py-2 text-[11px] sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${inviteMode === 'single' ? 'bg-white text-[var(--brand)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FaEnvelope className="text-[11px] sm:text-[13px]" /> Single Invite
                            </button>
                            <button
                                type="button"
                                onClick={() => setInviteMode('bulk')}
                                className={`flex-1 py-2 text-[11px] sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${inviteMode === 'bulk' ? 'bg-white text-[var(--brand)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FaUsers className="text-[12px] sm:text-[14px]" /> Bulk Invite
                            </button>
                        </div>

                        <form onSubmit={handleInviteSubmit} className="space-y-6">
                            {inviteMode === "single" ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Candidate Email <span className="text-rose-400">*</span></label>
                                    <div className="relative">
                                        <FaEnvelope size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:border-[var(--brand)] outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Emails <span className="text-rose-400">*</span></label>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={parsingFile}
                                            className="text-xs font-bold text-[var(--brand)] flex items-center justify-center gap-1.5 hover:text-[var(--brand-dark)] transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm w-full sm:w-auto"
                                        >
                                            {parsingFile ? <FaSpinner size={12} className="animate-spin" /> : <FaFileUpload size={12} />}
                                            {parsingFile ? "Extracting..." : "Upload File"}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept=".txt,.csv,.pdf,.doc,.docx,.xls,.xlsx"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">Enter multiple email addresses separated by commas or new lines, or upload a file (PDF, TXT, DOCX, XLSX) to auto-extract them.</p>
                                    <textarea value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} rows={4} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[var(--brand)] outline-none resize-none" placeholder="john@example.com, jane@example.com&#10;team@example.com" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message (Optional)</label>
                                <textarea value={inviteDescription} onChange={(e) => setInviteDescription(e.target.value)} rows={3} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-[var(--brand)] outline-none resize-none" />
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 flex items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"><FaFileSignature size={14} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Require NDA Agreement</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5 sm:mt-0">If enabled, user must sign NDA to complete registration.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                                    <input type="checkbox" className="sr-only peer" checked={requireNda} onChange={(e) => setRequireNda(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand)]"></div>
                                </label>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                <button type="button" onClick={() => router.push(`/groups/${groupSlug}`)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" disabled={inviting || (inviteMode === 'single' ? !inviteEmail.trim() : !bulkEmails.trim())} className="flex-1 bg-[var(--brand)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[var(--brand-dark)] transition-all flex justify-center items-center gap-2">
                                    {inviting ? "Sending..." : <><FaPaperPlane size={13} /> Send Invitation{inviteMode === 'bulk' && 's'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

