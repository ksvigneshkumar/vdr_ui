"use client";

import React, { useState, useEffect, useRef } from "react";

const FEATURES_DATA = [
  {
    id: 1,
    letter: "A",
    title: "NDA",
    description: "Automate digital NDA execution, track legal compliance, and enforce confidentiality agreements before granting deal room access.",
    buttonText: "Digital Signatures",
    image: "/NDA.PNG"
  },
  {
    id: 2,
    letter: "B",
    title: "Watermark",
    description: "Protect critical intellectual property with dynamic user-specific watermarks featuring email, IP address, and live timestamp on every page.",
    buttonText: "Anti-Leak Security",
    image: "/watermark.PNG"
  },
  {
    id: 3,
    letter: "C",
    title: "Secure View",
    description: "Restricted in-browser viewing mode preventing unauthorized printing, downloading, copy-pasting, and screen recording.",
    buttonText: "View-Only Access",
    image: "/secure view.PNG"
  },
  {
    id: 4,
    letter: "D",
    title: "Secure Doc Download",
    description: "Encrypted offline access with automatic file revocation, 256-bit digital rights management (DRM), and expiration control.",
    buttonText: "Encrypted DRM",
    image: "/Secure doc download.PNG"
  },
  {
    id: 5,
    letter: "E",
    title: "Security Alert",
    description: "Real-time audit intelligence and instant threat notifications for suspicious logins, bulk downloads, and policy violations.",
    buttonText: "Instant Alerts",
    image: "/security alert.png"
  }
];

export default function FeaturesShowcaseCarousel() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll by card width every 3.5 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const cardWidth = 360;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 20) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  // Duplicate data to give endless seamless scrolling
  const duplicatedFeatures = [...FEATURES_DATA, ...FEATURES_DATA];

  return (
    <section id="features" className="w-full bg-white py-20 sm:py-24 select-none relative overflow-hidden border-t border-slate-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16" data-aos="fade-up">
          <div className="inline-block px-4 py-1 mb-3.5 rounded-full bg-brand-50 text-brand font-bold text-xs uppercase tracking-widest border border-brand-200/60 shadow-2xs">
            Security &amp; Governance
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-adaptive tracking-tight">
            Next-Gen Security &amp; Deal Protection
          </h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-2.5 max-w-2xl mx-auto">
            Bank-grade confidentiality, automated compliance, and dynamic threat protection built for high-stakes transactions.
          </p>
        </div>

        {/* Carousel Container with Left/Right Arrows */}
        <div className="relative group/carousel">
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
            className="flex overflow-x-auto no-scrollbar scroll-smooth py-4 cursor-grab active:cursor-grabbing border-y border-slate-200/80"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex shrink-0 gap-0 items-stretch">
              {duplicatedFeatures.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-[290px] sm:w-[330px] md:w-[360px] shrink-0 p-6 sm:p-8 flex flex-col justify-between border-r border-slate-200/80 bg-white group hover:bg-slate-50/50 transition-colors duration-300"
                >
                  <div>
                    {/* Top Letter Indicator */}
                    <div className="text-xs font-mono font-black text-slate-400 mb-4 tracking-widest uppercase">
                      {item.letter}
                    </div>

                    {/* UI Screenshot Mockup Box */}
                    <div className="w-full h-52 sm:h-56 bg-slate-50/90 rounded-xl flex items-center justify-center p-3 mb-6 border border-slate-100 overflow-hidden group-hover:border-brand-200 group-hover:shadow-md transition-all duration-500">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500 select-none pointer-events-none"
                        loading="lazy"
                      />
                    </div>

                    {/* Feature Title */}
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Action Pill */}
                  <div className="pt-2">
                    <span className="inline-block px-5 py-2 rounded-full font-bold text-xs bg-[#a3e635] text-slate-950 shadow-2xs group-hover:bg-brand group-hover:text-white transition-all duration-300">
                      {item.buttonText}
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
