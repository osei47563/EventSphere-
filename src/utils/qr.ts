import QRCode from 'qrcode';

/**
 * Generates a high-contrast QR code data URL (PNG)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    // SVG fallback or basic data URL
    return '';
  }
}

/**
 * Generates an event shareable public URL
 */
export function getEventShareUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}?event=${slug}`;
  }
  return `https://eventsphere.io/events/${slug}`;
}
