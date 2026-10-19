import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { updatePageSEO } from '../../utils/seo';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Ticket,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    setCurrentView,
    authModalTab,
    setAuthModalTab,
    login,
    signup,
    users,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(authModalTab || 'login');
  const [forgotPassword, setForgotPassword] = useState(false);

  useEffect(() => {
    updatePageSEO({
      title: activeTab === 'login' ? 'Sign In' : 'Create Account',
      description: 'Sign in to EventSphere to manage your event registrations, download verified QR passes, or launch event ticket sales as an organizer.',
      canonicalPath: '/auth',
    });
  }, [activeTab]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('attendee');
  const [signupOrg, setSignupOrg] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');

  // Status & error state
  const [statusAlert, setStatusAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setAuthModalTab(tab);
    setForgotPassword(false);
    setStatusAlert(null);
    setFieldErrors({});
  };

  const showForgotPasswordView = () => {
    setForgotPassword(true);
    setStatusAlert(null);
    setFieldErrors({});
    if (loginEmail) {
      setForgotEmail(loginEmail);
    }
  };

  const hideForgotPasswordView = () => {
    setForgotPassword(false);
    setStatusAlert(null);
    setFieldErrors({});
  };

  // Password strength logic
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    const labels = [
      'Enter at least 8 characters',
      'Weak — add numbers or symbols',
      'Fair — add uppercase letters',
      'Good password',
      'Strong password',
    ];

    let color = 'bg-slate-200';
    if (score === 1) color = 'bg-rose-500';
    else if (score === 2) color = 'bg-amber-500';
    else if (score === 3) color = 'bg-emerald-500';
    else if (score >= 4) color = 'bg-emerald-600';

    return {
      score,
      label: labels[score] || labels[0],
      color,
    };
  };

  const strength = calculatePasswordStrength(signupPassword);

  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setStatusAlert(null);

    const errors: Record<string, string> = {};
    if (!isValidEmail(loginEmail)) {
      errors.loginEmail = 'Please enter a valid email address.';
    }
    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = login(loginEmail, loginPassword);
      setIsSubmitting(false);
      if (res.success) {
        setStatusAlert({ type: 'success', message: `${res.message} Redirecting to your dashboard...` });
      } else {
        setStatusAlert({ type: 'error', message: res.message });
      }
    }, 450);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setStatusAlert(null);

    const errors: Record<string, string> = {};
    if (!signupName.trim() || signupName.trim().length < 2) {
      errors.signupName = 'Please enter your full legal or professional name.';
    }
    if (!isValidEmail(signupEmail)) {
      errors.signupEmail = 'Please enter a valid email address.';
    }
    if (signupPassword.length < 8) {
      errors.signupPassword = 'Password must be at least 8 characters long.';
    }
    if (signupPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!acceptTerms) {
      errors.acceptTerms = 'You must accept the terms of service to continue.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      signup({
        name: signupName,
        email: signupEmail,
        role: signupRole,
        organizationName: signupRole === 'organizer' ? signupOrg || `${signupName}'s Productions` : undefined,
      });
      setIsSubmitting(false);
      setStatusAlert({
        type: 'success',
        message: `Welcome to EventSphere, ${signupName}! Your account has been created.`,
      });
    }, 500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setStatusAlert(null);

    if (!isValidEmail(forgotEmail)) {
      setFieldErrors({ forgotEmail: 'Please enter a valid registered email address.' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const userExists = users.some((u) => u.email.toLowerCase() === forgotEmail.toLowerCase().trim());
      if (userExists) {
        setStatusAlert({
          type: 'success',
          message: `Password reset instructions & secure token link sent to ${forgotEmail}. Check your inbox!`,
        });
      } else {
        setStatusAlert({
          type: 'success',
          message: `If an account exists for ${forgotEmail}, a secure password reset link has been dispatched to your inbox.`,
        });
      }
    }, 600);
  };

  const handleGoogleAuth = () => {
    const googleEmailInput = window.prompt(
      'Enter your Google account email address to continue (e.g. yourname@gmail.com):',
      'alex.mercer@gmail.com'
    );
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      return;
    }
    const cleanEmail = googleEmailInput.toLowerCase().trim();
    setStatusAlert({
      type: 'success',
      message: `Connecting to Google Single Sign-On for ${cleanEmail}...`,
    });
    setTimeout(() => {
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        login(existingUser.email);
        setStatusAlert({
          type: 'success',
          message: `Authenticated successfully via Google as ${existingUser.name}. Redirecting...`,
        });
      } else {
        const nameParts = cleanEmail.split('@')[0].split('.');
        const formattedName = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        signup({
          name: formattedName || 'Google User',
          email: cleanEmail,
          role: 'attendee',
        });
        setStatusAlert({
          type: 'success',
          message: `New account created via Google for ${formattedName}. Redirecting...`,
        });
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* TOP BRAND NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('home');
            }}
            className="flex items-center gap-2.5 text-slate-900 hover:opacity-90 transition-opacity"
            aria-label="EventSphere Home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
              ◈
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                eventsphere
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">
                Live Ticketing &amp; Passes
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-slate-500">
              {activeTab === 'login' ? "Don't have an account yet?" : 'Already registered?'}
            </span>
            <button
              type="button"
              onClick={() => switchTab(activeTab === 'login' ? 'signup' : 'login')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {activeTab === 'login' ? 'Create Account' : 'Sign In'}
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN SPLIT AUTH VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-5xl items-center">
          
          {/* LEFT COLUMN: HERO SHOWCASE (DESKTOP) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-[640px] rounded-3xl overflow-hidden relative p-8 shadow-xl text-white">
            {/* Background Image with Rich Emerald / Navy Gradient */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-emerald-950/80 to-emerald-900/60" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-white shadow-xs">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Verified Ticketing Platform
              </span>
            </div>

            {/* Middle Feature Highlights */}
            <div className="relative z-10 space-y-4 my-auto">
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                Make every moment an <span className="text-emerald-300">experience.</span>
              </h1>
              <p className="text-xs text-slate-200 leading-relaxed max-w-xs">
                Discover unforgettable concerts, festivals, conferences and stage productions with instant scannable passes.
              </p>

              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Instant QR Passes</h4>
                    <p className="text-[10px] text-slate-300">Downloadable receipt with WhatsApp sharing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Official Paystack Checkout</h4>
                    <p className="text-[10px] text-slate-300">Instant card, mobile money &amp; bank transfer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Metrics */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-left">
              <div>
                <strong className="block text-lg font-black text-white">100%</strong>
                <span className="text-[10px] text-slate-300">Verified Entry</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <strong className="block text-lg font-black text-white">24/7</strong>
                <span className="text-[10px] text-slate-300">Gate Scanning</span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <strong className="block text-lg font-black text-white">Instant</strong>
                <span className="text-[10px] text-slate-300">Ticket Delivery</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REFINED AUTHENTICATION CARD */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-9 max-w-lg w-full mx-auto">
              
              {/* Card Header & Dynamic Heading */}
              <div className="mb-6">
                <span className="text-[11px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">
                  {forgotPassword
                    ? 'ACCOUNT RECOVERY'
                    : activeTab === 'login'
                    ? 'WELCOME BACK'
                    : 'NEW REGISTRATION'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {forgotPassword
                    ? 'Reset Your Password'
                    : activeTab === 'login'
                    ? 'Sign in to EventSphere'
                    : 'Create your account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {forgotPassword
                    ? 'Enter your registered email address and we will dispatch a reset link.'
                    : activeTab === 'login'
                    ? 'Enter your credentials to manage tickets or organizer productions.'
                    : 'Join EventSphere to discover verified events or host your own stage.'}
                </p>
              </div>

              {/* Segmented Pill Switcher (Only visible in normal login/signup) */}
              {!forgotPassword && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      activeTab === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      activeTab === 'signup'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Alert Status Banner */}
              {statusAlert && (
                <div
                  className={`p-3.5 mb-5 rounded-xl text-xs flex items-start gap-2.5 border ${
                    statusAlert.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {statusAlert.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium leading-relaxed">{statusAlert.message}</span>
                </div>
              )}

              {/* SECTION: LOGIN FORM */}
              {activeTab === 'login' && !forgotPassword && (
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="loginEmail">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="loginEmail"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.loginEmail ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.loginEmail && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.loginEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700" htmlFor="loginPassword">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={showForgotPasswordView}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        id="loginPassword"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.loginPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.loginPassword && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.loginPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 accent-emerald-700"
                      />
                      <span>Remember this device for 30 days</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Or continue with
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>
              )}

              {/* SECTION: SIGNUP FORM */}
              {activeTab === 'signup' && !forgotPassword && (
                <form onSubmit={handleSignupSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="signupName">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="signupName"
                        placeholder="e.g. David Mensah"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.signupName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.signupName && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.signupName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="signupEmail">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="signupEmail"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.signupEmail ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.signupEmail && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.signupEmail}
                      </p>
                    )}
                  </div>

                  {/* Account Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Intended Role
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSignupRole('attendee')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          signupRole === 'attendee'
                            ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Ticket className={`w-4 h-4 ${signupRole === 'attendee' ? 'text-emerald-700' : 'text-slate-400'}`} />
                          {signupRole === 'attendee' && (
                            <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold block">Event Attendee</span>
                        <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Browse events &amp; book verified tickets
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupRole('organizer')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          signupRole === 'organizer'
                            ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Building2 className={`w-4 h-4 ${signupRole === 'organizer' ? 'text-emerald-700' : 'text-slate-400'}`} />
                          {signupRole === 'organizer' && (
                            <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold block">Event Organizer</span>
                        <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Publish events &amp; manage ticket sales
                        </span>
                      </button>
                    </div>
                  </div>

                  {signupRole === 'organizer' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="signupOrg">
                        Organization / Production Studio
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          id="signupOrg"
                          placeholder="e.g. Starline Media GH Ltd"
                          value={signupOrg}
                          onChange={(e) => setSignupOrg(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="signupPassword">
                      Create Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        id="signupPassword"
                        placeholder="At least 8 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.signupPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {signupPassword.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1.5 h-1">
                          {[0, 1, 2, 3].map((idx) => (
                            <div
                              key={idx}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                idx < strength.score ? strength.color : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{strength.label}</p>
                      </div>
                    )}
                    {fieldErrors.signupPassword && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.signupPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 accent-emerald-700"
                      />
                      <span className="leading-tight">
                        I agree to EventSphere's{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentView('terms')}
                          className="text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentView('privacy')}
                          className="text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Privacy Policy
                        </button>.
                      </span>
                    </label>
                    {fieldErrors.acceptTerms && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.acceptTerms}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create My Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* SECTION: FORGOT PASSWORD FORM */}
              {forgotPassword && (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                      Enter your account email. We will send a password restoration link valid for 60 minutes.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="forgotEmail">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="forgotEmail"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400 ${
                          fieldErrors.forgotEmail ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.forgotEmail && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.forgotEmail}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={hideForgotPasswordView}
                    className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              )}

              {/* CARD FOOTER */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>EventSphere Platform</span>
                <span>Official Ticketing Portal</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
