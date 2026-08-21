"use client";

import React, { useState } from "react";
import { WORKSPACE_TYPES, DEAL_TYPES, CURRENCIES, DEFAULT_WORKSPACE_FORM } from "@/lib/workspaces/constants";
import { validateWorkspaceForm } from "@/lib/workspaces/validation";
import { FaTimes, FaShieldAlt, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";

export default function WorkspaceModal({
  isOpen,
  mode = "create", // "create" | "edit"
  initialData = null,
  onClose,
  onSubmit,
  workspaces = [],
}) {
  const [formData, setFormData] = useState({
    type: "Virtual Data Room",
    name: "",
    dealType: "",
  });

  React.useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          type: initialData.type || "Virtual Data Room",
          name: initialData.name || "",
          dealType: initialData.dealType || "",
        });
      } else {
        setFormData({
          type: "Virtual Data Room",
          name: "",
          dealType: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNameTaken = formData.name.trim() !== "" && workspaces.some(ws => ws.name.toLowerCase() === formData.name.trim().toLowerCase());
  const isNameAvailable = formData.name.trim() !== "" && !isNameTaken;

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateWorkspaceForm(formData);
    if (!validation.isValid || isNameTaken) {
      if (!isNameTaken) setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    onSubmit({
      ...formData,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 transition-opacity">
      {/* Modal Card - Compact & Neat */}
      <div
        className="relative w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20 flex items-center justify-center text-[var(--brand)] shrink-0">
              <FaShieldAlt className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-gray-900 tracking-tight">
                {mode === "create" ? "Create New Workspace" : "Edit Workspace"}
              </h3>
              <p className="text-[12px] text-gray-500">
                {mode === "create"
                  ? "Configure your Virtual Data Room details."
                  : "Update workspace deal information."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body Form - Compact spacing */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4" noValidate>
          {/* 1. Workspace Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
              Workspace Type
            </label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full h-10 px-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 outline-none transition-all appearance-none cursor-pointer"
              >
                {WORKSPACE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Workspace Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-gray-400">
                {formData.name.length}/50 chars
              </span>
            </div>

            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Project Horizon - Q4 Acquisition"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full h-10 px-3 bg-gray-50/50 border rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 outline-none transition-all ${
                isNameTaken
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
                  : isNameAvailable 
                  ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10"
                  : errors.name
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-gray-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]/10"
              }`}
            />
            {isNameTaken && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <FaExclamationCircle />
                <span>Workspace name is already used</span>
              </p>
            )}
            {isNameAvailable && (
              <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <FaCheckCircle />
                <span>Workspace name is available</span>
              </p>
            )}
            {!isNameTaken && !isNameAvailable && errors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <FaExclamationCircle />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* 3. Deal Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
              Deal Type <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                value={formData.dealType}
                onChange={(e) => handleChange("dealType", e.target.value)}
                className="w-full h-10 px-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a deal type...</option>
                {DEAL_TYPES.map((deal) => (
                  <option key={deal} value={deal}>
                    {deal}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 text-xs">
                ▼
              </div>
            </div>
          </div>


          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Workspace"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
