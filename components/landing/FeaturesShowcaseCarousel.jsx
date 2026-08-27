"use client";

import React, { useState, useEffect, useRef } from "react";

const FEATURES_DATA = [
  {
    id: 1,
    letter: "A",
    title: "NDA & DSC",
    description: "Requires external users to review and acknowledge applicable NDAs or disclaimers before Data Room access, ensuring confidentiality terms are formally accepted during the access process.",
    buttonText: "Digital Signatures",
    image: "/NDA.PNG"
  },
  {
    id: 2,
    letter: "B",
    title: "Watermarking",
    description: "Applies persistent, non-removable watermarks to documents, helping identify users accessing or downloading files while strengthening document traceability, accountability, and information security.",
    buttonText: "Anti-Leak Security",
    image: "/watermark.PNG"
  },
  {
    id: 3,
    letter: "C",
    title: "Secure Document Viewing",
    description: "Provides permission-based access to documents through a controlled and secure viewing environment, ensuring users can securely access authorized content without unauthorized document actions.",
    buttonText: "View-Only Access",
    image: "/secure view.PNG"
  },
  {
    id: 4,
    letter: "D",
    title: "Secure Document Download",
    description: "Protects downloaded documents through security controls, helping maintain document confidentiality and security even when files are downloaded, transferred, or shared externally.",
    buttonText: "Encrypted DRM",
    image: "/Secure doc download.PNG"
  },
  {
    id: 5,
    letter: "E",
    title: "Suspicious Activity Prevention",
    description: "Monitors unusual or unauthorized activities, generates security alerts, and applies access restrictions to help prevent unauthorized access to sensitive documents and Data Room content.",
    buttonText: "Instant Alerts",
    image: "/security alert.png"
  }
];

export default function FeaturesShowcaseCarousel() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll by card width every 3 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const firstCard = el.querySelector('[data-carousel-card]');
      const cardWidth = firstCard ? firstCard.clientWidth : (window.innerWidth < 640 ? window.innerWidth * 0.85 : 540);
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 30) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const firstCard = el.querySelector('[data-carousel-card]');
      const step = firstCard ? -firstCard.clientWidth : (window.innerWidth < 640 ? -window.innerWidth * 0.85 : -540);
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const firstCard = el.querySelector('[data-carousel-card]');
      const step = firstCard ? firstCard.clientWidth : (window.innerWidth < 640 ? window.innerWidth * 0.85 : 540);
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  // Duplicate data to give endless seamless scrolling
  const duplicatedFeatures = [...FEATURES_DATA, ...FEATURES_DATA];

  return (
    <section id="features" className="w-full bg-white py-16 sm:py-20 md:py-24 select-none relative overflow-hidden border-t border-slate-100">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-16" data-aos="fade-up">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-brand-adaptive tracking-tight max-w-4xl mx-auto leading-tight px-2">
            Experience the future of deal management with AI-driven features
          </h2>
        </div>

        {/* Carousel Container with Left/Right Arrows */}
        <div 
          className="relative group/carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll Left"
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-slate-800 border border-slate-200 shadow-xl items-center justify-center z-20 hover:scale-110 hover:border-brand-400 hover:text-brand transition-all cursor-pointer"
          >
            &#10094;
          </button>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll Right"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-slate-800 border border-slate-200 shadow-xl items-center justify-center z-20 hover:scale-110 hover:border-brand-400 hover:text-brand transition-all cursor-pointer"
          >
            &#10095;
          </button>

          {/* Auto-scrolling Features Row */}
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex overflow-x-auto no-scrollbar scroll-smooth py-3 sm:py-4 cursor-grab active:cursor-grabbing border-y border-slate-200/80 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex shrink-0 gap-0 items-stretch">
              {duplicatedFeatures.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  data-carousel-card
                  className="w-[85vw] max-w-[340px] xs:w-[340px] sm:max-w-none sm:w-[440px] md:w-[500px] lg:w-[560px] shrink-0 p-4 sm:p-6 md:p-8 flex flex-col justify-between border-r border-slate-200/80 bg-white group hover:bg-slate-50/40 transition-colors duration-300 snap-center"
                >
                  <div>
                    {/* Top Letter & Tag Indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand transition-colors">
                        0{item.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Feature Spotlight
                      </span>
                    </div>

                    {/* UI Screenshot Mockup Box (Professional Browser Window) */}
                    <div className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-md group-hover:shadow-xl group-hover:border-brand-300 transition-all duration-500 mb-5">
                      {/* Window Header */}
                      <div className="w-full bg-slate-100/90 px-3.5 py-2 border-b border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 bg-white/90 px-3 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                          securevdr.app/{item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        </div>
                        <div className="w-8"></div>
                      </div>

                      {/* Image Area (Snug 16/10 aspect ratio without extra bottom space) */}
                      <div className="w-full aspect-[16/10] bg-slate-50 flex items-center justify-center p-1.5 sm:p-2.5 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain object-top drop-shadow-sm group-hover:scale-105 transition-transform duration-500 select-none pointer-events-none"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Feature Title */}
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2.5 tracking-tight group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-sm sm:text-[14.5px] font-medium leading-relaxed mb-5">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Action Pill */}
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full font-bold text-xs sm:text-[13px] bg-brand text-white shadow-md group-hover:scale-105 group-hover:shadow-brand-500/30 transition-all duration-300">
                      <span>{item.buttonText}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
