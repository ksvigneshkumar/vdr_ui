"use client";

import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaTags,
  FaBuilding,
  FaCheckCircle,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';

export default function PlanModal({
  isOpen,
  onClose,
  onSave,
  mode = 'create', // 'create' | 'edit' | 'assign'
  initialData = null,
  organizations = [],
  plans = [],
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('$0/mo');
  const [storageValue, setStorageValue] = useState('50');
  const [storageUnit, setStorageUnit] = useState('GB');
  const [maxUsers, setMaxUsers] = useState('5');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState('');

  // Assign mode states
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('Pro');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (mode === 'assign') {
      setSelectedOrgId(organizations[0]?.id || '');
      setSelectedPlanName(initialData?.currentPlan || 'Pro');
    } else if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setPrice(initialData.price || '');
      if (initialData.storageLimitMb >= 1024 && initialData.storageLimitMb % 1024 === 0) {
        setStorageValue(String(initialData.storageLimitMb / 1024));
        setStorageUnit('GB');
      } else {
        setStorageValue(String(initialData.storageLimitMb || 51200));
        setStorageUnit('MB');
      }
      setMaxUsers(String(initialData.maxUsers || 5));
      setDescription(initialData.description || '');
      setFeatures(initialData.features || []);
    } else {
      setName('');
      setPrice('');
      setStorageValue('');
      setStorageUnit('GB');
      setMaxUsers('');
      setDescription('');
      setFeatures(['']);
    }
    setErrorMsg('');
  }, [initialData, mode, isOpen, organizations]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'assign') {
        if (!selectedOrgId) {
          throw new Error('Please select an organization.');
        }
        await onSave({
          action: 'assign',
          orgId: selectedOrgId,
          planName: selectedPlanName,
        });
      } else {
        if (!name.trim()) {
          throw new Error('Plan Name is required.');
        }
        await onSave({
          planId: mode === 'edit' ? initialData?.id : undefined,
          name: name.trim(),
          price: price.trim(),
          storageLimitMb: storageUnit === 'GB' ? Number(storageValue) * 1024 : Number(storageValue),
          maxUsers: Number(maxUsers),
          description: description.trim(),
          features,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving plan.');
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

      {/* Modal Card - Human Pibi Theme */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden z-10 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              {mode === 'assign' ? <FaBuilding className="text-base" /> : <FaTags className="text-base" />}
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-900 leading-tight">
                {mode === 'assign'
                  ? 'Assign Plan to Tenant Organization'
                  : mode === 'edit'
                    ? 'Edit SaaS Subscription Plan'
                    : 'Create New Subscription Plan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Set monthly pricing and deal room resource quotas
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {mode === 'assign' ? (
            /* Assign Mode Content */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Tenant Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} (Current: {org.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select New Subscription Tier
                </label>
                <select
                  value={selectedPlanName}
                  onChange={(e) => setSelectedPlanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Create / Edit Mode Content */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pro, Enterprise"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Price Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. ₹199/mo or Custom"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Storage Quota
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={storageValue}
                      onChange={(e) => setStorageValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                    />
                    <select
                      value={storageUnit}
                      onChange={(e) => setStorageUnit(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-[var(--brand)] cursor-pointer"
                    >
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Max User Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Plan Subtitle / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Ideal for growing M&A teams and data rooms"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              {/* Feature List Builder */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Included Plan Features
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="e.g. Dynamic Watermarking"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200/70 text-sm text-slate-700 font-medium"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
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
              <span>{isSubmitting ? 'Saving...' : 'Save Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
