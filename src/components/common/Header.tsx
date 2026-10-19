import React, { useState } from 'react';
import {
  QrCode,
  Globe2,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Building,
  User,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  Wallet,
  Settings,
  LogOut,
  Sliders,
  Layers,
  Calendar,
  Lock,
  Compass,
  ArrowRight,
  UserPlus,
  LogIn,
  Ticket,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_LABELS } from '../../utils/translations';
import { LanguageCode } from '../../types';
import { NotificationBell } from './NotificationBell';
import { MyTicketsModal } from './MyTicketsModal';

export const Header: React.FC = () => {
  const {
    organization,
    events,
    activeEvent,
    setActiveEventId,
    currentUser,
    currentView,
    setCurrentView,
    language,
    setLanguage,
    setIs2FAModalOpen,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setAuthModalTab,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);

  const currentLangObj = LANGUAGE_LABELS.find((l) => l.code === language) || LANGUAGE_LABELS[0];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Custom Branded Logo & Event Selector */}
            <div className="flex items-center gap-3 sm:gap-5">
              <div
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Return to EventSphere Home Marketplace"
              >
                {/* Custom Branded SVG Logo Mark in Navy & Orange */}
                <div className="w-10 h-10 rounded-xl bg-[#102A43] flex items-center justify-center shadow-md group-hover:bg-[#243F57] transition-all relative">
                  <svg
                    className="w-5 h-5 text-white group-hover:scale-105 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M7 12a5 5 0 0 1 10 0" stroke="currentColor" />
                    <path d="M12 7v5l3 3" stroke="#FF8A34" strokeWidth="2.5" />
                    <circle cx="12" cy="12" r="2.5" fill="#FF8A34" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FF8A34] rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#102A43] text-base tracking-tight leading-none">
                      EventSphere
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#FF8A34]">
                      PRO
                    </span>
                  </div>
                  <span className="text-[11px] text-[#526579] font-medium">Ticketing & Live Operations</span>
                </div>
              </div>

              {/* Active Event Dropdown */}
              <div className="hidden xl:flex items-center">
                <div className="h-4 w-px bg-slate-200 mx-2" />
                <select
                  value={activeEvent.id}
                  onChange={(e) => setActiveEventId(e.target.value)}
                  className="text-xs font-semibold text-[#102A43] bg-[#F1F5F9] hover:bg-slate-200/80 border border-[#E2E8F0] rounded-xl py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#102A43] transition-colors max-w-[220px] truncate cursor-pointer"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Center Navigation: Clean Customer & Operations Portals */}
            <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#FF8A34]" />
                <span>Explore Events</span>
              </button>

              <button
                onClick={() => setCurrentView('public_event')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'public_event'
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                }`}
              >
                <Ticket className="w-4 h-4 text-[#FF8A34]" />
                <span>Book Tickets</span>
              </button>

              {/* My Tickets Button */}
              <button
                onClick={() => setIsMyTicketsOpen(true)}
                className="px-3.5 py-2 rounded-xl text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9] transition-all flex items-center gap-1.5 cursor-pointer"
                title="View your purchased tickets and boarding passes"
              >
                <Sparkles className="w-4 h-4 text-[#FF8A34]" />
                <span>My Tickets</span>
              </button>

              {/* Organizer Hub */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setCurrentView('dashboard');
                  } else {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#526579]" />
                <span>Organizer Hub</span>
              </button>

              {/* Scanner */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setCurrentView('scanner');
                  } else {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'scanner'
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#526579]" />
                <span>QR Scanner</span>
              </button>

              {currentUser.role === 'system_admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-[#102A43] text-white shadow-xs'
                      : 'text-[#334155] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-[#FF8A34]" />
                  <span>Admin</span>
                </button>
              )}
            </nav>

            {/* Right Action Icons & User Authentication */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#102A43] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
                  title="Change Platform Language"
                >
                  <span>{currentLangObj.flag}</span>
                  <span className="hidden sm:inline">{currentLangObj.name}</span>
                  <ChevronDown className="w-3 h-3 text-[#526579]" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-1.5 z-50 text-xs">
                    {LANGUAGE_LABELS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-[#F1F5F9] transition-colors cursor-pointer ${
                          language === lang.code ? 'font-bold text-[#102A43] bg-[#F1F5F9]' : 'text-[#334155]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* When NOT Authenticated: Sign In & Sign Up CTA Buttons */}
              {!isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthModalTab('login');
                      setCurrentView('auth');
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-[#102A43] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#526579]" />
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuthModalTab('signup');
                      setCurrentView('auth');
                    }}
                    className="px-4 py-2 text-xs font-bold bg-[#FF8A34] hover:bg-[#E87420] text-white rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Event</span>
                  </button>
                </div>
              ) : (
                /* When Authenticated: Profile Menu & Logout */
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs font-medium hover:bg-[#F1F5F9] rounded-full text-[#102A43] transition-colors border border-[#E2E8F0] cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#102A43] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="hidden md:flex flex-col text-left">
                        <span className="text-xs font-bold text-[#102A43] leading-tight">
                          {currentUser.name.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-[#526579] uppercase font-mono">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-[#526579]" />
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] py-2 z-50 text-xs text-[#334155]">
                        <div className="px-4 py-3 border-b border-[#E2E8F0]">
                          <p className="font-bold text-[#102A43] text-sm">{currentUser.name}</p>
                          <p className="text-[11px] text-[#526579] font-mono mt-0.5">{currentUser.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#102A43] text-white uppercase">
                              {currentUser.role.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-[#526579]">
                              {organization.name}
                            </span>
                          </div>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setCurrentView('dashboard');
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer font-medium text-[#102A43]"
                          >
                            <Layers className="w-4 h-4 text-[#FF8A34]" />
                            <span>Organizer Mission Control</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsMyTicketsOpen(true);
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer font-medium text-[#102A43]"
                          >
                            <Ticket className="w-4 h-4 text-[#FF8A34]" />
                            <span>My Booked Tickets & Passes</span>
                          </button>

                          <button
                            onClick={() => {
                              setCurrentView('wallet');
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer font-medium text-[#102A43]"
                          >
                            <Wallet className="w-4 h-4 text-[#526579]" />
                            <span>Revenue & Payouts</span>
                          </button>

                          <button
                            onClick={() => {
                              setIs2FAModalOpen(true);
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#F1F5F9] flex items-center gap-2.5 cursor-pointer font-medium text-[#102A43]"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#526579]" />
                            <span>Security & Account Access</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0] px-4 pb-1">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                            }}
                            className="w-full text-left py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center gap-2 text-rose-700 transition-colors cursor-pointer font-bold"
                          >
                            <LogOut className="w-4 h-4 text-rose-600" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Hamburger toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 text-[#102A43] hover:bg-[#F1F5F9] rounded-xl cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#E2E8F0] bg-white p-4 space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#526579]">Select Active Event:</span>
              <select
                value={activeEvent.id}
                onChange={(e) => {
                  setActiveEventId(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-xs font-semibold text-[#102A43] bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl py-2 px-3"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 font-bold rounded-xl hover:bg-[#F1F5F9] flex items-center gap-2.5 text-[#102A43]"
              >
                <Compass className="w-4 h-4 text-[#FF8A34]" />
                <span>Explore Events Marketplace</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('public_event');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 font-semibold rounded-xl hover:bg-[#F1F5F9] flex items-center gap-2.5 text-[#334155]"
              >
                <Ticket className="w-4 h-4 text-[#FF8A34]" />
                <span>Book Tickets & Interactive Seats</span>
              </button>

              <button
                onClick={() => {
                  setIsMyTicketsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 font-semibold rounded-xl hover:bg-[#F1F5F9] flex items-center gap-2.5 text-[#334155]"
              >
                <Sparkles className="w-4 h-4 text-[#FF8A34]" />
                <span>My Booked Tickets & Passes</span>
              </button>

              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setCurrentView('dashboard');
                  } else {
                    setAuthModalTab('login');
                    setCurrentView('auth');
                  }
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 font-semibold rounded-xl hover:bg-[#F1F5F9] flex items-center gap-2.5 text-[#334155]"
              >
                <Layers className="w-4 h-4 text-[#526579]" />
                <span>Organizer Mission Control</span>
              </button>

              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setCurrentView('scanner');
                  } else {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3 font-semibold rounded-xl hover:bg-[#F1F5F9] flex items-center gap-2.5 text-[#334155]"
              >
                <QrCode className="w-4 h-4 text-[#526579]" />
                <span>QR Door Scanner App</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Beautiful Base / Bottom Navigation Bar for Mobile Public Browsing */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] px-3 py-2 sm:hidden shadow-2xl pb-safe no-print">
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'text-white bg-[#FF8A34] shadow-md shadow-orange-500/30 font-bold'
                : 'text-[#526579] hover:text-[#102A43]'
            }`}
          >
            <Compass className={`w-5 h-5 ${currentView === 'home' ? 'text-white' : 'text-[#526579]'}`} />
            <span className="text-[10px] font-semibold mt-0.5">Explore</span>
          </button>

          <button
            onClick={() => setCurrentView('public_event')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'public_event'
                ? 'text-white bg-[#FF8A34] shadow-md shadow-orange-500/30 font-bold'
                : 'text-[#526579] hover:text-[#102A43]'
            }`}
          >
            <Ticket className={`w-5 h-5 ${currentView === 'public_event' ? 'text-white' : 'text-[#526579]'}`} />
            <span className="text-[10px] font-semibold mt-0.5">Tickets</span>
          </button>

          <button
            onClick={() => setIsMyTicketsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer text-[#526579] hover:text-[#102A43]"
          >
            <Sparkles className="w-5 h-5 text-[#FF8A34]" />
            <span className="text-[10px] font-semibold mt-0.5">My Passes</span>
          </button>

          <button
            onClick={() => {
              if (isAuthenticated) {
                setCurrentView('dashboard');
              } else {
                setAuthModalTab('login');
                setCurrentView('auth');
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'dashboard' || currentView === 'wallet' || currentView === 'scanner'
                ? 'text-white bg-[#102A43] shadow-md font-bold'
                : 'text-[#526579] hover:text-[#102A43]'
            }`}
          >
            <Layers className="w-5 h-5 text-[#526579]" />
            <span className="text-[10px] font-semibold mt-0.5">Organizer</span>
          </button>
        </div>
      </div>

      {/* My Tickets Modal */}
      <MyTicketsModal
        isOpen={isMyTicketsOpen}
        onClose={() => setIsMyTicketsOpen(false)}
      />
    </>
  );
};
