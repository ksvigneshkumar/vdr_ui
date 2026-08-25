"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import emailjs from '@emailjs/browser';
import { useRouter, useSearchParams } from "next/navigation";
const qB = { then: (r) => r({data:[],error:null}), single: async()=>({data:null,error:null}), maybeSingle: async()=>({data:null,error:null}) }; qB.eq = () => qB; qB.order = () => qB; qB.select = () => qB; qB.insert = () => qB; qB.update = () => qB; qB.delete = () => qB; const supabase = { auth: { getSession: async () => ({ data: { session: null } }), signOut: async () => ({}) }, storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: "" } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }, from: () => qB };
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt, FaBuilding, FaPhoneAlt } from "react-icons/fa";
import { FiShield } from "react-icons/fi";

// =========================================================================
// 1. INVITE REGISTRATION COMPONENT (FOR USERS WITH A TOKEN)
// =========================================================================
function InviteRegisterContent({ token }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  const [inviteData, setInviteData] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      setInviteData({
        id: "mock-invite",
        email: "demo@example.com",
        requires_nda: token?.includes('mock-token-nda') || false,
        groups: { role: "user", workspace_id: "mock-ws" }
      });
      setCompanyData({ id: "mock-company", name: "Demo Workspace" });
      setEmail("demo@example.com");
      
      const sessionString = localStorage.getItem('vdr_session');
      if (sessionString) {
        try { setSessionUser(JSON.parse(sessionString)); } catch (e) {}
      } else {
        setIsExistingUser(false);
      }
      setLoading(false);
    }, 800);
  }, [token]);

  const handleAcceptExisting = async () => {
    setErrorMsg("");
    setSubmitting(true);
    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      if (inviteData?.requires_nda) {
        router.push("/sign-nda");
      } else {
        router.push("/workspace");
      }
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      if (inviteData?.requires_nda) {
        router.push("/sign-nda?from=register");
      } else {
        setIsSuccess(true);
      }
      setSubmitting(false);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Validating Invitation...</div>;

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--brand)]/10 via-white to-[var(--brand-secondary)]/10 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-gray-100 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <FaCheckCircle className="text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 text-sm mb-6">Your account has been created. You can now log in to access the Virtual Data Room.</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 shadow-sm shadow-[var(--brand)]/20"
          >
            Go to Login
          </button>
          <button
            onClick={() =>
              router.push(
                `/verify-email?email=${encodeURIComponent(inviteData?.email || "")}`
              )
            }
            className="w-full py-2.5 mt-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-300 text-sm cursor-pointer"
          >
            Verify Email Address
          </button>
        </div>
      </div>
    );
  }

  // ERROR SCREEN
  if (errorMsg && !inviteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-rose-100 max-w-md w-full text-center">
          <FaShieldAlt className="text-rose-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
          <button onClick={() => router.push('/login')} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand)]/10 via-white to-[var(--brand-secondary)]/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--brand)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--brand-secondary)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            <FiShield className="text-white text-2xl" strokeWidth={2.8} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-gray-600 text-sm">Accepting Invitation for sector @pibi</p>
          </div>
          
          {/* Step Indicator */}
          {inviteData?.requires_nda && (
            <div className="flex items-center gap-4 mt-3">
              <div className="w-9 h-9 rounded-full bg-[#1b7e9a] text-white flex items-center justify-center font-bold text-base shadow-sm">1</div>
              <div className="w-12 h-[3px] bg-slate-200"></div>
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-base">2</div>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-100">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <div>
                <p className="text-red-800 font-medium text-sm">Error</p>
                <p className="text-red-700 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {sessionUser && sessionUser.email === inviteData?.email ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <FaUser className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome back, {sessionUser.name}!</h2>
              <p className="text-slate-600 text-sm mb-6">
                You are currently logged in. Click below to accept the invitation and join the workspace.
              </p>
              <button
                onClick={handleAcceptExisting}
                disabled={submitting}
                className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Accept Invitation</span>
                )}
              </button>
            </div>
          ) : isExistingUser ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <FaLock className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Account Already Exists</h2>
              <p className="text-slate-600 text-sm mb-6">
                An account with the email <strong>{inviteData?.email}</strong> is already registered. Please log in to accept this invitation.
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem("vdr_redirect_url", `/register?token=${token}`);
                  router.push("/login");
                }}
                className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 shadow-sm"
              >
                Log In to Accept
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="email"
                    value={email}
                    disabled={true}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none transition bg-slate-50 text-gray-900 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={submitting}
                    className="w-full pl-11 pr-4 py-3 bg-brand-soft/30 border border-brand-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{inviteData?.requires_nda ? "Next: Review Security Terms" : "Request Workspace"}</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--brand)] font-semibold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// =========================================================================
