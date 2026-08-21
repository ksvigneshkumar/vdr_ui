"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiShield } from "react-icons/fi";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Edit3,
  X,
  Sparkles,
  Check,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramEmail = searchParams.get("email");

  // Email State (defaults to query param or a realistic demo email)
  const [email, setEmail] = useState(paramEmail || "robert.fox@gmail.com");

  // OTP 6-digit State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  // Timer State: 5 minutes (300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [isExpired, setIsExpired] = useState(false);

  // Resend Cooldown State: 30 seconds
  const [resendCooldown, setResendCooldown] = useState(30);

  // UX Feedback States
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendToast, setResendToast] = useState("");
  const [shakeError, setShakeError] = useState(false);

  // Change Email Modal State
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  // Mask Email helper: e.g. robert.fox@gmail.com -> ro***@gmail.com
  const maskEmailAddress = (rawEmail) => {
    if (!rawEmail || !rawEmail.includes("@")) return "ro***@gmail.com";
    const [localPart, domain] = rawEmail.split("@");
    if (localPart.length <= 2) {
      return `${localPart[0] || "u"}***@${domain}`;
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  const maskedEmail = maskEmailAddress(email);

  // Expiry Countdown (5 minutes)
  useEffect(() => {
    if (isExpired || isSuccess) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired, isSuccess]);

  // Resend Cooldown Countdown (30 seconds)
  useEffect(() => {
    if (resendCooldown <= 0 || isSuccess) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown, isSuccess]);

  // Auto-focus first input on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Format MM:SS for display
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // OTP input change handler
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    // Allow only numeric digits
    if (value && !/^\d+$/.test(value)) return;

    const lastDigit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = lastDigit;
    setOtp(newOtp);
    setErrorMsg("");

    // Move focus to next input box
    if (lastDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Key navigation & backspace handling
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (otp.every((val) => val !== "") && !isExpired && !isVerifying) {
        handleVerify();
      }
    }
  };

  // Support pasting the full 6-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const numbersOnly = pastedData.replace(/\D/g, "");
    if (!numbersOnly) return;

    const newOtp = [...otp];
    const digits = numbersOnly.slice(0, 6).split("");
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    setErrorMsg("");

    const nextEmptyIdx = newOtp.findIndex((val) => val === "");
    if (nextEmptyIdx !== -1) {
      inputRefs.current[nextEmptyIdx]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Resend Verification Code
  const handleResendCode = () => {
    if (resendCooldown > 0 || isVerifying) return;

    setOtp(["", "", "", "", "", ""]);
    setIsExpired(false);
    setExpirySeconds(300); // restart 5-minute timer
    setResendCooldown(30); // restart 30-second cooldown
    setErrorMsg("");
    setShakeError(false);

    setResendToast("A new verification code has been sent to your email.");
    setTimeout(() => {
      setResendToast("");
    }, 4500);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);
  };

  // Verify Action
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.some((val) => val === "") || isExpired || isVerifying || isSuccess)
      return;

    const code = otp.join("");
    setIsVerifying(true);
    setErrorMsg("");
    setShakeError(false);

    // Simulate verification delay for a smooth SaaS feel
    await new Promise((resolve) => setTimeout(resolve, 950));

    // Demo rule: "000000" or "999999" -> invalid code error state
    // Any other 6-digit code -> success state
    if (code === "000000" || code === "999999") {
      setIsVerifying(false);
      setErrorMsg("Invalid code. Please check the code and try again.");
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      inputRefs.current[0]?.focus();
      return;
    }

    setIsVerifying(false);
    setIsSuccess(true);

    // After success animation, redirect to documents dashboard
    setTimeout(() => {
      router.push("/documents");
    }, 1600);
  };

  // Open & Save Change Email Modal
  const handleOpenChangeEmail = () => {
    setNewEmailInput(email);
    setEmailError("");
    setIsChangeEmailOpen(true);
  };

  const handleSaveNewEmail = (e) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmail(trimmed);
    setIsChangeEmailOpen(false);

    // Reset OTP & Timers
    setOtp(["", "", "", "", "", ""]);
    setIsExpired(false);
    setExpirySeconds(300);
    setResendCooldown(30);
    setErrorMsg("");
    setResendToast(`Verification code sent to ${trimmed}`);
    setTimeout(() => setResendToast(""), 4500);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const isOtpComplete = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand)]/10 via-white to-[var(--brand-secondary)]/10 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--brand)]/12 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--brand-secondary)]/12 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none"></div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[var(--brand)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/95 rounded-xl shadow-md p-6 sm:p-8 md:p-10 border border-gray-100/90 relative overflow-hidden transition-all duration-300">
          {/* Top Brand Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand)] via-[var(--brand-secondary)] to-[var(--brand)] absolute top-0 left-0"></div>

          {/* SUCCESS STATE VIEW */}
          {isSuccess ? (
            <div className="py-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100/80 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-11 h-11" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                Email Verified!
              </h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Thank you for verifying <span className="font-semibold text-slate-800">{email}</span>. Your account is now fully active.
              </p>
              <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] text-sm font-semibold">
                <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
                <span>Redirecting to your workspace...</span>
              </div>
            </div>
          ) : (
            /* VERIFICATION FORM VIEW */
            <div>
              {/* Header Logo */}
              <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
                <div className="w-14 h-14 rounded-lg brand-gradient flex items-center justify-center shadow-sm shadow-[var(--brand)]/25 transition-transform hover:scale-105 duration-300">
                  <FiShield
                    className="text-white text-2xl"
                    strokeWidth={2.8}
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Verify Your Email
                  </h1>
                  <p className="text-slate-500 text-sm sm:text-base mt-1.5 max-w-xs mx-auto leading-relaxed">
                    We’ve sent a 6-digit verification code to your email address
                  </p>
                </div>

                {/* Masked Email Pill with Change Option */}
                <div className="mt-4 flex items-center justify-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-full text-slate-700 text-xs sm:text-sm font-medium shadow-xs">
                  <Mail className="w-4 h-4 text-[var(--brand)] shrink-0" />
                  <span className="font-mono tracking-tight font-semibold text-slate-800">
                    {maskedEmail}
                  </span>
                  <span className="h-3.5 w-px bg-slate-200"></span>
                  <button
                    type="button"
                    onClick={handleOpenChangeEmail}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-[var(--brand)] transition-colors font-semibold text-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* Toast / Status Notifications */}
              {resendToast && (
                <div className="mb-5 p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2.5 text-xs sm:text-sm font-medium shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resendToast}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMsg}</p>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Code expired. Please request a new one.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                  >
                    Resend
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleVerify}>
                {/* 6-Digit OTP Inputs */}
                <div
                  className={`my-6 ${shakeError ? "animate-shake" : ""}`}
                >
                  <label className="sr-only">6-Digit Verification Code</label>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isExpired || isVerifying || isSuccess}
                        aria-label={`Digit ${index + 1}`}
                        className={`w-11 h-13 sm:w-13 sm:h-16 text-xl sm:text-2xl font-extrabold text-center rounded-lg border transition-all duration-200 focus:outline-none ${
                          isExpired
                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                            : digit
                            ? "bg-white border-[var(--brand)] text-slate-900 shadow-sm"
                            : "bg-slate-50/70 border-slate-300 text-slate-900 hover:border-slate-400 focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer & Resend Actions Row */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-6 px-1">
                  {/* Timer Display */}
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {isExpired ? (
                      <span className="text-rose-600 font-semibold">
                        Code expired
                      </span>
                    ) : (
                      <span>
                        Code expires in{" "}
                        <span className="font-mono font-bold text-slate-800">
                          {formatTime(expirySeconds)}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Resend Button with 30s Cooldown */}
                  <div>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 font-medium cursor-not-allowed">
                        Resend available in{" "}
                        <span className="font-mono font-bold">
                          {resendCooldown}s
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 text-[var(--brand)] hover:text-[var(--brand-dark)] font-semibold transition-colors hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Verify Button */}
                <button
                  type="submit"
                  disabled={
                    !isOtpComplete || isExpired || isVerifying || isSuccess
                  }
                  className="w-full py-3.5 sm:py-4 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5 shadow-sm shadow-[var(--brand)]/25 hover:shadow-sm hover:shadow-[var(--brand)]/30 active:scale-[0.99] cursor-pointer text-sm sm:text-base"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email Address</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Helper Text: Didn't receive code? */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Didn’t receive the code? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isVerifying}
                    className="text-[var(--brand)] font-semibold hover:underline cursor-pointer disabled:text-slate-400 disabled:no-underline"
                  >
                    request a new verification code
                  </button>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Email Inline Modal */}
        {isChangeEmailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-7 max-w-sm w-full border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Change Email Address
                </h3>
                <button
                  type="button"
                  onClick={() => setIsChangeEmailOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Enter your new email address. We will immediately send a fresh 6-digit verification code to the new address.
              </p>
              <form onSubmit={handleSaveNewEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@company.com"
                      value={newEmailInput}
                      onChange={(e) => {
                        setNewEmailInput(e.target.value);
                        setEmailError("");
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">
                      {emailError}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeEmailOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-semibold rounded-xl shadow-md shadow-[var(--brand)]/20 transition cursor-pointer"
                  >
                    Update & Send Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Demo Helper Footer */}
        <div className="mt-6 p-4 rounded-lg bg-white/75 border border-gray-200/60 shadow-xs max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>Interactive SaaS Demo Mode</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">123456</span> (or any valid code) to verify, or enter <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">000000</span> to test the invalid code error state.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          Secure VDR Platform • 256-bit Encrypted Connection
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-medium">
          Loading email verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
