"use client";

import React, { useRef, useState, useEffect } from "react";

const PROJECTS_DATA = [
  {
    id: 1,
    num: "1",
    logoType: "airtrunk",
    name: "AIRTRUNK",
    amount: "$24",
    unit: "billion",
    description: "Blackstone Acquires Airtrunk"
  },
  {
    id: 2,
    num: "2",
    logoType: "ubs",
    name: "UBS",
    amount: "$11.6",
    unit: "billion",
    description: "Sale of Qube Holdings"
  },
  {
    id: 3,
    num: "3",
    logoType: "alinta",
    name: "alintaenergy",
    amount: "$6.5",
    unit: "billion",
    description: "Sembcorp acquires Alinta Energy"
  },
  {
    id: 4,
    num: "4",
    logoType: "cerebras",
    name: "cerebras",
    amount: "$1.1",
    unit: "billion",
    description: "Series G funding round"
  },
  {
    id: 5,
    num: "5",
    logoType: "macquarie",
    name: "MACQUARIE",
    amount: "$18.4",
    unit: "billion",
    description: "Global Infrastructure Fund VII"
  },
  {
    id: 6,
    num: "6",
    logoType: "blackstone",
    name: "Blackstone",
    amount: "$35.2",
    unit: "billion",
    description: "Real Estate Partners Acquisition"
  },
  {
    id: 7,
    num: "7",
    logoType: "goldman",
    name: "Goldman Sachs",
    amount: "$9.8",
    unit: "billion",
    description: "Strategic Cross-Border Merger"
  },
  {
    id: 8,
    num: "8",
    logoType: "kkr",
    name: "KKR",
    amount: "$15.0",
    unit: "billion",
    description: "Global Tech & Telecom Buyout"
  }
];

function ProjectLogo({ type, name }) {
  if (type === "airtrunk") {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-slate-900 fill-current" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
        <span className="text-[17px] font-black tracking-wider text-slate-900 font-sans uppercase">
          AIRTRUNK
        </span>
      </div>
    );
  }

  if (type === "ubs") {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 text-slate-900 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
        <span className="text-[22px] font-black tracking-widest text-slate-900 font-serif">
          UBS
        </span>
      </div>
    );
  }

  if (type === "alinta") {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm10-7a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm14.071-7.071a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM6.343 17.657a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zm12.728 1.414a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 0 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM6.343 6.343a1 1 0 0 1-1.414 0L3.515 4.929a1 1 0 0 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414z" />
        </svg>
        <span className="text-[17px] font-bold tracking-tight text-slate-900 font-sans lowercase">
          alintaenergy
        </span>
      </div>
    );
  }

  if (type === "cerebras") {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
        <span className="text-[18px] font-black tracking-tight text-slate-900 font-sans lowercase">
          cerebras
        </span>
      </div>
    );
  }

  if (type === "macquarie") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] text-slate-900">
          M
        </div>
        <span className="text-[16px] font-black tracking-widest text-slate-900 font-sans uppercase">
          MACQUARIE
        </span>
      </div>
    );
  }

  if (type === "blackstone") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[20px] font-black tracking-tight text-slate-900 font-serif">
          Blackstone
        </span>
      </div>
    );
  }

  if (type === "goldman") {
    return (
      <div className="flex items-center gap-2">
        <div className="px-1 py-0.5 bg-slate-900 text-white text-[10px] font-black font-serif rounded-xs">
          GS
        </div>
        <span className="text-[16px] font-bold tracking-tight text-slate-900 font-sans">
          Goldman Sachs
        </span>
      </div>
    );
  }

  return (
    <span className="text-[18px] font-black tracking-wider text-slate-900 uppercase">
      {name}
    </span>
  );
}

export default function ProjectsShowcase() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Smooth Auto-scroll loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const cardWidth = 320;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="w-full bg-gradient-to-r from-[#00a877] via-[#059669] to-[#088382] py-10 sm:py-14 select-none overflow-hidden relative shadow-inner">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none"></div>

      {/* Top Header Bar (Purely Centered & Big) */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 mb-8 text-center relative z-10">
        <h2 className="text-[19px] sm:text-[23px] md:text-[26px] font-black tracking-wide text-white uppercase font-sans leading-snug drop-shadow-xs">
          THE WORLD'S MOST IMPORTANT PROJECTS ARE DONE ON SECUREVDR
        </h2>
      </div>

      {/* Horizontal Carousel Container (Smooth Auto-Scroll) */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="w-full overflow-x-auto scroll-smooth no-scrollbar flex items-stretch py-2 px-4 sm:px-8 relative z-10"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
      >
        {PROJECTS_DATA.concat(PROJECTS_DATA).map((proj, idx) => {
          const serialNumber = (idx % PROJECTS_DATA.length) + 1;
          return (
            <div
              key={`${proj.id}-${idx}`}
              className="shrink-0 w-[270px] sm:w-[320px] min-h-[260px] sm:min-h-[280px] p-6 sm:p-8 flex flex-col justify-between rounded-2xl bg-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 mr-4 sm:mr-5 border border-white/80"
            >
              {/* Top Index Number (Sleek 2-digit Badge) */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                  {String(serialNumber).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  M&amp;A
                </span>
              </div>

              {/* Middle: Brand Logo */}
              <div className="my-auto py-3">
                <ProjectLogo type={proj.logoType} name={proj.name} />
              </div>

              {/* Bottom: Deal Amount & Subtitle */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight font-sans leading-none text-slate-900">
                    {proj.amount}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-800">
                    {proj.unit}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 font-medium tracking-tight mt-2 leading-snug">
                  {proj.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
