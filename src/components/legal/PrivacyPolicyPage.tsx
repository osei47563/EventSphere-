import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updatePageSEO } from '../../utils/seo';
import {
  Shield,
  Lock,
  Smartphone,
  Eye,
  FileText,
  CreditCard,
  QrCode,
  ArrowLeft,
  Printer,
  CheckCircle2,
  HelpCircle,
  Mail,
  Search,
} from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { setCurrentView, setAuthModalTab } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageSEO({
      title: 'Privacy Policy | EventSphere Live Ticketing',
      description:
        'Read how EventSphere collects, protects, and utilizes attendee contact data, phone numbers, verified QR passes, and Paystack transactions.',
      canonicalPath: '/privacy',
    });
  }, []);

  const sections = [
    { id: 'overview', title: '1. Executive Summary & Scope' },
    { id: 'data-collection', title: '2. Information We Collect' },
    { id: 'phone-usage', title: '3. Mobile Numbers & Ticket Delivery' },
    { id: 'paystack-payments', title: '4. Payment Processing with Paystack' },
    { id: 'qr-verification', title: '5. Scannable QR Codes & Gate Access' },
    { id: 'retention-backups', title: '6. Storage, Backups & Retention' },
    { id: 'user-rights', title: '7. Your Rights & Data Requests' },
    { id: 'cookies', title: '8. Cookies & Local Session Storage' },
    { id: 'contact', title: '9. Privacy Contact & DPO' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer group"
              aria-label="Back to home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                ◈
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  eventsphere
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">
                  Privacy Center
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Policy</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-gradient-to-b from-emerald-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Shield className="w-3.5 h-3.5" />
            Official Privacy &amp; Data Policy
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            EventSphere Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We are dedicated to safeguarding your personal data, ticket credentials, and financial privacy. Learn how your information is handled with care.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span>Last Updated: <strong>October 19, 2026</strong></span>
            <span>•</span>
            <span>Version: <strong>3.2.0</strong></span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR NAVIGATION (STICKY ON DESKTOP) */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm sticky top-22">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Policy Contents</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">9 Sections</span>
              </h3>

              {/* Quick Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter privacy terms..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <nav className="space-y-1 text-xs font-medium">
                {sections
                  .filter((sec) =>
                    searchQuery
                      ? sec.title.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`block px-3 py-2 rounded-lg transition-colors text-left ${
                        activeSection === sec.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold border-l-2 border-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {sec.title}
                    </a>
                  ))}
              </nav>

              <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                Have questions about your data privacy or account? Reach out to our support desk anytime.
              </div>
            </div>
          </aside>

          {/* MAIN POLICY ARTICLES */}
          <main className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-10">
            
            {/* 1. OVERVIEW */}
            <article id="overview" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileText className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  1. Executive Summary &amp; Scope
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                EventSphere operates as a premier multi-tenant event ticketing, seat mapping, and gate verification software platform. This Privacy Policy governs your use of our ticketing services, web applications, event checkout flows, and organizer dashboards.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                By purchasing a ticket, registering an attendee account, or publishing an event production, you consent to the data practices described in this document. We do not sell your personal data to third-party data brokers or advertisers.
              </p>
            </article>

            {/* 2. INFORMATION WE COLLECT */}
            <article id="data-collection" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Eye className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  2. Information We Collect
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To issue valid event tickets and prevent fraud, we collect information directly provided by attendees and event organizers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Attendee Credentials
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Full name, email address, and active telephone / WhatsApp mobile number to dispatch digital ticket receipts.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Transaction Metadata
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Paystack payment reference, ticket tier ID, quantity, amount paid, and seat or table allocation numbers.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Organizer Details
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Production brand name, business email, authorized bank account or mobile money details for revenue withdrawals.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Gate Check-In Timestamps
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Exact door scan timestamps and door officer badge IDs when your ticket barcode is verified at physical venue gates.
                  </p>
                </div>
              </div>
            </article>

            {/* 3. MOBILE NUMBERS & TICKET DELIVERY */}
            <article id="phone-usage" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Smartphone className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  3. Mobile Numbers &amp; Ticket Delivery
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                During ticket checkout, we request your active mobile phone number. This data is collected specifically for the following verified use-cases:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                <li>
                  <strong>Backup Identity Verification:</strong> If your paper or digital receipt is misplaced or battery runs out, door staff can look up your verified registration using your name and phone number.
                </li>
                <li>
                  <strong>Instant WhatsApp Sharing:</strong> Allows you to immediately forward your scannable QR ticket passport and receipt to your personal WhatsApp or companions with one click.
                </li>
                <li>
                  <strong>Critical Event Announcements:</strong> Urgent notifications regarding venue changes, weather delays, or parking updates for your registered event.
                </li>
              </ul>
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-medium">
                🔒 We will never send spam advertisements or sell your phone number to third-party telemarketers.
              </div>
            </article>

            {/* 4. PAYMENT PROCESSING WITH PAYSTACK */}
            <article id="paystack-payments" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  4. Payment Processing with Paystack
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All financial ticket transactions are processed through <strong>Paystack</strong>. EventSphere never collects, sees, or stores your credit or debit card numbers, bank account passwords, or Mobile Money PINs.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Secure Direct Processing</span>
                </div>
                <p>
                  Payment authorization is handled directly by Paystack across card networks, Mobile Money, and bank transfers. EventSphere only receives a confirmed transaction reference code to confirm payment and issue your ticket pass.
                </p>
              </div>
            </article>

            {/* 5. SCANNABLE QR CODES */}
            <article id="qr-verification" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <QrCode className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  5. Scannable QR Codes &amp; Gate Access
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every ticket generated by EventSphere includes a unique, verifiable QR code. This code represents your registration record, admission tier, and entry status.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When scanned by authorized door staff using our camera scanner, our system validates the ticket instantly, flags duplicate attempts, and logs admission without revealing private billing details to gate operators.
              </p>
            </article>

            {/* 6. RETENTION & BACKUPS */}
            <article id="retention-backups" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Lock className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  6. Storage, Backups &amp; Data Retention
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We retain attendee ticketing and financial records for as long as necessary to comply with accounting standards, tax obligations, and event dispute resolution periods. All records are safely maintained in accordance with standard data protection protocols.
              </p>
            </article>

            {/* 7. USER RIGHTS */}
            <article id="user-rights" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <HelpCircle className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  7. Your Rights &amp; Data Requests
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Under applicable data privacy regulations (including GDPR and local Data Protection legislation), you hold specific rights regarding your personal information:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                <li><strong>Right of Access:</strong> You may request an export of your purchased tickets and registered data.</li>
                <li><strong>Right to Rectification:</strong> You may correct inaccurate attendee names or phone numbers before an event commences.</li>
                <li><strong>Right to Erasure:</strong> You may request deletion of non-regulatory records following completion of an event.</li>
              </ul>
            </article>

            {/* 8. COOKIES */}
            <article id="cookies" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileText className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  8. Cookies &amp; Local Session Storage
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We use strictly necessary browser local storage and cookies to retain your login session, chosen currency, preferred language, and shopping cart selections. We do not employ intrusive cross-site tracking cookies.
              </p>
            </article>

            {/* 9. CONTACT */}
            <article id="contact" className="scroll-mt-24 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Mail className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  9. Privacy Contact &amp; Data Protection Officer
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If you have questions regarding this Privacy Policy, wish to exercise your data rights, or need assistance retrieving a verified ticket, please contact our team:
              </p>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p><strong>Data Privacy Office:</strong> EventSphere Compliance Operations</p>
                <p><strong>Official Email:</strong> <a href="mailto:privacy@eventsphere.io" className="text-emerald-700 font-bold hover:underline">privacy@eventsphere.io</a></p>
                <p><strong>Support Hotline:</strong> <a href="mailto:support@eventsphere.io" className="text-emerald-700 font-bold hover:underline">support@eventsphere.io</a></p>
                <p><strong>Response Timeframe:</strong> All inquiries are reviewed and answered within 48 business hours.</p>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('terms')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  View Terms of Service →
                </button>
                <button
                  onClick={() => setCurrentView('contact')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Contact Support Desk →
                </button>
              </div>
            </article>

          </main>
        </div>
      </div>
    </div>
  );
};
