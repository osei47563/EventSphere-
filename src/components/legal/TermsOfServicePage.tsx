import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updatePageSEO } from '../../utils/seo';
import {
  FileCheck,
  Scale,
  Ticket,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Search,
  Building2,
  Users,
} from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  const { setCurrentView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageSEO({
      title: 'Terms of Service | EventSphere Live Ticketing Platform',
      description:
        'Official Terms of Service governing ticket purchases, event organization, Paystack processing, refunds, and admission policies on EventSphere.',
      canonicalPath: '/terms',
    });
  }, []);

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'ticketing', title: '2. Ticket Purchases & Digital QR Passes' },
    { id: 'gate-entry', title: '3. Gate Verification & Admission Rules' },
    { id: 'refunds', title: '4. Refunds, Cancellations & Delays' },
    { id: 'organizers', title: '5. Organizer Obligations & Commission' },
    { id: 'prohibited', title: '6. Prohibited Activities & Scalping' },
    { id: 'liability', title: '7. Limitation of Liability' },
    { id: 'disputes', title: '8. Governing Law & Dispute Resolution' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* TOP BAR */}
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
                  Legal &amp; Terms
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
              <span>Print Agreement</span>
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
      <section className="bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Scale className="w-3.5 h-3.5" />
            Binding Legal Terms &amp; Conditions
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Terms of Service Agreement
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before purchasing tickets or creating event productions on EventSphere. This agreement protects all buyers, organizers, and venue partners.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span>Effective Date: <strong>October 19, 2026</strong></span>
            <span>•</span>
            <span>Standard Contract Version: <strong>4.1.0</strong></span>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm sticky top-22">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Agreement Sections</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">8 Articles</span>
              </h3>

              {/* Quick Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search terms & clauses..."
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

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Fair Ticketing Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every ticket issued on EventSphere is mathematically tied to a unique verified transaction reference.
                </p>
              </div>
            </div>
          </aside>

          {/* MAIN ARTICLES */}
          <main className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-10">
            
            {/* 1. ACCEPTANCE */}
            <article id="acceptance" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileCheck className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  1. Acceptance of Terms &amp; Eligibility
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                By accessing EventSphere, creating an account, publishing an event, or purchasing tickets, you confirm that you are at least 18 years of age (or have the consent of a legal guardian) and agree to be bound by these Terms of Service.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If you are acting on behalf of an event production company, corporate sponsor, or music festival, you represent that you possess the full legal authority to bind that entity to this agreement.
              </p>
            </article>

            {/* 2. TICKET PURCHASES */}
            <article id="ticketing" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Ticket className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  2. Ticket Purchases &amp; Digital QR Passes
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When you purchase a ticket through EventSphere, you receive an official verified digital pass equipped with a verified QR code, unique ticket alphanumeric code, and payment receipt.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-2">
                <p className="font-bold text-slate-900">Verification on File:</p>
                <p>
                  As part of the checkout process, attendees provide their legal name, email, and mobile telephone number. This information is inscribed on the downloadable PDF receipt and ticket pass to ensure instant backup verification at the venue gate even if the QR image is damaged.
                </p>
              </div>
            </article>

            {/* 3. GATE ENTRY */}
            <article id="gate-entry" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  3. Gate Verification &amp; Admission Rules
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Admission to any event is contingent upon successful scanning of your valid QR code by authorized door personnel or manual verification of your name and telephone number against the live organizer guest registry.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                <li>
                  <strong>One Scan Per Ticket:</strong> Once a QR code is checked in, our system records the entry timestamp and flags any subsequent attempt to enter with the same code as duplicate/unauthorized.
                </li>
                <li>
                  <strong>Right of Admission Reserved:</strong> Event organizers and venue security maintain the legal right to refuse entry or eject individuals for disorderly conduct, security breaches, or failure to comply with venue regulations.
                </li>
              </ul>
            </article>

            {/* 4. REFUNDS & CANCELLATIONS */}
            <article id="refunds" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <RotateCcw className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  4. Refunds, Cancellations &amp; Delays
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ticket refund policies are set by the respective Event Organizer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Cancelled Events</h4>
                  <p className="text-slate-500 leading-relaxed">
                    If an event is permanently cancelled by the organizer, purchasers are entitled to a refund processed back through the original Paystack payment method.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Postponed / Rescheduled</h4>
                  <p className="text-slate-500 leading-relaxed">
                    Existing tickets remain 100% valid for the rescheduled date. Organizers may provide a refund claim window for attendees unable to attend the new date.
                  </p>
                </div>
              </div>
            </article>

            {/* 5. ORGANIZER OBLIGATIONS */}
            <article id="organizers" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Building2 className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  5. Organizer Obligations &amp; Platform Commission
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Event Organizers using EventSphere to sell tickets, design venue seating, and collect attendee registrations agree to:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                <li>Provide accurate event schedules, performers, dates, venues, and ticket tier descriptions.</li>
                <li>Fulfill all advertised event obligations in good faith.</li>
                <li>
                  Acknowledge that EventSphere retains an automated platform commission rate (standard default <strong>18%</strong> or custom enterprise negotiated rate) on gross ticket sales to cover technology infrastructure, Paystack payment gateway fees, QR verification systems, and customer support.
                </li>
                <li>
                  Maintain valid verified bank account or Mobile Money merchant credentials for revenue disbursements and withdrawal requests.
                </li>
              </ul>
            </article>

            {/* 6. PROHIBITED CONDUCT */}
            <article id="prohibited" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  6. Prohibited Activities &amp; Ticket Scalping
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Users agree not to engage in unauthorized ticket resale, automated bot scraping, unauthorized duplication of QR passes, or fraudulent chargeback disputes. Accounts involved in scalping or fraud will be terminated immediately and ticket codes voided.
              </p>
            </article>

            {/* 7. LIMITATION OF LIABILITY */}
            <article id="liability" className="scroll-mt-24 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Scale className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  7. Limitation of Liability
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                EventSphere provides the technology platform connecting ticket purchasers and event organizers. EventSphere does not own, direct, or operate the physical venues, performances, or security personnel at events. To the maximum extent permitted by law, EventSphere is not liable for personal injury, property loss, or artist cancellations occurring at live events.
              </p>
            </article>

            {/* 8. DISPUTES */}
            <article id="disputes" className="scroll-mt-24 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  8. Governing Law &amp; Dispute Resolution
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                These terms are governed by the laws of the jurisdiction in which the event organizer's registered business is established. The parties agree to resolve any dispute through good-faith mediation before resorting to formal arbitration or judicial proceedings.
              </p>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentView('privacy')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Read Privacy Policy →
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
