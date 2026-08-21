"use client";

import React, { useState, useEffect } from 'react';
import {
  FaUserShield,
  FaEnvelope,
  FaShieldAlt,
  FaKey,
  FaCheckCircle,
  FaSlidersH,
  FaPalette,
} from 'react-icons/fa';

export default function SettingsPage() {
  const [session, setSession] = useState(null);
  const [name, setName] = useState('Anushiya Selvaraj');
  const [email, setEmail] = useState('owner@pibivdr.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Global system configs
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);
  const [require2fa, setRequire2fa] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('vdr_session');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setSession(s);
        if (s.name) setName(s.name);
        if (s.email) setEmail(s.email);
      } catch (e) {
        console.error('Session error:', e);
      }
    }
    
    const sysSettings = localStorage.getItem('vdr_sys_settings');
    if (sysSettings) {
      try {
        const parsed = JSON.parse(sysSettings);
        if (parsed.maintenanceMode !== undefined) setMaintenanceMode(parsed.maintenanceMode);
        if (parsed.defaultTrialDays !== undefined) setDefaultTrialDays(parsed.defaultTrialDays);
        if (parsed.require2fa !== undefined) setRequire2fa(parsed.require2fa);
      } catch (e) {}
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setToast('');

    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      // Update session in localStorage
      const updated = {
        ...(session || {}),
        name,
        email,
      };
      localStorage.setItem('vdr_session', JSON.stringify(updated));
      setSession(updated);

      setNewPassword('');
      setConfirmPassword('');
      setIsSaving(false);
      setToast('Super Admin profile updated successfully.');

      setTimeout(() => setToast(''), 4000);
    }, 500);
  };

  const handleSaveSystem = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('vdr_sys_settings', JSON.stringify({
        maintenanceMode,
        defaultTrialDays,
        require2fa
      }));
      setIsSaving(false);
      setToast('Global system security & trial settings applied.');
      setTimeout(() => setToast(''), 4000);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Executive Settings &amp; Security
        </h1>
        <p className="text-slate-500 mt-2 text-[15px]">
          Manage Business Owner credentials, system maintenance modes, default trial durations, and 2FA policies.
        </p>
      </div>

      {toast && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <FaCheckCircle className="text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Admin Profile & Credentials */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              <FaUserShield className="text-base" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Super Admin Identity
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Business Owner Executive Account
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Full Executive Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Primary Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Update Security Password (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (leave blank to keep)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-xl hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Global System Policies */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
              <FaSlidersH className="text-base" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                System Policies
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Global VDR Configuration
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveSystem} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Default Trial Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={defaultTrialDays}
                onChange={(e) => setDefaultTrialDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Enforce 2FA for Super Admins
                  </span>
                  <span className="text-xs text-slate-500">
                    Require second factor upon login
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={require2fa}
                  onChange={(e) => setRequire2fa(e.target.checked)}
                  className="w-5 h-5 accent-[var(--brand)] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Maintenance Mode
                  </span>
                  <span className="text-xs text-slate-500">
                    Temporarily restrict new tenant signups
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-5 h-5 accent-[var(--brand)] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all"
              >
                Apply System Policies
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
