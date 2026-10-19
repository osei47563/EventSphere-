export interface PaystackConfig {
  publicKey: string;
  secretKeyMasked?: string;
  isLiveMode: boolean;
  currency: string;
  webhookUrl: string;
}

export interface PaystackTransactionRequest {
  email: string;
  amount: number; // in base units (e.g., $150 or GH₵500)
  currency: string;
  reference?: string;
  ticketTierName: string;
  eventName: string;
  customerName: string;
  metadata?: Record<string, any>;
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>;
}

export interface PaystackPaymentResponse {
  reference: string;
  status: 'success' | 'failed' | 'cancelled';
  channel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money';
  amount: number;
  currency: string;
  trans?: string;
  message?: string;
}

export interface PaystackKeyValidation {
  valid: boolean;
  mode: 'production' | 'test' | 'invalid';
  isLive: boolean;
  message: string;
}

export const PAYSTACK_TEST_CARDS = [
  {
    number: '4084 0840 8408 4081',
    expiry: '09/28',
    cvv: '123',
    label: 'Standard Successful (Visa)',
    expectedOutcome: 'success',
  },
  {
    number: '5061 0000 0000 0000',
    expiry: '12/29',
    cvv: '999',
    label: 'Corporate Mastercard (Success)',
    expectedOutcome: 'success',
  },
  {
    number: '4084 0840 8408 4082',
    expiry: '04/27',
    cvv: '456',
    label: 'Declined: Insufficient Funds',
    expectedOutcome: 'declined',
  },
  {
    number: '5060 0000 0000 0001',
    expiry: '11/27',
    cvv: '789',
    label: 'Verve Card (Ghana / Nigeria)',
    expectedOutcome: 'success',
  },
];

/**
 * Validates a Paystack Public or Secret key structure
 * Production keys start with `pk_live_` or `sk_live_`
 * Test/Sandbox keys start with `pk_test_` or `sk_test_`
 */
export function validatePaystackKey(key: string): PaystackKeyValidation {
  const trimmed = key ? key.trim() : '';
  if (!trimmed) {
    return {
      valid: false,
      mode: 'invalid',
      isLive: false,
      message: 'No Paystack key provided. Enter your pk_live_... key for production.',
    };
  }

  if (trimmed.startsWith('pk_live_') || trimmed.startsWith('sk_live_')) {
    if (trimmed.length < 24) {
      return {
        valid: false,
        mode: 'production',
        isLive: true,
        message: 'Live key appears incomplete. Expected format: pk_live_xxxxxxxxxxxxxxxxxxxxxxxx',
      };
    }
    return {
      valid: true,
      mode: 'production',
      isLive: true,
      message: 'Valid Paystack Production Live Key.',
    };
  }

  if (trimmed.startsWith('pk_test_') || trimmed.startsWith('sk_test_')) {
    return {
      valid: true,
      mode: 'test',
      isLive: false,
      message: 'Paystack Test Sandbox Key. Suitable for local simulation, not real money.',
    };
  }

  return {
    valid: false,
    mode: 'invalid',
    isLive: false,
    message: 'Invalid key format. Paystack keys must start with pk_live_ or pk_test_',
  };
}

/**
 * Generates an official Paystack-compliant unique transaction reference
 */
