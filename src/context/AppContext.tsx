import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  EventData,
  Attendee,
  Organization,
  UserAccount,
  RealTimeNotification,
  AuditLog,
  LanguageCode,
  WithdrawalRequest,
  WithdrawalAccount,
  FooterSettings,
  AppView,
  UserRole,
  DatabaseBackup,
  DatabaseStats,
  SqlQueryResult,
} from '../types';
import {
  INITIAL_ORGANIZATION,
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_ATTENDEES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WITHDRAWAL_REQUESTS,
  INITIAL_FOOTER_SETTINGS,
} from '../data/mockData';
import {
  sqlDb,
  SYSTEM_DEFAULT_ADMIN,
  SYSTEM_DEFAULT_ORGANIZER,
  SYSTEM_DEFAULT_ORG,
  SYSTEM_DEFAULT_FOOTER,
} from '../db/sqlDatabase';
import {
  createFullZipBackup,
  inspectZipBackup,
  restoreFromZipBackup,
  ZipInspectionResult,
} from '../utils/zipBackup';
import { generateQrDataUrl, getEventShareUrl } from '../utils/qr';
import { generatePaystackReference } from '../utils/paystack';
import { generateTicketSecuritySeal, verifyTicketAuthenticity } from '../utils/security';

interface AppContextType {
  organization: Organization;
  updateOrganization: (updates: Partial<Organization>) => void;
  users: UserAccount[];
  updateUserPermissions: (userId: string, permissions: UserAccount['permissions']) => void;
  suspendUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  currentUser: UserAccount;
  setCurrentUserRole: (role: UserAccount['role']) => void;
  events: EventData[];
  organizerEvents: EventData[];
  activeEvent: EventData;
  activeOrganizerEvent: EventData | null;
  setActiveEventId: (id: string) => void;
  createEvent: (event: Omit<EventData, 'id' | 'createdAt'>) => string;
  loadSampleEventTemplate: (templateType?: 'conference' | 'concert' | 'workshop') => string;
  updateEvent: (id: string, updates: Partial<EventData>) => void;
  deleteEvent: (id: string) => void;
  attendees: Attendee[];
  activeEventAttendees: Attendee[];
  registerAttendee: (params: {
    eventId: string;
    ticketTierId: string;
    fullName: string;
    email: string;
    phone?: string;
    company: string;
    jobTitle: string;
    assignedSeat?: string;
    customAnswers: Record<string, string>;
    amountPaid: number;
    currency: string;
    paymentChannel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';
    paymentReference?: string;
  }) => Promise<Attendee>;
  checkInTicket: (ticketCode: string, operatorName?: string) => { success: boolean; message: string; attendee?: Attendee };
  undoCheckIn: (attendeeId: string) => void;
  notifications: RealTimeNotification[];
  isolatedNotifications: RealTimeNotification[];
  broadcastNotification: (
    title: string,
    message: string,
    type: RealTimeNotification['type'],
    targetAudience: RealTimeNotification['targetAudience'],
    targetEventId?: string // 'system_all' or specific eventId
  ) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  auditLogs: AuditLog[];
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  is2FAModalOpen: boolean;
  setIs2FAModalOpen: (open: boolean) => void;
  toggleTwoFactor: (enabled: boolean) => void;
  getQrCodeForTicket: (ticketCode: string) => Promise<string>;
  getQrCodeForEvent: (eventSlug: string) => Promise<string>;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  viewingTicketCode: string | null;
  setViewingTicketCode: (code: string | null) => void;
  // Auth & Session
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'signup';
  setAuthModalTab: (tab: 'login' | 'signup') => void;
  login: (email: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  signup: (params: { name: string; email: string; role: UserRole; organizationName?: string }) => UserAccount;
  // Wallet & Commission
  withdrawalRequests: WithdrawalRequest[];
  requestWithdrawal: (amount: number, account: WithdrawalAccount) => WithdrawalRequest;
  updateWithdrawalStatus: (
    requestId: string,
    status: WithdrawalRequest['status'],
    adminNotes?: string
  ) => void;
  addWithdrawalAccount: (account: WithdrawalAccount) => void;
  removeWithdrawalAccount: (accountNumber: string) => void;
  updatePlatformCommissionRate: (rate: number) => void;
  platformStats: {
    totalGrossTicketSales: number;
    platformEarnings: number;
    totalOrganizerNetEarnings: number;
    commissionRate: number;
    totalPaidTicketsCount: number;
  };
  walletStats: {
    grossRevenue: number;
    commissionRate: number;
    platformCommissionFee: number;
    netEarnings: number;
    totalWithdrawn: number;
    pendingWithdrawn: number;
    withdrawableBalance: number;
  };
  // Footer customization
  footerSettings: FooterSettings;
  updateFooterSettings: (settings: Partial<FooterSettings>) => void;
  // Relational SQL Database & Backup/Restore
  isMockDataSeeded: boolean;
  databaseStats: DatabaseStats;
  databaseBackups: DatabaseBackup[];
  seedMockData: () => { addedEvents: number; addedAttendees: number };
  unseedMockData: () => { removedEvents: number; removedAttendees: number; removedUsers: number };
  clearMockData: () => void;
  createDatabaseBackup: (name?: string) => DatabaseBackup;
  restoreDatabaseFromJson: (jsonStrOrObj: string | object, mode?: 'replace' | 'merge') => { success: boolean; message: string };
  executeSqlQuery: (sql: string) => SqlQueryResult;
  deleteDatabaseBackup: (backupId: string) => void;
  downloadSqlDump: () => void;
  downloadJsonBackup: (backupId?: string) => void;
  downloadFullZipBackup: (customTitle?: string) => Promise<void>;
  restoreFromZipArchive: (file: File | Blob, mode?: 'replace' | 'merge') => Promise<{ success: boolean; message: string; restoredCounts?: Record<string, number> }>;
  inspectZipArchive: (file: File | Blob) => Promise<ZipInspectionResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if mock data was cleared on first boot
  const [isMockDataSeeded, setIsMockDataSeeded] = useState<boolean>(() => {
    if (localStorage.getItem('eventsphere_mock_init_v2') === null) {
      localStorage.setItem('eventsphere_mock_init_v2', 'true');
      sqlDb.unseedMockData(); // Clear mock data as requested!
      return false;
    }
    return sqlDb.isMockDataEnabled();
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    return sqlDb.getOrganizations();
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    return sqlDb.getUsers();
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('eventsphere_current_user_id') || SYSTEM_DEFAULT_ADMIN.id;
  });

  const [events, setEvents] = useState<EventData[]>(() => {
    return sqlDb.getEvents();
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    const saved = localStorage.getItem('eventsphere_active_event_id');
    const all = sqlDb.getEvents();
    if (saved && all.some((e) => e.id === saved)) return saved;
    return all.length > 0 ? all[0].id : '';
  });

  const [attendees, setAttendees] = useState<Attendee[]>(() => {
    return sqlDb.getAttendees();
  });

  const [notifications, setNotifications] = useState<RealTimeNotification[]>(() => {
    return sqlDb.getNotifications();
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return sqlDb.getAuditLogs();
  });

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    return sqlDb.getWithdrawalRequests();
  });

  const [footerSettings, setFooterSettings] = useState<FooterSettings>(() => {
    return sqlDb.getFooterSettings();
  });

  const [databaseBackups, setDatabaseBackups] = useState<DatabaseBackup[]>(() => {
    return sqlDb.getBackups();
  });

  const [language, setLanguage] = useState<LanguageCode>('en');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [viewingTicketCode, setViewingTicketCode] = useState<string | null>(null);

  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('eventsphere_auth') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  // Parse URL query parameter on load to support direct event sharing links with flyers and details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const eventParam = params.get('event');
      if (eventParam) {
        const found = events.find((e) => e.id === eventParam || e.slug === eventParam);
        if (found) {
          setActiveEventId(found.id);
          setCurrentView('public_event');
        }
      }
    }
  }, []);

  // Sync state to local storage and SQL Database
  useEffect(() => {
    sqlDb.saveOrganizations(organizations);
    localStorage.setItem('eventsphere_all_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    sqlDb.saveUsers(users);
    localStorage.setItem('eventsphere_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    sqlDb.saveEvents(events);
    localStorage.setItem('eventsphere_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    sqlDb.saveAttendees(attendees);
    localStorage.setItem('eventsphere_attendees', JSON.stringify(attendees));
  }, [attendees]);

  useEffect(() => {
    sqlDb.saveNotifications(notifications);
    localStorage.setItem('eventsphere_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    sqlDb.saveAuditLogs(auditLogs);
    localStorage.setItem('eventsphere_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    sqlDb.saveWithdrawalRequests(withdrawalRequests);
    localStorage.setItem('eventsphere_withdrawals', JSON.stringify(withdrawalRequests));
  }, [withdrawalRequests]);

  useEffect(() => {
    sqlDb.saveFooterSettings(footerSettings);
    localStorage.setItem('eventsphere_footer', JSON.stringify(footerSettings));
  }, [footerSettings]);

  useEffect(() => {
    localStorage.setItem('eventsphere_active_event_id', activeEventId);
  }, [activeEventId]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || SYSTEM_DEFAULT_ADMIN;

  // Tenancy: Current user's associated organization
  const organization = useMemo(() => {
    const matched = organizations.find((o) => o.id === currentUser.organizationId);
    return matched || organizations[0] || SYSTEM_DEFAULT_ORG;
  }, [organizations, currentUser.organizationId]);

  // Strict Event Isolation: Events belonging to the current organizer
  const organizerEvents = useMemo(() => {
    if (currentUser.role === 'system_admin') {
      return events;
    }
    if (currentUser.id === 'user_organizer_01') {
      // Demo organizer account sees their events
      return events.filter(
        (e) => e.organizerId === 'user_organizer_01' || e.organizationId === 'org_apex_enterprises'
      );
    }
    // Any newly registered organizer strictly sees only events they created
    return events.filter(
      (e) => e.organizerId === currentUser.id || (currentUser.organizationId && e.organizationId === currentUser.organizationId)
    );
  }, [events, currentUser.id, currentUser.role, currentUser.organizationId]);

  // Active event specifically for the organizer's mission control
  const activeOrganizerEvent = useMemo(() => {
    if (organizerEvents.length === 0) return null;
    return organizerEvents.find((e) => e.id === activeEventId) || organizerEvents[0];
  }, [organizerEvents, activeEventId]);

  // Public active event for browsing/ticketing
  const activeEvent = useMemo(() => {
    if (events.length === 0) {
      return {
        id: 'evt_clean_system',
        title: 'EventSphere Portal',
        slug: 'eventsphere-portal',
        tagline: 'Discover concerts, tech festivals, conferences & celebrations.',
        description: 'Explore verified events, purchase tickets securely, and access scannable digital passes on EventSphere.',
        category: 'Corporate Conference',
        startDate: '2026-11-28T09:00:00Z',
        endDate: '2026-11-29T18:00:00Z',
        timezone: 'UTC+0 (Accra / London)',
        locationType: 'in_person',
        venueName: 'EventSphere Grand Pavilion',
        venueAddress: 'Independence Avenue, Accra',
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        organizerId: currentUser.id,
        organizationId: organization.id,
        status: 'published',
        ticketTiers: [],
        schedule: [],
        customFields: [],
        automatedReminders: {
          send24hReminder: true,
          send1hReminder: true,
          sendPostEventSurvey: true,
        },
        totalCapacity: 0,
        currency: organization.currency || 'GHS',
        createdAt: new Date().toISOString(),
        isMock: false,
      } as EventData;
    }
    return events.find((e) => e.id === activeEventId) || events[0];
  }, [events, activeEventId, currentUser.id, organization.id, organization.currency]);

  const setCurrentUserRole = (role: UserAccount['role']) => {
    const target = users.find((u) => u.role === role);
    if (target) {
      setCurrentUserId(target.id);
      localStorage.setItem('eventsphere_current_user_id', target.id);
      if (role === 'door_staff') {
        setCurrentView('scanner');
      } else if (role === 'attendee') {
        setCurrentView('public_event');
      } else if (role === 'system_admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('dashboard');
      }
    }
  };

  const login = (email: string, password?: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    const match = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!match) {
      return { success: false, message: 'Invalid email or password. Please check your details and try again.' };
    }

    // System Admin obahlog@gmail.com is safeguarded with admin master password
    if (trimmedEmail === 'obahlog@gmail.com') {
      if (!password || password.trim() !== '48468080') {
        return { success: false, message: 'Invalid administrator credentials. Please check your password and try again.' };
      }
    }

    setCurrentUserId(match.id);
    setIsAuthenticated(true);
    localStorage.setItem('eventsphere_auth', 'true');
    localStorage.setItem('eventsphere_current_user_id', match.id);
    addAuditLog('USER_LOGIN', `User ${match.name} authenticated successfully.`);
    if (match.role === 'system_admin') setCurrentView('admin');
    else if (match.role === 'organizer') setCurrentView('dashboard');
    else if (match.role === 'door_staff') setCurrentView('scanner');
    else setCurrentView('home');
    return { success: true, message: `Welcome back, ${match.name}!` };
  };

  const logout = () => {
    const userName = currentUser.name;
    setIsAuthenticated(false);
    localStorage.removeItem('eventsphere_auth');
    setCurrentView('home');
    addAuditLog('USER_LOGOUT', `User ${userName} logged out of session.`);
  };

  const signup = (params: { name: string; email: string; role: UserRole; organizationName?: string }): UserAccount => {
    // Generate isolated organization for new organizer
    const newOrgId = `org_${Date.now()}`;
    const orgName = params.organizationName?.trim() || `${params.name.trim()}'s Event Studio`;
    const newOrg: Organization = {
      id: newOrgId,
      name: orgName,
      slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tier: 'Starter',
      paystackPublicKey: '',
      paystackSecretKeyMasked: '',
      currency: 'GHS',
      platformCommissionRate: 5.0,
      createdAt: new Date().toISOString(),
      totalEvents: 0,
      totalRevenue: 0,
      withdrawalAccounts: [],
    };

    setOrganizations((prev) => [...prev, newOrg]);

    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: params.name.trim(),
      email: params.email.toLowerCase().trim(),
      role: params.role,
      organizationId: newOrgId,
      twoFactorEnabled: false,
      permissions: {
        canCreateEvents: params.role === 'organizer' || params.role === 'system_admin',
        canEditFinancials: params.role === 'organizer' || params.role === 'system_admin',
        canScanTickets: params.role === 'organizer' || params.role === 'door_staff' || params.role === 'system_admin',
        canBroadcastNotifications: params.role === 'organizer' || params.role === 'system_admin',
        canManageTeam: params.role === 'organizer' || params.role === 'system_admin',
      },
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    localStorage.setItem('eventsphere_auth', 'true');
    localStorage.setItem('eventsphere_current_user_id', newUser.id);
    setIsAuthModalOpen(false);
    addAuditLog('USER_REGISTERED', `New account created: ${newUser.name} as ${newUser.role}`);
    
    if (params.role === 'organizer') {
      setActiveEventId(''); // Fresh organizer starts with NO events (no data leakage)
      setCurrentView('dashboard');
    } else {
      setCurrentView('home');
    }
    return newUser;
  };

  const updateOrganization = (updates: Partial<Organization>) => {
    setOrganizations((prev) => {
      const updated = prev.map((o) => (o.id === organization.id ? { ...o, ...updates } : o));
      sqlDb.saveOrganizations(updated);
      return updated;
    });
  };

  const updateUserPermissions = (userId: string, permissions: UserAccount['permissions']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions } : u))
    );
    addAuditLog('PERMISSIONS_UPDATED', `Updated role permissions for user ID: ${userId}`);
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      ipAddress: '197.210.84.12',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const createEvent = (eventData: Omit<EventData, 'id' | 'createdAt'>): string => {
    const newId = `evt_${Date.now()}`;
    const newEvent: EventData = {
      ...eventData,
      id: newId,
      createdAt: new Date().toISOString(),
      organizerId: currentUser.id,
      organizationId: currentUser.organizationId || organization.id,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newId);
    addAuditLog('EVENT_CREATED', `Created new event "${newEvent.title}" (${newEvent.slug})`);
    return newId;
  };

  const loadSampleEventTemplate = (templateType: 'conference' | 'concert' | 'workshop' = 'conference'): string => {
    const newId = `evt_${Date.now()}`;
    const targetCurrency = organization.currency || 'GHS';
    const newEvent: EventData = {
      id: newId,
      title:
        templateType === 'concert'
          ? `${organization.name} Live Music & Arts Experience 2026`
          : templateType === 'workshop'
          ? `${organization.name} Masterclass & Tech Bootcamp`
          : `${organization.name} Annual Leadership & Innovation Summit 2026`,
      slug: `starter-${templateType}-${Date.now().toString().slice(-4)}`,
      tagline:
        templateType === 'concert'
          ? 'A high-energy festival celebrating contemporary sounds, live performances, and arts'
          : templateType === 'workshop'
          ? 'Hands-on intensive sessions with industry mentors, certifications, and live labs'
          : 'Connecting industry pioneers, strategic executives, and creators across emerging markets',
      description:
        'Welcome to your newly provisioned event. You can customize this description, update ticket tiers, schedule sessions, and begin selling tickets immediately.',
      category:
        templateType === 'concert'
          ? 'Music & Festival'
          : templateType === 'workshop'
          ? 'Hackathon & Workshop'
          : 'Corporate Conference',
      startDate: '2026-11-28T09:00:00Z',
      endDate: '2026-11-29T18:00:00Z',
      timezone: 'UTC+0 (Accra / London)',
      locationType: 'hybrid',
      venueName: 'The Grand Royale Pavilion & Gardens',
      venueAddress: '24 Liberation Avenue, City Center',
      coverImage:
        templateType === 'concert'
          ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      organizerId: currentUser.id,
      organizationId: currentUser.organizationId || organization.id,
      status: 'live',
      totalCapacity: 300,
      currency: targetCurrency,
      createdAt: new Date().toISOString(),
      automatedReminders: {
        send24hReminder: true,
        send1hReminder: true,
        sendPostEventSurvey: true,
      },
      customFields: [
        {
          id: `cf_diet_${Date.now()}`,
          label: 'Dietary or Seating Requirements',
          type: 'select',
          required: false,
          options: ['Standard', 'Vegetarian / Vegan', 'Halal Certified', 'Gluten Free'],
        },
      ],
      ticketTiers: [
        {
          id: `tier_${Date.now()}_regular`,
          name: 'Regular Admission',
          description: 'Full event entry, event badge, and standard access',
          price: targetCurrency === 'USD' ? 45 : 120,
          currency: targetCurrency,
          type: 'paid',
          capacity: 200,
          soldCount: 0,
          perks: ['Main Event Access', 'Digital Badge', 'Welcome Pack'],
          salesEnd: '2026-11-28T10:00:00Z',
        },
        {
          id: `tier_${Date.now()}_vip`,
          name: 'VIP Executive Pass',
          description: 'Priority reserved seating, VIP lounge hospitality, and networking access',
          price: targetCurrency === 'USD' ? 120 : 350,
          currency: targetCurrency,
          type: 'vip',
          capacity: 50,
          soldCount: 0,
          perks: ['Priority Seating', 'VIP Lounge Access', 'Complimentary Drinks & Canapés'],
          salesEnd: '2026-11-28T10:00:00Z',
          requiresSeatSelection: true,
          seatLayoutType: 'dinner_tables',
        },
      ],
      schedule: [
        {
          id: `sch_${Date.now()}_1`,
          title: 'Opening Ceremony & Welcome Address',
          description: 'Official opening remarks, introduction of keynote speakers and partners.',
          speakerName: currentUser.name,
          speakerRole: 'Event Host & Convener',
          speakerCompany: organization.name,
          room: 'Main Plenary Pavilion',
          startTime: '09:00',
          endTime: '10:00',
          date: '2026-11-28',
          category: 'Keynote',
          isLive: true,
        },
      ],
    };

    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newId);
    addAuditLog('EVENT_CREATED', `Starter template loaded: "${newEvent.title}"`);
    return newId;
  };

  const updateEvent = (id: string, updates: Partial<EventData>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    addAuditLog('EVENT_UPDATED', `Modified event configuration for ID: ${id}`);
  };

  const deleteEvent = (id: string) => {
    const target = events.find((e) => e.id === id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (activeEventId === id && events.length > 1) {
      const remaining = events.filter((e) => e.id !== id);
      setActiveEventId(remaining[0].id);
    }
    addAuditLog('EVENT_DELETED', `Deleted event "${target?.title || id}"`);
  };

  const registerAttendee = async ({
    eventId,
    ticketTierId,
    fullName,
    email,
    phone,
    company,
    jobTitle,
    assignedSeat,
    customAnswers,
    amountPaid,
    currency,
    paymentChannel,
    paymentReference,
  }: {
    eventId: string;
    ticketTierId: string;
    fullName: string;
    email: string;
    phone?: string;
    company: string;
    jobTitle: string;
    assignedSeat?: string;
    customAnswers: Record<string, string>;
    amountPaid: number;
    currency: string;
    paymentChannel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';
    paymentReference?: string;
  }): Promise<Attendee> => {
    const event = events.find((e) => e.id === eventId) || activeEvent;
    const tier = event.ticketTiers.find((t) => t.id === ticketTierId);
    const tierName = tier ? tier.name : 'Standard Pass';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `TKT-${randomSuffix}-${tierName.substring(0, 3).toUpperCase()}`;
    const prefix = organization.paystackPublicKey?.startsWith('pk_live_') ? 'PSTK_LIVE' : 'PSTK_TEST';
    const paystackRef = paymentReference || generatePaystackReference(prefix);

    // Cryptographic anti-forgery digital security seal
    const { seal: securitySeal, barcodeHash: securityHash } = generateTicketSecuritySeal({
      ticketCode,
      eventId: event.id,
      email,
      amount: amountPaid,
      paymentRef: paystackRef,
    });

    // Generate Scannable QR code URL with the tamper-proof ticket verification payload
    const qrDataPayload = JSON.stringify({
      code: ticketCode,
      event: event.slug,
      name: fullName,
      tier: tierName,
      seat: assignedSeat,
      seal: securitySeal,
      sig: securityHash,
    });
    const qrDataUrl = await generateQrDataUrl(qrDataPayload);

    const currentRate = organization.platformCommissionRate ?? 18.0;
    const platformCommission = amountPaid > 0 ? Math.round(amountPaid * (currentRate / 100) * 100) / 100 : 0;
    const organizerEarnings = amountPaid > 0 ? Math.round((amountPaid - platformCommission) * 100) / 100 : 0;

    const newAttendee: Attendee = {
      id: `att_${Date.now()}`,
      eventId,
      ticketTierId,
      ticketTierName: tierName,
      ticketCode,
      qrDataUrl,
      fullName,
      email,
      phone,
      company,
      jobTitle,
      assignedSeat,
      customAnswers,
      paymentStatus: amountPaid > 0 ? 'paid' : 'free',
      paymentReference: amountPaid > 0 ? paystackRef : undefined,
      amountPaid,
      commissionRate: currentRate,
      platformCommission,
      organizerEarnings,
      currency,
      paymentChannel,
      checkedIn: false,
      securitySeal,
      securityHash,
      createdAt: new Date().toISOString(),
    };

    setAttendees((prev) => [newAttendee, ...prev]);

    // Update tier sold count
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            ticketTiers: e.ticketTiers.map((t) =>
              t.id === ticketTierId ? { ...t, soldCount: t.soldCount + 1 } : t
            ),
          };
        }
        return e;
      })
    );

    // Update organization revenue with net earnings credited to organizer
    if (amountPaid > 0) {
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === organization.id
            ? { ...o, totalRevenue: o.totalRevenue + organizerEarnings }
            : o
        )
      );
    }

    // Add audit log
    addAuditLog(
      'TICKET_PURCHASE_PAYSTACK',
      `Registered ${fullName} for ${tierName}. Paid ${currency} ${amountPaid} via Paystack (${paymentChannel}). Ref: ${paystackRef}`
    );

    // Real-time broadcast
    broadcastNotification(
      'New Ticket Registered',
      `${fullName} (${company || 'Guest'}) just secured a ${tierName} for ${event.title}.`,
      'announcement',
      'staff'
    );

    return newAttendee;
  };

  const checkInTicket = (
    ticketCodeOrPayload: string,
    operatorName = currentUser.name
  ): { success: boolean; message: string; attendee?: Attendee } => {
    let cleanCode = ticketCodeOrPayload.trim().toUpperCase();

    let presentedSeal: string | undefined = undefined;

    // Check if input is a JSON string from QR scanner
    if (ticketCodeOrPayload.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(ticketCodeOrPayload.trim());
        if (parsed.code) {
          cleanCode = String(parsed.code).trim().toUpperCase();
        }
        if (parsed.seal) {
          presentedSeal = String(parsed.seal).trim();
        }
      } catch {
        // Fall back to cleanCode as string
      }
    }

    // First try finding attendee in the currently active event
    let attendee = attendees.find(
      (a) => a.ticketCode.toUpperCase() === cleanCode && a.eventId === activeEvent.id
    );

    // If not found in activeEvent, search across all events to prevent false invalid rejections
    if (!attendee) {
      attendee = attendees.find((a) => a.ticketCode.toUpperCase() === cleanCode);
      if (attendee) {
        // Auto-switch active event so the check-in context and roster reflect the attendee's event
        setActiveEventId(attendee.eventId);
      }
    }

    if (!attendee) {
      return {
        success: false,
        message: `FORGERY OR INVALID PASS ALERT: Ticket code [${cleanCode}] does not exist in any registered event database. Access Denied.`,
      };
    }

    // Cryptographic anti-forgery validation
    const authCheck = verifyTicketAuthenticity(attendee, presentedSeal);
    if (!authCheck.isValid) {
      addAuditLog(
        'FORGED_TICKET_DETECTED',
        `FORGERY ALERT: Tampered receipt presented for ${attendee.ticketCode} (${attendee.fullName}). Reason: ${authCheck.reason}`
      );
      return {
        success: false,
        message: `COUNTERFEIT / TAMPERED RECEIPT DETECTED: ${authCheck.reason || 'Cryptographic signature mismatch.'} Entry Prohibited.`,
        attendee,
      };
    }

    if (attendee.checkedIn) {
      return {
        success: false,
        message: `DUPLICATE ENTRY ALERT: Ticket ${attendee.ticketCode} for ${attendee.fullName} was already verified at ${new Date(attendee.checkedInAt || '').toLocaleTimeString()} by ${attendee.checkedInBy || 'Door Staff'}.`,
        attendee,
      };
    }

    const checkInTime = new Date().toISOString();
    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendee.id
          ? {
              ...a,
              checkedIn: true,
              checkedInAt: checkInTime,
              checkedInBy: operatorName,
            }
          : a
      )
    );

    const updatedAttendee = {
      ...attendee,
      checkedIn: true,
      checkedInAt: checkInTime,
      checkedInBy: operatorName,
    };

    addAuditLog(
      'TICKET_VERIFIED_SUCCESS',
      `Door check-in successful: ${attendee.fullName} (${attendee.ticketTierName}) verified by ${operatorName}.`
    );

    return {
      success: true,
      message: `Verified! Welcome ${attendee.fullName} (${attendee.ticketTierName}). Badging approved.`,
      attendee: updatedAttendee,
    };
  };

  const undoCheckIn = (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendeeId ? { ...a, checkedIn: false, checkedInAt: undefined, checkedInBy: undefined } : a))
    );
    addAuditLog('CHECKIN_REVERSED', `Reversed check-in status for attendee ID: ${attendeeId}`);
  };

  // Active attendees for the selected active event (with strict organizer isolation)
  const activeEventAttendees = useMemo(() => {
    if (currentUser.role === 'organizer') {
      if (!activeOrganizerEvent) return [];
      return attendees.filter((a) => a.eventId === activeOrganizerEvent.id);
    }
    return attendees.filter((a) => a.eventId === activeEvent.id);
  }, [attendees, currentUser.role, activeOrganizerEvent, activeEvent.id]);

  // Strictly isolated notifications for active event, plus system-wide announcements
  const isolatedNotifications = useMemo(() => {
    const activeEvtId = currentUser.role === 'organizer' ? activeOrganizerEvent?.id : activeEvent.id;
    return notifications.filter(
      (n) => n.eventId === 'system_all' || (activeEvtId && n.eventId === activeEvtId) || !n.eventId
    );
  }, [notifications, currentUser.role, activeOrganizerEvent?.id, activeEvent.id]);

  const broadcastNotification = (
    title: string,
    message: string,
    type: RealTimeNotification['type'],
    targetAudience: RealTimeNotification['targetAudience'],
    targetEventId = (currentUser.role === 'organizer' ? activeOrganizerEvent?.id : activeEvent.id) || activeEvent.id
  ) => {
    const targetEvt = events.find((e) => e.id === targetEventId);
    const newNotif: RealTimeNotification = {
      id: `notif_${Date.now()}`,
      eventId: targetEventId,
      eventTitle: targetEventId === 'system_all' ? 'System-Wide Announcement' : targetEvt?.title || activeEvent.title,
      title,
      message,
      type,
      targetAudience,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addAuditLog(
      'NOTIFICATION_BROADCAST',
      `Sent ${type.toUpperCase()} notification to ${targetAudience} for [${targetEventId === 'system_all' ? 'SYSTEM-WIDE' : targetEvt?.title || targetEventId}]`
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Wallet & Platform Commission Calculations (strictly tenant-isolated per organizer)
  const walletStats = useMemo(() => {
    // Only count revenue from events owned by this organizer!
    const myEventIdSet = new Set(organizerEvents.map((e) => e.id));
    const paidAttendeesForMyEvents = attendees.filter(
      (a) => myEventIdSet.has(a.eventId) && a.paymentStatus === 'paid'
    );

    const grossRevenue = paidAttendeesForMyEvents.reduce((sum, a) => sum + a.amountPaid, 0);

    const commissionRate = organization.platformCommissionRate ?? 18.0;
    const platformCommissionFee = paidAttendeesForMyEvents.reduce(
      (sum, a) => sum + (a.platformCommission ?? Math.round(a.amountPaid * (commissionRate / 100) * 100) / 100),
      0
    );
    // Total value of all receipts in organizer account (excluding platform percentage!)
    const netEarnings = paidAttendeesForMyEvents.reduce(
      (sum, a) => sum + (a.organizerEarnings ?? Math.round((a.amountPaid - (a.platformCommission ?? (a.amountPaid * (commissionRate / 100)))) * 100) / 100),
      0
    );

    const myWithdrawals = withdrawalRequests.filter(
      (w) => w.organizationId === (currentUser.organizationId || organization.id)
    );

    const totalWithdrawn = myWithdrawals
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawn = myWithdrawals
      .filter((w) => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + w.amount, 0);

    // Withdrawable balance is net receipts minus amounts already withdrawn or pending
    const withdrawableBalance = Math.max(
      0,
      Math.round((netEarnings - totalWithdrawn - pendingWithdrawn) * 100) / 100
    );

    return {
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      commissionRate,
      platformCommissionFee: Math.round(platformCommissionFee * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
      pendingWithdrawn: Math.round(pendingWithdrawn * 100) / 100,
      withdrawableBalance,
    };
  }, [organizerEvents, attendees, organization.platformCommissionRate, withdrawalRequests, currentUser.organizationId, organization.id]);

  // System Administrator Platform-wide Financial Stats
  const platformStats = useMemo(() => {
    const allPaidAttendees = attendees.filter((a) => a.paymentStatus === 'paid');
    const totalGrossTicketSales = allPaidAttendees.reduce((sum, a) => sum + a.amountPaid, 0);
    const commissionRate = organization.platformCommissionRate ?? 18.0;
    const platformEarnings = allPaidAttendees.reduce(
      (sum, a) => sum + (a.platformCommission ?? Math.round(a.amountPaid * (commissionRate / 100) * 100) / 100),
      0
    );
    const totalOrganizerNetEarnings = allPaidAttendees.reduce(
      (sum, a) => sum + (a.organizerEarnings ?? Math.round((a.amountPaid - (a.platformCommission ?? (a.amountPaid * (commissionRate / 100)))) * 100) / 100),
      0
    );

    return {
      totalGrossTicketSales: Math.round(totalGrossTicketSales * 100) / 100,
      platformEarnings: Math.round(platformEarnings * 100) / 100,
      totalOrganizerNetEarnings: Math.round(totalOrganizerNetEarnings * 100) / 100,
      commissionRate,
      totalPaidTicketsCount: allPaidAttendees.length,
    };
  }, [attendees, organization.platformCommissionRate]);

  const requestWithdrawal = (amount: number, account: WithdrawalAccount): WithdrawalRequest => {
    // Upfront commission already deducted at ticket purchase. Organizer receives 100% of requested amount.
    const fee = 0;
    const netPayoutAmount = amount;

    const newRequest: WithdrawalRequest = {
      id: `wd_${Date.now()}`,
      organizationId: organization.id,
      organizationName: organization.name,
      amount,
      currency: organization.currency,
      platformCommissionFee: fee,
      netPayoutAmount,
      bankAccount: account,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reference: `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      adminNotes: 'Disbursement from organizer withdrawable balance (fee was deducted upon ticket purchase).',
    };

    setWithdrawalRequests((prev) => [newRequest, ...prev]);
    addAuditLog(
      'WITHDRAWAL_REQUESTED',
      `Requested withdrawal payout of ${organization.currency} ${amount} (Net: ${netPayoutAmount}) to ${account.bankName} Account ${account.accountNumber}`
    );

    broadcastNotification(
      'New Withdrawal Payout Request',
      `Organizer requested withdrawal of ${organization.currency} ${amount} to ${account.bankName}.`,
      'system',
      'staff',
      'system_all'
    );

    return newRequest;
  };

  const updateWithdrawalStatus = (
    requestId: string,
    status: WithdrawalRequest['status'],
    adminNotes?: string
  ) => {
    setWithdrawalRequests((prev) =>
      prev.map((w) =>
        w.id === requestId
          ? {
              ...w,
              status,
              adminNotes: adminNotes !== undefined ? adminNotes : w.adminNotes,
              processedAt: status === 'completed' || status === 'rejected' ? new Date().toISOString() : w.processedAt,
            }
          : w
      )
    );
    addAuditLog(
      'WITHDRAWAL_STATUS_CHANGED',
      `Withdrawal ${requestId} marked as ${status.toUpperCase()}. Notes: ${adminNotes || 'None'}`
    );
  };

  const addWithdrawalAccount = (account: WithdrawalAccount) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === organization.id
          ? { ...o, withdrawalAccounts: [...(o.withdrawalAccounts || []), account] }
          : o
      )
    );
    addAuditLog('WITHDRAWAL_BANK_ADDED', `Added bank settlement account: ${account.bankName} - ${account.accountNumber}`);
  };

  const removeWithdrawalAccount = (accountNumber: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === organization.id
          ? {
              ...o,
              withdrawalAccounts: (o.withdrawalAccounts || []).filter(
                (a) => a.accountNumber !== accountNumber
              ),
            }
          : o
      )
    );
    addAuditLog('WITHDRAWAL_BANK_REMOVED', `Removed bank settlement account: ${accountNumber}`);
  };

  const updatePlatformCommissionRate = (rate: number) => {
    const validRate = Math.max(0, Math.min(100, Number(rate) || 0));
    setOrganizations((prev) =>
      prev.map((o) => ({
        ...o,
        platformCommissionRate: validRate,
      }))
    );
    addAuditLog('COMMISSION_POLICY_UPDATED', `Platform commission rate adjusted to ${validRate}%`);
    broadcastNotification(
      'Platform Commission Updated',
      `Platform commission percentage has been updated to ${validRate}%. All future ticket sales will automatically deduct ${validRate}% upfront into Platform Earnings.`,
      'system',
      'all',
      'system_all'
    );
  };

  const updateFooterSettings = (settings: Partial<FooterSettings>) => {
    setFooterSettings((prev) => ({
      ...prev,
      ...settings,
    }));
    addAuditLog('FOOTER_CONFIG_UPDATED', 'Updated public footer links and company disclosures');
  };

  const toggleTwoFactor = (enabled: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              twoFactorEnabled: enabled,
              twoFactorSecret: enabled ? 'JBSWY3DPEHPK3PXP' : undefined,
            }
          : u
      )
    );
    addAuditLog(
      enabled ? '2FA_ENABLED' : '2FA_DISABLED',
      `User ${currentUser.name} ${enabled ? 'enabled' : 'disabled'} Two-Factor Authentication.`
    );
  };

  const suspendUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: 'suspended' as any } : u)));
    addAuditLog('USER_SUSPENDED', `Admin suspended user ${userId}`);
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('USER_DELETED', `Admin deleted user ${userId}`);
  };

  const getQrCodeForTicket = async (ticketCode: string): Promise<string> => {
    const payload = JSON.stringify({ code: ticketCode, event: activeEvent.slug });
    return await generateQrDataUrl(payload);
  };

  const getQrCodeForEvent = async (eventSlug: string): Promise<string> => {
    const shareUrl = getEventShareUrl(eventSlug);
    return await generateQrDataUrl(shareUrl);
  };

  // Relational SQL Database & Seed/Unseed Methods
  const seedMockData = () => {
    const res = sqlDb.seedMockData({
      events: INITIAL_EVENTS,
      attendees: INITIAL_ATTENDEES,
      users: INITIAL_USERS,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      withdrawals: INITIAL_WITHDRAWAL_REQUESTS,
    });
    const newEvents = sqlDb.getEvents();
    const newAttendees = sqlDb.getAttendees();
    const newUsers = sqlDb.getUsers();
    const newNotifs = sqlDb.getNotifications();
    const newLogs = sqlDb.getAuditLogs();
    const newWithdrawals = sqlDb.getWithdrawalRequests();

    setEvents(newEvents);
    setAttendees(newAttendees);
    setUsers(newUsers);
    setNotifications(newNotifs);
    setAuditLogs(newLogs);
    setWithdrawalRequests(newWithdrawals);
    setIsMockDataSeeded(true);
    if (newEvents.length > 0) {
      setActiveEventId(newEvents[0].id);
    }
    addAuditLog('SQL_MOCK_SEEDED', `Seeded ${res.addedEvents} demo events and ${res.addedAttendees} demo attendees with is_mock=1 into PostgreSQL schema.`);
    return res;
  };

  const unseedMockData = () => {
    const res = sqlDb.unseedMockData();
    const newEvents = sqlDb.getEvents();
    const newAttendees = sqlDb.getAttendees();
    const newUsers = sqlDb.getUsers();
    const newNotifs = sqlDb.getNotifications();
    const newLogs = sqlDb.getAuditLogs();
    const newWithdrawals = sqlDb.getWithdrawalRequests();

    setEvents(newEvents);
    setAttendees(newAttendees);
    setUsers(newUsers);
    setNotifications(newNotifs);
    setAuditLogs(newLogs);
    setWithdrawalRequests(newWithdrawals);
    setIsMockDataSeeded(false);
    if (newEvents.length > 0) {
      setActiveEventId(newEvents[0].id);
    } else {
      setActiveEventId('');
    }
    addAuditLog('SQL_MOCK_UNSEEDED', `Purged ${res.removedEvents} demo events and ${res.removedAttendees} demo attendees. Real events and user data preserved.`);
    return res;
  };

  const clearMockData = () => {
    unseedMockData();
  };

  const createDatabaseBackup = (name?: string) => {
    const backup = sqlDb.createBackup(name, currentUser.name);
    setDatabaseBackups(sqlDb.getBackups());
    addAuditLog('DATABASE_BACKUP_CREATED', `Created database snapshot "${backup.name}" (${(backup.sizeBytes / 1024).toFixed(1)} KB)`);
    return backup;
  };

  const restoreDatabaseFromJson = (jsonStrOrObj: string | object, mode: 'replace' | 'merge' = 'replace') => {
    const res = sqlDb.restoreFromJson(jsonStrOrObj, mode);
    if (res.success) {
      setEvents(sqlDb.getEvents());
      setAttendees(sqlDb.getAttendees());
      setUsers(sqlDb.getUsers());
      setOrganizations(sqlDb.getOrganizations());
      setNotifications(sqlDb.getNotifications());
      setAuditLogs(sqlDb.getAuditLogs());
      setWithdrawalRequests(sqlDb.getWithdrawalRequests());
      setFooterSettings(sqlDb.getFooterSettings());
      setDatabaseBackups(sqlDb.getBackups());
      addAuditLog('DATABASE_RESTORED', `Database restored successfully (${mode} mode).`);
    }
    return res;
  };

  const executeSqlQuery = (sql: string) => {
    const res = sqlDb.executeSql(sql);
    if (res.affectedRows && res.affectedRows > 0) {
      setEvents(sqlDb.getEvents());
      setAttendees(sqlDb.getAttendees());
      setUsers(sqlDb.getUsers());
    }
    return res;
  };

  const deleteDatabaseBackup = (backupId: string) => {
    const remaining = databaseBackups.filter((b) => b.id !== backupId);
    setDatabaseBackups(remaining);
    sqlDb.saveBackups(remaining);
    addAuditLog('DATABASE_BACKUP_DELETED', `Deleted backup snapshot ${backupId}`);
  };

  const downloadSqlDump = () => {
    const dump = sqlDb.generateSqlDump();
    const blob = new Blob([dump], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eventsphere-database-dump-${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addAuditLog('SQL_DUMP_DOWNLOADED', 'Exported full relational SQL schema & data dump (.sql)');
  };

  const downloadJsonBackup = (backupId?: string) => {
    let jsonStr = '';
    let filename = `eventsphere-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (backupId) {
      const found = databaseBackups.find((b) => b.id === backupId);
      if (found) {
        jsonStr = found.dataJson;
        filename = `${found.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
      }
    }
    if (!jsonStr) {
      const stats = sqlDb.getDatabaseStats();
      const payload = {
        version: '2.4.0',
        exportedAt: new Date().toISOString(),
        stats,
        data: {
          events,
          attendees,
          users,
          organizations,
          notifications,
          auditLogs,
          withdrawalRequests,
          footerSettings,
        },
      };
      jsonStr = JSON.stringify(payload, null, 2);
    }
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addAuditLog('JSON_BACKUP_DOWNLOADED', `Exported full database JSON snapshot (${filename})`);
  };

  const downloadFullZipBackup = async (customTitle?: string) => {
    const { blob, filename, manifest } = await createFullZipBackup(customTitle, currentUser.name);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addAuditLog('ZIP_BACKUP_DOWNLOADED', `Exported complete ZIP archive ${filename} (${(blob.size / 1024).toFixed(1)} KB) with ${manifest.stats.assetsCount} media assets.`);
  };

  const restoreFromZipArchive = async (file: File | Blob, mode: 'replace' | 'merge' = 'replace') => {
    const res = await restoreFromZipBackup(file, mode);
    if (res.success) {
      setEvents(sqlDb.getEvents());
      setAttendees(sqlDb.getAttendees());
      setUsers(sqlDb.getUsers());
      setOrganizations(sqlDb.getOrganizations());
      setNotifications(sqlDb.getNotifications());
      setAuditLogs(sqlDb.getAuditLogs());
      setWithdrawalRequests(sqlDb.getWithdrawalRequests());
      setFooterSettings(sqlDb.getFooterSettings());
      setDatabaseBackups(sqlDb.getBackups());
      addAuditLog('ZIP_BACKUP_RESTORED', `Full ZIP Archive restored (${mode} mode).`);
    }
    return res;
  };

  const inspectZipArchive = async (file: File | Blob) => {
    return await inspectZipBackup(file);
  };

  const databaseStats = useMemo(() => {
    return sqlDb.getDatabaseStats();
  }, [events, attendees, users, organizations, notifications, auditLogs, withdrawalRequests, isMockDataSeeded]);

  return (
    <AppContext.Provider
      value={{
        organization,
        updateOrganization,
        users,
        updateUserPermissions,
        suspendUser,
        deleteUser,
        currentUser,
        setCurrentUserRole,
        events,
        organizerEvents,
        activeEvent,
        activeOrganizerEvent,
        setActiveEventId,
        createEvent,
        loadSampleEventTemplate,
        updateEvent,
        deleteEvent,
        attendees,
        activeEventAttendees,
        registerAttendee,
        checkInTicket,
        undoCheckIn,
        notifications,
        isolatedNotifications,
        broadcastNotification,
        markNotificationAsRead,
        clearNotifications,
        auditLogs,
        language,
        setLanguage,
        is2FAModalOpen,
        setIs2FAModalOpen,
        toggleTwoFactor,
        getQrCodeForTicket,
        getQrCodeForEvent,
        currentView,
        setCurrentView,
        viewingTicketCode,
        setViewingTicketCode,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        login,
        logout,
        signup,
        withdrawalRequests,
        requestWithdrawal,
        updateWithdrawalStatus,
        addWithdrawalAccount,
        removeWithdrawalAccount,
        updatePlatformCommissionRate,
        platformStats,
        walletStats,
        footerSettings,
        updateFooterSettings,
        // SQL Database & Backup/Restore
        isMockDataSeeded,
        databaseStats,
        databaseBackups,
        seedMockData,
        unseedMockData,
        clearMockData,
        createDatabaseBackup,
        restoreDatabaseFromJson,
        executeSqlQuery,
        deleteDatabaseBackup,
        downloadSqlDump,
        downloadJsonBackup,
        downloadFullZipBackup,
        restoreFromZipArchive,
        inspectZipArchive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
