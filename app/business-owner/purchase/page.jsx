"use client";

import React from 'react';
import { FaClock } from 'react-icons/fa';

export default function BusinessOwnerPurchasePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-xl p-12 sm:p-16 text-center shadow-2xs max-w-md w-full">
        <div className="w-16 h-16 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto mb-6">
          <FaClock className="text-2xl animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Coming Soon
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          We are working on bringing this feature to you soon.
        </p>
      </div>
    </div>
  );
}
