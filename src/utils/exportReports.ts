import { jsPDF } from 'jspdf';
import { Attendee, EventData } from '../types';
import { formatCurrency } from './paystack';

/**
 * Exports an executive performance report in PDF format
 */
export function exportEventReportPdf(event: EventData, attendees: Attendee[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalAttendees = attendees.length;
  const checkedInAttendees = attendees.filter((a) => a.checkedIn).length;
  const turnoutPercent = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;
  const totalRevenue = attendees.reduce((sum, a) => sum + (a.paymentStatus === 'paid' ? a.amountPaid : 0), 0);

  // Header branding
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EVENTSPHERE ENTERPRISE SAAS', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('EXECUTIVE EVENT PERFORMANCE & ATTENDANCE REPORT', 14, 22);

  const reportDate = new Date().toLocaleString();
  doc.text(`Generated: ${reportDate}`, 140, 22);

  // Event title & overview section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(event.title, 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Venue: ${event.venueName} · ${event.venueAddress}`, 14, 48);
  doc.text(`Schedule Date: ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`, 14, 53);

  // KPI Metric Cards (Visual Grid)
  const drawMetricCard = (x: number, y: number, w: number, h: number, title: string, value: string, sub: string) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), x + 4, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 4, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sub, x + 4, y + 24);
  };

  const cardW = 42;
  const cardH = 28;
  const startY = 60;
  drawMetricCard(14, startY, cardW, cardH, 'Total Revenue', formatCurrency(totalRevenue, event.currency), 'Gross Paystack transactions');
  drawMetricCard(60, startY, cardW, cardH, 'Registered Guests', `${totalAttendees}`, `Target capacity: ${event.totalCapacity}`);
  drawMetricCard(106, startY, cardW, cardH, 'Turnout Rate', `${turnoutPercent}%`, `${checkedInAttendees} verified at doors`);
  drawMetricCard(152, startY, cardW, cardH, 'Remaining Passes', `${Math.max(0, event.totalCapacity - totalAttendees)}`, 'Capacity allocation');

  // Ticket Tiers breakdown
  let currY = 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Ticket Tiers & Sales Performance', 14, currY);

  currY += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currY, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Tier Name', 16, currY + 5.5);
  doc.text('Price', 75, currY + 5.5);
  doc.text('Cap / Sold', 105, currY + 5.5);
  doc.text('Revenue', 145, currY + 5.5);
  doc.text('Status', 175, currY + 5.5);

  currY += 8;
  event.ticketTiers.forEach((tier) => {
    const tierSold = attendees.filter((a) => a.ticketTierId === tier.id).length;
    const tierRev = tierSold * tier.price;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(tier.name, 16, currY + 6);
    doc.text(tier.price > 0 ? formatCurrency(tier.price, tier.currency) : 'Free', 75, currY + 6);
    doc.text(`${tierSold} / ${tier.capacity}`, 105, currY + 6);
    doc.text(formatCurrency(tierRev, tier.currency), 145, currY + 6);
    doc.text(tierSold >= tier.capacity ? 'Sold Out' : 'Active', 175, currY + 6);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currY + 9, 196, currY + 9);
    currY += 9;
  });

  // Recent Check-in Logs section
  currY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Door Operations & Live Attendee Status Sample', 14, currY);

  currY += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currY, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Attendee Name', 16, currY + 5.5);
  doc.text('Company & Role', 65, currY + 5.5);
  doc.text('Tier', 115, currY + 5.5);
  doc.text('Ticket ID', 145, currY + 5.5);
  doc.text('Turnout Status', 172, currY + 5.5);

  currY += 8;
  attendees.slice(0, 14).forEach((attendee) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(attendee.fullName.substring(0, 24), 16, currY + 5);
    doc.text(`${attendee.jobTitle || 'Executive'}, ${attendee.company || 'N/A'}`.substring(0, 26), 65, currY + 5);
    doc.text(attendee.ticketTierName.substring(0, 16), 115, currY + 5);
    doc.text(attendee.ticketCode, 145, currY + 5);

    if (attendee.checkedIn) {
      doc.setTextColor(16, 185, 129); // green
      doc.text('Checked In', 172, currY + 5);
    } else {
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Awaiting', 172, currY + 5);
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, currY + 7.5, 196, currY + 7.5);
    currY += 7.5;
  });

  // Footer notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('EventSphere Cloud SaaS · Built with Paystack Gateway & Real-Time QR Door Verification', 14, 285);
  doc.text('Page 1 of 1 · Confidential', 165, 285);

  doc.save(`${event.slug}-executive-report.pdf`);
}

/**
 * Exports single attendee badge / confirmation pass as PDF
 */
export function exportSingleTicketPdf(event: EventData, attendee: Attendee): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148], // A6 size ideal for event badge lanyard & pass
  });

  // Background header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 105, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL EVENT PASS', 10, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(event.title.substring(0, 40), 10, 20);

  // Attendee Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(attendee.fullName, 10, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${attendee.jobTitle} · ${attendee.company}`, 10, 50);

  // Tier Badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(10, 56, 85, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const tierLine = attendee.assignedSeat
    ? `${attendee.ticketTierName.toUpperCase()} · ${attendee.assignedSeat.toUpperCase()}`
    : `ACCESS: ${attendee.ticketTierName.toUpperCase()}`;
  doc.text(tierLine.substring(0, 48), 12, 62.5);

  // QR Code placeholder / image if provided
  if (attendee.qrDataUrl) {
    try {
      doc.addImage(attendee.qrDataUrl, 'PNG', 27, 70, 50, 50);
    } catch (e) {
      console.warn('Could not render QR code in PDF', e);
    }
  }

  // Ticket Code
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(attendee.ticketCode, 52, 127, { align: 'center' });

  // Verification instruction
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Present this QR code upon arrival at registration desk.', 52, 133, { align: 'center' });
  doc.text(`${event.venueName} · Paystack Ref: ${attendee.paymentReference || 'N/A'}`, 52, 138, { align: 'center' });

  doc.save(`${attendee.ticketCode}-${attendee.fullName.replace(/\s+/g, '_')}-badge.pdf`);
}

/**
 * Exports CSV of attendees
 */
export function exportAttendeesCsv(event: EventData, attendees: Attendee[]): void {
  const headers = [
    'Ticket Code',
    'Full Name',
    'Email',
    'Company',
    'Job Title',
    'Ticket Tier',
    'Assigned Seat',
    'Amount Paid',
    'Currency',
    'Payment Status',
    'Paystack Ref',
    'Checked In',
    'Checked In At',
    'Registration Date',
  ];

  const rows = attendees.map((a) => [
    `"${a.ticketCode}"`,
    `"${a.fullName}"`,
    `"${a.email}"`,
    `"${a.company || ''}"`,
    `"${a.jobTitle || ''}"`,
    `"${a.ticketTierName}"`,
    `"${a.assignedSeat || 'General'}"`,
    a.amountPaid,
    `"${a.currency}"`,
    `"${a.paymentStatus}"`,
    `"${a.paymentReference || ''}"`,
    a.checkedIn ? 'YES' : 'NO',
    `"${a.checkedInAt || ''}"`,
    `"${a.createdAt}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${event.slug}-attendees-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
