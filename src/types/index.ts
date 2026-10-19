export type UserRole = 'system_admin' | 'organizer' | 'door_staff' | 'attendee' | 'suspended';

export type AppView =
  | 'home'
  | 'dashboard'
  | 'public_event'
  | 'ticket_pass'
  | 'scanner'
  | 'admin'
  | 'wallet'
  | 'auth'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'contact';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  permissions: {
    canCreateEvents: boolean;
    canEditFinancials: boolean;
    canScanTickets: boolean;
    canBroadcastNotifications: boolean;
    canManageTeam: boolean;
  };
  isMock?: boolean;
}

export interface WithdrawalAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingOrSwiftCode?: string;
  currency: string;
}

export interface WithdrawalRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  currency: string;
  platformCommissionFee: number;
  netPayoutAmount: number;
  bankAccount: WithdrawalAccount;
  status: 'pending' | 'processing' | 'completed' | 'successful' | 'failed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
  reference: string;
  isMock?: boolean;
}

export interface FooterSettings {
  companyName: string;
  tagline: string;
  supportEmail: string;
  copyrightYear: string;
  disclaimer: string;
  statusText: string;
  socialLinks: {
    twitter: string;
    linkedin: string;
    github: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'Starter' | 'Professional' | 'Enterprise';
  paystackPublicKey: string;
  paystackSecretKeyMasked: string;
  currency: 'USD' | 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'EUR' | 'GBP';
  platformCommissionRate: number; // percentage, e.g. 5.0%
  withdrawalAccount?: WithdrawalAccount;
  createdAt: string;
  totalEvents: number;
  totalRevenue: number;
  logo?: string;
  isMock?: boolean;
}

export type TicketType = 'free' | 'paid' | 'vip' | 'early_bird';

export type SeatLayoutType = 'dinner_tables' | 'theater_rows';

export interface SeatItem {
  id: string; // e.g. "T1-S3" or "A-12"
  label: string; // "Table 1 · Seat 3" or "Row A · Seat 12"
  section: string; // "Presidential Table 1", "Plenary Row A"
  status: 'available' | 'occupied' | 'reserved';
  tierId: string;
  occupantName?: string;
  occupantCompany?: string;
}

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: TicketType;
  capacity: number;
  soldCount: number;
  perks: string[];
  salesEnd: string;
  requiresSeatSelection?: boolean;
  seatLayoutType?: SeatLayoutType;
}

export interface AgendaSession {
  id: string;
  title: string;
  description: string;
  speakerName: string;
  speakerRole: string;
  speakerCompany: string;
  speakerAvatar?: string;
  room: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:15"
  date: string;      // "2026-10-24"
  category: 'Keynote' | 'Panel' | 'Breakout' | 'Dinner & Networking' | 'Workshop';
  isLive?: boolean;
}

export interface CustomFormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[]; // for select/radio
  placeholder?: string;
}

export interface EventData {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: 'Corporate Conference' | 'Gala Dinner' | 'Executive Summit' | 'Product Launch' | 'Tech Expo' | 'Music & Festival' | 'Hackathon & Workshop' | 'Concert & Entertainment' | string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  timezone: string;
  locationType: 'in_person' | 'hybrid' | 'virtual';
  venueName: string;
  venueAddress: string;
  virtualLink?: string;
  coverImage: string;
  logoImage?: string;
  organizerId: string;
  organizationId: string;
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  ticketTiers: TicketTier[];
  schedule: AgendaSession[];
  customFields: CustomFormField[];
  automatedReminders: {
    send24hReminder: boolean;
    send1hReminder: boolean;
    sendPostEventSurvey: boolean;
  };
  totalCapacity: number;
  currency: string;
  visibility?: 'public' | 'private';
  createdAt: string;
  isMock?: boolean;
}

export interface Attendee {
  id: string;
  eventId: string;
  ticketTierId: string;
  ticketTierName: string;
  ticketCode: string; // unique scan code (e.g., TKT-9842-X7)
  qrDataUrl?: string;
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle: string;
  assignedSeat?: string;
  customAnswers: Record<string, string>;
  paymentStatus: 'paid' | 'free' | 'pending' | 'refunded';
  paymentReference?: string;
  amountPaid: number; // Actual gross amount paid by buyer (e.g. 50 GHS)
  commissionRate?: number; // Platform commission % deducted at sale (e.g. 18%)
  platformCommission?: number; // Deducted platform earnings (e.g. 9 GHS)
  organizerEarnings?: number; // Actual amount left in organizer account (e.g. 41 GHS)
  currency: string;
  paymentChannel?: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' | string;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  createdAt: string;
  isMock?: boolean;
}

export interface TransactionReceipt {
  receiptId: string;
  reference: string;
  createdAt: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizerName: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  ticketTierName: string;
  ticketCode: string;
  amountPaid: number; // 1. Actual amount paid
  commissionRate: number; // Platform percentage (e.g. 18%)
  platformCommission: number; // 2. Platform commission deducted
  organizerEarnings: number; // 3. Actual amount left in organizer account
  currency: string;
  paymentChannel: string;
  status: 'paid' | 'settled' | 'refunded';
}

export interface RealTimeNotification {
  id: string;
  eventId?: string; // 'system_all' or specific eventId
  eventTitle?: string;
  title: string;
  message: string;
  type: 'urgent' | 'announcement' | 'reminder' | 'system';
  targetAudience: 'all' | 'attendees' | 'staff' | 'vip';
  timestamp: string;
  read: boolean;
  isMock?: boolean;
}

export interface PaystackPaymentDetails {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  ticketTierId: string;
  channel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';
  paidAt: string;
  status: 'success' | 'failed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  isMock?: boolean;
}

export interface DatabaseBackup {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  tablesCount: number;
  totalRecords: number;
  realRecordsCount: number;
  mockRecordsCount: number;
  createdBy: string;
  sqlDump: string;
  dataJson: string;
  version: string;
}

export interface TableStat {
  tableName: string;
  displayName: string;
  totalRows: number;
  realRows: number;
  mockRows: number;
  columns: string[];
}

export interface DatabaseStats {
  engine: string;
  status: 'connected' | 'disconnected' | 'migrating';
  tables: TableStat[];
  totalRecords: number;
  realRecords: number;
  mockRecords: number;
  lastBackupDate?: string;
  storageSizeBytes: number;
  mockDataEnabled: boolean;
}

export interface SqlQueryResult {
  query: string;
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  affectedRows?: number;
  error?: string;
}

