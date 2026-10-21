import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { OrganizerDashboard } from './components/organizer/OrganizerDashboard';
import { OrganizerWallet } from './components/organizer/OrganizerWallet';
import { DoorScanner } from './components/door/DoorScanner';
import { PublicEventPage } from './components/public/PublicEventPage';
import { SystemAdminDashboard } from './components/admin/SystemAdminDashboard';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/legal/TermsOfServicePage';
import { AboutUsPage } from './components/about/AboutUsPage';
import { ContactSupportPage } from './components/support/ContactSupportPage';
import { TwoFactorModal } from './components/common/TwoFactorModal';
import { AuthModal } from './components/common/AuthModal';
import { Footer } from './components/common/Footer';
import { AlertCircle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentView, isolatedNotifications, markNotificationAsRead } = useApp();

  // Strictly isolated urgent notifications: only displays urgent announcements intended for active event or system-wide
  const urgentNotification = isolatedNotifications.find((n) => n.type === 'urgent' && !n.read);

  const isDashboardView = ['admin', 'wallet', 'scanner', 'dashboard'].includes(currentView);
  const isCustomStaticView = ['home', 'public_event', 'auth', 'privacy', 'terms', 'about', 'contact'].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Real-Time Urgent Announcement Banner with Strict Event Isolation */}
      {urgentNotification && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium shadow-xs flex items-center justify-between gap-3 z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] bg-rose-700 px-1.5 py-0.5 rounded">
                {urgentNotification.eventId === 'system_all' ? 'System Broadcast' : 'Event Alert'}
              </span>
              <strong className="text-white">{urgentNotification.title}:</strong>
              <span className="text-rose-100">{urgentNotification.message}</span>
            </div>
          </div>
          <button
            onClick={() => markNotificationAsRead(urgentNotification.id)}
            className="p-1 hover:bg-rose-700 rounded text-rose-200 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Top Header - On Dashboard and Internal Pages */}
      {!isDashboardView && !isCustomStaticView && (
        <div className="no-print">
          <Header />
        </div>
      )}

      {/* Dynamic View Router */}
      <main className="flex-1">
        {currentView === 'home' ? (
          <HomePage />
        ) : currentView === 'auth' ? (
          <AuthPage />
        ) : currentView === 'privacy' ? (
          <PrivacyPolicyPage />
        ) : currentView === 'terms' ? (
          <TermsOfServicePage />
        ) : currentView === 'about' ? (
          <AboutUsPage />
        ) : currentView === 'contact' ? (
          <ContactSupportPage />
        ) : currentView === 'admin' ? (
          <SystemAdminDashboard />
        ) : currentView === 'wallet' ? (
          <OrganizerWallet />
        ) : currentView === 'scanner' ? (
          <DoorScanner />
        ) : currentView === 'public_event' ? (
          <PublicEventPage />
        ) : (
          <OrganizerDashboard />
        )}
      </main>

      {/* Enterprise Dynamic Footer - Rendered on Public Static and Subpages (except auth, home which has embedded footer) */}
      {!isDashboardView && !['auth', 'home'].includes(currentView) && (
        <div className="no-print">
          <Footer />
        </div>
      )}

      {/* Security & Authentication Modals */}
      <div className="no-print">
        <TwoFactorModal />
        <AuthModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
