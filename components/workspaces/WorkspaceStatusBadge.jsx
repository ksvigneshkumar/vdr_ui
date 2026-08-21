"use client";

import React from 'react';

export default function WorkspaceStatusBadge({ status, className = "" }) {
  const normStatus = status?.toLowerCase() || 'approved';

  if (normStatus === 'pending') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Pending Approval
      </span>
    );
  }

  if (normStatus === 'rejected') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Rejected
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Approved
    </span>
  );
}
