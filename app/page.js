"use client";

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import { FaBars, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import ProjectsShowcase from "@/components/landing/ProjectsShowcase";
import InsightsResources from "@/components/landing/InsightsResources";
import CustomerStoriesCarousel from "@/components/landing/CustomerStoriesCarousel";
import InteractiveSecurityShowcase from "@/components/landing/InteractiveSecurityShowcase";
import FeaturesShowcaseCarousel from "@/components/landing/FeaturesShowcaseCarousel";
import SecurityCertBadges from "@/components/landing/SecurityCertBadges";
import BusinessProcessesShowcase from "@/components/landing/BusinessProcessesShowcase";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      mirror: false,
      offset: 50,
      easing: 'ease-out-cubic'
    });
  }, []);

  useEffect(() => {
    const scrollBtn = document.getElementById('scrollTopBtn');
    const handleScroll = () => {
      if (window.scrollY > 500 && scrollBtn) {
        scrollBtn.classList.add('show');
      } else if (scrollBtn) {
        scrollBtn.classList.remove('show');
      }
    };
    const handleClick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    if (scrollBtn) {
      window.addEventListener('scroll', handleScroll);
      scrollBtn.addEventListener('click', handleClick);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        scrollBtn.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <main className="overflow-x-hidden relative w-full font-sans text-gray-800 bg-gray-50">

      {/* 1. Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-xs z-50 py-3.5 sm:py-4 px-4 sm:px-8 md:px-16 flex justify-between items-center transition-all duration-300 border-b border-slate-100">
        <Link href="/" className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <i className="fas fa-shield-alt text-brand text-2xl sm:text-3xl"></i>
          <span>SecureVDR</span>
        </Link>

        {/* Desktop / Large Tablet Navigation Links */}
        <div className="hidden lg:flex gap-8 items-center font-medium text-gray-600 text-sm md:text-base">
          <a href="#features" className="hover:text-brand transition-colors">Features</a>
          <a href="#products" className="hover:text-brand transition-colors">Products</a>
          <a href="#insights" className="hover:text-brand transition-colors">Insights</a>
        </div>

        {/* Desktop / Tablet Navigation Action Buttons */}
        <div className="hidden md:flex gap-2.5 lg:gap-3.5 items-center">
          {/* Business Owner Button */}
          <Link 
            href="/business-owner/login" 
            className="px-3.5 lg:px-4 py-2 border-2 border-brand text-brand rounded-full font-bold text-xs lg:text-sm flex items-center gap-1.5 hover:bg-brand hover:text-white transition-all duration-300"
          >
            <i className="fas fa-chart-line text-xs"></i> <span>Business Owner</span>
          </Link>

          {/* Login Button */}
          <a 
            href="/login" 
            className="px-4 lg:px-5 py-2 border-2 border-slate-200 text-slate-700 rounded-full font-bold text-xs lg:text-sm hover:border-brand hover:text-brand transition-all duration-300"
          >
            Login
          </a>

          {/* Register Button */}
          <Link 
            href="/register" 
            className="px-4 lg:px-5 py-2 bg-brand text-white rounded-full font-bold text-xs lg:text-sm shadow-md hover:opacity-95 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          aria-label="Toggle Navigation Menu"
          className="md:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-lg focus:outline-none cursor-pointer" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Mobile Drawer Overlay & Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fade-in">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Menu Drawer Content */}
          <div className="relative top-[60px] w-full bg-white shadow-2xl flex flex-col p-6 gap-3 border-b border-slate-200">
            <a href="#features" className="text-base font-bold text-slate-800 py-2.5 border-b border-slate-100 flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
              <span>Features</span>
              <span className="text-slate-400">→</span>
            </a>
            <a href="#products" className="text-base font-bold text-slate-800 py-2.5 border-b border-slate-100 flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
              <span>Products</span>
              <span className="text-slate-400">→</span>
            </a>
            <a href="#insights" className="text-base font-bold text-slate-800 py-2.5 border-b border-slate-100 flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
              <span>Insights</span>
              <span className="text-slate-400">→</span>
            </a>
            <Link href="/business-owner/login" className="text-base font-bold text-brand py-2.5 border-b border-slate-100 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="fas fa-chart-line"></i> 
              <span>Business Owner Portal</span>
            </Link>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-2">
              <a href="/login" className="w-full text-center px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-full font-bold text-sm" onClick={() => setIsMobileMenuOpen(false)}>
                Log In
              </a>
              <Link href="/register" className="w-full text-center px-4 py-2.5 bg-brand text-white rounded-full font-bold text-sm shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section (Responsive for Mobile & Tablet) */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-4 sm:px-8 md:px-16 pt-28 sm:pt-32 md:pt-36 pb-14 sm:pb-20 overflow-hidden bg-white">

        {/* Premium SaaS Background: Aurora + Grid */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
          {/* Subtle Dot Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPgo8L3N2Zz4=')] opacity-50"></div>

          {/* Aurora Glows */}
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] rounded-full bg-brand opacity-15 blur-[120px] animate-float"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[80vh] rounded-full bg-brand opacity-10 blur-[150px] animate-float-delayed"></div>

          {/* Bottom Fade Mask */}
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="max-w-5xl w-full mx-auto text-center relative z-10" data-aos="fade-up">

          {/* Main Hero Headline */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#0f172a] leading-tight mb-4 sm:mb-6 tracking-tight">
            Secure Document Sharing. <br className="hidden sm:inline" />
            Complete Control. <span className="text-brand">Zero Leaks.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 mb-8 sm:mb-10 max-w-3xl mx-auto font-medium px-2 leading-relaxed">
            Protect your sensitive files with built-in redaction, dynamic watermarking, and granular access controls built for high-stakes dealmaking.
          </p>

          {/* Hero Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14">
            <Link
              href="/register"
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-brand text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Start Free Trial →
            </Link>
            <a
              href="#products"
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm sm:text-base hover:bg-white hover:border-brand hover:text-brand transition-all duration-300"
            >
              Explore Products
            </a>
          </div>

          {/* Features / Stats Bar (Fully Responsive 2x2 on Mobile, 4x1 on Tablet/Desktop) */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200/90 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] mb-0.5">AES-256</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500">Data Encryption</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] mb-0.5">Granular</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500">Access Controls</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] mb-0.5">Dynamic</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500">Watermarking</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0f172a] mb-0.5">Built-in</div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500">Redaction Tool</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2.1 Important Projects Done On Platform (Auto-Scrolling Showcase) */}
      <ProjectsShowcase />

      {/* 3. Next-Gen Security & Deal Protection Showcase (Interactive Tabs) */}
      <InteractiveSecurityShowcase />

      {/* 2.2 Features Showcase Carousel (Ansarada Style) */}
      <FeaturesShowcaseCarousel />

      {/* 6. Executive Customer Stories Carousel (Ansarada-Style Cinematic Slides) */}
      <CustomerStoriesCarousel />

      {/* 7. Our Products Section (Responsive Image Cards) */}
      <section id="products" className="py-16 sm:py-20 md:py-24 px-4 sm:px-8 md:px-16 bg-white text-slate-900 relative border-t border-slate-100 select-none">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Section Header */}
          <div className="mb-10 sm:mb-14 md:mb-16" data-aos="fade-up">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-brand-adaptive tracking-tight mb-3 sm:mb-4">
              Our <span className="text-brand">Products</span>
            </h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto px-2 leading-relaxed">
              From secure document sharing to end-to-end deal execution, one platform, purpose-built for high-stakes transactions.
            </p>
          </div>

          {/* 3 Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 text-left items-stretch">
            
            {/* Product 1: Virtual Data Room (VDR) */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-brand shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between" data-aos="fade-up" data-aos-delay="0">
              <div>
                {/* Product Image */}
                <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src="/images/products/vdr_product.jpg"
                    alt="Virtual Data Room (VDR)"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      Core Platform
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-7">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 group-hover:text-brand transition-colors mb-2 sm:mb-3 tracking-tight">
                    Virtual Data Room (VDR)
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm md:text-[15px] font-medium leading-relaxed">
                    DPDP-aligned virtual data room built for high-stakes M&amp;A, IPO, and fundraising with bank-grade encryption.
                  </p>
                </div>
              </div>

              {/* Bottom Footer Link */}
              <div className="px-5 sm:px-6 md:px-7 pb-5 sm:pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs sm:text-sm font-bold text-brand flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  <span>Explore VDR</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Product 2: Document Management System */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-brand shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between" data-aos="fade-up" data-aos-delay="100">
              <div>
                {/* Product Image */}
                <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src="/images/products/dms_product.jpg"
                    alt="Document Management System"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      Document Safe
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-7">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 group-hover:text-brand transition-colors mb-2 sm:mb-3 tracking-tight">
                    Document Management System
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm md:text-[15px] font-medium leading-relaxed">
                    One secure centralized document hub. Right version, right stakeholder, and automated folder indexing.
                  </p>
                </div>
              </div>

              {/* Bottom Footer Link */}
              <div className="px-5 sm:px-6 md:px-7 pb-5 sm:pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs sm:text-sm font-bold text-brand flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  <span>Explore DMS</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Product 3: Deal Management System */}
            <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-brand shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between" data-aos="fade-up" data-aos-delay="200">
              <div>
                {/* Product Image */}
                <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-slate-900">
                  <img
                    src="/images/products/deal_management_product.jpg"
                    alt="Deal Management System"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xs">
                      Deal Flow
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-7">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 group-hover:text-brand transition-colors mb-2 sm:mb-3 tracking-tight">
                    Deal Management System
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm md:text-[15px] font-medium leading-relaxed">
                    Manage deals, due diligence tasks, and team workstreams from one integrated executive dashboard.
                  </p>
                </div>
              </div>

              {/* Bottom Footer Link */}
              <div className="px-5 sm:px-6 md:px-7 pb-5 sm:pb-6 pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs sm:text-sm font-bold text-brand flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  <span>Explore Deals</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7.1 Solutions for Every Critical Business Process (Interactive Tabs & Spotlights) */}
      <BusinessProcessesShowcase />

      {/* 7.1 Insights & Market Intelligence Resources */}
      <InsightsResources />

      {/* 8. Pre-Footer Seamless CTA Banner (Slim & Compact in Vibrant Teal Gradient) */}
      <section className="w-full bg-brand py-7 sm:py-9 px-6 md:px-16 text-white relative shadow-inner overflow-hidden border-b border-white/10">
        {/* Ambient Subtle Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Headline & Subtitle (Compact) */}
          <div className="max-w-2xl text-center lg:text-left" data-aos="fade-right">
            <h2 className="text-xl sm:text-2xl md:text-[26px] font-extrabold leading-snug tracking-tight text-white mb-1.5">
              Your next transaction deserves a data room with a global track record.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium leading-normal">
              Join 955,633+ dealmakers in 170 countries. Discover how deals get done.
            </p>
          </div>

          {/* Right Action CTA Buttons (Compact & Sleek) */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 shrink-0" data-aos="fade-left">
            <Link
              href="/register"
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-white text-white font-bold hover:bg-white hover:text-slate-900 transition-all duration-300 text-xs sm:text-sm shadow-xs"
            >
              Get a Demo
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#020b33] text-white font-bold hover:bg-black hover:scale-105 transition-all duration-300 text-xs sm:text-sm shadow-md"
            >
              Start for Free
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Premium Enterprise Footer (FirmsData Theme with Teal Certification Ribbon) */}
      <footer className="bg-[#020b33] text-slate-300 font-sans">
        {/* Main Footer Links Container */}
        <div className="max-w-7xl mx-auto px-6 md:px-16 pt-16 pb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

            {/* Column 1: Brand & Contact Info */}
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2.5 text-white font-black text-2xl tracking-wider">
                <i className="fas fa-shield-alt text-brand text-2xl"></i>
                <span className="font-extrabold tracking-tight text-2xl text-white">SecureVDR</span>
              </div>

              {/* Address */}
              <p className="text-[13px] text-slate-300 leading-relaxed mt-1">
                8th Floor, GM IT Park, 32-33, Sector 142,<br />
                Noida, Uttar Pradesh 201304
              </p>

              {/* Phone */}
              <div className="flex items-center gap-2.5 text-[13px] text-slate-300 mt-1">
                <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span>+91-9873694065</span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5 text-[13px] text-slate-300">
                <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <a href="mailto:contact@securevdr.com" className="hover:text-brand transition-colors">
                  contact@securevdr.com
                </a>
              </div>

              {/* Social Icon Badges (X & in) */}
              <div className="flex items-center gap-2.5 mt-2">
                {/* X (Twitter) */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-brand text-[#020b33] font-black flex items-center justify-center hover:bg-brand hover:scale-105 transition-all shadow-xs"
                  aria-label="X (Twitter)"
                >
                  <span className="font-mono text-sm font-black">X</span>
                </a>
                {/* LinkedIn */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-brand text-[#020b33] font-black flex items-center justify-center hover:bg-brand hover:scale-105 transition-all shadow-xs"
                  aria-label="LinkedIn"
                >
                  <span className="font-sans text-xs font-black">in</span>
                </a>
              </div>
            </div>

            {/* Column 2: Company */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 tracking-wide">Company</h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><a href="#" className="hover:text-brand transition-colors">Why SecureVDR</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Career</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">SLA &amp; Terms</a></li>
                <li><a href="#pricing" className="hover:text-brand transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Column 3: Products & Solutions */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 tracking-wide">Products &amp; Solutions</h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><a href="#" className="hover:text-brand transition-colors">Virtual Data Room</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Document Management System</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Deal Management System</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Security &amp; Compliance</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">IPO Advisory</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Legal Data Room</a></li>
              </ul>
            </div>

            {/* Column 4: Industry */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 tracking-wide">Industry</h4>
              <ul className="space-y-2.5 text-[13px] text-slate-300">
                <li><a href="#" className="hover:text-brand transition-colors">Energy</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Real Estate</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Life Sciences</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Financial Services</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Technology, Media, &amp; Telecom</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Consumer Retail</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Oil &amp; Gas</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Middle Security Certifications Bar (High-Resolution Vector Badges) */}
        <SecurityCertBadges />

        {/* Bottom Copyright Row */}
        <div className="py-4 sm:py-5 px-6 text-center text-xs sm:text-[13px] text-slate-300 font-medium">
          Copyright &copy; 2026 SecureVDR. All rights reserved.
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <div id="scrollTopBtn" className="fixed bottom-6 right-6 bg-gray-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer opacity-0 invisible transition-all duration-300 hover:bg-brand hover:-translate-y-1 z-50 [&.show]:opacity-100 [&.show]:visible">
        <FaChevronUp />
      </div>

    </main>
  );
}