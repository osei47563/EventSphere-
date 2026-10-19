import React, { useState } from 'react';
import {
  Ticket,
  X,
  Download,
  Calendar,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Share2,
  Utensils,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Attendee, EventData } from '../../types';
import { formatCurrency } from '../../utils/paystack';
import { exportSingleTicketPdf } from '../../utils/exportReports';

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({ isOpen, onClose }) => {
  const { attendees, events, activeEvent, currentUser } = useApp();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Attendee | null>(null);

  if (!isOpen) return null;

  // Filter user's tickets based on current user email or search input
  const userTickets = attendees.filter((a) => {
    if (searchEmail.trim()) {
      return (
        a.email.toLowerCase().includes(searchEmail.toLowerCase().trim()) ||
        a.ticketCode.toLowerCase().includes(searchEmail.toLowerCase().trim()) ||
        a.fullName.toLowerCase().includes(searchEmail.toLowerCase().trim())
      );
    }
    // Default show tickets matching currentUser email or default seed tickets
    return a.email === currentUser.email || attendees.slice(0, 4).includes(a);
  });

  const getEventForAttendee = (attendee: Attendee): EventData | undefined => {
    return events.find((e) => e.id === attendee.eventId) || activeEvent;
  };

  const handleDownloadCalendar = (attendee: Attendee) => {
    const event = getEventForAttendee(attendee);
    if (!event) return;

    const startDate = new Date(event.startDate).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(event.endDate).toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventSphere//Ticketing//EN',
      'BEGIN:VEVENT',
      `UID:${attendee.ticketCode}@eventsphere.app`,
      `DTSTAMP:${startDate}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:Ticket Pass ${attendee.ticketCode} - Tier: ${attendee.ticketTierName}. Venue: ${event.venueName}`,
      `LOCATION:${event.venueAddress}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Ticket.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#102A43] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF8A34] text-white flex items-center justify-center shadow-md">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                My Booked Tickets & Passes
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/20 text-orange-200">
                  {userTickets.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Official digital boarding passes with verified QR code verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar for retrieving tickets */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by your email, ticket code (e.g. TK-014298), or attendee name..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102A43] focus:border-transparent text-slate-800 placeholder-slate-400 shadow-xs"
            />
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {userTickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Ticket className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Tickets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets matched &ldquo;{searchEmail}&rdquo;. Enter the email address you used during ticket checkout or book a new ticket now.
              </p>
            </div>
          ) : (
            userTickets.map((attendee) => {
              const event = getEventForAttendee(attendee);
              const isSelected = selectedTicket?.id === attendee.id;

              return (
                <div
                  key={attendee.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'border-[#FF8A34] shadow-md ring-1 ring-[#FF8A34]'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#102A43] text-white">
                          {attendee.ticketCode}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF8A34]">
                          {attendee.ticketTierName}
                        </span>
                        {attendee.checkedIn ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Checked In
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Valid Entry Pass
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#102A43]">
                        {event?.title || 'EventSphere Conference'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#FF8A34] shrink-0" />
                          <span>{event ? new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Upcoming'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#FF8A34] shrink-0" />
                          <span className="truncate">{event?.venueName || 'Kumasi, Ghana'}</span>
                        </p>
                        <p className="text-slate-500 font-medium">
                          Attendee: <strong className="text-slate-800">{attendee.fullName}</strong>
                        </p>
                        {attendee.assignedSeat && (
                          <p className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Utensils className="w-3 h-3" /> Seat: {attendee.assignedSeat}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* QR Code thumbnail and fast actions */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:border-l sm:border-slate-100 sm:pl-5">
                      {attendee.qrDataUrl && (
                        <div
                          onClick={() => setSelectedTicket(isSelected ? null : attendee)}
                          className="cursor-pointer group flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#102A43] transition-colors"
                          title="Click to expand full QR boarding pass"
                        >
                          <img
                            src={attendee.qrDataUrl}
                            alt="QR Pass"
                            className="w-16 h-16 object-contain group-hover:scale-105 transition-transform"
                          />
                          <span className="text-[10px] font-mono text-slate-500 mt-1">Tap to enlarge</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (event) exportSingleTicketPdf(event, attendee);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#243F57] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Download PDF Ticket Badge"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => handleDownloadCalendar(attendee)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Add to Google / Apple Calendar"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded QR Modal Details */}
                  {isSelected && (
                    <div className="border-t border-slate-100 bg-slate-50 p-6 flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                        <img
                          src={attendee.qrDataUrl}
                          alt="Full QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                        <div className="mt-2 text-center">
                          <span className="font-mono font-bold text-sm text-[#102A43] bg-slate-100 px-3 py-1 rounded-md">
                            {attendee.ticketCode}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">
                          Present this verified QR code at the venue door
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Door staff will scan this QR pass for instant acoustic check-in verification.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (event) exportSingleTicketPdf(event, attendee);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#FF8A34] hover:bg-[#E87420] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download High-Resolution Badge (PDF)</span>
                        </button>
                        <button
                          onClick={() => handleDownloadCalendar(attendee)}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-[#FF8A34]" />
                          <span>Add to Calendar (.ics)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Need help with your ticket? Call: <strong>0530026527</strong> (Kumasi, Ghana)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#102A43] text-white font-semibold hover:bg-[#243F57] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
