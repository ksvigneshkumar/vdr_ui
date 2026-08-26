"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialog } from '@/components/ui/DialogProvider';
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import { Pencil, UploadCloud, Bold, Italic, Underline, List, ListOrdered, Check, Download, ShieldAlert, FileText } from 'lucide-react';

const DEFAULT_NDA_TEXT = `<strong>SAMPLE NON-DISCLOSURE AGREEMENT (NDA)</strong><br><br>This Non-Disclosure Agreement (“Agreement”) is entered into on [Date]<br>between:<br><br><strong>Disclosing Party:</strong> [Company Name]<br><br>and<br><br><strong>Receiving Party:</strong> [Recipient Name]<br><br><strong>1. Purpose</strong><br>The Receiving Party may receive confidential information solely for evaluating a business relationship, project, investment, audit, or due diligence process.<br><br><strong>2. Confidential Information</strong><br>Confidential Information includes, but is not limited to:<br>- Business plans<br>- Financial records<br>- Customer and supplier information<br>- Product designs and source code<br>- Technical documentation<br>- Contracts and legal documents<br>- Marketing strategies<br>- Any information marked as confidential<br><br><strong>3. Obligations of the Receiving Party</strong><br>The Receiving Party agrees to:<br>- Keep all Confidential Information strictly confidential.<br>- Use the information only for the stated purpose.<br>- Not disclose the information to any third party without written consent.<br>- Protect the information using reasonable security measures.<br><br><strong>4. Exclusions</strong><br>Confidential Information does not include information that:<br>- Is publicly available without breach of this Agreement.<br>- Was already known before disclosure.<br>- Is independently developed without using the confidential information.<br>- Is required by law to be disclosed.<br><br><strong>5. Term</strong><br>This Agreement remains effective for 3 years from the Effective Date. Confidentiality obligations survive termination.<br><br><strong>6. Return or Destruction</strong><br>Upon request, the Receiving Party will promptly return or securely destroy all confidential materials and copies.<br><br><strong>7. No License</strong><br>This Agreement does not grant ownership, intellectual property rights, or licenses.<br><br><strong>8. Governing Law</strong><br>This Agreement shall be governed by the laws of [Country/State].`;

