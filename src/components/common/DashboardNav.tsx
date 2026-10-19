import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Home,
  Shield,
  QrCode,
  Wallet,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Compass,
  ExternalLink,
  Ticket,
  Calendar,
  Layers,
  BarChart3,
  Users,
  Settings,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationBell } from './NotificationBell';

export interface TabItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
}

interface DashboardNavProps {
  title: string;
  subtitle?: string;
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  actions?: React.ReactNode;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({
  title,
  subtitle,
  tabs,
  activeTab,
  onSelectTab,
  actions,
}) => {
  const {
    currentUser,
    organization,
    logout,
    setCurrentView,
    currentView,
    organizerEvents,
    activeOrganizerEvent,
    activeEvent,
    setActiveEventId,
  } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 250);
    }
  };

  return (
    <>
      {/* Sleek Top Header for Dashboards with Zero Overflow */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#102A43] border-b border-[#E2E8F0] shadow-xs no-print w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Hamburger & Brand Title with responsive truncation */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#102A43] transition-colors cursor-pointer border border-[#E2E8F0] flex items-center gap-1.5 shrink-0 group"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#102A43] group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold hidden md:inline text-[#102A43]">Menu</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div
                onClick={() => setCurrentView('home')}
                className="cursor-pointer flex items-center gap-2 group shrink-0"
                title="Return to Public Marketplace"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#102A43] flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md group-hover:bg-[#243F57] transition-all relative">
                  <span>ES</span>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FF8A34] rounded-full border-2 border-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-base font-bold tracking-tight text-[#102A43] truncate">
                    {title}
                  </h1>
                  <span className="hidden lg:inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    Live Operations
                  </span>
                </div>
                {subtitle && (
                  <p className="text-[10px] sm:text-[11px] text-[#526579] truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls: Event Switcher (tenant-isolated), Public Switch, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Active Event Dropdown on Dashboards - ONLY if organizer has multiple events! */}
            {organizerEvents && organizerEvents.length > 1 && (
              <div className="hidden xl:flex items-center">
                <select
                  value={activeOrganizerEvent?.id || activeEvent?.id}
                  onChange={(e) => setActiveEventId(e.target.value)}
                  className="text-xs font-semibold text-[#102A43] bg-[#F1F5F9] hover:bg-slate-200/80 border border-[#E2E8F0] rounded-xl py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-[#102A43] transition-colors max-w-[170px] truncate cursor-pointer"
                  title="Switch Active Event"
                >
                  {organizerEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick View Public Site */}
            <button
              onClick={() => setCurrentView('home')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#102A43] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl transition-all cursor-pointer shrink-0"
              title="Preview Public Marketplace & Ticket Booking"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF8A34]" />
              <span className="hidden xl:inline">Public Portal</span>
              <ExternalLink className="w-3 h-3 text-[#526579]" />
            </button>

            {/* Injected custom actions */}
            {actions}

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-[#E2E8F0] pl-1.5 sm:pl-3 shrink-0">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#102A43] text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title={`${currentUser?.name} (${currentUser?.role})`}
              >
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={logout}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#102A43] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tab Navigation Bar with Smooth Scroll Controls */}
        {tabs.length > 0 && (
          <div className="hidden sm:block border-t border-[#E2E8F0] bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative flex items-center">
              {/* Left Scroll Button */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollTabs('left')}
                  className="absolute left-1 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#102A43] hover:bg-[#F1F5F9] transition-all cursor-pointer"
                  title="Scroll tabs left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <nav
                ref={tabsScrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-1 overflow-x-auto py-2 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 w-full"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSelectTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#102A43] text-white shadow-sm'
                          : 'text-[#526579] hover:text-[#102A43] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF8A34]' : 'text-[#526579]'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-[#FF8A34] text-white font-bold' : 'bg-[#F1F5F9] text-[#102A43]'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Right Scroll Button */}
              {canScrollRight && (
                <button
                  onClick={() => scrollTabs('right')}
                  className="absolute right-1 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#102A43] hover:bg-[#F1F5F9] transition-all cursor-pointer"
                  title="Scroll tabs right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hamburger Slide-Over Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#102A43]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-80 sm:w-96 bg-white border-r border-[#E2E8F0] text-[#102A43] shadow-2xl flex flex-col justify-between">
              <div className="overflow-y-auto">
                {/* Drawer Header Profile */}
                <div className="p-5 bg-[#102A43] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#FF8A34] flex items-center justify-center text-white font-black text-lg shadow-md">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {currentUser?.name || 'Administrator'}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate max-w-[160px]">
                        {currentUser?.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/20 text-orange-200 uppercase">
                          {currentUser?.role?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          {organization.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Dashboard Navigation Groups */}
                <div className="p-4 space-y-4">
                  {/* Management Section */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#526579] px-3 mb-1.5">
                      Operational Mission Controls
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('dashboard');
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          currentView === 'dashboard'
                            ? 'bg-[#102A43] text-white shadow-sm'
                            : 'hover:bg-[#F1F5F9] text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-[#FF8A34]' : 'text-[#102A43]'}`} />
                          <span>Organizer Mission Control</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>

                      <button
                        onClick={() => {
                          setCurrentView('wallet');
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          currentView === 'wallet'
                            ? 'bg-[#102A43] text-white shadow-sm'
                            : 'hover:bg-[#F1F5F9] text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className={`w-4 h-4 ${currentView === 'wallet' ? 'text-[#FF8A34]' : 'text-[#102A43]'}`} />
                          <span>Revenue & Paystack Payouts</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>

                      <button
                        onClick={() => {
                          setCurrentView('scanner');
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          currentView === 'scanner'
                            ? 'bg-[#102A43] text-white shadow-sm'
                            : 'hover:bg-[#F1F5F9] text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <QrCode className={`w-4 h-4 ${currentView === 'scanner' ? 'text-[#FF8A34]' : 'text-[#102A43]'}`} />
                          <span>Live QR Door Scanner</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>

                      {currentUser?.role === 'system_admin' && (
                        <button
                          onClick={() => {
                            setCurrentView('admin');
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            currentView === 'admin'
                              ? 'bg-[#102A43] text-white shadow-sm'
                              : 'hover:bg-[#F1F5F9] text-[#334155]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Shield className={`w-4 h-4 ${currentView === 'admin' ? 'text-[#FF8A34]' : 'text-[#102A43]'}`} />
                            <span>System Admin Portal</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Operational Event Tabs Section (Accessible without horizontal scroll) */}
                  {tabs && tabs.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#526579] px-3 mb-1.5 flex items-center justify-between">
                        <span>Event Operational Tabs</span>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-500">{tabs.length} tabs</span>
                      </p>
                      <div className="space-y-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                onSelectTab(tab.id);
                                setIsDrawerOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#102A43] text-white shadow-xs'
                                  : 'hover:bg-[#F1F5F9] text-[#334155]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF8A34]' : 'text-[#102A43]'}`} />
                                <span>{tab.label}</span>
                              </div>
                              {tab.badge && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isActive ? 'bg-[#FF8A34] text-white' : 'bg-[#F1F5F9] text-[#102A43]'
                                  }`}
                                >
                                  {tab.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Public Marketplace Views */}
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#526579] px-3 mb-1.5">
                      Public Customer Pages
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('home');
                          setIsDrawerOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F1F5F9] text-[#334155] text-xs font-semibold transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Compass className="w-4 h-4 text-[#FF8A34]" />
                          <span>Events Discovery Marketplace</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#526579]" />
                      </button>

                      <button
                        onClick={() => {
                          setCurrentView('public_event');
                          setIsDrawerOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F1F5F9] text-[#334155] text-xs font-semibold transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Ticket className="w-4 h-4 text-[#FF8A34]" />
                          <span>Public Ticket Booking & Seat Map</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#526579]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer & Contact Details */}
              <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-[#F1F5F9]">
                <div className="space-y-1.5 text-xs text-[#526579]">
                  <p className="flex items-center gap-2 text-[#102A43] font-medium">
                    <MapPin className="w-4 h-4 text-[#FF8A34] shrink-0" />
                    <span>Kumasi, Ghana</span>
                  </p>
                  <p className="flex items-center gap-2 text-[#102A43]">
                    <Phone className="w-4 h-4 text-[#FF8A34] shrink-0" />
                    <span>0530026527</span>
                  </p>
                  <p className="flex items-center gap-2 text-[#102A43] truncate">
                    <Mail className="w-4 h-4 text-[#FF8A34] shrink-0" />
                    <span>obahlog@gmail.com</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Log Out of Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gorgeous Bottom Navigation Bar for Mobile Phones */}
      {tabs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] px-3 py-2 sm:hidden shadow-2xl pb-safe no-print">
          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
            {tabs.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer relative ${
                    isActive
                      ? 'text-white bg-[#FF8A34] shadow-md shadow-orange-500/30 font-bold scale-102'
                      : 'text-[#526579] hover:text-[#102A43]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#526579]'}`} />
                  <span className="text-[10px] font-semibold mt-0.5 truncate max-w-[62px]">
                    {tab.label.split(' ')[0]}
                  </span>
                  {tab.badge && !isActive && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#FF8A34]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
