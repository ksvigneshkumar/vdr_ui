"use client";

import React, { useState, useEffect, useRef } from "react";

const STORIES = [
  {
    id: 1,
    companyLogo: "Deloitte.",
    quote: "Kevin Defour, is the Director Investment Banking at Deloitte, Belgium. Discover how he brings order to the M&A chaos with SecureVDR.",
    readStoryText: "Read Kevin's story",
    imageUrl: "/images/stories/story_1.jpg",
    videoTitle: "Deloitte: Bringing Order to M&A Deal Chaos"
  },
  {
    id: 2,
    companyLogo: "Oaklins",
    quote: "Frederik van der Schoot, Partner at Oaklins, and the Oaklins Netherlands team have completed more than 60 deals on the SecureVDR platform in the past 18 months.",
    readStoryText: "Read Frederik's story",
    imageUrl: "/images/stories/story_2.jpg",
    videoTitle: "Oaklins: Navigating High-Speed Cross Border Transactions"
  },
  {
    id: 3,
    companyLogo: "PSG CAPITAL",
    quote: "Logan Hufkie, a director at PSG Capital, emphasises the importance of family and relationships in corporate finance with SecureVDR.",
    readStoryText: "Read Logan's story",
    imageUrl: "/images/stories/story_3.jpg",
    videoTitle: "PSG Capital: Modern Corporate Finance & Relationships"
  },
  {
    id: 4,
    companyLogo: "Hall & Wilcox",
    companySub: "smarter law",
    quote: "Ed Paton, a partner at Hall & Wilcox in Melbourne, Australia, shares the firm's growth from 8 partners to 123 and its expansion to eight offices across Australia.",
    readStoryText: "Read Ed's story",
    imageUrl: "/images/stories/story_4.jpg",
    videoTitle: "Hall & Wilcox: Scaling Multi-Jurisdiction Deal Governance"
  },
  {
    id: 5,
    companyLogo: "MORGAN SHAW",
    companySub: "ADVISORY",
    quote: '"SecureVDR is like the Apple of data rooms". Leigh Golombick, Director of M&A at Morgan Shaw Advisory',
    readStoryText: "Read Leigh's story",
    imageUrl: "/images/stories/story_5.jpg",
    videoTitle: "Morgan Shaw Advisory: Premium Dealmaking Standards"
  }
];

export default function CustomerStoriesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Auto-scroll every 5.5 seconds
  useEffect(() => {
    if (isPaused || activeModal) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STORIES.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, activeModal]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % STORIES.length);
  };

  const current = STORIES[currentIndex];

  return (
    <section className="w-full bg-[#f8fafc] py-16 sm:py-24 select-none relative overflow-hidden border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12" data-aos="fade-up">
          <div className="inline-block px-4 py-1 mb-3.5 rounded-full bg-emerald-50 text-[#00a877] font-bold text-xs uppercase tracking-widest border border-emerald-200/60 shadow-2xs">
            Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-[#00a877] via-[#059669] to-[#088382] bg-clip-text text-transparent tracking-tight">
            Trusted by the best. Discover why.
          </h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-2.5 max-w-xl mx-auto">
            See how world-leading dealmakers, law firms, and corporations close high-stakes transactions.
          </p>
        </div>

        {/* Main Big Hero Card Container */}
        <div
          className="relative w-full h-[460px] sm:h-[520px] md:h-[560px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/60"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Background Images with Fade Transition */}
          {STORIES.map((item, idx) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentIndex ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={item.imageUrl}
                alt={item.companyLogo}
                className="w-full h-full object-cover"
              />
              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
            </div>
          ))}

          {/* Glassmorphism Outline Card in Center-Left */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] lg:w-[58%] p-6 sm:p-10 md:p-12 flex flex-col justify-center text-white z-10">
            <div className="p-6 sm:p-8 md:p-9 rounded-2xl border border-white/35 bg-black/25 backdrop-blur-md shadow-2xl max-w-xl transition-all duration-500">
              
              {/* Company Logo Header */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
                  {current.companyLogo}
                </span>
                {current.companySub && (
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-300">
                    {current.companySub}
                  </span>
                )}
              </div>

              {/* Story Quote */}
              <p className="text-white/95 text-sm sm:text-base md:text-[17px] font-normal leading-relaxed mb-7 drop-shadow-xs">
                {current.quote}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Watch Now Button (Permanently styled with Emerald-Teal Gradient) */}
                <button
                  type="button"
                  onClick={() => setActiveModal(current)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-gradient-to-r from-[#00a877] via-[#059669] to-[#088382] text-white font-bold text-xs sm:text-sm hover:opacity-95 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
                >
                  <span>Watch Now</span>
                  <span className="text-xs">▷</span>
                </button>

                {/* Read Story Button (Hover changes to Emerald-Teal Gradient) */}
                <button
                  type="button"
                  onClick={() => setActiveModal(current)}
                  className="inline-flex items-center px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-black/40 border border-white/40 text-white font-medium text-xs sm:text-sm hover:bg-[#00a877] hover:border-[#00a877] hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  {current.readStoryText}
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Right TV Logo Watermark */}
          <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex items-center gap-2 text-white/90 font-black text-xl sm:text-2xl drop-shadow-lg pointer-events-none select-none z-10">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm2 0v9h12V6H6zm3 13h6v2H9v-2z" />
            </svg>
            <span className="tracking-wider">TV</span>
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white border border-white/20 flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg hover:scale-110"
          >
            &#10094;
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white border border-white/20 flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg hover:scale-110"
          >
            &#10095;
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-6 sm:mt-8">
          {STORIES.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                dotIdx === currentIndex
                  ? "w-8 h-2.5 bg-gradient-to-r from-[#00a877] via-[#059669] to-[#088382] shadow-sm"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

      </div>

      {/* Video Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <h4 className="text-white font-bold text-base sm:text-lg">
                {activeModal.videoTitle}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Player Visual Simulation */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activeModal.imageUrl}
                alt={activeModal.companyLogo}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-slate-900 flex items-center justify-center text-2xl pl-1 shadow-2xl mb-4 hover:scale-110 hover:bg-gradient-to-r hover:from-[#00a877] hover:via-[#059669] hover:to-[#088382] hover:text-white transition-all cursor-pointer">
                  ▶
                </div>
                <h5 className="text-white text-lg sm:text-2xl font-black mb-1">
                  {activeModal.companyLogo} Executive Story
                </h5>
                <p className="text-slate-300 text-xs sm:text-sm max-w-md">
                  {activeModal.quote}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-950 flex items-center justify-between text-xs sm:text-sm text-slate-400">
              <span>SecureVDR TV &bull; Customer Insights Series</span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