// 2. COMPANY REGISTRATION COMPONENT (NO TOKEN)
// =========================================================================
function CompanyRegisterContent() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const MOCK_OTP = "123456";

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/business-owner/plans');
        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans.length > 0) {
            setPlans(data.plans);
            setSelectedPlanId(data.plans[0].id);
            setLoadingPlans(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error loading plans for registration:", err);
      }
      setPlans([
        { 
          id: "1", 
          name: "Starter", 
          price: "₹999/month", 
          description: "Perfect for startups and small businesses to securely share documents.",
          storageLimitMb: 25600, 
          maxUsers: 10,
          features: ["Secure Document Storage", "3 Workspaces", "Role-Based Access"]
        },
        { 
          id: "2", 
          name: "Professional", 
          price: "₹2,999/month", 
          description: "Ideal for growing businesses managing multiple projects and teams.",
          storageLimitMb: 204800, 
          maxUsers: 50,
          features: ["Everything in Starter", "20 Workspaces", "Dynamic Watermarking"]
        },
        { 
          id: "3", 
          name: "Enterprise", 
          price: "Custom", 
          description: "Designed for large enterprises, M&A transactions, and highly secure data rooms.",
          storageLimitMb: 1024000, 
          maxUsers: 185,
          features: ["Everything in Professional", "Unlimited Workspaces"]
        }
      ]);
      setSelectedPlanId("1");
      setLoadingPlans(false);
    };

    fetchPlans();
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim() || !phone.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    
    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      setCountdown(60);
      setStep(2);
      setSubmitting(false);
    }, 1000);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (otpCode.length === 0) {
      setErrorMsg("Please enter an OTP code.");
      return;
    }

    setSubmitting(true);

    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      setStep(3);
      setSubmitting(false);
    }, 1000);
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    setSubmitting(true);

    // MOCK FOR STATIC UI DEMO
    setTimeout(() => {
      setCountdown(60);
      setOtpCode("");
      setSubmitting(false);
    }, 1000);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setErrorMsg("");
    setSubmitting(true);

    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      const planNameFormatted = selectedPlan
        ? (selectedPlan.name.includes("Plan") ? selectedPlan.name : `${selectedPlan.name} Plan`)
        : "Starter Plan";

      const storageMb = selectedPlan?.storageLimitMb || selectedPlan?.storage_limit_mb || 25600;
      const storageGb = Math.round(storageMb / 1024) || 25;
      const usersLimit = selectedPlan?.maxUsers || selectedPlan?.users_limit || 10;

      const res = await fetch('/api/business-owner/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          adminName: adminName,
          adminEmail: adminEmail,
          plan: planNameFormatted,
          status: "trial",
          usersCount: 1,
          usersLimit: usersLimit,
          storageUsedGb: 0,
          storageLimitGb: storageGb
        })
      });
      if (!res.ok) throw new Error("Registration failed");
    } catch (err) {
      console.error(err);
    }

    // MOCK FOR STATIC UI DEMO
    setTimeout(async () => {
      
      // SEND EMAILJS DEMO EMAIL
      try {
        await emailjs.send(
          'service_f6stamc',
          'template_5pzyn3x',
          {
            company_name: companyName,
            user_name: adminName,
            email: adminEmail,
            login_url: window.location.origin + '/login'
          },
          'd55hUoytvELaZZHQe'
        );
        console.log("Welcome email sent via EmailJS!");
      } catch (err) {
        console.error("Failed to send email via EmailJS:");
        console.error("Error Text:", err.text);
        console.error("Error Status:", err.status);
        console.error("Full Error:", JSON.stringify(err, null, 2));
        alert(`EmailJS Error: ${err.text || err.message || JSON.stringify(err)}`);
      }

      setIsSuccess(true);
      setSubmitting(false);
    }, 1500);
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 relative">

      <div className={`relative w-full ${step === 3 ? "max-w-4xl" : "max-w-lg"}`}>
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shadow-md shadow-[var(--brand)]/20">
            <FiShield className="text-white text-2xl" strokeWidth={2.8} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              {step === 1 && "Get Started"}
              {step === 2 && "Verify Email"}
              {step === 3 && "Select a Plan"}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {step === 1 && "Register your organization for VDR Access"}
              {step === 2 && `We sent a code to ${adminEmail}`}
              {step === 3 && "Choose the right capacity for your organization"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center gap-2 mb-6">
          <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-[var(--brand)]' : 'bg-gray-200'}`}></div>
          <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-[var(--brand)]' : 'bg-gray-200'}`}></div>
          <div className={`h-1.5 w-12 rounded-full ${step >= 3 ? 'bg-[var(--brand)]' : 'bg-gray-200'}`}></div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-100">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <div>
                <p className="text-red-800 font-medium text-sm">Registration Error</p>
                <p className="text-red-700 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Organization Name</label>
                <div className="relative">
                  <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Admin Details</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">📞</span>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send OTP Verification</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-inner shadow-blue-100">
                  <FaShieldAlt className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  We've sent a 6-digit verification code to <br />
                  <strong className="text-slate-800 font-semibold">{adminEmail}</strong>
                </p>
              </div>

              <div className="relative max-w-[300px] mx-auto">
                <div className="flex justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otpCode[index] || "";
                    const isFocused = otpCode.length === index;
                    return (
                      <div
                        key={index}
                        className={`w-11 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 transition-all duration-300
                          ${digit ? 'border-[var(--brand)] text-slate-800 bg-white shadow-sm' : 'border-gray-200 text-slate-300 bg-gray-50'}
                          ${isFocused ? 'border-[var(--brand)] ring-4 ring-[var(--brand)]/10 bg-white' : ''}
                        `}
                      >
                        {digit}
                      </div>
                    );
                  })}
                </div>
                {/* Hidden Input for Mobile Keyboard & Desktop Typing */}
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  disabled={submitting}
                  autoFocus
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                />
              </div>

              <div className="text-center -mt-2">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-500 font-medium">
                    Code expires in <span className="text-[var(--brand)] font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <p className="text-sm text-rose-500 font-medium">Code has expired</p>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={submitting}
                      className="px-6 py-2 border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white font-semibold rounded-xl transition-all duration-300 text-sm shadow-sm flex items-center gap-2"
                    >
                      {submitting ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-all duration-300 border border-slate-200"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || otpCode.length === 0 || countdown === 0}
                  className="flex-[2] py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-sm shadow-[var(--brand)]/20"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Plan Selection */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-700">

              {loadingPlans ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium">Loading subscription plans...</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-red-500 font-medium">No plans available.</p>
                  <p className="text-sm text-red-400 mt-2">Please contact support.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {plans.map((plan) => {
                      const storageMb = plan.storageLimitMb || plan.storage_limit_mb || 0;
                      const isGb = storageMb >= 1024 && storageMb % 1024 === 0;
                      const storageDisplay = isGb ? `${storageMb / 1024} GB` : `${storageMb} MB`;
                      const userSeats = plan.maxUsers || plan.users_limit || 10;
                      const isSelected = selectedPlanId === plan.id;
                      const cleanName = (plan.name || '').replace(/ Tier| Plan/i, '');

                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden p-6 flex flex-col items-center text-center group
                            ${isSelected
                              ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20 bg-[var(--brand)]/5 shadow-md -translate-y-1'
                              : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs hover:-translate-y-0.5'}`}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 text-[var(--brand)]">
                              <FaCheckCircle className="text-lg" />
                            </div>
                          )}
                          <span className="inline-block px-3 py-1 rounded-lg bg-brand-soft text-[var(--brand)] text-xs font-bold mb-2">
                            {cleanName} Tier
                          </span>
                          <div className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                            {plan.price || 'Custom'}
                          </div>
                          <p className="text-xs text-slate-500 mb-4 min-h-[32px] line-clamp-2 px-1">
                            {plan.description || "Secure virtual data room capacity and team access."}
                          </p>

                          <div className="w-full bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 mb-4 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Storage</span>
                              <span className="text-slate-900 font-bold">{storageDisplay}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">User Seats</span>
                              <span className="text-slate-900 font-bold">Up to {userSeats} Users</span>
                            </div>
                          </div>

                          {plan.features && plan.features.length > 0 && (
                            <div className="w-full text-left space-y-1.5 mb-2 mt-auto">
                              {plan.features.slice(0, 3).map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                  <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center max-w-sm mx-auto">
                    <button
                      type="submit"
                      disabled={submitting || !selectedPlanId}
                      className="w-full py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2.5 text-base"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Finalizing...</span>
                        </>
                      ) : (
                        <span>Request Workspace</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Login Link (Only show on Step 1) */}
          {step === 1 && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already registered?{" "}
                <Link href="/login" className="text-[var(--brand)] font-semibold hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Success Alert */}
      {isSuccess && (
        <div className="fixed top-6 right-6 bg-white border border-emerald-200 rounded-xl shadow-md p-4 flex items-start gap-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
            <FaCheckCircle className="text-xl" />
          </div>
          <div className="flex-1 pr-4">
            <h4 className="text-[15px] font-bold text-slate-900">Registration Submitted!</h4>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              Your VDR account is currently pending executive approval. Redirecting you to login...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 3. MAIN COMPONENT (SWITCHES BASED ON TOKEN)
// =========================================================================
function RegisterController() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // If token exists, use the INVITE flow.
  // Otherwise, use the COMPANY REGISTRATION flow.
  if (token) {
    return <InviteRegisterContent token={token} />;
  }

  return <CompanyRegisterContent />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading...</div>}>
      <RegisterController />
    </Suspense>
  );
}