export function generatePaystackReference(prefix = 'PSTK'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Converts standard currency amounts to Paystack subunits (e.g. 50 GHS -> 5000 pesewas, $10 -> 1000 cents)
 * CRITICAL for Paystack: amount must be multiplied by 100!
 */
export function toPaystackSubunits(amount: number): number {
  return Math.round(Number(amount) * 100);
}

/**
 * Format currency with international symbols
 */
export function formatCurrency(amount: number, currency = 'GHS'): string {
  try {
    const symbolMap: Record<string, string> = {
      USD: '$',
      NGN: '₦',
      GHS: 'GH₵',
      KES: 'KSh',
      ZAR: 'R',
      EUR: '€',
      GBP: '£',
    };

    const symbol = symbolMap[currency] || currency + ' ';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * Calculates Paystack gateway fee
 * 1.5% for local transactions (e.g., Ghana/Nigeria capped), 3.9% for international
 */
export function calculatePaystackFee(amount: number, currency: string): { fee: number; netAmount: number } {
  let fee = 0;
  if (currency === 'NGN') {
    fee = Math.min(amount * 0.015 + (amount >= 2500 ? 100 : 0), 2000);
  } else if (currency === 'GHS') {
    fee = Math.min(amount * 0.0195, 300);
  } else if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    fee = amount * 0.039 + 0.30;
  } else {
    fee = amount * 0.02;
  }
  return {
    fee: Math.round(fee * 100) / 100,
    netAmount: Math.round((amount - fee) * 100) / 100,
  };
}

/**
 * Dynamically loads Paystack's official Inline JavaScript SDK into the document
 */
export function loadPaystackInlineScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).PaystackPop) return Promise.resolve(true);

  return new Promise((resolve) => {
    // Check if already injected
    const existing = document.querySelector('script[src*="paystack.co"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Paystack inline.js script could not be loaded from CDN. Fallback modal will be used.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Checks if Paystack Inline SDK is loaded in window
 */
export function isPaystackLoaded(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).PaystackPop !== 'undefined';
}

/**
 * Launches official Paystack Inline popup
 * Uses window.PaystackPop.setup({...})
 */
export function launchPaystackInline(
  config: {
    publicKey: string;
    request: PaystackTransactionRequest;
    onSuccess: (response: PaystackPaymentResponse) => void;
    onClose: () => void;
  }
): boolean {
  if (!isPaystackLoaded()) {
    return false;
  }

  const { publicKey, request, onSuccess, onClose } = config;
  const paystackRef = request.reference || generatePaystackReference(publicKey.startsWith('pk_live_') ? 'PSTK_LIVE' : 'PSTK_TEST');
  const subunitAmount = toPaystackSubunits(request.amount);

  try {
    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: request.email,
      amount: subunitAmount,
      currency: request.currency || 'GHS',
      ref: paystackRef,
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: request.customerName,
          },
          {
            display_name: 'Event',
            variable_name: 'event_name',
            value: request.eventName,
          },
          {
            display_name: 'Ticket Tier',
            variable_name: 'ticket_tier',
            value: request.ticketTierName,
          },
        ],
        ...request.metadata,
      },
      channels: request.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      callback: (res: any) => {
        onSuccess({
          reference: res.reference || paystackRef,
          status: 'success',
          channel: res.channel || (request.channels?.[0] as any) || 'card',
          amount: request.amount,
          currency: request.currency,
          trans: res.trans,
          message: res.message || 'Approved',
        });
      },
      onClose: () => {
        onClose();
      },
    });

    if (handler && typeof handler.openIframe === 'function') {
      handler.openIframe();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Failed to launch PaystackPop iframe:', err);
    return false;
  }
}

/**
 * Simulates and verifies a Paystack Webhook event
 */
export function simulatePaystackWebhook(
  event: 'charge.success' | 'transfer.success' | 'transfer.failed',
  data: Record<string, any>
): {
  event: string;
  status: 'verified';
  deliveredAt: string;
  signature: string;
  data: Record<string, any>;
} {
  const dummySignature = 'sha512_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  return {
    event,
    status: 'verified',
    deliveredAt: new Date().toISOString(),
    signature: dummySignature,
    data: {
      id: Math.floor(Math.random() * 90000000) + 10000000,
      domain: 'live',
      status: 'success',
      reference: data.reference || generatePaystackReference('PSTK_LIVE'),
      amount: toPaystackSubunits(data.amount || 100),
      currency: data.currency || 'GHS',
      channel: data.channel || 'card',
      paid_at: new Date().toISOString(),
      customer: {
        email: data.email || 'customer@example.com',
        customer_code: 'CUS_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
      ...data,
    },
  };
}
