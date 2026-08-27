"use client";

import React, { useState, useEffect } from "react";

const FEATURES_DATA = [
  {
    id: 1,
    title: "Role-Based Access",
    description: "Assigns access permissions according to user roles and responsibilities, controlling access to documents, users, and data rooms while maintaining security and preventing unauthorized access.",
    image: "/role based access.PNG"
  },
  {
    id: 2,
    title: "Document Access Control",
    description: "Ensures users can view or download only authorized documents, preventing unauthorized users from opening, accessing, or downloading restricted files within the Data Room.",
    image: "/doc access control.PNG"
  },
  {
    id: 3,
    title: "Teams & Groups",
    description: "Enables authorized teams and groups to securely access, manage, and collaborate on assigned data while providing group-level analytics and controlled information access.",
    image: "/groups.PNG"
  },
  {
    id: 4,
    title: "Analytics",
    description: "Provides real-time insights into document engagement, including viewers, views, downloads, and user activity, enabling organizations to monitor document usage and engagement effectively.",
    image: "/analytics.PNG"
  },
  {
    id: 5,
    title: "Agentic Q&A",
    description: "Provides AI-powered, document-based answers in natural language, with direct citations to relevant documents and pages while maintaining secure, permission-based access to information.",
    image: "/Agentic Q&A.png"
  },
  {
    id: 6,
    title: "AI Assistant",
    description: "Enables intelligent document search, summarization, and follow-up queries while maintaining user-level access permissions and ensuring users receive information from authorized documents only.",
    image: "/ai_assistant.jpg"
  }
];

export default function InteractiveSecurityShowcase() {
  const [activeTab, setActiveTab] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === FEATURES_DATA.length ? 1 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section 
      id="functions" 
      className="w-full bg-white py-20 sm:py-24 select-none relative overflow-hidden border-t border-slate-100 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16" data-aos="fade-up">
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-black text-[#0f172a] tracking-tight mb-3 sm:mb-4">
            Simplicity and speed <span className="text-brand">reimagined</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            In a world where precision drives progress, we empower leaders to accelerate their projects with confidence
          </p>
        </div>

        {/* Interactive Layout */}
        <div 
          className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-14 items-start" 
          data-aos="fade-up" 
          data-aos-delay="100"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          
          {/* Left Side - Dynamic Image Viewer (Sticky on Desktop) */}
          <div className="w-full lg:w-[55%] relative rounded-2xl shadow-xl lg:shadow-2xl overflow-hidden border border-gray-200/60 bg-gray-50 flex items-center justify-center h-[260px] xs:h-[300px] sm:h-[380px] md:h-[460px] lg:h-[580px] lg:sticky lg:top-24">
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
                  className="w-full h-full object-contain p-2 sm:p-4 md:p-6 drop-shadow-lg"
                />
              </div>
            ))}
          </div>

          {/* Right Side - Accordion List */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center h-full">
            <div className="space-y-1 relative">
              {/* Vertical line indicator background */}
              <div className="absolute left-[23px] top-8 bottom-8 w-[2px] bg-gray-100 z-0"></div>

              {FEATURES_DATA.map((feature) => {
                const isActive = activeTab === feature.id;
                
                return (
                  <div
                    key={feature.id}
                    className={`relative z-10 cursor-pointer transition-all duration-300 rounded-xl px-4 py-3.5 sm:py-4 border ${
                      isActive 
                        ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-brand-200/70 scale-[1.02]" 
                        : "hover:bg-gray-50/80 scale-100 border-transparent"
                    }`}
                    onClick={() => {
                      setActiveTab(feature.id);
                      setIsPaused(true);
                    }}
                    onMouseEnter={() => {
                      setActiveTab(feature.id);
                      setIsPaused(true);
                    }}
                  >
                    <div className="flex items-start gap-5 sm:gap-6">
                      {/* Number Indicator */}
                      <div className="flex flex-col items-center mt-1">
                        <span
                          className={`text-sm sm:text-base font-black transition-colors duration-300 ${
                            isActive ? "text-brand" : "text-gray-300"
                          }`}
                        >
                          0{feature.id}
                        </span>
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1">
                        <h3
                          className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                            isActive ? "text-slate-900" : "text-gray-400"
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
