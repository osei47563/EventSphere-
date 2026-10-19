import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { updatePageSEO } from '../../utils/seo';
import {
  Sparkles,
  Ticket,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  QrCode,
  ArrowRight,
  Heart,
  Globe,
  Award,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { setCurrentView, setAuthModalTab } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageSEO({
      title: 'About Us | EventSphere Live Event Ticketing & Gate Technology',
      description:
        'Learn about EventSphere — our mission to revolutionize live event ticketing, secure gate QR check-ins, and Paystack payments for festivals, conferences, and concerts.',
      canonicalPath: '/about',
    });
  }, []);

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
                About Our Journey
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthModalTab('signup');
                setCurrentView('auth');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Become an Organizer
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Our Vision &amp; Philosophy
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Connecting People with <span className="text-emerald-300">Unforgettable</span> Live Experiences.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            EventSphere was built to solve live event chaos: eliminate counterfeit passes, prevent long gate queues, and empower organizers with seamless payments and instant attendance verification.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setAuthModalTab('signup');
                setCurrentView('auth');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Get Started with EventSphere</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              Contact Our Team
            </button>
          </div>
        </div>
      </section>

      {/* IMPACT METRICS BAR */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700">250K+</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Verified Passes Scanned</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">99.98%</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Door Scanner Uptime</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700">&lt; 1 sec</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Gate Entry Check-in Time</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">450+</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Festivals &amp; Summits Hosted</p>
          </div>
        </div>
      </section>

      {/* CORE VALUES / THE PROBLEM & SOLUTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
        
        {/* Story Block 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-wider text-emerald-700 uppercase">
              THE PROBLEM WE SET OUT TO SOLVE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Traditional event ticketing was broken and stressful.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Paper tickets get lost or ruined in rain. Screenshot passes are scalped and duplicated to multiple unsuspecting fans. Gate lines stretch for blocks while staff frantically shuffle paper printouts and guestlists.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              At the same time, event organizers struggle with complicated payment gateways, delayed disbursements, and fragmented seating arrangements.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-video relative">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80"
              alt="Live festival audience with stage lights"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                ✦ High Energy, Zero Gate Bottlenecks
              </span>
            </div>
          </div>
        </div>

        {/* Story Block 2: The EventSphere Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-video relative order-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80"
              alt="Conference auditorium presentation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                ✦ Corporate Conferences &amp; VIP Galas
              </span>
            </div>
          </div>

          <div className="space-y-4 order-1 md:order-2">
            <span className="text-xs font-black tracking-wider text-emerald-700 uppercase">
              THE EVENTSPHERE ECOSYSTEM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              An all-in-one platform built for fans and producers.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We engineered a streamlined ticketing platform where attendees receive instantaneous scannable QR passes and downloadable verified receipts directly to their devices and WhatsApp.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Instant Paystack Integration:</strong> Cards, Mobile Money, and Bank Transfer.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Mobile Number Identity Recovery:</strong> Verified lookup if phone runs out of charge.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Camera QR Scanner:</strong> 1-second check-ins with anti-duplicate fraud detection.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Interactive Physical Seating:</strong> VIP tables and reserved tier allocations.</span>
              </li>
            </ul>
          </div>
        </div>

      </section>

      {/* THREE PILLARS CARDS */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              HOW WE OPERATE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Our Core Technology Pillars
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Seamless Payments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by official Paystack production rails for fast, reliable checkout across cards, Mobile Money, and bank transfers with instant organizer payouts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified QR Code Entry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every ticket features a unique digital verification QR code. Scanned seamlessly at the entrance to ensure authentic admission and eliminate duplicate entries.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Community &amp; Culture First</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether it's a 20,000-person music festival in Accra or an executive tech summit in Lagos or London, we cater to local payment rails with global reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Ready to experience events the way they should be?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Join thousands of attendees discovering live entertainment or sign up as an organizer to sell tickets and launch your next stage production today.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentView('home')}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Explore Live Events →
          </button>
          <button
            onClick={() => {
              setAuthModalTab('signup');
              setCurrentView('auth');
            }}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Create Organizer Account
          </button>
        </div>
      </section>
    </div>
  );
};
