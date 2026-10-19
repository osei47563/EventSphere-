import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Volume2,
  VolumeX,
  Camera,
  RefreshCw,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Attendee } from '../../types';
import { DashboardNav } from '../common/DashboardNav';

export const DoorScanner: React.FC = () => {
  const { activeEvent, activeEventAttendees, checkInTicket, undoCheckIn, currentUser } = useApp();
  const [ticketInput, setTicketInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'duplicate' | 'invalid' | 'idle';
    message: string;
    attendee?: Attendee;
  }>({
    status: 'idle',
    message: 'Scanner initialized. Ready to verify attendee QR codes or codes.',
  });
  const [cameraActive, setCameraActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Audio tone synthesizer using Web Audio API for instantaneous chime without external audio files
  const playChime = (type: 'success' | 'duplicate' | 'invalid') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'duplicate') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(370, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // AudioContext not allowed or restricted
    }
  };

  const handleVerify = (codeToTest: string) => {
    if (!codeToTest.trim()) return;
    const result = checkInTicket(codeToTest, currentUser.name);

    if (result.success) {
      setLastScanResult({
        status: 'success',
        message: result.message,
        attendee: result.attendee,
      });
      playChime('success');
    } else if (result.attendee) {
      setLastScanResult({
        status: 'duplicate',
        message: result.message,
        attendee: result.attendee,
      });
      playChime('duplicate');
    } else {
      setLastScanResult({
        status: 'invalid',
        message: result.message,
      });
      playChime('invalid');
    }
    setTicketInput('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(ticketInput);
  };

  // Helper to simulate scanning a specific attendee's QR from the event
  const simulateScanAttendee = (attendee: Attendee) => {
    handleVerify(attendee.ticketCode);
  };

  const totalAttendees = activeEventAttendees.length;
  const checkedInCount = activeEventAttendees.filter((a) => a.checkedIn).length;
  const turnoutPercent = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;
  const vipCount = activeEventAttendees.filter((a) => a.ticketTierName.toLowerCase().includes('vip')).length;
  const vipCheckedIn = activeEventAttendees.filter(
    (a) => a.checkedIn && a.ticketTierName.toLowerCase().includes('vip')
  ).length;

  const filteredAttendees = activeEventAttendees.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scannerTabs = [
    { id: 'scanner', label: 'QR Door Scanner', icon: QrCode },
    { id: 'roster', label: `Attendee Roster (${totalAttendees})`, icon: Users },
    { id: 'turnout', label: `Turnout (${turnoutPercent}%)`, icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-10">
      <DashboardNav
        title="QR Door Scanner App"
        subtitle={`${activeEvent.title} · Operator: ${currentUser.name}`}
        tabs={scannerTabs}
        activeTab="scanner"
        onSelectTab={() => {}}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Turnout Counter */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-emerald-600">
                Door Station · Live
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{activeEvent.title}</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Operator: <strong className="text-slate-700">{currentUser.name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 transition-colors"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundEnabled ? 'Chime Active' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Turnout Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Live Turnout</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {checkedInCount} <span className="text-xs text-slate-400 font-sans font-normal">/ {totalAttendees}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${turnoutPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500">Turnout Rate</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">{turnoutPercent}%</div>
            <span className="text-[11px] text-slate-400">Door velocity active</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500">VIP Credentials</span>
            <div className="text-2xl font-bold text-purple-700 font-mono tabular-nums">
              {vipCheckedIn} <span className="text-xs text-slate-400 font-sans font-normal">/ {vipCount}</span>
            </div>
            <span className="text-[11px] text-slate-400">Gala & Greenroom Passes</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500">Awaiting Arrival</span>
            <div className="text-2xl font-bold text-slate-700 font-mono tabular-nums">
              {Math.max(0, totalAttendees - checkedInCount)}
            </div>
            <span className="text-[11px] text-slate-400">Expected today</span>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewfinder & Manual Verification */}
        <div className="lg:col-span-7 space-y-5">
          {/* Viewfinder Card */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md text-white">
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide uppercase">QR Optical Scanner</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                HIGH RESOLUTION 60FPS
              </span>
            </div>

            <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-6">
              {/* Animated laser line */}
              <div className="absolute inset-x-8 top-1/4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />

              {/* Viewfinder Target Bracket Box */}
              <div className="relative w-56 h-56 border-2 border-emerald-400/80 rounded-lg flex flex-col items-center justify-center p-4">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />

                <QrCode className="w-20 h-20 text-slate-700/60" />
                <span className="text-[11px] text-slate-400 mt-2 text-center">
                  Align attendee digital pass or physical lanyard badge inside target frame
                </span>
              </div>

              {/* Instant Scan Simulation bar */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 z-10">
                <span className="text-xs text-slate-400">Quick Test Scan:</span>
                {activeEventAttendees.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => simulateScanAttendee(a)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                  >
                    Scan {a.fullName.split(' ')[0]} ({a.ticketCode.slice(-3)})
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Code Input Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="Enter Ticket Code manually (e.g. TKT-9421-VIP)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 font-mono text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Ticket</span>
                </button>
              </form>
            </div>
          </div>

          {/* Scan Result Feedback Card */}
          {lastScanResult.status !== 'idle' && (
            <div
              className={`p-5 rounded-xl border transition-all ${
                lastScanResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : lastScanResult.status === 'duplicate'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastScanResult.status === 'success' && (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {lastScanResult.status === 'duplicate' && (
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}
                {lastScanResult.status === 'invalid' && (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-bold text-sm">
                      {lastScanResult.status === 'success' && 'TICKET VALIDATED — ACCESS GRANTED'}
                      {lastScanResult.status === 'duplicate' && 'ENTRY WARNING — ALREADY CHECKED IN'}
                      {lastScanResult.status === 'invalid' && 'ACCESS REJECTED — UNRECOGNIZED PASS'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">{lastScanResult.message}</p>
                  </div>

                  {lastScanResult.attendee && (
                    <div className="p-3 bg-white/80 rounded-lg border border-current/10 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">{lastScanResult.attendee.fullName}</span>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                          {lastScanResult.attendee.ticketCode}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {lastScanResult.attendee.jobTitle} · <strong>{lastScanResult.attendee.company}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-white">
                          {lastScanResult.attendee.ticketTierName}
                        </span>
                        {lastScanResult.attendee.assignedSeat && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Seat: {lastScanResult.attendee.assignedSeat}
                          </span>
                        )}
                        {lastScanResult.attendee.customAnswers?.cf_dietary && (
                          <span className="text-[11px] text-slate-600 font-medium">
                            Dietary: {lastScanResult.attendee.customAnswers.cf_dietary}
                          </span>
                        )}
                      </div>

                      {lastScanResult.status === 'duplicate' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              undoCheckIn(lastScanResult.attendee!.id);
                              setLastScanResult({
                                status: 'idle',
                                message: 'Check-in reset. Ready for re-scan.',
                              });
                            }}
                            className="text-xs text-rose-700 hover:text-rose-900 underline font-medium"
                          >
                            Reset / Re-open Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Attendee Registry & Quick Check-in Lookup */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Guest Lookup & Door Override</h3>
                <p className="text-xs text-slate-500">Quick search registered delegates if badge is lost</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">{filteredAttendees.length} records</span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or ticket ID..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-2 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            {/* Attendee list */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredAttendees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No attendees matching search query</div>
              ) : (
                filteredAttendees.map((att) => (
                  <div
                    key={att.id}
                    className={`p-3 rounded-lg border text-xs transition-colors flex items-center justify-between gap-3 ${
                      att.checkedIn ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{att.fullName}</span>
                        {att.checkedIn && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px]">
                            Checked In
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 truncate text-[11px]">
                        {att.jobTitle} · {att.company}
                      </p>
                      <div className="text-[10px] font-mono text-slate-400">
                        {att.ticketCode} · {att.ticketTierName} {att.assignedSeat && `· 🍽️ ${att.assignedSeat}`}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {att.checkedIn ? (
                        <button
                          onClick={() => undoCheckIn(att.id)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(att.ticketCode)}
                          className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                        >
                          <span>Check In</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
