import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updatePageSEO, buildFaqJsonLd } from '../../utils/seo';
import {
  Mail,
  Phone,
  MessageSquare,
  HelpCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  ArrowLeft,
  Ticket,
  ShieldCheck,
} from 'lucide-react';

export const ContactSupportPage: React.FC = () => {
  const { setCurrentView } = useApp();

  const [formCategory, setFormCategory] = useState<'lost_ticket' | 'payment' | 'organizer' | 'general'>('lost_ticket');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [ticketReference, setTicketReference] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageSEO({
      title: 'Help & Contact Support | EventSphere Live Ticketing',
      description:
        'Need assistance with your ticket, Paystack payment receipt, QR gate pass, or organizer account? Contact the EventSphere support desk.',
      canonicalPath: '/contact',
      jsonLd: buildFaqJsonLd([
        {
          q: 'I bought a ticket but misplaced my receipt or QR code. How do I retrieve it?',
          a: 'Your ticket is never lost! Since we collect your name and mobile phone number during checkout, you can present your phone number and valid photo ID to the door staff at the venue gate for instant registration lookup.',
        },
        {
          q: 'Can I show my QR code ticket directly on WhatsApp or my phone screen?',
          a: 'Yes, absolutely! You do not need to print your ticket on paper. Simply present the scannable QR code on your mobile phone screen or WhatsApp message to our gate officers.',
        },
        {
          q: 'What payment methods does EventSphere accept via Paystack?',
          a: 'Through our official Paystack integration, we support Visa, Mastercard, Verve, Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo), Bank Transfers, and USSD.',
        },
        {
          q: 'How do event organizers withdraw ticket sales revenue?',
          a: 'Organizers can submit automated withdrawal requests anytime from their Organizer Wallet dashboard. Disbursements are transferred directly to verified bank accounts or Mobile Money.',
        },
      ]),
    });
  }, []);

  const faqs = [
    {
      q: 'I bought a ticket but misplaced my receipt or QR code. How do I retrieve it?',
      a: 'Your ticket is never lost! Since we collect your name and mobile phone number during checkout, you can present your phone number and valid photo ID to the door staff at the venue gate for instant registration lookup. You can also submit an inquiry below with your phone number to receive a direct WhatsApp re-dispatch.',
    },
    {
      q: 'Can I show my QR code ticket directly on WhatsApp or my phone screen?',
      a: 'Yes, absolutely! You do not need to print your ticket on paper. Simply present the scannable QR code on your mobile phone screen or WhatsApp message to our gate officers. Our camera scanner reads high-definition digital screens in under 1 second.',
    },
    {
      q: 'What payment methods does EventSphere accept via Paystack?',
      a: 'Through our official Paystack integration, we support Visa, Mastercard, Verve, Mobile Money (MTN MoMo, Telecel / Vodafone Cash, AirtelTigo), Bank Transfers, and USSD mobile banking.',
    },
    {
      q: 'How do event organizers withdraw ticket sales revenue?',
      a: 'Organizers can submit automated withdrawal requests anytime from their Organizer Wallet dashboard. Disbursements are transferred directly to the verified bank account or Mobile Money merchant number within 24 to 48 hours.',
    },
    {
      q: 'Are tickets refundable if an event is cancelled?',
      a: 'Yes. If an event is officially cancelled by the producer, refunds are automatically credited back to your original payment account in accordance with our Terms of Service.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(generatedId);
      setMessage('');
      setTicketReference('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              ◈
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                eventsphere
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider mt-0.5">
                Support &amp; Help Desk
              </span>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('home')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            24/7 Attendee &amp; Organizer Assistance
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            How can our team help you today?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Need to retrieve a lost ticket receipt, verify a Paystack payment reference, or get organizer assistance? We are here to support you.
          </p>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        
        {/* CONTACT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Email Support Desk</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              For general inquiries, ticket re-issuance, and payment verification:
            </p>
            <a
              href="mailto:support@eventsphere.io"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 block"
            >
              support@eventsphere.io →
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">WhatsApp Priority Desk</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast live chat support for ticket retrieval and on-site door gate issues:
            </p>
            <a
              href="https://wa.me/233244981240"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 block"
            >
              Chat on WhatsApp Hotline →
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Rapid Response Times</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ticket inquiries during live event days are monitored and answered with priority within minutes.
            </p>
            <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              Average Response: &lt; 15 mins
            </span>
          </div>
        </div>

        {/* INTERACTIVE FORM & FAQ SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: SUPPORT REQUEST FORM */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-9 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">
                SUBMIT A SUPPORT TICKET
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Send Us an Inquiry
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the details below. Our technical support team will assist you promptly.
              </p>
            </div>

            {submittedTicketId ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-base font-bold text-emerald-950">Inquiry Dispatched Successfully!</h3>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
                  Your reference ticket number is <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedTicketId}</strong>. A confirmation email has been logged and our staff will respond within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicketId(null)}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inquiry Category Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Inquiry Topic
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'lost_ticket', label: '🎟️ Lost Ticket' },
                      { id: 'payment', label: '💳 Paystack Issue' },
                      { id: 'organizer', label: '🏢 Organizer Hub' },
                      { id: 'general', label: '💬 General Info' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormCategory(cat.id as any)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          formCategory === cat.id
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="senderName">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      id="senderName"
                      required
                      placeholder="e.g. Richard Quaye"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="senderEmail">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="senderEmail"
                      required
                      placeholder="you@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="senderPhone">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      id="senderPhone"
                      placeholder="e.g. +233 24 498 1240"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="ticketRef">
                      Paystack Reference or Ticket Code
                    </label>
                    <input
                      type="text"
                      id="ticketRef"
                      placeholder="e.g. TICK-928103 or pay_xyz"
                      value={ticketReference}
                      onChange={(e) => setTicketReference(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="supportMsg">
                    Message / Inquiry Details *
                  </label>
                  <textarea
                    id="supportMsg"
                    rows={4}
                    required
                    placeholder="Describe your issue or inquiry in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: FREQUENTLY ASKED QUESTIONS */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider text-emerald-700 uppercase block mb-1">
                KNOWLEDGE BASE
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Quick answers to common questions about passes and payouts.
              </p>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>EventSphere Global Presence</span>
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Operating hubs in Accra (Independence Avenue), Lagos (Victoria Island), Nairobi, and London.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
