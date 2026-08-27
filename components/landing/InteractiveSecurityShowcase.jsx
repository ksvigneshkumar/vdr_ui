"use client";

import React, { useState, useEffect } from "react";

const FEATURES_DATA = [
  {
    id: 1,
    title: "Role Based Access",
    description: "Assign granular permissions to users and administrators to ensure that sensitive data is only accessible to authorized personnel.",
    image: "/role based access.PNG"
  },
  {
    id: 2,
    title: "Document Access Control",
    description: "Maintain strict control over document visibility. Apply view-only, download, and print restrictions instantly to secure your intellectual property.",
    image: "/doc access control.PNG"
  },
  {
    id: 3,
    title: "Groups",
    description: "Organize users into logical groups for bulk permission management. Simplify access control across large teams and external stakeholders.",
    image: "/groups.PNG"
  },
  {
    id: 4,
    title: "Analytics",
    description: "Gain deep insights into user activity and document engagement. Track who viewed what and when with comprehensive audit trails.",
    image: "/analytics.PNG"
  }
];

export default function InteractiveSecurityShowcase() {
  const [activeTab, setActiveTab] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === FEATURES_DATA.length ? 1 : prev + 1));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      id="interactive-features" 
      className="w-full bg-white py-20 sm:py-24 select-none relative overflow-hidden border-t border-slate-100"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="inline-block px-5 py-1.5 mb-5 rounded-full border border-indigo-200/80 bg-indigo-50/50 text-indigo-600 font-bold text-[11px] uppercase tracking-widest shadow-sm">
            Security & Governance
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-black text-[#0f172a] tracking-tight mb-4">
            Next-Gen Security &amp; <span className="text-brand">Deal Protection</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bank-grade confidentiality, automated compliance, and dynamic threat protection built for high-stakes transactions.
          </p>
        </div>

        {/* Interactive Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start" data-aos="fade-up" data-aos-delay="100">
          
          {/* Left Side - Dynamic Image Viewer */}
          <div className="w-full lg:w-[55%] relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200/60 bg-gray-50 flex items-center justify-center h-[300px] sm:h-[400px] lg:h-[500px]">
            {FEATURES_DATA.map((feature) => (
              <div
                key={feature.id}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  activeTab === feature.id 
                    ? "opacity-100 translate-y-0 scale-100 z-10" 
                    : "opacity-0 translate-y-4 scale-95 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-contain p-2 sm:p-6 drop-shadow-xl"
                />
              </div>
            ))}
          </div>

          {/* Right Side - Accordion List */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center h-full lg:pt-4">
            <div className="space-y-1 relative">
              {/* Vertical line indicator background */}
              <div className="absolute left-[23px] top-8 bottom-8 w-[2px] bg-gray-100 z-0"></div>

              {FEATURES_DATA.map((feature) => {
                const isActive = activeTab === feature.id;
                
                return (
                  <div
                    key={feature.id}
                    className={`relative z-10 cursor-pointer transition-all duration-300 rounded-xl px-4 py-4 sm:py-5 ${
                      isActive ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100/80 scale-[1.02]" : "hover:bg-gray-50/80 scale-100"
                    }`}
                    onClick={() => setActiveTab(feature.id)}
                  >
                    <div className="flex items-start gap-5 sm:gap-6">
                      {/* Number Indicator */}
                      <div className="flex flex-col items-center mt-1">
                        <span
                          className={`text-sm sm:text-base font-black transition-colors duration-300 ${
                            isActive ? "text-slate-900" : "text-gray-300"
                          }`}
                        >
                          {feature.id}
                        </span>
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1">
                        <h3
                          className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                            isActive ? "text-slate-900" : "text-gray-300"
                          }`}
                        >
                          {feature.title}
                        </h3>
                        
                        {/* Description Wrapper (Animated height) */}
                        <div
                          className={`grid transition-all duration-500 ease-in-out ${
                            isActive ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed pr-2 pb-1 font-medium">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
