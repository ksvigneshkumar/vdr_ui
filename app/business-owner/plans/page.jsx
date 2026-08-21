"use client";

import React, { useState, useEffect } from 'react';

import PlanModal from '@/components/business-owner/PlanModal';
import { useDialog } from '@/components/ui/DialogProvider';
import {
  FaPlus,
  FaTags,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaArrowRight,
  FaUsers,
  FaDatabase,
} from 'react-icons/fa';

export default function BusinessOwnerPlansPage() {
  const [plans, setPlans] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showConfirm, showAlert } = useDialog();

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'assign'
  const [selectedPlan, setSelectedPlan] = useState(null);

  const fetchPlansData = async () => {
    try {
      const [plansRes, orgsRes] = await Promise.all([
        fetch('/api/business-owner/plans'),
        fetch('/api/business-owner/organizations'),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (orgsRes.ok) {
        const oData = await orgsRes.json();
        setOrganizations(oData.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching plans data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansData();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setModalMode('edit');
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleOpenAssign = () => {
    setModalMode('assign');
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const handleDeletePlan = async (plan) => {
    if (plan.name === 'Free' || plan.name === 'Pro' || plan.name === 'Enterprise') {
      await showAlert('System default plans cannot be deleted.');
      return;
    }
    if (!(await showConfirm(`Are you sure you want to delete plan "${plan.name}"?`))) {
      return;
    }

    try {
      const res = await fetch(`/api/business-owner/plans?id=${plan.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleSavePlan = async (payload) => {
    const isAssign = payload.action === 'assign';
    const method = isAssign ? 'PATCH' : payload.planId ? 'PUT' : 'POST';

    const res = await fetch('/api/business-owner/plans', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to process plan request');
    }

    await fetchPlansData();
  };

  const getPlanOrgCount = (planName) => {
    return organizations.filter((o) => o.plan === planName).length;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SaaS Subscription Tiers
          </h1>
          <p className="text-slate-500 mt-2 text-[15px]">
            Configure VDR pricing plans, storage and user seat quotas, and assign subscription tiers to tenant organizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAssign}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all shadow-2xs flex items-center gap-2"
          >
            <FaBuilding className="text-slate-400" />
            <span>Assign Plan to Org</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-xl hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <FaPlus />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Plans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 rounded-xl bg-white border border-slate-200 animate-pulse"
            />
          ))
        ) : (
          plans.map((plan) => {
            const orgCount = getPlanOrgCount(plan.name);
            const isGb = plan.storageLimitMb >= 1024 && plan.storageLimitMb % 1024 === 0;
            const storageDisplay = isGb ? `${plan.storageLimitMb / 1024} GB` : `${plan.storageLimitMb || 0} MB`;

            return (
              <div
                key={plan.id}
                className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badge & Price */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-lg bg-brand-soft text-[var(--brand)] text-xs font-bold mb-2">
                        {plan.name} Tier
                      </span>
                      <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {plan.price}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[var(--brand)] transition-colors"
                        title="Edit plan"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 transition-colors"
                        title="Delete plan"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
                    {plan.description || 'Flexible virtual data room features for deal teams.'}
                  </p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
                        <FaDatabase className="text-[var(--brand)]" />
                        <span>Storage</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">
                        {storageDisplay}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
                        <FaUsers className="text-[var(--brand)]" />
                        <span>Seats</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">
                        {plan.maxUsers} Users
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Included Capabilities
                    </span>
                    {(plan.features || []).map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-slate-700 font-medium"
                      >
                        <FaCheckCircle className="text-emerald-500 text-sm shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Assign Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">
                    Active in <strong className="text-slate-900">{orgCount}</strong> {orgCount === 1 ? 'Org' : 'Orgs'}
                  </span>
                  <button
                    onClick={handleOpenAssign}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[var(--brand)] hover:underline"
                  >
                    <span>Assign</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Plan Modal */}
      <PlanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePlan}
        mode={modalMode}
        initialData={selectedPlan}
        organizations={organizations}
        plans={plans}
      />
    </div>
  );
}
