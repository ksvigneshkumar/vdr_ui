"use client";

import React, { useState, useEffect } from 'react';
import StorageLimitModal from '@/components/business-owner/StorageLimitModal';
import {
  FaDatabase,
  FaBuilding,
  FaEdit,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';

export default function BusinessOwnerStoragePage() {
  const [storageData, setStorageData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [globalStorageInput, setGlobalStorageInput] = useState('');
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);

  const fetchStorageData = async () => {
    try {
      const [storageRes, orgsRes] = await Promise.all([
        fetch('/api/business-owner/storage'),
        fetch('/api/business-owner/organizations'),
      ]);

      if (storageRes.ok) {
        const sData = await storageRes.json();
        setStorageData(sData);
        setGlobalStorageInput(sData.storageLimitGb || '');
      }
      if (orgsRes.ok) {
        const oData = await orgsRes.json();
        setOrganizations(oData.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching storage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const handleSaveGlobalLimit = async () => {
    const val = Number(globalStorageInput);
    if (!isNaN(val) && val > 0) {
      try {
        const res = await fetch('/api/business-owner/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ globalStorageLimitGb: val }),
        });

        if (!res.ok) {
          throw new Error('Failed to update global limit');
        }

        setStorageData(prev => ({ ...prev, storageLimitGb: val }));
        setIsEditingGlobal(false);
        alert('Global storage limit updated in Database successfully!');
      } catch (err) {
        console.error('Error saving global limit:', err);
        alert('Failed to update global storage limit');
      }
    }
  };

  const handleOpenLimitModal = (org) => {
    setSelectedOrg(org);
    setModalOpen(true);
  };

  const handleSaveQuota = async (payload) => {
    const res = await fetch('/api/business-owner/organizations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.orgId,
        storageLimitMb: payload.storageLimitMb,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update storage limit');
    }

    await fetchStorageData();
  };

  const totalUsedGb = storageData?.storageUsedGb || 0;
  const totalLimitGb = storageData?.storageLimitGb || 1;
  const globalPct = Math.min(100, Math.round((totalUsedGb / totalLimitGb) * 100));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          File Vault Storage &amp; Quotas
        </h1>
        <p className="text-slate-500 mt-2 text-[15px]">
          Monitor data room document consumption and assign storage capacity limits per tenant organization.
        </p>
      </div>

      {/* Global Storage Summary Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center text-[var(--brand)] text-xl">
              <FaDatabase />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total System Storage Allocated
              </span>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalUsedGb} GB <span className="text-slate-400 font-normal text-lg">/</span>
                </div>
                {isEditingGlobal ? (
                  <>
                    <input
                      type="number"
                      min="1"
                      value={globalStorageInput}
                      onChange={(e) => setGlobalStorageInput(e.target.value)}
                      className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-lg font-bold text-slate-900 focus:outline-none focus:border-[var(--brand)]"
                    />
                    <span className="text-slate-400 font-normal text-lg">GB</span>
                    <button
                      onClick={handleSaveGlobalLimit}
                      className="px-3 py-1.5 bg-[var(--brand)] text-white text-xs font-bold rounded-lg hover:bg-[var(--brand-dark)] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingGlobal(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      <span className="text-slate-400 font-normal text-lg">{totalLimitGb} GB</span>
                    </div>
                    <button
                      onClick={() => {
                        setGlobalStorageInput(totalLimitGb);
                        setIsEditingGlobal(true);
                      }}
                      className="ml-1 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[var(--brand)] hover:bg-brand-soft transition-colors"
                      title="Edit Global Limit"
                    >
                      <FaEdit />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-500">Global Utilization</span>
              <span className="text-[var(--brand)]">{globalPct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--brand)] rounded-full transition-all duration-500"
                style={{ width: `${globalPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Organization Storage Usage Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Tenant Storage Usage &amp; Capacity
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Click edit to adjust individual organization quotas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[12.5px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Organization</th>
                <th className="py-4 px-6">Plan</th>
                <th className="py-4 px-6">Storage Used</th>
                <th className="py-4 px-6">Assigned Limit</th>
                <th className="py-4 px-6">Utilization</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading storage metrics...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No tenant organizations found.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const usedGb = org.storageUsedGb || 0;
                  const limitGb = org.storageLimitGb || 1;
                  const pct = Math.min(100, Math.round((usedGb / limitGb) * 100));
                  const isWarning = pct >= 85;

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)] shrink-0">
                            <FaBuilding className="text-sm" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{org.name}</p>
                            <span className="text-xs text-slate-400">{org.adminEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {usedGb} GB
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {limitGb} GB
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-36">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className={isWarning ? 'text-amber-600' : 'text-slate-600'}>
                              {pct}%
                            </span>
                            {isWarning && (
                              <span className="text-amber-600 inline-flex items-center gap-1">
                                <FaExclamationTriangle className="text-[10px]" /> High
                              </span>
                            )}
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isWarning ? 'bg-amber-500' : 'bg-[var(--brand)]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenLimitModal(org)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                        >
                          <FaEdit />
                          <span>Edit Quota</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quota Modal */}
      <StorageLimitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveQuota}
        organization={selectedOrg}
      />
    </div>
  );
}
