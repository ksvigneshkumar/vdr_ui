"use client";

import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaEnvelopeOpenText,
  FaCheckCircle,
  FaCode,
  FaEye,
  FaPlus,
} from 'react-icons/fa';

export default function EmailTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (template) {
      setSubject(template.subject || '');
      setBody(template.body || '');
    } else {
      setSubject('');
      setBody('');
    }
    setActiveTab('editor');
    setErrorMsg('');
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const insertToken = (token) => {
    setBody((prev) => prev + ` ${token} `);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subject.trim() || !body.trim()) {
      setErrorMsg('Subject and body cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: template.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error updating email template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewHtml = () => {
    let rendered = body
      .replace(/{{user_name}}/g, 'Alex Morgan')
      .replace(/{{company_name}}/g, 'Acme Holdings LLC')
      .replace(/{{login_url}}/g, 'https://vdr.pibidevloperhouse.com/login')
      .replace(/{{reset_link}}/g, 'https://vdr.pibidevloperhouse.com/reset?token=xyz987');

    return `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #0f172a; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #1C7F9F; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1C7F9F; font-size: 18px;">PiBi VDR System Email</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Subject: ${subject}</p>
        </div>
        <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #334155;">
          ${rendered}
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          © 2026 PiBi Virtual Data Room System. All Rights Reserved.
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box - Human Pibi Theme */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden z-10 transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              <FaEnvelopeOpenText className="text-base" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-900 leading-tight">
                Edit Template: {template.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dynamic variable tags &amp; automated HTML email formatting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-[var(--brand)] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FaCode className="text-xs" />
            <span>HTML &amp; Text Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-[var(--brand)] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FaEye className="text-xs" />
            <span>Live Render Preview</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'editor' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              {/* Dynamic Tokens Helper */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-bold text-slate-500 block mb-2">
                  Click variable tag to insert into message body:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['{{user_name}}', '{{company_name}}', '{{login_url}}', '{{reset_link}}'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertToken(token)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-soft text-slate-700 hover:text-[var(--brand)] border border-slate-200 text-xs font-mono font-bold transition-colors shadow-2xs"
                    >
                      <FaPlus className="text-[10px]" />
                      <span>{token}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Email Body (HTML / Plaintext supported) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-[var(--brand)] leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-sm text-slate-600 font-medium block">
                Sample render preview with simulated values (Alex Morgan @ Acme Holdings LLC):
              </span>
              <div
                className="rounded-lg border border-slate-200 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white shadow-sm transition-all disabled:opacity-50"
            >
              <FaCheckCircle className="text-xs" />
              <span>{isSubmitting ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
