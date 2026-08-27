"use client";

import React, { useState } from "react";

const PROCESSES = [
  {
    id: "mna",
    name: "M&A",
    tag: "Transactions",
    title: "Mergers & Acquisitions",
    desc: "Accelerate buy-side and sell-side transactions. Track buyer engagement, securely manage diligence vaults, and close deals 40% faster.",
    features: ["Real-time buyer engagement scoring", "In-browser redaction & watermarks", "Granular group permissions"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: "due-diligence",
    name: "Due Diligence",
    tag: "Audit & Review",
    title: "Seamless Due Diligence",
    desc: "Eliminate chaotic spreadsheets and email attachments. Structure multi-tier folders with auto-indexing and instant document search.",
    features: ["Automated folder indexing", "Full-text OCR search", "Q&A workflow module"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: "legal",
    name: "Legal & Litigation",
    tag: "Compliance",
    title: "Legal & Litigation Management",
    desc: "Protect attorney-client privilege, redact sensitive data permanently, and generate tamper-proof audit trails for regulatory compliance.",
    features: ["Irreversible redaction tool", "Court-admissible audit trails", "Digital NDA enforcement"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    )
  },
  {
    id: "ipo",
    name: "IPO",
    tag: "Capital Markets",
    title: "Initial Public Offerings (IPO)",
    desc: "Manage syndicate investment banks, underwriters, auditors, and legal teams simultaneously with precision access boundaries.",
    features: ["Syndicate room segregation", "High-volume secure downloads", "Strict DRM & screenshot block"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    id: "private-equity",
    name: "Private Equity",
    tag: "Fund Management",
    title: "Private Equity & Portfolio",
    desc: "Streamline capital calls, quarterly LP reporting, fund formation, and portfolio company acquisitions on one unified platform.",
    features: ["Limited Partner (LP) portal", "Centralized asset vaults", "Dynamic watermark branding"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    id: "investment-banking",
    name: "Investment Banking",
    tag: "Advisory",
    title: "Investment Banking Advisory",
    desc: "Execute high-stakes advisory mandates. Share teasers, CIMs, and financial models with total control over who views, prints, or downloads.",
    features: ["Predictive buyer analytics", "Time-expiring link sharing", "Bulk permission updates"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: "startups",
    name: "Startups",
    tag: "Fundraising",
    title: "Startup & Venture Capital",
    desc: "Impress venture capitalists and angel syndicates. Keep pitch decks, cap tables, IP patents, and financials organized for Seed to Series B rounds.",
    features: ["Fast self-serve setup", "Investor activity tracking", "Affordable transparent plans"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
];

export default function BusinessProcessesShowcase() {
  const [selectedId, setSelectedId] = useState("mna");
  const selected = PROCESSES.find((p) => p.id === selectedId) || PROCESSES[0];

  return (
    <section id="solutions" className="w-full bg-[#fafbfc] py-20 sm:py-24 px-6 md:px-16 relative select-none border-t border-slate-100">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,216,182,0.06),transparent_60%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16" data-aos="fade-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-adaptive tracking-tight max-w-4xl mx-auto leading-tight">
            One Virtual Data Room for Every <span className="text-brand">Critical Business Process</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base md:text-lg mt-3.5 max-w-3xl mx-auto leading-relaxed">
            SecureVDR supports organisations, advisers, and transaction teams managing sensitive documents across deals and corporate projects.
          </p>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 mb-8 sm:mb-12" data-aos="fade-up" data-aos-delay="100">
          {PROCESSES.map((proc) => {
            const isActive = proc.id === selectedId;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => setSelectedId(proc.id)}
                className={`px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  isActive
                    ? "bg-brand text-white shadow-md shadow-brand-500/20 scale-105"
                    : "bg-white text-slate-700 hover:text-brand hover:bg-slate-50 border border-slate-200/90 shadow-2xs"
                }`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? "bg-white" : "bg-brand"}`}></span>
                <span>{proc.name}</span>
              </button>
            );
          })}
        </div>

        {/* Featured Process Spotlight Card */}
        <div
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-5 sm:p-8 md:p-10 lg:p-12 transition-all duration-500"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Area */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand border border-brand-200/70 flex items-center justify-center shadow-xs">
                  {selected.icon}
                </div>
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    {selected.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {selected.title}
                  </h3>
                </div>
              </div>

              <p className="text-slate-600 text-sm sm:text-base md:text-[17px] font-normal leading-relaxed mb-6">
                {selected.desc}
              </p>

              {/* Key Features List */}
              <div className="space-y-3 mb-8">
                {selected.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-100 text-brand flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <span className="text-slate-700 text-sm sm:text-[15px] font-medium">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div>
                <a
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-brand-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore {selected.name} Data Room</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            {/* Right Interactive Visual Card */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#020b33] p-6 sm:p-8 text-white shadow-2xl border border-slate-700/50 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-brand-400"></div>
                  </div>
                  <span className="text-xs font-mono text-brand-400 font-bold uppercase tracking-wider">
                    ● Active Vault
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-brand-400 text-lg">📁</span>
                      <div>
                        <div className="text-xs font-bold text-white">{selected.name} Diligence Index</div>
                        <div className="text-[11px] text-slate-400">128 Documents &bull; AES-256</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      Protected
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-brand-400 text-lg">🔒</span>
                      <div>
                        <div className="text-xs font-bold text-white">Dynamic Watermark Policy</div>
                        <div className="text-[11px] text-slate-400">Viewer IP &amp; Live Timestamp</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Enforced
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-brand-400 text-lg">⚡</span>
                      <div>
                        <div className="text-xs font-bold text-white">Audit &amp; Intelligence Log</div>
                        <div className="text-[11px] text-slate-400">Real-time view tracking</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Live
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Compliance: SOC2 &bull; GDPR &bull; ISO</span>
                  <span className="text-brand-400 font-bold">100% Zero-Leak</span>
                </div>
              </div>
            </div>

          </div>
        </div>



      </div>
    </section>
  );
}
