"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaShieldAlt, FaLock, FaEnvelope, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function BusinessOwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e, demoEmail, demoPass) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    const targetEmail = demoEmail || email;
    const targetPass = demoPass || password;

    try {
      const res = await fetch("/api/auth/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('vdr_session', JSON.stringify(data.user));
        document.cookie = "vdr_super_admin=true; path=/; max-age=86400; SameSite=Lax";
        router.push('/business-owner');
      } else {
        setError(data.error || 'Invalid executive credentials. Please check your email and password.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('owner@pibivdr.com');
    setPassword('superadmin123');
    handleLogin(null, 'owner@pibivdr.com', 'superadmin123');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-3xl shadow-sm">
            <FaShieldAlt />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
        <span className="text-[var(--brand)]">VDR</span> Business Owner Portal
        </h2>
        <p className="mt-2 text-center text-[15px] text-slate-500">
          Super Admin clearance required to manage tenant organizations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white border border-slate-200/80 py-8 px-6 sm:px-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
              >
                Business owner Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-sm">
                  <FaEnvelope />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gamil.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
              >
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-sm">
                  <FaLock />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand)] transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying Executive Clearance...' : 'Login'}</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </form>


          {/* <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              ← Back to Tenant User Portal
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
