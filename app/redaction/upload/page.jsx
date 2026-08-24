"use client";

import React, { useState, useRef } from "react";
import { FaCloudUploadAlt, FaFileAlt } from "react-icons/fa";

export default function RedactionUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setUploadStatus(null);
    
    try {
      // Mock upload delay for frontend demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus('success');
      setTimeout(() => setUploadStatus(null), 3000);
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus(err.message || 'Error uploading file');
      setTimeout(() => setUploadStatus(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 lg:p-8 w-full h-full bg-[#FAFBFD] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Upload Document</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center py-4">
        <div 
          className={`w-full max-w-2xl min-h-[280px] sm:h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 sm:p-8 transition-colors cursor-pointer text-center ${
            isDragging 
              ? "border-[var(--brand)] bg-[var(--brand)]/5" 
              : "border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-2xs"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin mb-4" />
              <p className="text-slate-700 font-bold text-base sm:text-lg">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center mb-4 sm:mb-6">
                <FaCloudUploadAlt className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--brand)]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5">Drag & Drop files here</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-5">or click to browse from your device</p>
              
              <button className="px-5 sm:px-6 py-2.5 bg-[var(--brand)] text-white text-xs sm:text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-xs">
                Browse Files
              </button>
            </>
          )}
        </div>
      </div>
      
      {uploadStatus === 'success' && (
        <div className="fixed bottom-6 right-4 sm:right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>File uploaded successfully</span>
        </div>
      )}
      
      {uploadStatus && uploadStatus !== 'success' && (
        <div className="fixed bottom-6 right-4 sm:right-6 bg-rose-600 text-white px-5 py-3 rounded-xl shadow-lg font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{uploadStatus}</span>
        </div>
      )}
    </div>
  );
}
