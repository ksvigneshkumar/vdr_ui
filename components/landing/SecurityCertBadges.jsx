"use client";

import React from "react";

export default function SecurityCertBadges() {
  return (
    <div className="w-full bg-brand py-3.5 sm:py-5 px-3 sm:px-8 md:px-16 shadow-inner select-none relative overflow-hidden">
      {/* Subtle Ambient Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto flex items-center justify-around sm:justify-center gap-2 sm:gap-8 md:gap-14 relative z-10">

        {/* 1. AICPA SOC 2 Seal Logo */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 group cursor-pointer text-center sm:text-left" title="AICPA SOC 2 Type II Certified">
          <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white shadow-md border-2 border-white/90 flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
              <text x="50" y="32" textAnchor="middle" fontSize="12" fontWeight="900" fill="currentColor" fontFamily="sans-serif">AICPA</text>
              <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="900" fill="var(--brand)" fontFamily="sans-serif">SOC</text>
              <text x="50" y="70" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">TYPE II</text>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10.5px] sm:text-[13px] font-black text-white leading-tight uppercase tracking-tight">SOC 2</span>
            <span className="hidden sm:inline text-[11px] font-bold text-white/80 leading-tight mt-0.5">Type II Certified</span>
          </div>
        </div>

        {/* 2. GDPR Compliant Seal Logo */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 group cursor-pointer text-center sm:text-left" title="GDPR Compliant">
          <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white shadow-md border-2 border-white/90 flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              {/* EU 12 Stars */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const cx = Number((50 + 35 * Math.sin(rad)).toFixed(3));
                const cy = Number((50 - 35 * Math.cos(rad)).toFixed(3));
                return (
                  <polygon
                    key={i}
                    points={`${cx},${cy - 3} ${cx + 1},${cy - 1} ${cx + 3},${cy - 1} ${cx + 1.5},${cy + 0.5} ${cx + 2},${cy + 2.5} ${cx},${cy + 1} ${cx - 2},${cy + 2.5} ${cx - 1.5},${cy + 0.5} ${cx - 3},${cy - 1} ${cx - 1},${cy - 1}`}
                    fill="var(--brand)"
                  />
                );
              })}
              <text x="50" y="56" textAnchor="middle" fontSize="16" fontWeight="900" fill="var(--brand)" fontFamily="sans-serif">GDPR</text>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10.5px] sm:text-[13px] font-black text-white leading-tight uppercase tracking-tight">GDPR</span>
            <span className="hidden sm:inline text-[11px] font-bold text-white/80 leading-tight mt-0.5">EU Data Privacy</span>
          </div>
        </div>

        {/* 3. HIPAA Compliant Seal Logo */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 group cursor-pointer text-center sm:text-left" title="HIPAA Compliant">
          <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white shadow-md border-2 border-white/90 flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              {/* Caduceus / Health Cross Emblem */}
              <path d="M50 20 V80 M35 32 Q50 24 65 32 M35 44 Q50 36 65 44" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="20" r="5" fill="var(--brand)" />
              <text x="50" y="65" textAnchor="middle" fontSize="13" fontWeight="900" fill="var(--brand)" fontFamily="sans-serif">HIPAA</text>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10.5px] sm:text-[13px] font-black text-white leading-tight uppercase tracking-tight">HIPAA</span>
            <span className="hidden sm:inline text-[11px] font-bold text-white/80 leading-tight mt-0.5">Health Privacy</span>
          </div>
        </div>

        {/* 4. ISO 27001 Certified Seal Logo */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 group cursor-pointer text-center sm:text-left" title="ISO/IEC 27001 Certified">
          <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white shadow-md border-2 border-white/90 flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <text x="50" y="32" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">ISO</text>
              <text x="50" y="52" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--brand)" fontFamily="sans-serif">27001</text>
              <text x="50" y="68" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">CERTIFIED</text>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10.5px] sm:text-[13px] font-black text-white leading-tight uppercase tracking-tight">ISO 27001</span>
            <span className="hidden sm:inline text-[11px] font-bold text-white/80 leading-tight mt-0.5">Info Security</span>
          </div>
        </div>

      </div>
    </div>
  );
}
