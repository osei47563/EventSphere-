import { EventData } from '../types';

/**
 * EventSphere SEO & Social Share Metadata Management Utility
 * Conforms to applet-seo guidelines (OpenGraph, Twitter Cards, Schema.org)
 */

export interface SEOConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'profile';
  image?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function updatePageSEO({
  title,
  description,
  canonicalPath = '',
  ogType = 'website',
  image = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
  jsonLd,
}: SEOConfig): void {
  // 1. Update Document Title
  const formattedTitle = title.includes('EventSphere')
    ? title
    : `${title} | EventSphere`;
  document.title = formattedTitle;

  // 2. Helper to set or create meta tags
  const setMeta = (nameOrProperty: string, value: string, isProperty = false) => {
    const attribute = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attribute}="${nameOrProperty}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

  // 3. Standard Meta Description
  setMeta('description', description);

  // 4. OpenGraph Tags
  setMeta('og:type', ogType, true);
  setMeta('og:title', formattedTitle, true);
  setMeta('og:description', description, true);
  setMeta('og:image', image, true);
  setMeta('og:site_name', 'EventSphere', true);

  if (typeof window !== 'undefined') {
    const url = window.location.origin + canonicalPath;
    setMeta('og:url', url, true);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }

  // 5. Twitter / X Cards
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', formattedTitle);
  setMeta('twitter:description', description);
  setMeta('twitter:image', image);

  // 6. Schema.org JSON-LD Structured Data
  if (typeof document !== 'undefined') {
    const existingScript = document.getElementById('eventsphere-page-jsonld');
    if (jsonLd) {
      const script = existingScript || document.createElement('script');
      script.id = 'eventsphere-page-jsonld';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(jsonLd);
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }
  }
}

/**
 * Builds Schema.org Event structured data for rich search engine event snippets
 */
export function buildEventJsonLd(event: EventData, origin?: string): Record<string, unknown> {
  const pageUrl = origin ? `${origin}/?event=${event.slug || event.id}` : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.tagline,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.locationType === 'virtual'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : event.locationType === 'hybrid'
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location:
      event.locationType === 'virtual'
        ? {
            '@type': 'VirtualLocation',
            url: event.virtualLink || pageUrl,
          }
        : {
            '@type': 'Place',
            name: event.venueName || 'Main Arena',
            address: {
              '@type': 'PostalAddress',
              streetAddress: event.venueAddress || event.venueName,
              addressLocality: 'Kumasi',
              addressCountry: 'GH',
            },
          },
    image: [event.coverImage],
    organizer: {
      '@type': 'Organization',
      name: 'EventSphere Verified Host',
      url: pageUrl,
    },
    offers: (event.ticketTiers || []).map((tier) => ({
      '@type': 'Offer',
      name: tier.name,
      price: tier.price.toString(),
      priceCurrency: event.currency || 'GHS',
      availability:
        (tier.capacity - tier.soldCount) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      validFrom: event.createdAt || new Date().toISOString(),
      url: pageUrl,
    })),
  };
}

/**
 * Builds Schema.org FAQPage structured data for rich FAQ Google search cards
 */
export function buildFaqJsonLd(faqs: Array<{ q: string; a: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
