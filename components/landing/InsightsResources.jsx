"use client";

import React from "react";

const INSIGHTS_DATA = [
  {
    id: 1,
    category: "BLOG",
    title: "SecureVDR Recognized for Secure AI Innovation in M&A Dealmaking",
    linkText: "READ MORE",
    iconType: "arrow-up-right",
    imageUrl: "/images/insights/award_trophies.jpg",
    imageAlt: "SecureVDR AI Innovation Awards"
  },
  {
    id: 2,
    category: "BLOG",
    title: "How Infrastructure Divestments and Wealth Roll-ups Are Reshaping New Zealand M&A...",
    linkText: "READ MORE",
    iconType: "arrow-right",
    imageUrl: "/images/insights/infrastructure_deal.jpg",
    imageAlt: "Infrastructure Divestments and Global Deal Flow"
  },
  {
    id: 3,
    category: "PODCASTS",
    title: "M&A's Biggest AI Risk Isn't What You Think",
    linkText: "READ MORE",
    iconType: "arrow-up-right",
    imageUrl: "/images/insights/the_dealist_podcast.jpg",
    imageAlt: "The Dealist M&A Executive Podcast"
  }
];

export default function InsightsResources() {
  return (
    <section id="insights" className="w-full bg-white py-16 sm:py-20 md:py-24 px-4 sm:px-8 md:px-16 select-none relative border-t border-slate-100 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header with Teal Gradient Letters */}
        <div className="text-center mb-10 sm:mb-14" data-aos="fade-up">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-brand-adaptive tracking-tight">
            Latest News, Deals &amp; <span className="text-brand">Podcasts</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base mt-2.5 max-w-xl mx-auto px-2">
            Stay ahead with the latest industry intelligence, transaction trends, and M&amp;A innovation.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {INSIGHTS_DATA.map((item, idx) => (
            <div
              key={item.id}
              data-aos="fade-up"
              data-aos-delay={idx * 100}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between border border-slate-200/90 hover:border-brand"
            >
              {/* Card Top Real Editorial Image */}
              <div className="w-full h-48 sm:h-52 md:h-56 overflow-hidden relative border-b border-gray-100 bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-7 md:p-8 flex flex-col justify-between flex-1 bg-white">
                <div>
                  {/* Category Pill / Tag in Teal Gradient */}
                  <div className="text-xs font-black tracking-widest text-brand uppercase mb-2 sm:mb-3 font-mono">
                    {item.category}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight mb-6 group-hover:text-brand transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* Bottom Read More Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider text-brand group-hover:text-brand-800 uppercase transition-colors"
                  >
                    {item.iconType === "arrow-up-right" ? (
                      <span className="text-amber-500 font-bold text-sm">↗</span>
                    ) : (
                      <span className="text-amber-500 font-bold text-sm">→</span>
                    )}
                    <span>{item.linkText}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