export default function NdaSettingsPage() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'users'
  const [showNdaAt, setShowNdaAt] = useState('First time workspace open');
  const [ndaText, setNdaText] = useState(DEFAULT_NDA_TEXT);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [ndaUsersList, setNdaUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { showAlert } = useDialog();
  const editorRef = useRef(null);
  const tableRef = useRef(null);

  // Permanent Non-Fading Scrollbar State
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(40);
  const [isScrollable, setIsScrollable] = useState(true);

  const updateScrollbar = useCallback(() => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    if (scrollWidth <= clientWidth) {
      setIsScrollable(false);
      setThumbWidth(100);
      setThumbLeft(0);
      return;
    }
    setIsScrollable(true);
    const visibleRatio = clientWidth / scrollWidth;
    const calculatedWidth = Math.max(Math.min(visibleRatio * 100, 80), 18); // between 18% and 80%
    const maxScroll = scrollWidth - clientWidth;
    const scrollPercent = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    const maxLeft = 100 - calculatedWidth;
    setThumbWidth(calculatedWidth);
    setThumbLeft(scrollPercent * maxLeft);
  }, []);

  useEffect(() => {
    const handleResize = () => updateScrollbar();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollbar]);

  // ——— BACKEND API CALLS ———
  const fetchUsersAndInvites = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const rawSession = localStorage.getItem("vdr_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);

      const res = await fetch('/api/settings/nda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_users', session })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const sortedUsers = (data.users || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const mappedUsers = sortedUsers.map(u => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email || '',
        dateAccepted: u.nda_accepted_at ? new Date(u.nda_accepted_at).toLocaleDateString() : 'N/A',
        timeAccepted: u.nda_accepted_at ? new Date(u.nda_accepted_at).toLocaleTimeString() : 'N/A',
        ipAddress: u.nda_ip_address || u.ip_address || (u.nda_accepted_at ? 'Logged (Protected)' : 'N/A'),
        userId: u.id,
        ndaAttached: (u.nda_status === 'accepted' || u.nda_status === 'pending') ? 'Yes' : 'No',
        status: u.nda_status === 'accepted' ? 'Accepted' : (u.nda_status === 'pending' ? 'Pending' : 'Not Required'),
        isRealUser: true,
        rawStatus: u.nda_status || 'not_required',
        signatureUrl: u.nda_signature_url || null,
        signaturePath: u.nda_signature_path || null,
        signatureType: u.nda_signature_type || null
      }));

      setNdaUsersList(mappedUsers);
    } catch (error) { console.error("Error fetching users:", error); } finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersAndInvites();
    }
  }, [activeTab, fetchUsersAndInvites]);

  useEffect(() => {
    if (activeTab === 'users') {
      setTimeout(updateScrollbar, 50);
      setTimeout(updateScrollbar, 300);
    }
  }, [activeTab, ndaUsersList, updateScrollbar]);

  const handleRequireNdaForUser = async (userId) => {
    try {
      const rawSession = localStorage.getItem("vdr_session");
      const session = JSON.parse(rawSession);
      const res = await fetch('/api/settings/nda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'require_nda', session, payload: { userId } })
      });
      if (!res.ok) throw new Error("Failed to update status");

      setToastMessage("User must now sign NDA on next login.");
      setTimeout(() => setToastMessage(''), 3000);
      fetchUsersAndInvites();
    } catch (err) { await showAlert("Failed to update user status.", "Error"); }
  };

  const handleSaveTerms = async () => {
    try {
      const rawSession = localStorage.getItem("vdr_session");
      if (!rawSession) { setToastMessage('Error: Please log in again'); return; }
      const session = JSON.parse(rawSession);

      const res = await fetch('/api/settings/nda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_text', session, payload: { text: ndaText } })
      });
      if (!res.ok) throw new Error("Failed to save");

      setShowEditor(false);
      setToastMessage('NDA saved to Database successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setToastMessage('Failed to save NDA');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  useEffect(() => {
    const fetchSavedNDA = async () => {
      const rawSession = localStorage.getItem("vdr_session");
      if (!rawSession) return;
      const session = JSON.parse(rawSession);

      const res = await fetch('/api/settings/nda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_text', session })
      });
      const data = await res.json();
      if (data.success && data.nda_text) setNdaText(data.nda_text);
    };
    fetchSavedNDA();
  }, []);

  // ——— EDITOR LOGIC ———
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setNdaText(event.target.result.replace(/\n/g, '<br>'));
          setShowEditor(true);
        };
        reader.readAsText(file);
      } else {
        showAlert("Please upload a valid text (.txt) file.", "Invalid Format");
        setUploadedFile(null);
      }
    }
  };

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  useEffect(() => {
    if (showEditor && editorRef.current && editorRef.current.innerHTML !== ndaText) {
      editorRef.current.innerHTML = ndaText;
    }
  }, [showEditor, ndaText]);

  const handleDownloadUserNDA = async (user) => {
    const companyName = "Organization NDA";
    const userName = user.name || "Authorized Signatory";
    const userEmail = user.email || "";
    const signDate = `${user.dateAccepted} at ${user.timeAccepted}`;
    const agreementContent = ndaText || "<p>No terms provided.</p>";
    
    // Resolve signature URL (if bucket is private, generate a 1-hour signed URL using signaturePath)
    let sigImgSrc = user.signatureUrl;
    if (user.signaturePath) {
      try {
        const { data: signedData } = await supabase.storage
          .from("signature_documents")
          .createSignedUrl(user.signaturePath, 3600);
        if (signedData?.signedUrl) {
          sigImgSrc = signedData.signedUrl;
        }
      } catch (e) {
        console.warn("Could not generate signed URL, falling back to stored signatureUrl", e);
      }
    }

    // Display signature image if available, else show legal execution text
    const sigElement = sigImgSrc
      ? `<img src="${sigImgSrc}" class="sig-image" alt="Digital Signature" />`
      : `<div class="sig-placeholder">Digitally Signed & Accepted by ${userName}</div>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      await showAlert("Please allow popups to download/print the signed NDA document.", "Popups Blocked");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Signed NDA - ${userName}</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  color: #1e293b;
                  line-height: 1.6;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                  background: #ffffff;
              }
              .header {
                  text-align: center;
                  border-bottom: 2px solid #e2e8f0;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
              }
              .header h1 {
                  font-size: 24px;
                  font-weight: 800;
                  margin: 0 0 8px 0;
                  color: #0f172a;
              }
              .header p {
                  font-size: 14px;
                  color: #64748b;
                  margin: 0;
              }
              .content {
                  font-size: 14px;
                  color: #0f172a;
                  margin-bottom: 40px;
              }
              .content h1, .content h2, .content h3 {
                  color: #0f172a;
              }
              .signature-box {
                  border-top: 2px solid #0f172a;
                  padding-top: 25px;
                  margin-top: 50px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                  page-break-inside: avoid;
              }
              .sig-details {
                  font-size: 13px;
              }
              .sig-details p {
                  margin: 5px 0;
              }
              .sig-details strong {
                  color: #0f172a;
              }
              .sig-image-wrapper {
                  text-align: right;
              }
              .sig-image {
                  max-height: 80px;
                  max-width: 240px;
                  border-bottom: 1px solid #cbd5e1;
                  padding-bottom: 6px;
                  margin-bottom: 6px;
                  display: block;
              }
              .sig-placeholder {
                  font-weight: 700;
                  color: #15803d;
                  border-bottom: 1px solid #cbd5e1;
                  padding-bottom: 6px;
                  margin-bottom: 6px;
                  font-size: 14px;
              }
              .sig-label {
                  font-size: 11px;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
              }
              .audit-footer {
                  margin-top: 40px;
                  padding-top: 15px;
                  border-top: 1px dashed #cbd5e1;
                  font-size: 11px;
                  color: #94a3b8;
                  text-align: center;
              }
              @media print {
                  body { padding: 0; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>NON-DISCLOSURE AGREEMENT (NDA)</h1>
              <p>Virtual Data Room • Cryptographically Executed Agreement Copy</p>
          </div>

          <div class="content">
              ${agreementContent}
          </div>

          <div class="signature-box">
              <div class="sig-details">
                  <p><strong>Digitally Signed By:</strong> ${userName}</p>
                  ${userEmail ? `<p><strong>Email Address:</strong> ${userEmail}</p>` : ""}
                  <p><strong>User ID (Audit):</strong> ${user.id}</p>
                  <p><strong>Client IP Address:</strong> ${user.ipAddress || "Logged in DB Audit Trail"}</p>
                  <p><strong>Legal Status:</strong> Accepted & Executed</p>
                  <p><strong>Execution Timestamp:</strong> ${signDate}</p>
              </div>
              <div class="sig-image-wrapper">
                  ${sigElement}
                  <div class="sig-label">Authorized Digital Signature</div>
              </div>
          </div>

          <div class="audit-footer">
              Executed via Virtual Data Room Platform • Document Audit Trail Active
          </div>

          <script>
              window.onload = function() {
                  setTimeout(function() {
                      window.print();
                  }, 350);
              };
          </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hide native auto-fading scrollbar to let our permanent scrollbar take over */}
      <style>{`
        .nda-hide-native-scroll {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .nda-hide-native-scroll::-webkit-scrollbar {
          display: none !important;
          height: 0px !important;
        }
      `}</style>

      {toastMessage && (
        <div className="fixed top-8 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <Check size={18} className="text-green-500" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="mb-6 sm:mb-8 border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Non-Disclosure Agreement (NDA)</h1>
        <div className="flex gap-6 sm:gap-8">
          <button onClick={() => setActiveTab('settings')} className={`pb-3 sm:pb-4 text-sm sm:text-[15px] font-semibold transition-all relative ${activeTab === 'settings' ? 'text-[var(--brand)]' : 'text-gray-500 hover:text-gray-700'}`}>
            NDA Settings
            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] rounded-t-full"></span>}
          </button>
          <button onClick={() => setActiveTab('users')} className={`pb-3 sm:pb-4 text-sm sm:text-[15px] font-semibold transition-all relative ${activeTab === 'users' ? 'text-[var(--brand)]' : 'text-gray-500 hover:text-gray-700'}`}>
            NDA Users
            {activeTab === 'users' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--brand)] rounded-t-full"></span>}
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-10">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">NDA Document Content</h3>
            <p className="text-[13px] text-gray-500 mb-4">Upload a new text file (.txt) OR edit the currently active NDA.</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-lg shadow-md shadow-[var(--brand)]/20 hover:bg-[var(--brand)]/90 transition-all cursor-pointer">
                <UploadCloud size={18} />
                <span>Upload New File</span>
                <input type="file" className="hidden" accept=".txt,text/plain" onChange={handleFileUpload} />
              </label>
              <button onClick={() => setShowEditor(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                <Pencil size={16} className="text-blue-500" />
                <span>Preview & Edit Current NDA</span>
              </button>
            </div>
          </div>

          {showEditor && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-[15px] font-bold text-gray-900 mb-3">Edit terms here</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <style>{`.editor-content ul { list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; } .editor-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; } .editor-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; font-style: italic; color: #6b7280; margin-top: 0.5rem; margin-bottom: 0.5rem; }`}</style>
                <div className="border-b border-gray-100 p-2 flex flex-wrap items-center gap-1 bg-gray-50/50">
                  <select onChange={(e) => handleFormat('formatBlock', e.target.value)} className="px-3 py-1.5 text-[13px] text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded" defaultValue="P"><option value="P">Paragraph</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option></select>
                  <div className="w-px h-5 bg-gray-200 mx-1"></div>
                  <button title="Bold" onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><Bold size={16} /></button>
                  <button title="Italic" onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><Italic size={16} /></button>
                  <button title="Underline" onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><Underline size={16} /></button>
                  <div className="w-px h-5 bg-gray-200 mx-1"></div>
                  <button title="Bullet List" onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><List size={16} /></button>
                  <button title="Numbered List" onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><ListOrdered size={16} /></button>
                </div>
                <div ref={editorRef} className="editor-content w-full min-h-[250px] p-4 text-[14px] text-gray-800 focus:outline-none overflow-y-auto" contentEditable={true} onBlur={(e) => setNdaText(e.currentTarget.innerHTML)} style={{ minHeight: '250px' }}></div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowEditor(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={handleSaveTerms} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-lg shadow-md shadow-[var(--brand)]/20 hover:bg-[var(--brand)]/90 transition-all"><Check size={16} /> Save Terms</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
            {/* Table Container */}
            <div
              ref={tableRef}
              onScroll={updateScrollbar}
              className="overflow-x-auto nda-hide-native-scroll"
            >
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">S.No</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Accepted</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Time Accepted</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Audit IP / ID</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">NDA Attached</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-[12px] font-extrabold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingUsers ? (
                    <tr><td colSpan="8" className="text-center py-8 text-gray-500 font-medium">Loading users...</td></tr>
                  ) : ndaUsersList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center">
                        <FileText size={44} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-gray-900 font-bold text-sm mb-1">No Users Found</h3>
                        <p className="text-gray-500 text-xs">When users are registered or invited, they will appear here.</p>
                      </td>
                    </tr>
                  ) : ndaUsersList.map((u, index) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13.5px] font-bold text-gray-900">{u.name}</span>
                        {u.email && <span className="block text-[11px] text-gray-400 font-normal">{u.email}</span>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-gray-600 font-semibold">{u.dateAccepted}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-gray-600 font-medium">{u.timeAccepted}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-gray-900">{u.ipAddress || 'Logged (Protected)'}</span>
                          <span className="text-[11px] text-gray-400 font-mono" title={`User ID: ${u.id}`}>ID: {u.id?.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${u.ndaAttached === 'Yes' ? 'bg-blue-50 text-[var(--brand)] border border-blue-100' : 'bg-gray-100 text-gray-600'}`}>{u.ndaAttached}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          u.status === 'Accepted' 
                            ? 'bg-blue-50 text-[var(--brand)] border-blue-200' 
                            : u.status === 'Pending' || u.status === 'Pending Invite' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Accepted' ? 'bg-[var(--brand)]' : 'bg-slate-400'}`}></span>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button disabled={u.status !== 'Accepted'} onClick={() => handleDownloadUserNDA(u)} className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${u.status === 'Accepted' ? 'bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 shadow-sm hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} title={u.status === 'Accepted' ? 'Download Signed Document' : 'Pending Acceptance'}>
                            <Download size={15} />
                          </button>
                          {u.isRealUser && u.rawStatus !== 'pending' && u.rawStatus !== 'accepted' && (
                            <button onClick={() => handleRequireNdaForUser(u.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all shadow-xs border border-rose-200/60" title="Force old user to sign NDA on next login">
                              <ShieldAlert size={13} /> Require NDA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Permanent Non-Fading Scrollbar Bar (Always Visible, Light & Clean) */}
            {isScrollable && (
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center">
                <div
                  onClick={(e) => {
                    if (!tableRef.current) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = clickX / rect.width;
                    const maxScroll = tableRef.current.scrollWidth - tableRef.current.clientWidth;
                    tableRef.current.scrollTo({ left: clickPercent * maxScroll, behavior: 'smooth' });
                  }}
                  className="w-full h-1.5 bg-slate-100 hover:bg-slate-200/70 rounded-full relative cursor-pointer overflow-hidden transition-colors"
                  title="Click to scroll table"
                >
                  <div
                    className="absolute top-0 bottom-0 bg-slate-300 hover:bg-slate-400 rounded-full transition-all duration-75"
                    style={{
                      width: `${thumbWidth}%`,
                      left: `${thumbLeft}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
