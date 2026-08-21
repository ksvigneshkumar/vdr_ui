"use client";

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import { FaBars, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { q: "How do I start sharing documents?", a: "Simply create a workspace, invite your team members, and start uploading documents. You can assign specific viewing or editing permissions to different user groups." },
    { q: "Can I track who viewed my documents?", a: "Yes. Our platform provides an analytics dashboard where you can track document views and monitor group insights in real-time." },
    { q: "How does the Q&A module work?", a: "The Q&A module allows authorized users to securely ask and answer questions related to specific documents or the overall workspace, keeping all deal communication centralized." },
    { q: "Is it possible to hide sensitive text in documents?", a: "Yes, our built-in redaction tool allows you to permanently black out sensitive information before making the document visible to other parties." },
    { q: "Is my data secure during upload and storage?", a: "Absolutely. We employ enterprise-grade encryption for data both in transit and at rest, ensuring your highly sensitive corporate documents are protected at all times." },
    { q: "Can I customize watermarking for different users?", a: "Yes. Our dynamic watermarking feature allows you to configure personalized watermarks (such as user email and IP address) that automatically appear when documents are viewed." }
  ];

  return (
    <main className="overflow-x-hidden relative w-full font-sans text-gray-800 bg-gray-50">

      {/* 1. Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50 py-4 px-6 md:px-16 flex justify-between items-center transition-all duration-300">
        <div className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
          <i className="fas fa-shield-alt text-[var(--brand)] mr-2 text-3xl"></i> SecureVDR
        </div>

        <div className="hidden lg:flex gap-8 items-center font-medium text-gray-600">
          <a href="#features" className="hover:text-[var(--brand)] transition-colors">Platform</a>
          <a href="#solutions" className="hover:text-[var(--brand)] transition-colors">Solutions</a>
          <a href="#how-it-works" className="hover:text-[var(--brand)] transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-[var(--brand)] transition-colors">Plans</a>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden md:flex gap-4 items-center">
          {/* Business Owner Button */}
          <Link 
            href="/business-owner/login" 
            className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold flex items-center gap-2 transition-all duration-700"
          >
            <i className="fas fa-chart-line"></i> Business Owner
          </Link>

          {/* Login Button */}
          <a 
            href="/login" 
            className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700"
          >
            Login
          </a>

          {/* Register Button */}
          <Link 
            href="/register" 
            className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700"
          >
            Register
          </Link>
        </div>

        <button className="md:hidden text-2xl text-gray-800 focus:outline-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-[72px] left-0 w-full bg-white shadow-sm z-40 flex flex-col p-6 md:hidden gap-4 animate-fade-in border-t border-gray-100">
          <a href="#features" className="text-lg font-medium text-gray-700 py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Platform</a>
          <a href="#solutions" className="text-lg font-medium text-gray-700 py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Solutions</a>
          <a href="#how-it-works" className="text-lg font-medium text-gray-700 py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
          <a href="#pricing" className="text-lg font-medium text-gray-700 py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Plans</a>
          <Link href="/business-owner/login" className="text-lg font-medium text-[var(--brand)] py-2 border-b border-gray-50 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><i className="fas fa-chart-line"></i> Business Owner Login</Link>
          <div className="flex flex-col gap-3 mt-4">
            <a href="/login" className="w-full text-center px-6 py-3 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-bold" onClick={() => setIsMobileMenuOpen(false)}>Log In</a>
            <Link href="/register" className="w-full text-center px-6 py-3 bg-[var(--brand)] text-white rounded-full font-bold shadow-md" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
          </div>
        </div>
      )}

      {/* 2. Hero Section (New Design) */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-16 pt-32 pb-20 overflow-hidden bg-white">

        {/* Premium SaaS Background: Aurora + Grid */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
          {/* Subtle Dot Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPgo8L3N2Zz4=')] opacity-50"></div>

          {/* Aurora Glows */}
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] rounded-full bg-gradient-to-br from-[#00e5a3]/20 to-[#3b82f6]/15 blur-[120px] animate-float"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50vw] h-[80vh] rounded-full bg-gradient-to-bl from-[#3b82f6]/10 to-[#8b5cf6]/10 blur-[150px] animate-float-delayed"></div>

          {/* Bottom Fade Mask */}
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="max-w-5xl w-full mx-auto text-center relative z-10" data-aos="fade-up">

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0f172a] leading-tight mb-4 tracking-tight">
            Secure Document Sharing. Complete Control.<br />
            <span className="text-[var(--brand)]">Zero Leaks.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-3xl mx-auto font-medium">
            Protect your sensitive files with built-in redaction, dynamic watermarking, and granular access controls.
          </p>

          {/* Features Bar */}
          <div className="bg-white rounded-lg p-8 mb-12 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
              <div className="px-4">
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] mb-1">AES-256</div>
                <div className="text-sm font-medium text-gray-400">Data Encryption</div>
              </div>
              <div className="px-4">
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] mb-1">Granular</div>
                <div className="text-sm font-medium text-gray-400">Access Controls</div>
              </div>
              <div className="px-4">
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] mb-1">Dynamic</div>
                <div className="text-sm font-medium text-gray-400">Watermarking</div>
              </div>
              <div className="px-4">
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] mb-1">Built-in</div>
                <div className="text-sm font-medium text-gray-400">Redaction Tool</div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* 3. Detailed Alternating Features */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        {/* Background Decorative Orbs */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[10%] left-[-5%] w-96 h-96 bg-[var(--brand-soft)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-delayed"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-16 relative z-10">
          {/* Header removed as requested */}
          {/* Feature 1a: Doc Management */}
          <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
            <div className="flex-1" data-aos="fade-right">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest border border-indigo-100">Storage</div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">Secure Document Management</h3>
              <p className="text-lg text-gray-600 mb-6">Upload and organize your files with ease. Enjoy a fast, reliable, and secure platform to manage all your critical data.</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Bulk file uploads</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Organized folder structures</p>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative py-8 md:py-16 flex justify-center" data-aos="fade-left">
              {/* Decorative concentric circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[560px] md:h-[560px] rounded-full border border-dashed border-indigo-200 -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-indigo-300 -z-10">
                <div className="absolute top-0 right-1/4 w-3 h-3 bg-indigo-200 rounded-full"></div>
                <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-indigo-300 rounded-full"></div>
              </div>

              {/* Main Circular Container */}
              <div className="relative bg-white rounded-full aspect-square w-[260px] md:w-[420px] flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                <img src="/bii.jpeg" alt="Document Management" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

          {/* Feature 1b: Redaction */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16 mb-24">
            <div className="flex-1" data-aos="fade-left">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-red-50 text-red-600 font-bold text-xs uppercase tracking-widest border border-red-100">Privacy</div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">Document Redaction</h3>
              <p className="text-lg text-gray-600 mb-6">Need to hide sensitive data? Our built-in redaction tool lets you permanently black out text before anyone else sees it.</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">In-browser permanent redaction</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Irreversible data removal</p>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative py-8 md:py-16 flex justify-center" data-aos="fade-right">
              {/* Decorative concentric circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[560px] md:h-[560px] rounded-full border border-dashed border-red-200 -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-red-300 -z-10">
                <div className="absolute top-0 right-1/4 w-3 h-3 bg-red-200 rounded-full"></div>
                <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-red-300 rounded-full"></div>
              </div>

              {/* Main Circular Container */}
              <div className="relative bg-white rounded-full aspect-square w-[260px] md:w-[420px] flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                <img src="/bi.jpeg" alt="Document Redaction" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

          {/* Feature 2: Access & Watermarking */}
          <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
            <div className="flex-1" data-aos="fade-right">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-blue-50 text-[var(--brand)] font-bold text-xs uppercase tracking-widest border border-blue-100">Access Control</div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">Granular Permissions & Dynamic Watermarking</h3>
              <p className="text-lg text-gray-600 mb-6">Manage user groups and assign precise viewing permissions. Protect your intellectual property with automated, user-specific watermarks on every page.</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Role-based group access</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Automatic identifying watermarks</p>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative py-8 md:py-16 flex justify-center" data-aos="fade-left">
              {/* Decorative concentric circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[560px] md:h-[560px] rounded-full border border-dashed border-blue-200 -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-blue-300 -z-10">
                <div className="absolute top-0 right-1/4 w-3 h-3 bg-blue-200 rounded-full"></div>
                <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-blue-300 rounded-full"></div>
              </div>

              {/* Main Circular Container */}
              <div className="relative bg-white rounded-full aspect-square w-[260px] md:w-[420px] flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                <img src="/water.jpeg" alt="Dynamic Watermarking" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

          {/* Feature 3: Analytics & QA */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1" data-aos="fade-left">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-purple-50 text-purple-600 font-bold text-xs uppercase tracking-widest border border-purple-100">Intelligence</div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">Real-time Analytics & Secure Q&A</h3>
              <p className="text-lg text-gray-600 mb-6">Gain intelligence on who is viewing what. Facilitate secure, centralized Q&A workflows instead of relying on chaotic email threads.</p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Track views and downloads</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i className="fas fa-check text-xs"></i></div>
                  <p className="ml-3 text-gray-700 font-medium">Organized question workflows</p>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative py-8 md:py-16 flex justify-center" data-aos="fade-right">
              {/* Decorative concentric circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[560px] md:h-[560px] rounded-full border border-dashed border-purple-200 -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-purple-300 -z-10">
                <div className="absolute top-0 right-1/4 w-3 h-3 bg-purple-200 rounded-full"></div>
                <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>

              {/* Main Circular Container */}
              <div className="relative bg-white rounded-full aspect-square w-[260px] md:w-[420px] flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                <img src="/qa.jpeg" alt="Real-time Analytics" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Solutions by Role */}
      <section id="solutions" className="py-24 bg-gray-50 bg-dot-pattern border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-16 text-center">
          <div className="glass-card p-8 rounded-xl inline-block mb-16 border-none shadow-sm">
            <h2 className="text-[var(--brand)] font-bold tracking-wider uppercase text-sm mb-3">Who uses SecureVDR?</h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-0">Built for dealmakers across industries.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="glass-card bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-sm transition-all flex flex-col" data-aos="fade-up">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[var(--brand)] flex items-center justify-center text-2xl mb-6">
                <img src="/sec1.png" alt="Secure Logo" className="w-7 h-7 object-contain opacity-90" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(85%) saturate(1637%) hue-rotate(167deg) brightness(90%) contrast(89%)' }} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Secure Document Management & Redaction</h4>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">Upload and organize your files with ease. Need to hide sensitive data? Our built-in redaction tool lets you permanently black out text before anyone else sees it.</p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">Bulk file uploads</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">In-browser permanent redaction</p>
                </li>
              </ul>
            </div>
            <div className="glass-card bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-sm transition-all flex flex-col" data-aos="fade-up" data-aos-delay="100">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <img src="/pro.png" alt="Legal" className="w-7 h-7 object-contain opacity-90" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(85%) saturate(1637%) hue-rotate(167deg) brightness(90%) contrast(89%)' }} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Granular Permissions & Dynamic Watermarking</h4>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">Manage user groups and assign precise viewing permissions. Protect your intellectual property with automated, user-specific watermarks on every page.</p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">Role-based group access</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">Automatic identifying watermarks</p>
                </li>
              </ul>
            </div>
            <div className="glass-card bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-sm transition-all flex flex-col" data-aos="fade-up" data-aos-delay="200">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                <img src="/an.png" alt="Analytics" className="w-7 h-7 object-contain opacity-90" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(85%) saturate(1637%) hue-rotate(167deg) brightness(90%) contrast(89%)' }} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics & Secure Q&A</h4>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">Gain intelligence on who is viewing what. Facilitate secure, centralized Q&A workflows instead of relying on chaotic email threads.</p>
              <ul className="space-y-3 mt-auto">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">Track views and downloads</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]"><i className="fas fa-check text-[10px]"></i></div>
                  <p className="ml-3 text-gray-700 text-sm font-medium">Organized question workflows</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (Timeline) */}
      <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
        {/* Background Decorative Orbs */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--brand-soft)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float-delayed"></div>
        </div>
        <div className="max-w-6xl mx-auto px-6 md:px-16 text-center relative z-10">
          <div className="glass-card p-8 rounded-xl inline-block mb-12 border-none shadow-sm" data-aos="fade-up">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-0">Get started in 4 simple steps.</h2>
          </div>

          <style>{`
            [data-aos="draw-line-horizontal"] {
              width: 0%;
              transition-property: width;
            }
            [data-aos="draw-line-horizontal"].aos-animate {
              width: 100%;
            }

            [data-aos="draw-line-vertical"] {
              height: 0%;
              transition-property: height;
            }
            [data-aos="draw-line-vertical"].aos-animate {
              height: 100%;
            }

            [data-aos="fade-in-dot"] {
              transform: scale(0);
              opacity: 0;
              transition-property: transform, opacity;
            }
            [data-aos="fade-in-dot"].aos-animate {
              transform: scale(1);
              opacity: 1;
            }
          `}</style>

          <div className="relative mt-8 md:mt-20 z-0">
            {/* Single Continuous Background Line */}
            <div className="hidden md:block absolute top-[17px] left-[12.5%] w-[75%] h-[6px] bg-gray-100 rounded-full -z-20 shadow-inner">
              <div className="h-full bg-[var(--brand)] rounded-full" data-aos="draw-line-horizontal" data-aos-duration="3000" data-aos-delay="800" data-aos-easing="linear"></div>
            </div>

            {/* Mobile Vertical Line */}
            <div className="md:hidden absolute top-[20px] left-[19px] w-[4px] h-[calc(100%-80px)] bg-gray-100 rounded-full overflow-hidden -z-20">
              <div className="w-full bg-[var(--brand)]" data-aos="draw-line-vertical" data-aos-duration="3000" data-aos-delay="800" data-aos-easing="linear"></div>
            </div>

            <div className="flex flex-col md:flex-row w-full justify-between gap-12 md:gap-0">
              
              {/* Step 1 */}
              <div className="flex-1 flex flex-row md:flex-col items-center md:text-center text-left" data-aos="fade-up" data-aos-delay="0">
                <div className="w-10 h-10 rounded-full border-[3px] border-[var(--brand)] bg-white p-1 flex items-center justify-center shrink-0 md:mb-6 z-10 shadow-sm mr-6 md:mr-0">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand)]" data-aos="fade-in-dot" data-aos-delay="800" data-aos-duration="300"></div>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-[#031b4e] mb-2 md:mb-3">1. Register</h4>
                  <p className="text-gray-500 font-medium md:px-4 leading-relaxed">Create your account and initialize a new secure data room.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex-1 flex flex-row md:flex-col items-center md:text-center text-left" data-aos="fade-up" data-aos-delay="200">
                <div className="w-10 h-10 rounded-full border-[3px] border-[var(--brand)] bg-white p-1 flex items-center justify-center shrink-0 md:mb-6 z-10 shadow-sm mr-6 md:mr-0">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand)]" data-aos="fade-in-dot" data-aos-delay="1800" data-aos-duration="300"></div>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-[#031b4e] mb-2 md:mb-3">2. Upload</h4>
                  <p className="text-gray-500 font-medium md:px-4 leading-relaxed">Upload documents and permanently redact sensitive text.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex-1 flex flex-row md:flex-col items-center md:text-center text-left" data-aos="fade-up" data-aos-delay="400">
                <div className="w-10 h-10 rounded-full border-[3px] border-[var(--brand)] bg-white p-1 flex items-center justify-center shrink-0 md:mb-6 z-10 shadow-sm mr-6 md:mr-0">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand)]" data-aos="fade-in-dot" data-aos-delay="2800" data-aos-duration="300"></div>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-[#031b4e] mb-2 md:mb-3">3. Configure</h4>
                  <p className="text-gray-500 font-medium md:px-4 leading-relaxed">Assign granular viewing and downloading permissions.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex-1 flex flex-row md:flex-col items-center md:text-center text-left" data-aos="fade-up" data-aos-delay="600">
                <div className="w-10 h-10 rounded-full border-[3px] border-[var(--brand)] bg-white p-1 flex items-center justify-center shrink-0 md:mb-6 z-10 shadow-sm mr-6 md:mr-0">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand)]" data-aos="fade-in-dot" data-aos-delay="3800" data-aos-duration="300"></div>
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-[#031b4e] mb-2 md:mb-3">4. Invite</h4>
                  <p className="text-gray-500 font-medium md:px-4 leading-relaxed">Invite users securely and track activity via analytics.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials (Placeholder for Richness) */}
      <section className="py-24 bg-gray-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          {/* Header removed as requested */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col" data-aos="fade-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[var(--brand)] font-bold">JW</div>
                <div><h4 className="font-bold text-gray-900">Partner</h4><p className="text-sm text-gray-500">Leading Capital Firm</p></div>
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed flex-1">"SecureVDR reduced our document prep time significantly. The watermarking and granular audit logs give us the peace of mind we need."</p>
              <div className="flex gap-1 text-yellow-400 text-sm mt-auto"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
            </div>
            <div className="glass-card bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col" data-aos="fade-up" data-aos-delay="100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[var(--brand)] font-bold">DO</div>
                <div><h4 className="font-bold text-gray-900">General Counsel</h4><p className="text-sm text-gray-500">Enterprise Legal Group</p></div>
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed flex-1">"A VDR that combines enterprise security with a modern UI. Our team loves the built-in redaction tool and Q&A module."</p>
              <div className="flex gap-1 text-yellow-400 text-sm mt-auto"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
            </div>
            <div className="glass-card bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[var(--brand)] font-bold">PM</div>
                <div><h4 className="font-bold text-gray-900">CFO</h4><p className="text-sm text-gray-500">Tech Startup</p></div>
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed flex-1">"Best decision for our recent fundraising. Real-time analytics helped us track investor interest and engage effectively."</p>
              <div className="flex gap-1 text-yellow-400 text-sm mt-auto"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing */}
      <section id="pricing" className="py-24 px-6 md:px-16 bg-gray-50 bg-dot-pattern">
        <h2 className="text-3xl md:text-5xl font-black text-center text-gray-900 mb-4">Flexible Plans for Every Business</h2>
        <p className="text-center text-gray-500 mb-16 font-medium">Choose a plan that scales with your needs.</p>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

          {/* Basic Plan */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col" data-aos="fade-up">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
              <div className="flex justify-center items-baseline">
                <span className="text-5xl font-black text-gray-900">$249</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> Up to 5 users
              </li>
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> 50 GB storage
              </li>
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> Basic analytics
              </li>
            </ul>
            <Link href="/register" className="block w-full text-center py-3 rounded-full font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all">
              Get Basic
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-[var(--brand)] rounded-xl p-8 shadow-sm relative flex flex-col transform md:-translate-y-4" data-aos="fade-up" data-aos-delay="100">
            <div className="absolute top-0 right-8 bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1 rounded-b-md uppercase tracking-wider">
              Popular
            </div>
            <div className="text-center md:text-left mb-8 mt-2">
              <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
              <div className="flex justify-center md:justify-start items-baseline">
                <span className="text-5xl font-black text-white">$599</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-white font-medium">
                <i className="fas fa-check-circle text-white mr-3"></i> Unlimited users
              </li>
              <li className="flex items-center text-white font-medium">
                <i className="fas fa-check-circle text-white mr-3"></i> 500 GB + advanced logs
              </li>
              <li className="flex items-center text-white font-medium">
                <i className="fas fa-check-circle text-white mr-3"></i> Audit & watermarks
              </li>
            </ul>
            <Link href="/register" className="block w-full text-center py-3 rounded-full font-bold bg-white text-[var(--brand)] hover:bg-gray-50 transition-all shadow-md">
              Start Pro
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col" data-aos="fade-up" data-aos-delay="200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
              <div className="flex justify-center items-baseline mb-1">
                <span className="text-5xl font-black text-gray-900">Custom</span>
              </div>
              <span className="text-gray-500 text-sm">Tailored solutions</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> SSO + API access
              </li>
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> Dedicated support
              </li>
              <li className="flex items-center text-gray-600 font-medium">
                <i className="fas fa-check-circle text-green-500 mr-3"></i> Compliance (GDPR/SOC2)
              </li>
            </ul>
            <Link href="/register" className="block w-full text-center py-3 rounded-full font-bold border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all">
              Contact Sales
            </Link>
          </div>

        </div>
      </section>

      {/* 8. FAQs */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-[var(--brand)] font-bold tracking-wider uppercase text-sm mb-3">Got Questions?</h2>
            <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-0">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-4" data-aos="fade-up">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md ${openFaq === index ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]/20' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <button
                  className="w-full px-6 md:px-8 py-6 text-left flex justify-between items-center focus:outline-none group"
                  onClick={() => toggleFaq(index)}
                >
                  <span className={`font-bold text-lg pr-4 transition-colors ${openFaq === index ? 'text-[var(--brand)]' : 'text-gray-900 group-hover:text-[var(--brand)]'}`}>{faq.q}</span>
                  <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${openFaq === index ? 'bg-[var(--brand)] text-white rotate-180' : 'bg-gray-100 text-gray-500 group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]'}`}>
                    <FaChevronDown className="text-sm" />
                  </span>
                </button>
                <div
                  className={`px-6 md:px-8 pb-6 ${openFaq === index ? 'block' : 'hidden'}`}
                >
                  <div className="w-full h-px bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 mb-5"></div>
                  <p className="text-gray-600 font-medium leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-[#0f172a] text-gray-400 py-16 px-6 md:px-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Column 1 */}
            <div className="col-span-1">
              <div className="text-xl font-bold text-white flex items-center mb-4">
                <i className="fas fa-shield-alt text-white mr-2"></i> SecureVDR
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Enterprise Data Rooms<br />with next-gen security.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Webinars</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><i className="fas fa-envelope"></i> hello@securevdr.com</li>
                <li className="flex items-center gap-2"><i className="fas fa-phone"></i> +1 (888) 452-8637</li>
              </ul>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-gray-400 hover:text-white text-lg"><i className="fab fa-linkedin"></i></a>
                <a href="#" className="text-gray-400 hover:text-white text-lg"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-400 hover:text-white text-lg"><i className="fab fa-github"></i></a>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} SecureVDR — All rights reserved. Data protection at its core.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <div id="scrollTopBtn" className="fixed bottom-6 right-6 bg-gray-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer opacity-0 invisible transition-all duration-300 hover:bg-[var(--brand)] hover:-translate-y-1 z-50 [&.show]:opacity-100 [&.show]:visible">
        <FaChevronUp />
      </div>

    </main>
  );
}