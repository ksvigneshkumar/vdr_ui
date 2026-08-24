"use client";

import React, { useState, useEffect } from "react";
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import { FaFilePdf, FaEye, FaTrash } from "react-icons/fa";
import { useDialog } from "@/components/ui/DialogProvider";

export default function RedactedFilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showAlert } = useDialog();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('vdr_session');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    setSession(parsed);

    const fetchFiles = async () => {
      setLoading(true);
      const dummyRedactedFiles = [
        { id: "rd-1", name: "Financial_Report_Q3_Redacted.pdf", created_at: "2026-08-01T10:00:00.000Z", metadata: { size: 1400000 } },
        { id: "rd-2", name: "Employee_Contracts_Redacted.pdf", created_at: "2026-08-05T10:00:00.000Z", metadata: { size: 450000 } },
        { id: "rd-3", name: "Merger_Acquisition_Draft_Redacted.pdf", created_at: "2026-08-10T10:00:00.000Z", metadata: { size: 2300000 } },
        { id: "rd-4", name: "Board_Meeting_Minutes_Redacted.pdf", created_at: "2026-08-12T10:00:00.000Z", metadata: { size: 850000 } },
        { id: "rd-5", name: "Audit_Findings_2025.pdf", created_at: "2026-08-13T10:00:00.000Z", metadata: { size: 1200000 } },
        { id: "rd-6", name: "Customer_Data_Export.pdf", created_at: "2026-08-14T10:00:00.000Z", metadata: { size: 3100000 } }
      ];
      
      try {
        const stored = localStorage.getItem('vdr_mock_redacted_documents');
        if (stored) {
          const userFiles = JSON.parse(stored);
          setFiles([...userFiles, ...dummyRedactedFiles]);
        } else {
          setFiles(dummyRedactedFiles);
        }
      } catch (e) {
        setFiles(dummyRedactedFiles);
      }
      setLoading(false);
    };

    fetchFiles();
  }, []);

  const handleView = async (file) => {
    try {
      if (file.document_id) {
        window.open(`/redaction/documents/viewer?id=${file.document_id}`, "_blank");
        return;
      }
      if (file.dataUrl) {
        window.open(file.dataUrl, '_blank');
        return;
      }

      const path = `users/${session?.id || 'mock'}/${file.name}`;
      const { data, error } = await supabase.storage.from('redacted-files').createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        window.open(`/redaction/documents/viewer?id=${file.id}`, "_blank");
      }
    } catch (err) {
      await showAlert("Failed to open document: " + err.message, "Error");
    }
  };

  const handleDelete = async (file) => {
    if (!(await showConfirm(`Are you sure you want to delete ${file.name}?`))) return;
    try {
      const path = `users/${session.id}/${file.name}`;
      const { error } = await supabase.storage.from('redacted-files').remove([path]);
      if (error) throw error;
      setFiles(files.filter(f => f.name !== file.name));
    } catch (err) {
      await showAlert("Delete failed: " + err.message, "Error");
    }
  };

  const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex w-full h-full bg-[#FAFBFD] p-4 sm:p-6 lg:p-8 flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Redacted Files</h1>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          No redacted files found in the bucket.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {files.map((file, idx) => (
            <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col hover:border-[var(--brand)] hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                    <FaFilePdf className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm truncate" title={file.name}>{file.name}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {formatBytes(file.metadata?.size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleView(file)}
                  className="flex-1 sm:flex-initial justify-center px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[var(--brand)] hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FaEye /> <span>View Document</span>
                </button>
                <button 
                  onClick={() => handleDelete(file)}
                  className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FaTrash /> <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

