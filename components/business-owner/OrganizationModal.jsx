"use client";

import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaBuilding,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

export default function OrganizationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  plans = [],
}) {
  const isEdit = !initialData?.id;

  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [storageLimitGb, setStorageLimitGb] = useState(25);
  const [usersCount, setUsersCount] = useState(10);
  const [status, setStatus] = useState('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAdminEmail(initialData.adminEmail || '');
      setPlan(initialData.plan || (plans[0]?.name ? (plans[0].name.includes('Plan') ? plans[0].name : `${plans[0].name} Plan`) : 'Starter Plan'));
      setStorageLimitGb(
        initialData.storageLimitGb || Math.round((initialData.storageLimitMb || 25600) / 1024)
      );
      setUsersCount(initialData.usersCount || initialData.usersLimit || 10);
      setStatus(initialData.status || 'active');
    } else {
      setName('');
      setAdminEmail('');
      const defaultPlanName = plans[0]?.name ? (plans[0].name.includes('Plan') ? plans[0].name : `${plans[0].name} Plan`) : 'Starter Plan';
      setPlan(defaultPlanName);
      const defaultStorage = plans[0]?.storageLimitMb ? Math.round(plans[0].storageLimitMb / 1024) : 25;
      const defaultUsers = plans[0]?.maxUsers || 10;
      setStorageLimitGb(defaultStorage);
      setUsersCount(defaultUsers);
      setStatus('active');
    }
    setErrorMsg('');
  }, [initialData, isOpen, plans]);

  const handlePlanChange = (selectedPlanName) => {
    setPlan(selectedPlanName);
    const found = plans.find(
      (p) =>
        p.name === selectedPlanName ||
        `${p.name} Plan` === selectedPlanName ||
        p.name === selectedPlanName.replace(' Plan', '')
    );
    if (found) {
      if (found.storageLimitMb) {
        setStorageLimitGb(Math.round(found.storageLimitMb / 1024));
      }
      if (found.maxUsers) {
        setUsersCount(found.maxUsers);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !adminEmail.trim()) {
      setErrorMsg('Organization name and admin email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        adminEmail: adminEmail.trim(),
        plan,
        storageLimitGb: Number(storageLimitGb),
        storageLimitMb: Number(storageLimitGb) * 1024,
        usersCount: Number(usersCount),
        usersLimit: Number(usersCount),
        status,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving organization.');
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
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden z-10 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              <FaBuilding className="text-base" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-900 leading-tight">
                {isEdit ? 'Provision New Tenant Organization' : 'Edit Tenant Organization'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Set customer branding, seat limits, and storage quotas
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
              <FaExclamationCircle className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Org Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Organization / Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation VDR"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)]"
            />
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tenant Admin Email *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-sm">
                <FaEnvelope />
              </span>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@acmecorp.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Subscription Plan
              </label>
              <select
                value={plan}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
              >
                {plans && plans.length > 0 ? (
                  plans.map((p) => {
                    const planDisplayName = p.name.includes('Plan') ? p.name : `${p.name} Plan`;
                    return (
                      <option key={p.id} value={planDisplayName}>
                        {planDisplayName}
                      </option>
                    );
                  })
                ) : (
                  <option value="Starter Plan">Starter Plan</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
              >
                <option value="active">Active</option>
                <option value="trial">Trial Mode</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Storage Quota & Users Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Storage Quota (GB)
              </label>
              <input
                type="number"
                min="1"
                required
                value={storageLimitGb}
                onChange={(e) => setStorageLimitGb(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Initial User Seats
              </label>
              <input
                type="number"
                min="1"
                required
                value={usersCount}
                onChange={(e) => setUsersCount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Create Tenant Account' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
