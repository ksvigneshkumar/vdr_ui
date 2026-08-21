"use client";

import React, { useState, useEffect } from 'react';
import EmailTemplateModal from '@/components/business-owner/EmailTemplateModal';
import {
  FaEnvelopeOpenText,
  FaEdit,
  FaCode,
  FaEye,
  FaCheckCircle,
} from 'react-icons/fa';

export default function BusinessOwnerEmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/business-owner/email-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching email templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (tmpl) => {
    setSelectedTemplate(tmpl);
    setModalOpen(true);
  };

  const handleSaveTemplate = async (payload) => {
    const res = await fetch('/api/business-owner/email-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update email template');
    }

    await fetchTemplates();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Automated Email Templates
        </h1>
        <p className="text-slate-500 mt-2 text-[15px]">
          Customize automated tenant system notifications for onboarding welcome letters, deal room invitations, and password resets.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse"
            />
          ))
        ) : (
          templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Title Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
                      <FaEnvelopeOpenText className="text-base" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {tmpl.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        System Template ID: {tmpl.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(tmpl)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[var(--brand)] transition-colors"
                    title="Edit email template"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                </div>

                {/* Subject Preview */}
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Subject Line
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-sm font-semibold text-slate-800">
                    {tmpl.subject}
                  </div>
                </div>

                {/* Body Snippet */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Message Body (HTML / Plaintext)
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono text-slate-600 line-clamp-4 leading-relaxed">
                    {tmpl.body}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                  <FaCheckCircle className="text-emerald-500 text-xs" />
                  <span>Dynamic token replacement active</span>
                </span>

                <button
                  onClick={() => handleEdit(tmpl)}
                  className="inline-flex items-center gap-1.5 font-bold text-[var(--brand)] hover:underline text-sm"
                >
                  <FaCode className="text-xs" />
                  <span>Edit HTML Body</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Email Template Modal */}
      <EmailTemplateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
      />
    </div>
  );
}
