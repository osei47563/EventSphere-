import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Briefcase,
  Ticket,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    users,
    login,
    signup,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('attendee');
  const [signupOrg, setSignupOrg] = useState('');

  const handleGoogleAuth = () => {
    const googleEmailInput = window.prompt(
      'Enter your Google account email address to continue (e.g. yourname@gmail.com):',
      'alex.mercer@gmail.com'
    );
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      return;
    }
    const cleanEmail = googleEmailInput.toLowerCase().trim();
    setSuccessMsg(`Connecting to Google Single Sign-On for ${cleanEmail}...`);
    setTimeout(() => {
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        login(existingUser.email);
        setSuccessMsg(`Authenticated successfully via Google as ${existingUser.name}. Redirecting...`);
      } else {
        const nameParts = cleanEmail.split('@')[0].split('.');
        const formattedName = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        signup({
          name: formattedName || 'Google User',
          email: cleanEmail,
          role: 'attendee',
        });
        setSuccessMsg(`New account created via Google for ${formattedName}. Redirecting...`);
      }
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg(null);
      }, 600);
    }, 600);
  };

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const res = login(email, password);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg(null);
      }, 600);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMsg('Password should be at least 4 characters for prototyping.');
      return;
    }
    signup({
      name: signupName,
      email: signupEmail,
      role: signupRole,
      organizationName: signupRole === 'organizer' ? signupOrg || 'My Event Studio Ltd' : undefined,
    });
    setSuccessMsg(`Welcome to EventSphere, ${signupName}! Account created.`);
    setTimeout(() => {
      setIsAuthModalOpen(false);
      setSuccessMsg(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[var(--cream)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--green-800)] text-white flex items-center justify-center font-black text-lg shadow-sm">
              e
            </div>
            <div>
              <h2 className="font-extrabold text-[var(--green-900)] text-base leading-tight">
                {authModalTab === 'login' ? 'Sign In to EventSphere' : 'Create Free Account'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {authModalTab === 'login'
                  ? 'Access your tickets, organizer console, or governance portal'
                  : 'Start discovering events or hosting your own productions'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3">
          <button
            onClick={() => {
              setAuthModalTab('login');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              authModalTab === 'login'
                ? 'border-[var(--green-800)] text-[var(--green-900)] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthModalTab('signup');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              authModalTab === 'signup'
                ? 'border-[var(--green-800)] text-[var(--green-900)] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {authModalTab === 'login' ? (
            <>
              {/* Standard Email Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. marcus@apexconferences.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full px-3 py-2 pr-9 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[var(--green-800)] hover:bg-[var(--green-900)] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                </button>
              </form>

              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
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
            </>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. David Adeleke"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. david@liveevents.ng"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                  required
                />
              </div>

              {/* Account Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Account Intended Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupRole('attendee')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      signupRole === 'attendee'
                        ? 'border-[var(--green-800)] bg-[var(--green-50)] text-[var(--green-900)]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Ticket className={`w-4 h-4 ${signupRole === 'attendee' ? 'text-[var(--green-800)]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">Event Attendee</span>
                    </div>
                    <span className={`text-[10px] ${signupRole === 'attendee' ? 'text-slate-600' : 'text-slate-500'}`}>
                      Browse events, pick seats, secure tickets & QR passes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupRole('organizer')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      signupRole === 'organizer'
                        ? 'border-[var(--green-800)] bg-[var(--green-50)] text-[var(--green-900)]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Briefcase className={`w-4 h-4 ${signupRole === 'organizer' ? 'text-[var(--green-800)]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">Event Organizer</span>
                    </div>
                    <span className={`text-[10px] ${signupRole === 'organizer' ? 'text-slate-600' : 'text-slate-500'}`}>
                      Sell tickets, design physical seat layouts & withdraw earnings
                    </span>
                  </button>
                </div>
              </div>

              {signupRole === 'organizer' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Organization / Brand Name</span>
                  </label>
                  <input
                    type="text"
                    value={signupOrg}
                    onChange={(e) => setSignupOrg(e.target.value)}
                    placeholder="e.g. Starline Concerts & Media Ltd"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Secure Password</span>
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-900"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[var(--green-800)] hover:bg-[var(--green-900)] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Complete Registration & Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-6">
          <span>EventSphere Account</span>
          <span className="text-[10px] font-mono text-slate-400">
            Powered by Paystack & EventSphere
          </span>
        </div>
      </div>
    </div>
  );
};
