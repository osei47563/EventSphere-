import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { EventData, TicketTier, Attendee, WithdrawalAccount } from '../../types';
import { formatCurrency } from '../../utils/paystack';

export interface FormTicketDraft {
  id: string;
  name: string;
  price: number;
  capacity: number;
  limitPerPerson: number;
  description: string;
  perks: string;
  isFree?: boolean;
}

export const OrganizerDashboard: React.FC = () => {
  const {
    organization,
    updateOrganization,
    organizerEvents,
    activeOrganizerEvent,
    setActiveEventId,
    createEvent,
    updateEvent,
    deleteEvent,
    attendees,
    activeEventAttendees,
    currentUser,
    logout,
    setCurrentView,
    walletStats,
    withdrawalRequests,
    requestWithdrawal,
    addWithdrawalAccount,
    removeWithdrawalAccount,
    checkInTicket,
    setIs2FAModalOpen,
    broadcastNotification,
  } = useApp();

  const [activePage, setActivePage] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filters state
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [attendeeSearch, setAttendeeSearch] = useState('');

  // Transaction Receipt Modal State
  const [selectedReceiptAttendee, setSelectedReceiptAttendee] = useState<Attendee | null>(null);

  // Withdrawal Modal State
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawChannel, setWithdrawChannel] = useState<'mobile_money' | 'bank_transfer'>('mobile_money');
  const [withdrawMomoProvider, setWithdrawMomoProvider] = useState('MTN Mobile Money');
  const [withdrawMomoNumber, setWithdrawMomoNumber] = useState('0244981240');
  const [withdrawBankName, setWithdrawBankName] = useState('Stanbic Bank Ghana');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('0530026527');
  const [withdrawAccountName, setWithdrawAccountName] = useState(currentUser?.name || 'Richard Quaye');

  // Create & Edit Event Form state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Concerts');
  const [formType, setFormType] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person');
  const [formVisibility, setFormVisibility] = useState<'public' | 'private'>('public');
  const [formDate, setFormDate] = useState('2026-11-20');
  const [formTime, setFormTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formVenue, setFormVenue] = useState('Accra Sports Stadium');
  const [formLocation, setFormLocation] = useState('Accra');
  const [formDescription, setFormDescription] = useState('An extraordinary gathering for industry leaders and enthusiasts.');
  // Multi-Ticket Creation State & Helpers
  const [formTickets, setFormTickets] = useState<FormTicketDraft[]>([
    {
      id: 'tier_init_1',
      name: 'General Admission',
      price: 50,
      capacity: 250,
      limitPerPerson: 5,
      description: 'Standard event access, keynote seating & general expo access.',
      perks: 'General Admission, Digital Badge, Main Hall Access',
      isFree: false,
    },
    {
      id: 'tier_init_2',
      name: 'VIP Pass',
      price: 150,
      capacity: 50,
      limitPerPerson: 4,
      description: 'VIP front-row seating, dedicated check-in, networking lounge & complimentary refreshments.',
      perks: 'Priority Fast-Track Entry, VIP Lounge Access, Goodie Bag, Refreshments',
      isFree: false,
    },
  ]);
  const [formCoverImage, setFormCoverImage] = useState('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80');
  const [formLogoImage, setFormLogoImage] = useState('');

  // Settings active tab
  const [settingsTab, setSettingsTab] = useState('profile');
  const [profileName, setProfileName] = useState(organization.name);
  const [profilePhone, setProfilePhone] = useState('+233 20 000 0000');
  const [profileBio, setProfileBio] = useState('Premier event creator and community builder.');

  // Notification Preferences State
  const [notifTicketSales, setNotifTicketSales] = useState(true);
  const [notifDailySummary, setNotifDailySummary] = useState(true);
  const [notifLowInventory, setNotifLowInventory] = useState(true);
  const [notifCheckinMilestones, setNotifCheckinMilestones] = useState(false);

  // Security Form State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Team Management State with Granular Role-Based Access Control (RBAC)
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Pending Invite';
    addedAt: string;
    permissions: {
      canScanTickets: boolean;
      canViewAttendees: boolean;
      canManageEvents: boolean;
      canViewFinances: boolean;
      canSendBroadcasts: boolean;
    };
  }>>([
    {
      id: 'team-1',
      name: currentUser?.name || 'Organizer Admin',
      email: currentUser?.email || 'organizer@eventsphere.io',
      role: 'Owner',
      status: 'Active',
      addedAt: '2026-01-15',
      permissions: {
        canScanTickets: true,
        canViewAttendees: true,
        canManageEvents: true,
        canViewFinances: true,
        canSendBroadcasts: true,
      },
    },
    {
      id: 'team-2',
      name: 'Kofi Mensah',
      email: 'kofi.gate@eventsphere.io',
      role: 'Gate Scanner Staff',
      status: 'Active',
      addedAt: '2026-03-10',
      permissions: {
        canScanTickets: true,
        canViewAttendees: false,
        canManageEvents: false,
        canViewFinances: false,
        canSendBroadcasts: false,
      },
    },
    {
      id: 'team-3',
      name: 'Ama Osei',
      email: 'ama.coordinator@eventsphere.io',
      role: 'Event Coordinator',
      status: 'Active',
      addedAt: '2026-04-02',
      permissions: {
        canScanTickets: true,
        canViewAttendees: true,
        canManageEvents: false,
        canViewFinances: false,
        canSendBroadcasts: true,
      },
    },
  ]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Gate Scanner Staff');
  const [invitePermissions, setInvitePermissions] = useState({
    canScanTickets: true,
    canViewAttendees: false,
    canManageEvents: false,
    canViewFinances: false,
    canSendBroadcasts: false,
  });

  // Handle role preset selection
  const handleRolePresetChange = (role: string) => {
    setInviteRole(role);
    if (role === 'Gate Scanner Staff') {
      setInvitePermissions({
        canScanTickets: true,
        canViewAttendees: false,
        canManageEvents: false,
        canViewFinances: false,
        canSendBroadcasts: false,
      });
    } else if (role === 'Event Coordinator') {
      setInvitePermissions({
        canScanTickets: true,
        canViewAttendees: true,
        canManageEvents: false,
        canViewFinances: false,
        canSendBroadcasts: true,
      });
    } else if (role === 'Event Manager') {
      setInvitePermissions({
        canScanTickets: true,
        canViewAttendees: true,
        canManageEvents: true,
        canViewFinances: false,
        canSendBroadcasts: true,
      });
    } else if (role === 'Finance Auditor') {
      setInvitePermissions({
        canScanTickets: false,
        canViewAttendees: true,
        canManageEvents: false,
        canViewFinances: true,
        canSendBroadcasts: false,
      });
    }
  };

  // Broadcast Announcement State
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTargetEvent, setBroadcastTargetEvent] = useState<string>('all');
  const [sentBroadcasts, setSentBroadcasts] = useState<Array<{
    id: string;
    subject: string;
    message: string;
    eventTitle: string;
    sentAt: string;
    recipientCount: number;
  }>>([
    {
      id: 'bc-1',
      subject: 'Gate & Check-in Advisory',
      message: 'Doors open 1 hour before scheduled time. Please have your QR codes ready on your mobile screen or WhatsApp.',
      eventTitle: 'All Events',
      sentAt: '2026-10-18 14:30',
      recipientCount: 12,
    },
  ]);

  // QR Check-in Manual Validator State
  const [manualTicketCode, setManualTicketCode] = useState('');
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    success: boolean;
    message: string;
    attendee?: Attendee;
  } | null>(null);
  const scannerInstanceRef = useRef<any>(null);

  // Optical Camera Scanner initialization when on check-in tab
  useEffect(() => {
    // Auto-close past events
    organizerEvents.forEach((evt) => {
      if (evt.status === 'published' && new Date(evt.endDate || evt.startDate) < new Date()) {
        updateEvent(evt.id, { status: 'completed' });
      }
    });

    let qrScanner: any = null;
    if (activePage === 'check-in') {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        const container = document.getElementById('organizer-qr-reader');
        if (container) {
          qrScanner = new Html5Qrcode('organizer-qr-reader');
          scannerInstanceRef.current = qrScanner;
          qrScanner
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 220, height: 220 } },
              (decodedText: string) => {
                const res = checkInTicket(decodedText, currentUser?.name || 'Gate Operator');
                setLastCheckInResult(res);
                if (res.success) {
                  showToastMsg(`✓ Access Granted: ${res.attendee?.fullName} (${res.attendee?.ticketTierName})`);
                } else {
                  showToastMsg(res.message, 'error');
                }
              },
              () => {}
            )
            .catch((err: unknown) => {
              console.warn('Camera not available or permission denied:', err);
            });
        }
      });
    }

    return () => {
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, [activePage]);

  // Marketing Promo Codes State
  const [promoCodes, setPromoCodes] = useState<Array<{ code: string; discountPercent: number; uses: number; active: boolean }>>([
    { code: 'EARLYBIRD', discountPercent: 15, uses: 24, active: true },
    { code: 'VIPGUEST', discountPercent: 20, uses: 8, active: true },
    { code: 'COMMUNITY', discountPercent: 10, uses: 15, active: true },
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('10');

  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const goToPage = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CSV Export Handlers
  const exportAttendeesCSV = () => {
    if (allMyAttendees.length === 0) {
      showToastMsg('No attendees found to export.', 'error');
      return;
    }
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Event',
      'Ticket Tier',
      'Ticket Code',
      'Amount Paid',
      'Currency',
      'Payment Status',
      'Payment Channel',
      'Payment Reference',
      'Checked In',
      'Check In Time',
    ];
    const rows = allMyAttendees.map((a) => {
      const eventName = organizerEvents.find((e) => e.id === a.eventId)?.title || 'Event';
      return [
        `"${(a.fullName || '').replace(/"/g, '""')}"`,
        `"${a.email || ''}"`,
        `"${a.phone || ''}"`,
        `"${eventName.replace(/"/g, '""')}"`,
        `"${a.ticketTierName || ''}"`,
        `"${a.ticketCode || ''}"`,
        a.amountPaid,
        `"${a.currency}"`,
        `"${a.paymentStatus}"`,
        `"${a.paymentChannel || ''}"`,
        `"${a.paymentReference || ''}"`,
        a.checkedIn ? 'Yes' : 'No',
        `"${a.checkedInAt || ''}"`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendees-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('Attendees CSV exported successfully!');
  };

  const exportReceiptsCSV = () => {
    if (myPaidOrders.length === 0) {
      showToastMsg('No receipts found to export.', 'error');
      return;
    }
    const headers = [
      'Receipt / Order Ref',
      'Buyer Name',
      'Email',
      'Phone',
      'Event',
      'Ticket Tier',
      'Gross Paid',
      'Commission Rate (%)',
      'Platform Fee',
      'Organizer Net Earnings',
      'Currency',
      'Payment Method',
      'Date',
    ];
    const rows = myPaidOrders.map((o) => {
      const eventName = organizerEvents.find((e) => e.id === o.eventId)?.title || 'Event';
      const commRate = o.commissionRate ?? organization.platformCommissionRate ?? 18;
      const comm = o.platformCommission ?? Math.round(o.amountPaid * (commRate / 100) * 100) / 100;
      const net = o.organizerEarnings ?? Math.round((o.amountPaid - comm) * 100) / 100;
      return [
        `"${o.paymentReference || 'REC-' + o.id}"`,
        `"${(o.fullName || '').replace(/"/g, '""')}"`,
        `"${o.email || ''}"`,
        `"${o.phone || ''}"`,
        `"${eventName.replace(/"/g, '""')}"`,
        `"${o.ticketTierName || ''}"`,
        o.amountPaid,
        commRate,
        comm,
        net,
        `"${o.currency}"`,
        `"${o.paymentChannel || 'Paystack'}"`,
        `"${new Date(o.createdAt).toLocaleString()}"`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receipts-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('Receipts CSV exported successfully!');
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketCode.trim()) {
      showToastMsg('Please enter a ticket code to validate.', 'error');
      return;
    }
    const result = checkInTicket(manualTicketCode.trim(), currentUser?.name || 'Gate Operator');
    setLastCheckInResult(result);
    if (result.success) {
      showToastMsg(`✓ Checked in: ${result.attendee?.fullName} (${result.attendee?.ticketTierName})`);
      setManualTicketCode('');
    } else {
      showToastMsg(result.message, 'error');
    }
  };

  const copyEventShareLink = () => {
    const url = activeOrganizerEvent
      ? `${window.location.origin}/?event=${activeOrganizerEvent.slug || activeOrganizerEvent.id}`
      : window.location.origin;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showToastMsg('Event link copied to clipboard!'))
        .catch(() => showToastMsg('Copied URL: ' + url));
    } else {
      showToastMsg('Event link copied: ' + url);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      showToastMsg('Please enter both subject and message.', 'error');
      return;
    }
    const targetTitle = broadcastTargetEvent === 'all'
      ? 'All Events'
      : organizerEvents.find((ev) => ev.id === broadcastTargetEvent)?.title || 'Selected Event';

    const targetCount = broadcastTargetEvent === 'all'
      ? allMyAttendees.length
      : attendees.filter((a) => a.eventId === broadcastTargetEvent).length;

    // Send real broadcast notification via AppContext
    broadcastNotification(
      broadcastSubject.trim(),
      broadcastBody.trim(),
      'announcement',
      'attendees',
      broadcastTargetEvent === 'all' ? undefined : broadcastTargetEvent
    );

    // Record in history log
    setSentBroadcasts((prev) => [
      {
        id: `bc-${Date.now()}`,
        subject: broadcastSubject.trim(),
        message: broadcastBody.trim(),
        eventTitle: targetTitle,
        sentAt: new Date().toLocaleString(),
        recipientCount: targetCount,
      },
      ...prev,
    ]);

    setBroadcastSubject('');
    setBroadcastBody('');
    showToastMsg(`Announcement broadcasted to ${targetCount} registered attendees!`);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToastMsg('Please provide name and email.', 'error');
      return;
    }
    const newMember = {
      id: `team-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Active' as const,
      addedAt: new Date().toISOString().slice(0, 10),
      permissions: { ...invitePermissions },
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    showToastMsg(`Invitation sent to ${newMember.name} (${newMember.role}) with customized permissions!`);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    showToastMsg('Team member removed.');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      showToastMsg('Please enter both current and new password.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToastMsg('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToastMsg('Password must be at least 6 characters.', 'error');
      return;
    }
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToastMsg('Password updated successfully!');
  };

  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const discountNum = Number(newPromoDiscount) || 10;
    setPromoCodes((prev) => [
      ...prev,
      { code: newPromoCode.trim().toUpperCase(), discountPercent: discountNum, uses: 0, active: true },
    ]);
    setNewPromoCode('');
    showToastMsg(`Promo code ${newPromoCode.trim().toUpperCase()} added!`);
  };

  // Organizer's all attendees across all owned events
  const myEventIdSet = useMemo(() => new Set(organizerEvents.map((e) => e.id)), [organizerEvents]);
  const allMyAttendees = useMemo(() => attendees.filter((a) => myEventIdSet.has(a.eventId)), [attendees, myEventIdSet]);
  const myPaidOrders = useMemo(() => allMyAttendees.filter((a) => a.paymentStatus === 'paid'), [allMyAttendees]);

  // Metrics derived
  const totalAttendeesCount = allMyAttendees.length;
  const checkedInCount = allMyAttendees.filter((a) => a.checkedIn).length;
  const turnoutPercent = totalAttendeesCount > 0 ? Math.round((checkedInCount / totalAttendeesCount) * 100) : 0;
  const totalCapacity = activeOrganizerEvent?.totalCapacity || organizerEvents.reduce((sum, e) => sum + e.totalCapacity, 0);

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      showToastMsg('Please enter a valid withdrawal amount.', 'error');
      return;
    }
    if (amountNum > walletStats.withdrawableBalance) {
      showToastMsg(`Amount exceeds your withdrawable balance of ${formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}.`, 'error');
      return;
    }

    const account: WithdrawalAccount = {
      bankName: withdrawChannel === 'mobile_money' ? withdrawMomoProvider : withdrawBankName,
      accountNumber: withdrawChannel === 'mobile_money' ? withdrawMomoNumber : withdrawAccountNumber,
      accountName: withdrawAccountName.trim() || currentUser?.name || 'Richard Quaye',
      currency: activeOrganizerEvent?.currency || organization.currency || 'GHS',
      routingOrSwiftCode: withdrawChannel === 'mobile_money' ? 'MOMO_GH' : 'STANCHART_GH',
    };

    requestWithdrawal(amountNum, account);
    setIsWithdrawalModalOpen(false);
    setWithdrawAmount('');
    showToastMsg(`Withdrawal request of ${formatCurrency(amountNum, account.currency)} submitted successfully! Disbursed without additional deductions.`);
  };

  // Form Tickets Derived Totals
  const totalFormCapacity = useMemo(() => {
    return formTickets.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  }, [formTickets]);

  const minTicketPrice = useMemo(() => {
    if (formTickets.length === 0) return 0;
    return Math.min(...formTickets.map((t) => (t.isFree ? 0 : Number(t.price) || 0)));
  }, [formTickets]);

  const maxTicketPrice = useMemo(() => {
    if (formTickets.length === 0) return 0;
    return Math.max(...formTickets.map((t) => (t.isFree ? 0 : Number(t.price) || 0)));
  }, [formTickets]);

  const totalEstimatedGross = useMemo(() => {
    return formTickets.reduce((sum, t) => {
      const p = t.isFree ? 0 : Number(t.price) || 0;
      const c = Number(t.capacity) || 0;
      return sum + p * c;
    }, 0);
  }, [formTickets]);

  // Form Ticket Actions (add, remove, duplicate, update, preset)
  const handleAddTicket = (presetType?: 'custom' | 'vip' | 'early' | 'free' | 'table') => {
    const newId = `tier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newTicket: FormTicketDraft;

    if (presetType === 'vip') {
      newTicket = {
        id: newId,
        name: 'VIP Experience Pass',
        price: 180,
        capacity: 40,
        limitPerPerson: 4,
        description: 'Priority entrance, VIP lounge, free refreshments and merchandise pack.',
        perks: 'VIP Lounge, Express Entry, Free Drinks, Gift Bag',
        isFree: false,
      };
    } else if (presetType === 'early') {
      newTicket = {
        id: newId,
        name: 'Early Bird Ticket',
        price: 35,
        capacity: 100,
        limitPerPerson: 4,
        description: 'Discounted admission for early supporters (limited quantity).',
        perks: 'Discounted Admission, Early Access, Digital Badge',
        isFree: false,
      };
    } else if (presetType === 'free') {
      newTicket = {
        id: newId,
        name: 'Free Community RSVP',
        price: 0,
        capacity: 100,
        limitPerPerson: 2,
        description: 'Complimentary access ticket for students and community members.',
        perks: 'Free Entry, Access to Public Sessions',
        isFree: true,
      };
    } else if (presetType === 'table') {
      newTicket = {
        id: newId,
        name: 'Executive Group Table (8 Guests)',
        price: 900,
        capacity: 10,
        limitPerPerson: 2,
        description: 'Reserved executive table for 8 persons with champagne & table service.',
        perks: 'Table for 8, 2 Bottles of Champagne, Dedicated Concierge, Logo Recognition',
        isFree: false,
      };
    } else {
      newTicket = {
        id: newId,
        name: `Ticket Tier #${formTickets.length + 1}`,
        price: 75,
        capacity: 100,
        limitPerPerson: 5,
        description: 'Standard access ticket.',
        perks: 'Full Event Entry',
        isFree: false,
      };
    }

    setFormTickets((prev) => [...prev, newTicket]);
    showToastMsg(`Added ticket: "${newTicket.name}"`);
  };

  const handleRemoveTicket = (id: string) => {
    if (formTickets.length <= 1) {
      showToastMsg('An event must have at least one ticket tier.', 'error');
      return;
    }
    const tierToRemove = formTickets.find((t) => t.id === id);
    setFormTickets((prev) => prev.filter((t) => t.id !== id));
    showToastMsg(`Removed ticket "${tierToRemove?.name || 'tier'}".`);
  };

  const handleDuplicateTicket = (id: string) => {
    const tier = formTickets.find((t) => t.id === id);
    if (!tier) return;
    const duplicated: FormTicketDraft = {
      ...tier,
      id: `tier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${tier.name} (Copy)`,
    };
    setFormTickets((prev) => [...prev, duplicated]);
    showToastMsg(`Duplicated "${tier.name}".`);
  };

  const handleUpdateTicket = (id: string, updates: Partial<FormTicketDraft>) => {
    setFormTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.price !== undefined) {
          if (Number(updates.price) === 0) {
            updated.isFree = true;
          } else if (Number(updates.price) > 0) {
            updated.isFree = false;
          }
        }
        if (updates.isFree !== undefined) {
          if (updates.isFree) {
            updated.price = 0;
          } else if (updated.price === 0) {
            updated.price = 50;
          }
        }
        return updated;
      })
    );
  };

  // Filtered organizer events
  const filteredEvents = useMemo(() => {
    return organizerEvents.filter((evt) => {
      const matchText = `${evt.title} ${evt.category} ${evt.venueName}`.toLowerCase().includes(eventSearch.toLowerCase());
      const matchStatus = !eventStatusFilter || evt.status.toLowerCase() === eventStatusFilter.toLowerCase();
      return matchText && matchStatus;
    });
  }, [organizerEvents, eventSearch, eventStatusFilter]);

  // Reset form for creating a new event
  const handleStartNewEvent = () => {
    setEditingEventId(null);
    setFormName('');
    setFormCategory('Concerts');
    setFormType('in_person');
    setFormVisibility('public');
    setFormDate('2026-11-20');
    setFormTime('09:00');
    setFormEndDate('');
    setFormEndTime('');
    setFormVenue('Accra Sports Stadium');
    setFormLocation('Accra');
    setFormDescription('An extraordinary gathering for industry leaders and enthusiasts.');
    setFormCoverImage('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80');
    setFormLogoImage('');
    setFormTickets([
      {
        id: 'tier_init_1',
        name: 'General Admission',
        price: 50,
        capacity: 250,
        limitPerPerson: 5,
        description: 'Standard event access, keynote seating & general expo access.',
        perks: 'General Admission, Digital Badge, Main Hall Access',
        isFree: false,
      },
      {
        id: 'tier_init_2',
        name: 'VIP Pass',
        price: 150,
        capacity: 50,
        limitPerPerson: 4,
        description: 'VIP front-row seating, dedicated check-in, networking lounge & complimentary refreshments.',
        perks: 'Priority Fast-Track Entry, VIP Lounge Access, Goodie Bag, Refreshments',
        isFree: false,
      },
    ]);
  };

  // Populate form to edit an existing draft or published event
  const handleStartEditEvent = (evt: EventData) => {
    setEditingEventId(evt.id);
    setFormName(evt.title);
    setFormCategory(evt.category || 'Concerts');
    setFormType(evt.locationType || 'in_person');
    setFormVisibility(evt.visibility || 'public');
    const startIso = evt.startDate ? evt.startDate.split('T') : ['2026-11-20', '09:00'];
    setFormDate(startIso[0]);
    setFormTime(startIso[1]?.slice(0, 5) || '09:00');
    if (evt.endDate) {
      const endIso = evt.endDate.split('T');
      setFormEndDate(endIso[0]);
      setFormEndTime(endIso[1]?.slice(0, 5) || '18:00');
    } else {
      setFormEndDate('');
      setFormEndTime('');
    }
    setFormVenue(evt.venueName || '');
    setFormLocation(evt.venueAddress || '');
    setFormDescription(evt.description || '');
    setFormCoverImage(evt.coverImage || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80');
    setFormLogoImage(evt.logoImage || '');
    if (evt.ticketTiers && evt.ticketTiers.length > 0) {
      setFormTickets(
        evt.ticketTiers.map((t, idx) => ({
          id: t.id || `tier_${Date.now()}_${idx}`,
          name: t.name,
          price: t.price,
          capacity: t.capacity,
          limitPerPerson: 5,
          description: t.description || `${t.name} ticket entry`,
          perks: Array.isArray(t.perks) ? t.perks.join(', ') : '',
          isFree: t.type === 'free' || t.price === 0,
        }))
      );
    }
    goToPage('create-event');
  };

  // Quick submit draft event for administrator verification
  const handleSubmitForApproval = (evt: EventData) => {
    updateEvent(evt.id, { status: 'pending_approval' });
    showToastMsg(`Event "${evt.title}" submitted for administrator approval.`);
  };

  const handleToggleEventStatus = (evt: EventData) => {
    const nextStatus = evt.status === 'completed' ? 'published' : 'completed';
    updateEvent(evt.id, { status: nextStatus });
    showToastMsg(`Event "${evt.title}" marked as ${nextStatus === 'completed' ? 'Completed / Closed' : 'Published'}.`);
  };

  // Handle Event Form Submission (Both Create & Edit/Update)
  const handleSaveEventSubmit = (e: React.FormEvent, requestedStatus?: 'published' | 'draft' | 'pending_approval') => {
    e.preventDefault();
    if (!formName.trim()) {
      showToastMsg('Please enter an event name.', 'error');
      return;
    }

    if (formTickets.length === 0) {
      showToastMsg('Please add at least one ticket tier.', 'error');
      return;
    }

    for (let i = 0; i < formTickets.length; i++) {
      const t = formTickets[i];
      if (!t.name.trim()) {
        showToastMsg(`Ticket tier #${i + 1} must have a name.`, 'error');
        return;
      }
      if (Number(t.capacity) <= 0) {
        showToastMsg(`Ticket "${t.name}" must have a quantity of at least 1.`, 'error');
        return;
      }
    }

    const calculatedCapacity = formTickets.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
    const slug = formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Determine target status:
    // If saving as draft: 'draft'
    // If submitting for approval: 'pending_approval'
    // If existing event was already published and organizer edits it: keeps 'published' or sends update
    const targetStatus = requestedStatus || (editingEventId ? (organizerEvents.find(ev => ev.id === editingEventId)?.status === 'published' ? 'published' : 'pending_approval') : 'pending_approval');

    const eventPayload = {
      title: formName.trim(),
      slug,
      tagline: 'Exciting experience brought to you by ' + organization.name,
      description: formDescription,
      category: formCategory,
      startDate: new Date(`${formDate}T${formTime}`).toISOString(),
      endDate: formEndDate ? new Date(`${formEndDate}T${formEndTime || '18:00'}`).toISOString() : new Date(`${formDate}T18:00`).toISOString(),
      timezone: 'UTC+0',
      locationType: formType,
      venueName: formVenue || 'Accra Convention Center',
      venueAddress: formLocation || 'Accra',
      coverImage: formCoverImage,
      logoImage: formLogoImage || undefined,
      organizerId: currentUser?.id || 'user_organizer_01',
      organizationId: organization.id,
      status: targetStatus,
      totalCapacity: calculatedCapacity,
      currency: organization.currency || 'GHS',
      visibility: formVisibility,
      ticketTiers: formTickets.map((t, idx) => ({
        id: t.id.startsWith('tier_') ? t.id : `tier_${Date.now()}_${idx}`,
        name: t.name.trim(),
        price: t.isFree ? 0 : Math.max(0, Number(t.price) || 0),
        currency: organization.currency || 'USD',
        type: (t.isFree || Number(t.price) === 0 ? 'free' : 'paid') as any,
        capacity: Math.max(1, Number(t.capacity) || 1),
        soldCount: 0,
        description: t.description.trim() || `${t.name.trim()} ticket entry`,
        perks: t.perks
          ? t.perks.split(',').map((p) => p.trim()).filter(Boolean)
          : [`Access with ${t.name.trim()}`],
        salesEnd: new Date(`${formDate}T23:59:59`).toISOString(),
      })),
    };

    if (editingEventId) {
      updateEvent(editingEventId, eventPayload);
      showToastMsg(
        targetStatus === 'pending_approval'
          ? `Event "${formName}" updated and submitted for administrator approval.`
          : targetStatus === 'draft'
          ? `Draft event "${formName}" saved successfully.`
          : `Event "${formName}" updated successfully.`
      );
      setEditingEventId(null);
      goToPage('events');
    } else {
      const newId = createEvent({
        ...eventPayload,
        schedule: [],
        customFields: [],
        automatedReminders: { send24hReminder: true, send1hReminder: true, sendPostEventSurvey: true },
      });
      showToastMsg(
        targetStatus === 'pending_approval'
          ? `Event created and submitted for administrator approval before going live!`
          : `Event saved as draft with ${formTickets.length} ticket tier(s). You can edit anytime.`
      );
      setActiveEventId(newId);
      goToPage('events');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#26332C] font-sans">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <a href="#overview" onClick={(e) => { e.preventDefault(); goToPage('overview'); }} className="brand">
          <span className="brand-mark">◈</span>
          <span>
            <span className="brand-name">EventSphere</span>
            <span className="brand-subtitle">Organizer Workspace</span>
          </span>
        </a>

        <div className="sidebar-scroll">
          <p className="nav-label">Workspace</p>

          <button className={`side-link ${activePage === 'overview' ? 'active' : ''}`} onClick={() => goToPage('overview')}>
            <span className="side-icon">▦</span> Overview
          </button>
          <button className={`side-link ${activePage === 'events' ? 'active' : ''}`} onClick={() => goToPage('events')}>
            <span className="side-icon">▣</span> My Events
            <span className="nav-count">{organizerEvents.length}</span>
          </button>
          <button className={`side-link ${activePage === 'create-event' ? 'active' : ''}`} onClick={() => goToPage('create-event')}>
            <span className="side-icon">＋</span> Create Event
          </button>
          <button className={`side-link ${activePage === 'tickets' ? 'active' : ''}`} onClick={() => goToPage('tickets')}>
            <span className="side-icon">▤</span> Ticket Types
          </button>
          <button className={`side-link ${activePage === 'orders' ? 'active' : ''}`} onClick={() => goToPage('orders')}>
            <span className="side-icon">▧</span> Orders
          </button>
          <button className={`side-link ${activePage === 'attendees' ? 'active' : ''}`} onClick={() => goToPage('attendees')}>
            <span className="side-icon">♧</span> Attendees
          </button>

          <p className="nav-label">Event Operations</p>

          <button className={`side-link ${activePage === 'check-in' ? 'active' : ''}`} onClick={() => goToPage('check-in')}>
            <span className="side-icon">▦</span> QR Check-in
          </button>
          <button className={`side-link ${activePage === 'marketing' ? 'active' : ''}`} onClick={() => goToPage('marketing')}>
            <span className="side-icon">↗</span> Marketing
          </button>
          <button className={`side-link ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => goToPage('analytics')}>
            <span className="side-icon">▥</span> Analytics
          </button>

          <p className="nav-label">Finance</p>

          <button className={`side-link ${activePage === 'payouts' ? 'active' : ''}`} onClick={() => goToPage('payouts')}>
            <span className="side-icon">₵</span> Payouts &amp; Finance
          </button>

          <p className="nav-label">Management</p>

          <button className={`side-link ${activePage === 'team' ? 'active' : ''}`} onClick={() => goToPage('team')}>
            <span className="side-icon">♙</span> Team Members
          </button>
          <button className={`side-link ${activePage === 'messages' ? 'active' : ''}`} onClick={() => goToPage('messages')}>
            <span className="side-icon">✉</span> Messages
          </button>
          <button className={`side-link ${activePage === 'settings' ? 'active' : ''}`} onClick={() => goToPage('settings')}>
            <span className="side-icon">⚙</span> Settings
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="organizer-profile">
            <div className="avatar">{currentUser?.name?.charAt(0) || 'EO'}</div>
            <div>
              <strong>{organization.name}</strong>
              <span>{currentUser?.email || 'organizer'}</span>
            </div>
          </div>
          <button
            className="side-link"
            style={{ width: '100%', border: 0, background: 'white' }}
            onClick={logout}
          >
            <span className="side-icon">⇥</span> Log Out
          </button>
        </div>
      </aside>

      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* TOPBAR & MAIN APP */}
      <div className="app">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open dashboard navigation"
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>

            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  if (activePage !== 'events') goToPage('events');
                }}
                placeholder="Search events..."
                aria-label="Search dashboard"
              />
            </label>
          </div>

          <div className="topbar-right">
            <button
              className="icon-btn notification-button"
              onClick={() => showToastMsg('No new notifications')}
              aria-label="Notifications"
            >
              ♧ <span className="notification-dot"></span>
            </button>

            <div className="topbar-divider"></div>

            <button
              onClick={() => setCurrentView('home')}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Public Marketplace ↗
            </button>
          </div>
        </header>

        <main className="workspace">
          {/* OVERVIEW PAGE */}
          {activePage === 'overview' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>Good morning, {currentUser?.name || 'Organizer'} 👋</h1>
                  <p>Here's what's happening with your events today.</p>
                </div>
                <button className="btn btn-primary" onClick={() => goToPage('create-event')}>
                  ＋ Create New Event
                </button>
              </div>

              <div className="metrics-grid">
                <article className="panel metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Organizer Earnings</span>
                    <span className="metric-icon">₵</span>
                  </div>
                  <div className="metric-value">{formatCurrency(walletStats.netEarnings, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</div>
                  <p className="metric-footer"><span className="trend-up">↑ Live</span> <span>Total value of all ticket receipts (net)</span></p>
                </article>

                <article className="panel metric-card" style={{ borderLeft: '4px solid #176B45' }}>
                  <div className="metric-top">
                    <span className="metric-label">Withdrawable Balance</span>
                    <span className="metric-icon">✓</span>
                  </div>
                  <div className="metric-value" style={{ color: '#104A32' }}>{formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="metric-footer" style={{ margin: 0 }}>Available for payout</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ minHeight: '30px', padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      disabled={walletStats.withdrawableBalance <= 0}
                    >
                      Withdraw Funds →
                    </button>
                  </div>
                </article>

                <article className="panel metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Total Tickets Sold</span>
                    <span className="metric-icon">🎟</span>
                  </div>
                  <div className="metric-value">{totalAttendeesCount}</div>
                  <p className="metric-footer"><span className="trend-up">↑ Live</span> <span>Confirmed attendees</span></p>
                </article>

                <article className="panel metric-card">
                  <div className="metric-top">
                    <span className="metric-label">Active Events</span>
                    <span className="metric-icon">▣</span>
                  </div>
                  <div className="metric-value">{organizerEvents.length}</div>
                  <p className="metric-footer">Published &amp; live</p>
                </article>
              </div>

              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="section-title">Ticket Sales Overview</h2>
                      <p className="muted small">Live activity metrics</p>
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="chart-legend">
                      <span className="legend-item"><span className="legend-dot"></span> Tickets sold</span>
                    </div>
                    <div className="chart">
                      <div className="chart-y">
                        <span>200</span><span>150</span><span>100</span><span>50</span><span>0</span>
                      </div>
                      <div className="chart-main">
                        <div className="chart-grid" role="img" aria-label="Ticket sales bar chart">
                          <div className="chart-column"><span className="bar primary" style={{ height: '35%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '52%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '44%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '70%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '58%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '85%' }}></span></div>
                          <div className="chart-column"><span className="bar primary" style={{ height: '100%' }}></span></div>
                        </div>
                        <div className="chart-labels">
                          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="section-title">Quick Actions</h2>
                      <p className="muted small">Manage your workspace</p>
                    </div>
                  </div>
                  <div className="panel-body">
                    <div className="quick-actions">
                      <button className="quick-action" onClick={() => goToPage('create-event')}>
                        <span className="quick-action-icon">＋</span>
                        <strong>Create Event</strong>
                        <span>Publish an event</span>
                      </button>
                      <button className="quick-action" onClick={() => goToPage('tickets')}>
                        <span className="quick-action-icon">▤</span>
                        <strong>Manage Tickets</strong>
                        <span>Prices and inventory</span>
                      </button>
                      <button className="quick-action" onClick={() => goToPage('attendees')}>
                        <span className="quick-action-icon">♧</span>
                        <strong>View Attendees</strong>
                        <span>Guest list</span>
                      </button>
                      <button className="quick-action" onClick={() => goToPage('analytics')}>
                        <span className="quick-action-icon">▥</span>
                        <strong>View Reports</strong>
                        <span>Review performance</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="section-title">Your Events Repository</h2>
                    <p className="muted small">Manage your organization events</p>
                  </div>
                  <button className="btn btn-outline" onClick={() => goToPage('events')}>View All</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Date</th><th>Tickets Sold</th><th>Gross Sales</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {organizerEvents.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No events published yet. Click Create Event to begin!</td></tr>
                      ) : (
                        organizerEvents.slice(0, 4).map((evt) => (
                          <tr key={evt.id}>
                            <td>
                              <div className="event-table-name">
                                <img className="event-thumb" src={evt.coverImage} alt="" />
                                <div>
                                  <strong>{evt.title}</strong>
                                  <span>{evt.category} · {evt.venueName}</span>
                                </div>
                              </div>
                            </td>
                            <td>{new Date(evt.startDate).toLocaleDateString()}</td>
                            <td>{activeEventAttendees.filter((a) => a.eventId === evt.id).length}</td>
                            <td>{formatCurrency(walletStats.grossRevenue, evt.currency)}</td>
                            <td><span className="status status-live">{evt.status.toUpperCase()}</span></td>
                            <td>
                              <button
                                className="table-action"
                                onClick={() => { setActiveEventId(evt.id); goToPage('events'); }}
                              >
                                Select &amp; Manage
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* MY EVENTS PAGE */}
          {activePage === 'events' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>My Events</h1><p>Create, manage and monitor your events.</p></div>
                <button className="btn btn-primary" onClick={() => { handleStartNewEvent(); goToPage('create-event'); }}>＋ Create Event</button>
              </div>

              <div className="toolbar">
                <div className="toolbar-left">
                  <label className="search-box" style={{ width: '250px' }}>
                    <span>⌕</span>
                    <input
                      type="search"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search events..."
                    />
                  </label>
                  <select
                    className="filter-select"
                    value={eventStatusFilter}
                    onChange={(e) => setEventStatusFilter(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="">All statuses</option>
                    <option value="published">Published (Live)</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="draft">Drafts</option>
                  </select>
                </div>
                <div className="toolbar-right"><span className="muted small">{filteredEvents.length} event(s)</span></div>
              </div>

              <section className="panel">
                <div className="panel-header"><h2 className="section-title">Active Events</h2></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Sold</th>
                        <th>Gross Sales</th>
                        <th>Platform Cut</th>
                        <th>Net Earnings</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.filter(e => e.status !== 'completed').length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>No active events found.</td></tr>
                      ) : (
                        filteredEvents.filter(e => e.status !== 'completed').map((evt) => {
                          const evAttendees = attendees.filter((a) => a.eventId === evt.id && a.paymentStatus === 'paid');
                          const soldCount = attendees.filter((a) => a.eventId === evt.id).length;
                          const gross = evAttendees.reduce((sum, a) => sum + a.amountPaid, 0);
                          const commissionRate = organization.platformCommissionRate ?? 18;
                          const commission = evAttendees.reduce((sum, a) => sum + (a.platformCommission ?? a.amountPaid * (commissionRate / 100)), 0);
                          const net = evAttendees.reduce((sum, a) => sum + (a.organizerEarnings ?? (a.amountPaid - (a.platformCommission ?? a.amountPaid * (commissionRate / 100)))), 0);

                          return (
                            <tr key={evt.id}>
                              <td>
                                <div className="event-table-name">
                                  <img className="event-thumb" src={evt.coverImage} alt="" />
                                  <div>
                                    <strong>{evt.title}</strong>
                                    <span>{evt.category} · {evt.venueName}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{new Date(evt.startDate).toLocaleDateString()}</td>
                              <td><strong>{soldCount}</strong></td>
                              <td>{formatCurrency(gross, evt.currency)}</td>
                              <td style={{ color: '#047857' }}>-{formatCurrency(commission, evt.currency)}</td>
                              <td><strong style={{ color: '#104A32' }}>{formatCurrency(net, evt.currency)}</strong></td>
                              <td>
                                {evt.status === 'published' ? (
                                  <span className="status status-live">● PUBLISHED</span>
                                ) : evt.status === 'pending_approval' ? (
                                  <span className="status" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                    ⏳ PENDING
                                  </span>
                                ) : evt.status === 'draft' ? (
                                  <span className="status" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                                    ✎ DRAFT
                                  </span>
                                ) : (
                                  <span className="status" style={{ background: '#FFE4E6', color: '#9F1239' }}>
                                    {evt.status.toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <button type="button" className="table-action" onClick={() => handleStartEditEvent(evt)} style={{ color: '#0369A1', fontWeight: 700 }} title="Edit event details">✎ Edit</button>
                                  {evt.status === 'draft' && (
                                    <button type="button" className="table-action" onClick={() => handleSubmitForApproval(evt)} style={{ color: '#D97706', fontWeight: 700 }}>Submit</button>
                                  )}
                                  <button type="button" className="table-action" onClick={() => handleToggleEventStatus(evt)} style={{ color: '#475569', fontWeight: 700 }} title="Mark event completed">Complete</button>
                                  <button type="button" className="table-action" onClick={() => { setActiveEventId(evt.id); setCurrentView('public_event'); }} style={{ color: '#475569' }}>Preview</button>
                                  <button type="button" className="table-action" onClick={() => deleteEvent(evt.id)} style={{ color: '#DC2626' }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel">
                <div className="panel-header"><h2 className="section-title">Past Events Archive</h2></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Sold</th>
                        <th>Gross Sales</th>
                        <th>Net Earnings</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.filter(e => e.status === 'completed').length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No past events.</td></tr>
                      ) : (
                        filteredEvents.filter(e => e.status === 'completed').map((evt) => {
                          const evAttendees = attendees.filter((a) => a.eventId === evt.id && a.paymentStatus === 'paid');
                          const soldCount = attendees.filter((a) => a.eventId === evt.id).length;
                          const gross = evAttendees.reduce((sum, a) => sum + a.amountPaid, 0);
                          const net = evAttendees.reduce((sum, a) => sum + (a.organizerEarnings ?? (a.amountPaid - (a.platformCommission ?? a.amountPaid * 0.18))), 0);

                          return (
                            <tr key={evt.id}>
                              <td><strong>{evt.title}</strong></td>
                              <td>{new Date(evt.startDate).toLocaleDateString()}</td>
                              <td>{soldCount}</td>
                              <td>{formatCurrency(gross, evt.currency)}</td>
                              <td>{formatCurrency(net, evt.currency)}</td>
                              <td><span className="status" style={{ background: '#E2E8F0', color: '#334155', border: '1px solid #CBD5E1' }}>✓ COMPLETED</span></td>
                              <td>
                                <button type="button" className="table-action" onClick={() => handleToggleEventStatus(evt)} style={{ color: '#059669', fontWeight: 700 }}>Reopen</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* CREATE / EDIT EVENT PAGE */}
          {activePage === 'create-event' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>{editingEventId ? 'Edit Event' : 'Create an Event'}</h1>
                  <p>{editingEventId ? 'Modify your event details, schedule and ticket pricing tiers.' : 'Enter your event information and ticket details.'}</p>
                </div>
                <button className="btn btn-outline" onClick={() => goToPage('events')}>← Back to Events</button>
              </div>

              <form onSubmit={(e) => handleSaveEventSubmit(e, editingEventId ? (organizerEvents.find(ev => ev.id === editingEventId)?.status === 'published' ? 'published' : 'pending_approval') : 'pending_approval')}>
                <div className="editor-layout">
                  <div>
                    <section className="panel editor-panel">
                      <h3>1. Basic Information</h3>
                      <div className="field">
                        <label>Event Name *</label>
                        <input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                          placeholder="e.g. Accra Music Festival"
                        />
                      </div>
                      <div className="form-grid">
                        <div className="field">
                          <label>Category *</label>
                          <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                            <option>Concerts</option><option>Festivals</option><option>Conferences</option>
                            <option>Sports</option><option>Weddings</option><option>Parties</option>
                            <option>Business</option><option>Church Events</option><option>School Events</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Event Format *</label>
                          <select value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                            <option value="in_person">In person</option>
                            <option value="virtual">Online</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Event Visibility *</label>
                          <select value={formVisibility} onChange={(e) => setFormVisibility(e.target.value as any)}>
                            <option value="public">Public (Show on Home Page)</option>
                            <option value="private">Private (Hidden from Home Page)</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Event Date *</label>
                          <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                        <div className="field">
                          <label>Start Time *</label>
                          <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
                        </div>
                      </div>
                      <div className="field">
                        <label>Event Description *</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          required
                          placeholder="Describe the event..."
                        ></textarea>
                      </div>
                    </section>

                    <section className="panel editor-panel">
                      <h3>2. Venue and Location</h3>
                      <div className="field">
                        <label>Venue Name</label>
                        <input value={formVenue} onChange={(e) => setFormVenue(e.target.value)} placeholder="Venue name" />
                      </div>
                      <div className="field">
                        <label>City / Address</label>
                        <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="City" />
                      </div>
                    </section>

                    <section className="panel editor-panel">
                      <h3>3. Event Banner &amp; Logo Upload</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="upload-area">
                          {formCoverImage && (
                            <img src={formCoverImage} alt="Banner Preview" className="preview-cover" />
                          )}
                          <strong>Event Banner (Cover Image)</strong>
                          <p>Upload JPG, PNG or WebP banner (max 5MB)</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setFormCoverImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>

                        <div className="upload-area">
                          {formLogoImage && (
                            <img src={formLogoImage} alt="Logo Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 10px' }} />
                          )}
                          <strong>Event Logo</strong>
                          <p>Upload square logo (JPG/PNG)</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setFormLogoImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="panel editor-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>4. Ticket Information &amp; Tiers</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#77847C' }}>
                            Create two or more tickets (e.g. General, VIP, Early Bird, Student, Table) with custom prices and allocations.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, background: '#E4F3E9', color: '#104A32', padding: '4px 10px', borderRadius: '100px' }}>
                            {formTickets.length} {formTickets.length === 1 ? 'Tier' : 'Tiers'} Configured
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddTicket('custom')}
                            className="btn btn-primary"
                            style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
                          >
                            ＋ Add Another Ticket
                          </button>
                        </div>
                      </div>

                      {/* Quick Preset Buttons */}
                      <div style={{ background: '#F8FAF8', border: '1px solid #E6EBE7', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#19251F' }}>
                            ⚡ Quick Add Preset Tickets:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleAddTicket('vip')}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '11px', padding: '0 10px', background: 'white' }}
                            >
                              ＋ VIP Tier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddTicket('early')}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '11px', padding: '0 10px', background: 'white' }}
                            >
                              ＋ Early Bird
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddTicket('free')}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '11px', padding: '0 10px', background: 'white' }}
                            >
                              ＋ Free Community Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddTicket('table')}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '11px', padding: '0 10px', background: 'white' }}
                            >
                              ＋ Group / Table
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Tiers List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {formTickets.map((tier, index) => (
                          <div
                            key={tier.id}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8E3',
                              borderRadius: '12px',
                              padding: '16px',
                              boxShadow: '0 2px 6px rgba(16, 74, 50, 0.03)',
                              position: 'relative',
                            }}
                          >
                            {/* Card Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: '12px',
                                marginBottom: '14px',
                                borderBottom: '1px solid #F0F4F1',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#104A32',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                  }}
                                >
                                  {index + 1}
                                </span>
                                <strong style={{ fontSize: '14px', color: '#104A32' }}>
                                  {tier.name || `Ticket #${index + 1}`}
                                </strong>
                                {tier.isFree ? (
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: '100px' }}>
                                    FREE PASS
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '2px 8px', borderRadius: '100px' }}>
                                    PAID TIER
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateTicket(tier.id)}
                                  className="btn btn-outline"
                                  style={{ height: '30px', fontSize: '11px', padding: '0 9px' }}
                                  title="Duplicate this ticket tier"
                                >
                                  📋 Duplicate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTicket(tier.id)}
                                  disabled={formTickets.length <= 1}
                                  className="btn btn-outline"
                                  style={{
                                    height: '30px',
                                    fontSize: '11px',
                                    padding: '0 9px',
                                    color: formTickets.length <= 1 ? '#9CA3AF' : '#DC2626',
                                    borderColor: formTickets.length <= 1 ? '#E5E7EB' : '#FCA5A5',
                                    background: formTickets.length <= 1 ? '#F9FAFB' : '#FEF2F2',
                                    cursor: formTickets.length <= 1 ? 'not-allowed' : 'pointer',
                                  }}
                                  title={formTickets.length <= 1 ? 'You must have at least one ticket tier' : 'Delete this ticket tier'}
                                >
                                  🗑 Remove
                                </button>
                              </div>
                            </div>

                            {/* Card Grid */}
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                              <div className="field">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Ticket Name *</span>
                                  <span style={{ fontSize: '11px', color: '#77847C' }}>e.g. Early Bird, VIP</span>
                                </label>
                                <input
                                  value={tier.name}
                                  onChange={(e) => handleUpdateTicket(tier.id, { name: e.target.value })}
                                  placeholder="e.g. VIP Access Pass"
                                  required
                                />
                              </div>

                              <div className="field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <label style={{ margin: 0 }}>Price ({organization.currency || 'USD'}) *</label>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTicket(tier.id, { isFree: !tier.isFree })}
                                    style={{
                                      border: 'none',
                                      background: tier.isFree ? '#218653' : '#E6EBE7',
                                      color: tier.isFree ? '#FFFFFF' : '#49574E',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '100px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {tier.isFree ? '✓ Free Ticket' : 'Make Free'}
                                  </button>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  disabled={tier.isFree}
                                  value={tier.isFree ? 0 : tier.price}
                                  onChange={(e) => handleUpdateTicket(tier.id, { price: Number(e.target.value) })}
                                  placeholder="0.00"
                                  required
                                  style={{
                                    background: tier.isFree ? '#F4F7F4' : '#FFFFFF',
                                    cursor: tier.isFree ? 'not-allowed' : 'text',
                                  }}
                                />
                              </div>

                              <div className="field">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Quantity Available *</span>
                                  <span style={{ fontSize: '11px', color: '#77847C' }}>Capacity</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={tier.capacity}
                                  onChange={(e) => handleUpdateTicket(tier.id, { capacity: Math.max(1, parseInt(e.target.value) || 1) })}
                                  required
                                />
                              </div>

                              <div className="field">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Max per Order</span>
                                  <span style={{ fontSize: '11px', color: '#77847C' }}>Limit/buyer</span>
                                </label>
                                <select
                                  value={tier.limitPerPerson}
                                  onChange={(e) => handleUpdateTicket(tier.id, { limitPerPerson: parseInt(e.target.value) || 4 })}
                                >
                                  <option value={1}>1 ticket</option>
                                  <option value={2}>2 tickets</option>
                                  <option value={4}>4 tickets</option>
                                  <option value={5}>5 tickets</option>
                                  <option value={8}>8 tickets</option>
                                  <option value={10}>10 tickets</option>
                                </select>
                              </div>
                            </div>

                            {/* Perks & Description */}
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                              <div className="field">
                                <label>Perks / Highlights (Comma separated)</label>
                                <input
                                  value={tier.perks}
                                  onChange={(e) => handleUpdateTicket(tier.id, { perks: e.target.value })}
                                  placeholder="e.g. VIP Lounge, Fast-track entry, Welcome drink"
                                />
                              </div>
                              <div className="field">
                                <label>Ticket Description</label>
                                <input
                                  value={tier.description}
                                  onChange={(e) => handleUpdateTicket(tier.id, { description: e.target.value })}
                                  placeholder="Short note on what this ticket tier offers"
                                />
                              </div>
                            </div>

                            {/* Subtotal metrics footer */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '12px',
                                paddingTop: '10px',
                                borderTop: '1px dashed #E6EBE7',
                                fontSize: '11px',
                                color: '#77847C',
                              }}
                            >
                              <span>
                                Potential tier gross: <strong>{tier.isFree ? 'Free ($0)' : formatCurrency(tier.price * tier.capacity, organization.currency || 'USD')}</strong>
                              </span>
                              <span>
                                {tier.capacity} tickets @ {tier.isFree ? 'Free' : formatCurrency(tier.price, organization.currency || 'USD')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Add Ticket Action & Summary Bar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '20px',
                          padding: '14px 18px',
                          background: '#EBF4EE',
                          border: '1px solid #D1E5D8',
                          borderRadius: '12px',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#104A32', fontSize: '13px', display: 'block' }}>
                            Summary: {formTickets.length} Ticket Tiers · {totalFormCapacity.toLocaleString()} Total Tickets
                          </strong>
                          <span style={{ fontSize: '11px', color: '#49574E' }}>
                            Range: {minTicketPrice === maxTicketPrice ? (minTicketPrice === 0 ? 'Free' : formatCurrency(minTicketPrice, organization.currency || 'USD')) : `${minTicketPrice === 0 ? 'Free' : formatCurrency(minTicketPrice, organization.currency || 'USD')} - ${formatCurrency(maxTicketPrice, organization.currency || 'USD')}`} · Potential Revenue: {formatCurrency(totalEstimatedGross, organization.currency || 'USD')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTicket('custom')}
                          className="btn btn-primary"
                          style={{ gap: '8px' }}
                        >
                          ＋ Add Another Ticket
                        </button>
                      </div>
                    </section>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={(e) => handleSaveEventSubmit(e, 'draft')}
                      >
                        {editingEventId ? 'Save Changes as Draft' : 'Save as Draft'}
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingEventId
                          ? (organizerEvents.find(ev => ev.id === editingEventId)?.status === 'published' ? 'Update Published Event →' : 'Submit for Admin Approval →')
                          : 'Submit for Admin Approval →'}
                      </button>
                    </div>
                  </div>

                  <aside className="panel editor-preview">
                    <img src={formCoverImage} alt="Event preview" />
                    <div className="preview-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="status status-live">Live Preview</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#176B45', background: '#E4F3E9', padding: '2px 8px', borderRadius: '6px' }}>
                          {formTickets.length} {formTickets.length === 1 ? 'Ticket Tier' : 'Ticket Tiers'}
                        </span>
                      </div>
                      <h3>{formName || 'Your Event Name'}</h3>
                      <p>📅 {formDate || 'Date TBD'} · ⏰ {formTime || '09:00'}</p>
                      <p>📍 {formVenue || formLocation || 'Venue TBD'}</p>

                      <div style={{ marginTop: '12px', borderTop: '1px solid #E6EBE7', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#19251F' }}>Tickets on Sale:</span>
                          <strong style={{ color: '#176B45', fontSize: '14px' }}>
                            {minTicketPrice === maxTicketPrice
                              ? (minTicketPrice === 0 ? 'Free' : formatCurrency(minTicketPrice, organization.currency || 'USD'))
                              : `${minTicketPrice === 0 ? 'Free' : formatCurrency(minTicketPrice, organization.currency || 'USD')} - ${formatCurrency(maxTicketPrice, organization.currency || 'USD')}`}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                          {formTickets.map((tier, idx) => (
                            <div
                              key={tier.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 10px',
                                background: '#F8FAF8',
                                border: '1px solid #E4EAE5',
                                borderRadius: '7px',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong style={{ color: '#104A32', display: 'block' }}>{tier.name || `Ticket #${idx + 1}`}</strong>
                                <span style={{ display: 'block', fontSize: '10px', color: '#77847C' }}>
                                  {tier.capacity} available · max {tier.limitPerPerson}/person
                                </span>
                              </div>
                              <span style={{ fontWeight: 800, color: tier.isFree || tier.price === 0 ? '#218653' : '#104A32', whiteSpace: 'nowrap' }}>
                                {tier.isFree || tier.price === 0 ? 'FREE' : formatCurrency(tier.price, organization.currency || 'USD')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#77847C', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #E4EAE5' }}>
                          <span>Total Capacity: <strong>{totalFormCapacity.toLocaleString()} tickets</strong></span>
                          <span>Est. Gross: <strong>{formatCurrency(totalEstimatedGross, organization.currency || 'USD')}</strong></span>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </form>
            </div>
          )}

          {/* TICKET TYPES PAGE */}
          {activePage === 'tickets' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Ticket Types</h1><p>Review ticket allocations and prices for your events.</p></div>
                <button className="btn btn-primary" onClick={() => goToPage('create-event')}>＋ New Event</button>
              </div>

              <div className="finance-grid">
                <article className="panel finance-card"><span>Total Allocation</span><strong>{totalCapacity}</strong><p>Total capacity</p></article>
                <article className="panel finance-card"><span>Tickets Sold</span><strong>{totalAttendeesCount}</strong><p>Confirmed sales</p></article>
                <article className="panel finance-card"><span>Remaining</span><strong>{Math.max(0, totalCapacity - totalAttendeesCount)}</strong><p>Available inventory</p></article>
              </div>

              <section className="panel">
                <div className="panel-header"><h2 className="section-title">Ticket Inventory</h2></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Ticket Type</th><th>Event</th><th>Price</th><th>Sold</th><th>Allocation</th><th>Availability</th></tr></thead>
                    <tbody>
                      {organizerEvents.map((evt) =>
                        evt.ticketTiers.map((tier) => (
                          <tr key={tier.id}>
                            <td><strong>{tier.name}</strong></td>
                            <td>{evt.title}</td>
                            <td>{formatCurrency(tier.price, evt.currency)}</td>
                            <td>{tier.soldCount}</td>
                            <td>{tier.capacity}</td>
                            <td><span className="status status-live">On sale</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ORDERS & RECEIPTS PAGE */}
          {activePage === 'orders' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>Sales Receipts &amp; Orders</h1>
                  <p>View every ticket purchase transaction, upfront commission deduction, and download official receipts.</p>
                </div>
                <button className="btn btn-outline" onClick={exportReceiptsCSV}>
                  ↓ Export Receipts CSV
                </button>
              </div>

              {/* Policy explanation banner */}
              <div style={{ background: '#F2F9F4', border: '1px solid #CDE7D5', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#176B45', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                    ✓
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#104A32', fontSize: '13px' }}>
                      Upfront Monetary Separation Active
                    </strong>
                    <span style={{ color: '#218653', fontSize: '11px' }}>
                      Platform commission is deducted immediately at checkout. The net balance left in your account is 100% withdrawable with no second fee.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ minHeight: '34px', padding: '6px 14px', fontSize: '11px' }}
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  disabled={walletStats.withdrawableBalance <= 0}
                >
                  Withdraw Available ({formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}) →
                </button>
              </div>

              <div className="toolbar">
                <label className="search-box" style={{ width: '320px' }}>
                  <span>⌕</span>
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search buyer (e.g. Kwame), receipt #, or tier..."
                  />
                </label>
              </div>

              <section className="panel">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Buyer &amp; Method</th>
                        <th>Event &amp; Ticket</th>
                        <th>1. Actual Paid</th>
                        <th>2. Platform Fee</th>
                        <th>3. Amount Left (Net)</th>
                        <th>Status</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const q = orderSearch.toLowerCase().trim();
                        const filtered = allMyAttendees.filter((att) => {
                          if (att.paymentStatus !== 'paid') return false;
                          if (!q) return true;
                          return (
                            att.fullName.toLowerCase().includes(q) ||
                            att.email.toLowerCase().includes(q) ||
                            (att.paymentReference && att.paymentReference.toLowerCase().includes(q)) ||
                            att.ticketCode.toLowerCase().includes(q) ||
                            att.ticketTierName.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                                <p style={{ margin: 0, fontWeight: '700', color: '#19251F' }}>No receipts found.</p>
                                <span style={{ color: '#77847C', fontSize: '12px' }}>Paid ticket purchases will appear here with full monetary separation.</span>
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((att) => {
                          const rate = att.commissionRate ?? organization.platformCommissionRate ?? 18;
                          const commFee = att.platformCommission ?? Math.round(att.amountPaid * (rate / 100) * 100) / 100;
                          const netLeft = att.organizerEarnings ?? Math.round((att.amountPaid - commFee) * 100) / 100;
                          const receiptNum = att.paymentReference || `REC-${att.id.slice(-6).toUpperCase()}`;
                          const eventObj = organizerEvents.find((e) => e.id === att.eventId) || activeOrganizerEvent;

                          return (
                            <tr key={att.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReceiptAttendee(att)}>
                              <td>
                                <strong style={{ color: '#176B45', fontSize: '12px' }}>{receiptNum}</strong>
                                <span style={{ display: 'block', fontSize: '10px', color: '#77847C' }}>
                                  {new Date(att.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td>
                                <strong style={{ display: 'block', color: '#19251F' }}>{att.fullName}</strong>
                                <span style={{ display: 'block', fontSize: '11px', color: '#77847C' }}>{att.email}</span>
                                <span style={{ fontSize: '10px', color: '#176B45', fontWeight: '600' }}>
                                  {att.paymentChannel === 'mobile_money' ? '📱 Mobile Money' : '💳 Paystack Card'}
                                </span>
                              </td>
                              <td>
                                <strong style={{ display: 'block', color: '#19251F' }}>{eventObj?.title || 'Event'}</strong>
                                <span style={{ fontSize: '11px', color: '#77847C' }}>{att.ticketTierName}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#19251F', fontSize: '13px' }}>
                                  {formatCurrency(att.amountPaid, att.currency)}
                                </strong>
                              </td>
                              <td>
                                <span style={{ color: '#C48732', fontWeight: '700', fontSize: '12px' }}>
                                  -{formatCurrency(commFee, att.currency)}
                                </span>
                                <span style={{ display: 'block', fontSize: '10px', color: '#99691E' }}>
                                  ({rate}% platform)
                                </span>
                              </td>
                              <td>
                                <strong style={{ color: '#104A32', fontSize: '14px', fontWeight: '800' }}>
                                  {formatCurrency(netLeft, att.currency)}
                                </strong>
                                <span style={{ display: 'block', fontSize: '10px', color: '#218653' }}>
                                  ✓ In your balance
                                </span>
                              </td>
                              <td>
                                <span className="status status-live">Settled</span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '11px', minHeight: '30px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReceiptAttendee(att);
                                  }}
                                >
                                  🧾 View Receipt
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ATTENDEES PAGE */}
          {activePage === 'attendees' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Attendees</h1><p>View guest list and check-in records.</p></div>
                <button className="btn btn-outline" onClick={exportAttendeesCSV}>↓ Export CSV</button>
              </div>

              <div className="toolbar">
                <label className="search-box" style={{ width: '270px' }}>
                  <span>⌕</span>
                  <input
                    type="search"
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    placeholder="Search attendee..."
                  />
                </label>
                <button className="btn btn-outline" onClick={() => goToPage('check-in')}>Open Check-in →</button>
              </div>

              <section className="panel">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Attendee</th><th>Ticket Reference</th><th>Event</th><th>Check-in</th></tr></thead>
                    <tbody>
                      {activeEventAttendees.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No attendees registered yet.</td></tr>
                      ) : (
                        activeEventAttendees.map((att) => (
                          <tr key={att.id}>
                            <td><strong>{att.fullName}</strong></td>
                            <td>{att.ticketCode}</td>
                            <td>{activeOrganizerEvent?.title || 'Event'}</td>
                            <td>
                              <span className={`status ${att.checkedIn ? 'status-live' : 'status-pending'}`}>
                                {att.checkedIn ? 'Checked in' : 'Not checked in'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* QR CHECK-IN PAGE */}
          {activePage === 'check-in' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>QR Check-in &amp; Gate Scanner</h1>
                  <p>Live event entry management, optical camera scanner, and attendee validation.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('scanner')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>⛶</span> Open Dedicated Full-Screen Scanner →
                </button>
              </div>

              <div className="checkin-layout">
                <section className="scanner-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0 }}>Ticket Scanner</h2>
                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 'bold' }}>● CAMERA ACTIVE</span>
                  </div>
                  <p style={{ color: '#DCEADF', fontSize: '12px', marginTop: '2px', marginBottom: '14px' }}>
                    Point camera at attendee badge or enter ticket code below to validate entry for <strong>{activeOrganizerEvent?.title || 'Active Event'}</strong>.
                  </p>

                  {/* Real Optical Camera Scanner Reader Container */}
                  <div
                    id="organizer-qr-reader"
                    style={{
                      width: '100%',
                      minHeight: '260px',
                      background: '#0F172A',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      position: 'relative',
                    }}
                  />

                  {/* Manual Code Entry Form */}
                  <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Or enter ticket code manually (e.g. TKT-9421-VIP)..."
                      value={manualTicketCode}
                      onChange={(e) => setManualTicketCode(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#1E293B',
                        border: '1px solid #334155',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      Verify Pass
                    </button>
                  </form>

                  {/* Scan Result Feedback Banner */}
                  {lastCheckInResult && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginTop: '10px',
                        background: lastCheckInResult.success ? '#ECFDF5' : '#FEF2F2',
                        color: lastCheckInResult.success ? '#065F46' : '#991B1B',
                        border: `1px solid ${lastCheckInResult.success ? '#A7F3D0' : '#FECACA'}`,
                      }}
                    >
                      <strong>{lastCheckInResult.success ? '✓ ACCESS GRANTED' : '⚠ VERIFICATION FAILED'}:</strong> {lastCheckInResult.message}
                      {lastCheckInResult.attendee && (
                        <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.9 }}>
                          Attendee: <strong>{lastCheckInResult.attendee.fullName}</strong> · Tier: <strong>{lastCheckInResult.attendee.ticketTierName}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick test check-ins */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>
                      Quick Check-in Test (Registered Attendees):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {activeEventAttendees.slice(0, 4).map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => {
                            const res = checkInTicket(att.ticketCode, currentUser?.name || 'Organizer');
                            setLastCheckInResult(res);
                            if (res.success) showToastMsg(`✓ Checked in: ${att.fullName}`);
                            else showToastMsg(res.message, 'error');
                          }}
                          style={{
                            background: att.checkedIn ? '#065F46' : '#1E293B',
                            color: '#fff',
                            border: '1px solid #334155',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          {att.checkedIn ? '✓ ' : ''}{att.fullName.split(' ')[0]} ({att.ticketCode})
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <div>
                  <section className="panel" style={{ marginBottom: '18px' }}>
                    <div className="panel-header"><h2 className="section-title">Attendance Summary</h2></div>
                    <div className="panel-body">
                      <div className="checkin-stat"><strong>{checkedInCount}</strong><span>Check-ins recorded</span></div>
                      <div className="progress"><span style={{ width: `${turnoutPercent}%` }}></span></div>
                      <p className="muted small">{turnoutPercent}% turnout rate of {totalAttendeesCount} registered.</p>
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <h2 className="section-title">Recent Gate Activity</h2>
                    </div>
                    <div className="panel-body">
                      {activeEventAttendees.filter((a) => a.checkedIn).length === 0 ? (
                        <p className="muted small" style={{ margin: 0 }}>No attendees checked in yet today.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {activeEventAttendees
                            .filter((a) => a.checkedIn)
                            .slice(0, 5)
                            .map((a) => (
                              <div
                                key={a.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  padding: '8px',
                                  background: '#F8FAF8',
                                  borderRadius: '6px',
                                  border: '1px solid #E6EBE7',
                                }}
                              >
                                <div>
                                  <strong style={{ color: '#104A32' }}>{a.fullName}</strong>
                                  <span style={{ color: '#77847C', display: 'block', fontSize: '11px' }}>{a.ticketTierName} · {a.ticketCode}</span>
                                </div>
                                <span style={{ color: '#176B45', fontWeight: 600, fontSize: '11px' }}>
                                  {a.checkedInAt ? new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* MARKETING PAGE */}
          {activePage === 'marketing' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Marketing</h1><p>Prepare campaigns to promote your events.</p></div>
              </div>
              <section className="panel">
                <div className="panel-header"><h2 className="section-title">Event Sharing Link</h2></div>
                <div className="panel-body">
                  <div className="field">
                    <label>Public Event URL</label>
                    <input
                      readOnly
                      value={activeOrganizerEvent ? `${window.location.origin}/?event=${activeOrganizerEvent.id}` : 'Select an active event'}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => showToastMsg('Event link copied!')}>Copy Share Link</button>
                </div>
              </section>
            </div>
          )}

          {/* ANALYTICS PAGE */}
          {activePage === 'analytics' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Analytics &amp; Reports</h1><p>Review ticket sales and event performance.</p></div>
              </div>

              <div className="metrics-grid">
                <article className="panel metric-card"><span className="metric-label">Gross Sales</span><div className="metric-value" style={{ marginTop: '15px' }}>{formatCurrency(walletStats.grossRevenue, activeOrganizerEvent?.currency || organization.currency || 'USD')}</div></article>
                <article className="panel metric-card"><span className="metric-label">Tickets Sold</span><div className="metric-value" style={{ marginTop: '15px' }}>{totalAttendeesCount}</div></article>
                <article className="panel metric-card"><span className="metric-label">Check-in Rate</span><div className="metric-value" style={{ marginTop: '15px' }}>{turnoutPercent}%</div></article>
              </div>
            </div>
          )}

          {/* PAYOUTS & FINANCE PAGE */}
          {activePage === 'payouts' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>Payouts &amp; Finance</h1>
                  <p>Track your withdrawable ticket earnings and disbursement history.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  disabled={walletStats.withdrawableBalance <= 0}
                >
                  Withdraw Available Funds ({formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}) →
                </button>
              </div>

              <div className="payout-notice">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong>Instant Settlement &amp; Withdrawable Earnings</strong>
                    <p className="small" style={{ marginTop: '5px' }}>
                      All ticket receipts automatically deduct platform fees upfront. The balance shown below is 100% yours and ready for withdrawal to Mobile Money or Bank.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => goToPage('orders')}
                  >
                    🧾 View All Transaction Receipts →
                  </button>
                </div>
              </div>

              <div className="finance-grid">
                <article className="panel finance-card">
                  <span>Organizer Total Earnings</span>
                  <strong>{formatCurrency(walletStats.netEarnings, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#77847C' }}>Net total value of all receipts (excl. platform fee)</p>
                </article>

                <article className="panel finance-card">
                  <span>Total Withdrawn / Disbursed</span>
                  <strong>{formatCurrency(walletStats.totalWithdrawn, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</strong>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#77847C' }}>Successfully sent to your account</p>
                </article>

                <article className="panel finance-card" style={{ borderLeft: '4px solid #176B45' }}>
                  <span>Withdrawable Balance</span>
                  <strong style={{ color: '#104A32' }}>{formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</strong>
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', minHeight: '34px', fontSize: '11px' }}
                      onClick={() => setIsWithdrawalModalOpen(true)}
                      disabled={walletStats.withdrawableBalance <= 0}
                    >
                      Withdraw Funds →
                    </button>
                  </div>
                </article>
              </div>

              {/* Payout Requests History */}
              <section className="panel" style={{ marginTop: '24px' }}>
                <div className="panel-header">
                  <div>
                    <h2 className="section-title">Withdrawal Payout History</h2>
                    <p className="muted small">Record of all disbursement requests and settlement transfers</p>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Requested Date</th>
                        <th>Destination Account</th>
                        <th>Amount</th>
                        <th>Fee on Payout</th>
                        <th>Net Received</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ margin: 0, fontWeight: '700', color: '#19251F' }}>No withdrawal requests yet.</p>
                            <span style={{ color: '#77847C', fontSize: '12px' }}>When you request a payout, status and tracking reference will display here.</span>
                          </td>
                        </tr>
                      ) : (
                        withdrawalRequests.map((req) => (
                          <tr key={req.id}>
                            <td>
                              <strong style={{ color: '#176B45' }}>{req.reference}</strong>
                            </td>
                            <td>{new Date(req.requestedAt).toLocaleDateString()}</td>
                            <td>
                              <strong>{req.bankAccount.bankName}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: '#77847C' }}>
                                {req.bankAccount.accountNumber} ({req.bankAccount.accountName})
                              </span>
                            </td>
                            <td>
                              <strong>{formatCurrency(req.amount, req.currency)}</strong>
                            </td>
                            <td>
                              <span style={{ color: '#176B45', fontWeight: '700' }}>GH₵ 0.00</span>
                              <span style={{ display: 'block', fontSize: '10px', color: '#77847C' }}>(Fee deducted at sale)</span>
                            </td>
                            <td>
                              <strong style={{ color: '#104A32', fontSize: '13px' }}>
                                {formatCurrency(req.netPayoutAmount, req.currency)}
                              </strong>
                            </td>
                            <td>
                              <span className={`status ${req.status === 'completed' ? 'status-live' : req.status === 'processing' ? 'status-pending' : 'status-draft'}`}>
                                {req.status === 'completed' ? 'Completed' : req.status === 'processing' ? 'Processing' : 'Pending Review'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TEAM PAGE */}
          {activePage === 'team' && (
            <div className="page active">
              <div className="page-heading">
                <div>
                  <h1>Team Members &amp; Staff Permissions</h1>
                  <p>Invite gate scanners, coordinators, and check-in staff to operate with authorized event credentials.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsInviteModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>＋</span> Invite New Team Member
                </button>
              </div>

              <section className="panel">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Email Address</th>
                        <th>Assigned Role</th>
                        <th>Granted Permissions</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: member.role === 'Owner' ? '#104A32' : '#F1F5F9',
                                  color: member.role === 'Owner' ? '#fff' : '#102A43',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <strong>{member.name}</strong>
                            </div>
                          </td>
                          <td style={{ color: '#526579', fontFamily: 'monospace', fontSize: '12px' }}>{member.email}</td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: member.role === 'Owner' ? '#ECFDF5' : '#F1F5F9',
                                color: member.role === 'Owner' ? '#065F46' : '#334155',
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                              {member.permissions.canScanTickets && (
                                <span style={{ fontSize: '10px', background: '#ECFDF5', color: '#065F46', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Scan Passes
                                </span>
                              )}
                              {member.permissions.canViewAttendees && (
                                <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1E40AF', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Attendees
                                </span>
                              )}
                              {member.permissions.canManageEvents && (
                                <span style={{ fontSize: '10px', background: '#F5F3FF', color: '#5B21B6', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Manage Events
                                </span>
                              )}
                              {member.permissions.canViewFinances && (
                                <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ View Finances
                                </span>
                              )}
                              {member.permissions.canSendBroadcasts && (
                                <span style={{ fontSize: '10px', background: '#F0FDF4', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Broadcasts
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={member.status === 'Active' ? 'status status-live' : 'status status-draft'}>
                              {member.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748B' }}>{member.addedAt}</td>
                          <td style={{ textAlign: 'right' }}>
                            {member.role !== 'Owner' ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#DC2626',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                              >
                                Remove
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Primary Owner</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* MESSAGES PAGE */}
          {activePage === 'messages' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Messages &amp; Support</h1><p>Manage attendee enquiries and event communications.</p></div>
              </div>
              <section className="panel">
                <div className="panel-header"><h2 className="section-title">Broadcast Announcement</h2></div>
                <div className="panel-body">
                  <form onSubmit={(e) => { e.preventDefault(); showToastMsg('Announcement broadcasted!'); }}>
                    <div className="field"><label>Subject</label><input required placeholder="Important update" /></div>
                    <div className="field"><label>Message</label><textarea required placeholder="Message to attendees..."></textarea></div>
                    <button className="btn btn-primary" type="submit">Send Broadcast</button>
                  </form>
                </div>
              </section>
            </div>
          )}

          {/* SETTINGS PAGE */}
          {activePage === 'settings' && (
            <div className="page active">
              <div className="page-heading">
                <div><h1>Settings</h1><p>Manage your organizer profile and preferences.</p></div>
              </div>

              <div className="settings-layout">
                <nav className="panel settings-menu" aria-label="Settings navigation">
                  <button className={`settings-tab ${settingsTab === 'profile' ? 'active' : ''}`} onClick={() => setSettingsTab('profile')}>Organizer Profile</button>
                  <button className={`settings-tab ${settingsTab === 'notifications' ? 'active' : ''}`} onClick={() => setSettingsTab('notifications')}>Notifications</button>
                  <button className={`settings-tab ${settingsTab === 'security' ? 'active' : ''}`} onClick={() => setSettingsTab('security')}>Security</button>
                  <button className={`settings-tab ${settingsTab === 'payments' ? 'active' : ''}`} onClick={() => setSettingsTab('payments')}>Payout Setup</button>
                </nav>

                <section className="panel settings-content">
                  {settingsTab === 'profile' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      updateOrganization({ name: profileName });
                      showToastMsg('Organizer profile saved!');
                    }}>
                      <h2 className="section-title" style={{ marginBottom: '18px' }}>Organizer Profile</h2>
                      <div className="field"><label>Business Name</label><input value={profileName} onChange={(e) => setProfileName(e.target.value)} required /></div>
                      <div className="field"><label>Phone</label><input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} /></div>
                      <div className="field"><label>Bio</label><textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)}></textarea></div>
                      <button className="btn btn-primary" type="submit">Save Profile</button>
                    </form>
                  )}
                  {settingsTab === 'notifications' && (
                    <div>
                      <h2 className="section-title" style={{ marginBottom: '18px' }}>Notifications</h2>
                      <p className="muted">Manage email and SMS alert preferences for ticket purchases and check-ins.</p>
                    </div>
                  )}
                  {settingsTab === 'security' && (
                    <div>
                      <h2 className="section-title" style={{ marginBottom: '18px' }}>Security</h2>
                      <p className="muted">Multi-factor authentication and password settings.</p>
                    </div>
                  )}
                      {settingsTab === 'payments' && (
                    <div className="space-y-6">
                      <section>
                        <h2 className="section-title">Saved Withdrawal Accounts</h2>
                        <div className="space-y-3 mt-3">
                          {organization.withdrawalAccounts?.map((account) => (
                            <div key={account.accountNumber} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{account.bankName}</p>
                                <p className="text-[11px] text-slate-500">{account.accountName} • {account.accountNumber}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeWithdrawalAccount(account.accountNumber)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {(!organization.withdrawalAccounts || organization.withdrawalAccounts.length === 0) && (
                            <p className="text-xs text-slate-500 italic">No withdrawal accounts saved.</p>
                          )}
                        </div>
                      </section>

                      <section>
                        <h2 className="section-title">Add New Account</h2>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            addWithdrawalAccount({
                              bankName: withdrawBankName,
                              accountNumber: withdrawAccountNumber,
                              accountName: withdrawAccountName,
                              currency: organization.currency || 'GHS',
                            });
                            showToastMsg('Withdrawal account added!');
                            setWithdrawBankName('');
                            setWithdrawAccountNumber('');
                            setWithdrawAccountName('');
                          }}
                          className="space-y-4 mt-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field">
                              <label>Bank or Provider</label>
                              <input
                                value={withdrawBankName}
                                onChange={(e) => setWithdrawBankName(e.target.value)}
                                placeholder="e.g. MTN MoMo or Stanbic"
                                required
                              />
                            </div>
                            <div className="field">
                              <label>Account Number</label>
                              <input
                                value={withdrawAccountNumber}
                                onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                placeholder="e.g. 0530026527"
                                required
                              />
                            </div>
                            <div className="field">
                              <label>Account Holder</label>
                              <input
                                value={withdrawAccountName}
                                onChange={(e) => setWithdrawAccountName(e.target.value)}
                                placeholder="e.g. Full Legal Name"
                                required
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary">Add Account</button>
                        </form>
                      </section>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SECTION: OFFICIAL TRANSACTION RECEIPT MODAL */}
      {selectedReceiptAttendee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receiptModalTitle"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(16, 74, 50, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReceiptAttendee(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E6EBE7',
              padding: '28px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E6EBE7', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#176B45', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '900' }}>
                  🧾
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: '#176B45' }}>
                    EventSphere Verified Sales Receipt
                  </span>
                  <h2 id="receiptModalTitle" style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#19251F' }}>
                    {selectedReceiptAttendee.paymentReference || `REC-${selectedReceiptAttendee.id.toUpperCase()}`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptAttendee(null)}
                style={{ background: '#F2F9F4', border: '1px solid #E6EBE7', borderRadius: '8px', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#19251F' }}
                aria-label="Close receipt"
              >
                ×
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div style={{ background: '#F8FAF8', border: '1px solid #E0EDE4', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#77847C', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Customer / Buyer</span>
                  <strong style={{ color: '#19251F', fontSize: '13px' }}>{selectedReceiptAttendee.fullName}</strong>
                  <span style={{ display: 'block', color: '#77847C', fontSize: '11px' }}>{selectedReceiptAttendee.email}</span>
                  {selectedReceiptAttendee.company && <span style={{ display: 'block', color: '#77847C', fontSize: '11px' }}>{selectedReceiptAttendee.company}</span>}
                </div>
                <div>
                  <span style={{ color: '#77847C', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Event &amp; Organizer</span>
                  <strong style={{ color: '#19251F', fontSize: '13px' }}>
                    {organizerEvents.find((e) => e.id === selectedReceiptAttendee.eventId)?.title || activeOrganizerEvent?.title || 'Event'}
                  </strong>
                  <span style={{ display: 'block', color: '#176B45', fontSize: '11px', fontWeight: '600' }}>
                    Organizer: {currentUser?.name || 'Richard Quaye'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#77847C', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Ticket Type</span>
                  <strong style={{ color: '#19251F' }}>{selectedReceiptAttendee.ticketTierName}</strong>
                  <span style={{ display: 'block', color: '#77847C', fontSize: '10px' }}>Code: {selectedReceiptAttendee.ticketCode}</span>
                </div>
                <div>
                  <span style={{ color: '#77847C', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Date &amp; Payment Channel</span>
                  <strong style={{ color: '#19251F' }}>{new Date(selectedReceiptAttendee.createdAt).toLocaleString()}</strong>
                  <span style={{ display: 'block', color: '#176B45', fontSize: '11px', fontWeight: '600' }}>
                    {selectedReceiptAttendee.paymentChannel === 'mobile_money' ? '📱 Mobile Money (MTN MoMo)' : '💳 Card (Paystack)'}
                  </span>
                </div>
              </div>
            </div>

            {/* THREE CORE MONETARY SEPARATION ITEMS */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#77847C', marginBottom: '10px' }}>
                Monetary Breakdown &amp; Platform Split
              </div>

              <div style={{ border: '1px solid #E6EBE7', borderRadius: '12px', overflow: 'hidden' }}>
                {/* 1. Actual amount paid */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FFFFFF', borderBottom: '1px solid #F0F4F1' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#19251F', fontSize: '13px' }}>1. Actual Amount Paid</strong>
                    <span style={{ color: '#77847C', fontSize: '11px' }}>Total paid by buyer ({selectedReceiptAttendee.fullName}) for ticket</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#19251F' }}>
                    {formatCurrency(selectedReceiptAttendee.amountPaid, selectedReceiptAttendee.currency)}
                  </div>
                </div>

                {/* 2. Platform commission deducted */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FFFDF9', borderBottom: '1px solid #F0F4F1' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#99691E', fontSize: '13px' }}>
                      2. Platform Commission ({selectedReceiptAttendee.commissionRate ?? organization.platformCommissionRate ?? 18}%)
                    </strong>
                    <span style={{ color: '#77847C', fontSize: '11px' }}>
                      Auto-deducted directly into Platform Earnings at checkout
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#C48732' }}>
                    - {formatCurrency(
                      selectedReceiptAttendee.platformCommission ?? 
                      Math.round(selectedReceiptAttendee.amountPaid * ((selectedReceiptAttendee.commissionRate ?? 18) / 100) * 100) / 100,
                      selectedReceiptAttendee.currency
                    )}
                  </div>
                </div>

                {/* 3. Actual amount left in organizer account */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F2F9F4' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#104A32', fontSize: '14px' }}>
                      3. Actual Amount Left in Organizer Account
                    </strong>
                    <span style={{ color: '#218653', fontSize: '11px', fontWeight: '600' }}>
                      ✓ Credited to your Withdrawable Balance immediately
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#104A32' }}>
                    {formatCurrency(
                      selectedReceiptAttendee.organizerEarnings ?? 
                      Math.round((selectedReceiptAttendee.amountPaid - (selectedReceiptAttendee.platformCommission ?? (selectedReceiptAttendee.amountPaid * 0.18))) * 100) / 100,
                      selectedReceiptAttendee.currency
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory Policy Callout */}
            <div style={{ background: '#F2F9F4', border: '1px solid #CDE7D5', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: '11px', color: '#176B45', lineHeight: '1.5' }}>
                <strong>Instant Monetary Separation Policy:</strong> The platform commission was automatically deducted upon ticket purchase. The net amount has been credited to your account and is fully withdrawable without any additional deductions upon payout.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  window.print();
                  showToastMsg('Receipt sent to print preview.');
                }}
              >
                🖨 Print / Save PDF
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedReceiptAttendee(null)}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: WITHDRAWAL REQUEST MODAL */}
      {isWithdrawalModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdrawalModalTitle"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(16, 74, 50, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsWithdrawalModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E6EBE7',
              padding: '26px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E6EBE7', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: '#176B45' }}>
                  Instant Earnings Disbursement
                </span>
                <h2 id="withdrawalModalTitle" style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#19251F' }}>
                  Withdraw Available Funds
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawalModalOpen(false)}
                style={{ background: '#F2F9F4', border: '1px solid #E6EBE7', borderRadius: '8px', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#19251F' }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit}>
              {/* Withdrawable Balance Overview */}
              <div style={{ background: '#F2F9F4', border: '1px solid #CDE7D5', borderRadius: '12px', padding: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#77847C', display: 'block', marginBottom: '2px' }}>Available Withdrawable Balance</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#104A32' }}>
                    {formatCurrency(walletStats.withdrawableBalance, activeOrganizerEvent?.currency || organization.currency || 'GHS')}
                  </span>
                  <span style={{ fontSize: '10px', color: '#218653', display: 'block', marginTop: '2px' }}>
                    ✓ 100% of this amount is yours (commission already deducted)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '6px 10px', minHeight: '32px' }}
                  onClick={() => setWithdrawAmount(String(walletStats.withdrawableBalance))}
                  disabled={walletStats.withdrawableBalance <= 0}
                >
                  Withdraw All
                </button>
              </div>

              {/* Amount input */}
              <div className="field" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '6px' }}>
                  Amount to Withdraw ({activeOrganizerEvent?.currency || organization.currency || 'GHS'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={walletStats.withdrawableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`e.g. ${walletStats.withdrawableBalance || 41.00}`}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1px solid #E6EBE7', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Destination Channel Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '6px' }}>
                  Payout Destination *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setWithdrawChannel('mobile_money')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${withdrawChannel === 'mobile_money' ? '#176B45' : '#E6EBE7'}`,
                      background: withdrawChannel === 'mobile_money' ? '#F2F9F4' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '12px', color: '#19251F' }}>📱 Mobile Money</strong>
                    <span style={{ fontSize: '10px', color: '#77847C' }}>MTN MoMo, Telecel Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawChannel('bank_transfer')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${withdrawChannel === 'bank_transfer' ? '#176B45' : '#E6EBE7'}`,
                      background: withdrawChannel === 'bank_transfer' ? '#F2F9F4' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '12px', color: '#19251F' }}>🏦 Bank Account</strong>
                    <span style={{ fontSize: '10px', color: '#77847C' }}>Stanbic, Ecobank, GCB</span>
                  </button>
                </div>
              </div>

              {/* Channel specific fields */}
              {withdrawChannel === 'mobile_money' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div className="field">
                    <label style={{ fontSize: '11px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '4px' }}>
                      Network Provider
                    </label>
                    <select
                      value={withdrawMomoProvider}
                      onChange={(e) => setWithdrawMomoProvider(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6EBE7', fontSize: '12px', background: '#FAFBFA' }}
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                      <option value="Telecel Cash">Telecel Cash</option>
                      <option value="AT Money">AT Money (AirtelTigo)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label style={{ fontSize: '11px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '4px' }}>
                      Mobile Number *
                    </label>
                    <input
                      value={withdrawMomoNumber}
                      onChange={(e) => setWithdrawMomoNumber(e.target.value)}
                      placeholder="e.g. 0244981240"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6EBE7', fontSize: '12px' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div className="field">
                    <label style={{ fontSize: '11px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '4px' }}>
                      Bank Name *
                    </label>
                    <input
                      value={withdrawBankName}
                      onChange={(e) => setWithdrawBankName(e.target.value)}
                      placeholder="e.g. Stanbic Bank Ghana"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6EBE7', fontSize: '12px' }}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: '11px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '4px' }}>
                      Account Number *
                    </label>
                    <input
                      value={withdrawAccountNumber}
                      onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                      placeholder="e.g. 0530026527"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6EBE7', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}

              <div className="field" style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', fontWeight: '750', color: '#19251F', display: 'block', marginBottom: '4px' }}>
                  Account Holder Name *
                </label>
                <input
                  value={withdrawAccountName}
                  onChange={(e) => setWithdrawAccountName(e.target.value)}
                  placeholder="e.g. Richard Quaye"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E6EBE7', fontSize: '12px' }}
                />
              </div>

              {/* Live Payout Breakdown */}
              <div style={{ background: '#F8FAF8', border: '1px solid #E6EBE7', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#77847C' }}>Requested Withdrawal:</span>
                  <strong>{formatCurrency(Number(withdrawAmount) || 0, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#77847C' }}>Platform Fee Deducted:</span>
                  <span style={{ color: '#176B45', fontWeight: '700' }}>GH₵ 0.00 (Commission was already deducted upon ticket purchase)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #E6EBE7', fontSize: '13px' }}>
                  <strong style={{ color: '#104A32' }}>Net Disbursed to You:</strong>
                  <strong style={{ color: '#104A32' }}>{formatCurrency(Number(withdrawAmount) || 0, activeOrganizerEvent?.currency || organization.currency || 'GHS')}</strong>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > walletStats.withdrawableBalance}
                >
                  Confirm &amp; Disburse Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER INVITATION MODAL */}
      {isInviteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsInviteModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '480px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Invite New Team Member</h2>
                <p>Grant staff operational access to scan passes, coordinate entries, or manage events.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsInviteModalOpen(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInviteMember} style={{ padding: '20px' }}>
              <div className="field" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwesi Appiah"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div className="field" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kwesi@eventsphere.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div className="field" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  Operational Role Preset *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => handleRolePresetChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Gate Scanner Staff">Gate Scanner Staff (Fast optical QR scanner &amp; check-in only)</option>
                  <option value="Event Coordinator">Event Coordinator (Attendee roster, check-in, messaging)</option>
                  <option value="Event Manager">Event Manager (Event editing, tickets, attendees, check-in)</option>
                  <option value="Finance Auditor">Finance Auditor (Payout ledger, reports &amp; revenue viewing)</option>
                  <option value="Custom Role">Custom Role (Select individual permissions below)</option>
                </select>
              </div>

              {/* Granular Permission Toggles */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Granular Access Permissions (Organizer Controls)
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.canScanTickets}
                      onChange={(e) => setInvitePermissions((p) => ({ ...p, canScanTickets: e.target.checked }))}
                    />
                    <span><strong>Optical QR Scanner &amp; Door Check-in</strong> (Scan and validate attendee passes)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.canViewAttendees}
                      onChange={(e) => setInvitePermissions((p) => ({ ...p, canViewAttendees: e.target.checked }))}
                    />
                    <span><strong>View Attendee Roster</strong> (Inspect guest lists and verified badges)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.canManageEvents}
                      onChange={(e) => setInvitePermissions((p) => ({ ...p, canManageEvents: e.target.checked }))}
                    />
                    <span><strong>Event &amp; Ticket Tier Management</strong> (Edit event details and pricing)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.canViewFinances}
                      onChange={(e) => setInvitePermissions((p) => ({ ...p, canViewFinances: e.target.checked }))}
                    />
                    <span><strong>Payouts &amp; Finance Ledger</strong> (View revenue and withdrawal accounts)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.canSendBroadcasts}
                      onChange={(e) => setInvitePermissions((p) => ({ ...p, canSendBroadcasts: e.target.checked }))}
                    />
                    <span><strong>Broadcast Messages</strong> (Send announcements and alerts to attendees)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Send Team Invite →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
