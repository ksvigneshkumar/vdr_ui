"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaDatabase, FaCheckCircle } from 'react-icons/fa';

export default function StorageLimitModal({
  isOpen,
  onClose,
  onSave,
  organization,
}) {
  const [newLimitGb, setNewLimitGb] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (organization) {
      setNewLimitGb(String(organization.storageLimitGb || 50));
    } else {
      setNewLimitGb('50');
    }
    setErrorMsg('');
  }, [organization, isOpen]);

  if (!isOpen || !organization) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const gbVal = Number(newLimitGb);
    if (!gbVal || gbVal < 1) {
      setErrorMsg('Please enter a valid storage limit in GB.');
      return;
    }

    if (gbVal < (organization.storageUsedGb || 0)) {
      if (!window.confirm(`Warning: The new limit (${gbVal} GB) is lower than current usage (${organization.storageUsedGb} GB). Continue?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        orgId: organization.id,
        storageLimitMb: gbVal * 1024,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update storage quota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box - Human Pibi Theme */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden z-10 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              <FaDatabase className="text-base" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-900 leading-tight">
                Adjust Storage Quota
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Set customer file vault capacity
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/70 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Organization:</span>
              <span className="font-bold text-slate-900">{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Currently Used:</span>
              <span className="font-semibold text-slate-900">{organization.storageUsedGb} GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Current Limit:</span>
              <span className="font-semibold text-slate-700">{organization.storageLimitGb} GB</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              New Allocated Quota (GB) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={newLimitGb}
              onChange={(e) => setNewLimitGb(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              <span>{isSubmitting ? 'Updating...' : 'Save New Quota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
