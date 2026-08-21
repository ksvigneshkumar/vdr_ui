"use client";

import React from 'react';
import WorkspaceStatusBadge from '@/components/workspaces/WorkspaceStatusBadge';
import { FaClock, FaShieldAlt, FaEnvelope } from 'react-icons/fa';

export default function WorkspacePendingOverlay({ companyName = "Your Organization" }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-8 text-center space-y-6 shadow-md animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500 shadow-sm shadow-amber-500/10">
          <FaClock className="text-3xl animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-center mb-3">
            <WorkspaceStatusBadge status="pending" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Workspace Pending Approval
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Welcome! Your registration for <strong className="text-white">{companyName}</strong> has been submitted. Our Business Owner team is currently reviewing your workspace request.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <FaShieldAlt className="text-emerald-400 shrink-0" />
            <span>Executive security verification in progress</span>
          </div>
          <p>
            Dashboard and workspace access will automatically unlock once your request is accepted. You will receive an email notification when your workspace is ready.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a
            href="mailto:owner@pibivdr.com"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <FaEnvelope />
            <span>Contact Administrator</span>
          </a>
        </div>
      </div>
    </div>
  );
}
