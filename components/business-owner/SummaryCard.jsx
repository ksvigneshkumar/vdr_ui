"use client";

import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  progress,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium text-slate-500 block mb-1">
            {title}
          </span>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Icon className="text-lg" />
          </div>
        )}
      </div>

      {/* Progress bar if provided */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Utilization</span>
            <span className="text-slate-600">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-800 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer / Subtitle */}
      <div className="mt-4 flex items-center justify-between text-[12px] pt-3 border-t border-slate-100">
        <span className="text-slate-500 font-medium">{subtitle}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              trendPositive ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {trendPositive ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
            <span>{trend}</span>
          </span>
        )}
      </div>
    </div>
  );
}
