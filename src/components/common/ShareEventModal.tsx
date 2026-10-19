import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
  Calendar,
  MapPin,
  Tag,
  Globe,
  MessageCircle,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { EventData } from '../../types';
import { getEventShareUrl, generateQrDataUrl } from '../../utils/qr';
import { formatCurrency } from '../../utils/paystack';

interface ShareEventModalProps {
  event: EventData;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareEventModal: React.FC<ShareEventModalProps> = ({ event, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'social_card' | 'qr_code' | 'links'>('social_card');
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'whatsapp' | 'facebook'>('twitter');

  const shareUrl = getEventShareUrl(event.slug);
  const lowestPrice = Math.min(...event.ticketTiers.map((t) => t.price));
  const highestPrice = Math.max(...event.ticketTiers.map((t) => t.price));
  const priceDisplay =
    lowestPrice === 0
      ? 'Free - Registration Required'
      : `${formatCurrency(lowestPrice, event.currency)} - ${formatCurrency(highestPrice, event.currency)}`;

  useEffect(() => {
    if (isOpen) {
      generateQrDataUrl(shareUrl).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${event.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tweetText = `Excited to announce ${event.title}! Join us on ${new Date(
    event.startDate
  ).toLocaleDateString()} at ${event.venueName}. Register now: ${shareUrl}`;

  const whatsappText = `*${event.title}*\n${event.tagline}\n\n📅 Date: ${new Date(
    event.startDate
  ).toLocaleDateString()}\n📍 Venue: ${event.venueName}, ${event.venueAddress}\n🎟️ Tickets: ${priceDisplay}\n\nReserve your pass directly here:\n${shareUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Social Share & Event Promotion
              </h3>
              <p className="text-xs text-slate-500">
                Optimized social cards, viral direct invite links, and high-res QR badges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/40 text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveTab('social_card')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'social_card'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Social Card Preview (SEO & OG)</span>
          </button>

          <button
            onClick={() => setActiveTab('qr_code')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'qr_code'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-slate-700" />
            <span>Printable QR Badge</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'links'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-slate-700" />
            <span>Direct Purchase URL</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'social_card' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Social Media Card Mockup:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setSelectedPlatform('twitter')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedPlatform === 'twitter'
                        ? 'bg-white shadow-2xs font-bold text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    X / Twitter
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('linkedin')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedPlatform === 'linkedin'
                        ? 'bg-white shadow-2xs font-bold text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('whatsapp')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedPlatform === 'whatsapp'
                        ? 'bg-white shadow-2xs font-bold text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('facebook')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedPlatform === 'facebook'
                        ? 'bg-white shadow-2xs font-bold text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Facebook
                  </button>
                </div>
              </div>

              {/* Realistic Social Share Card Preview */}
              {selectedPlatform === 'whatsapp' ? (
                /* WhatsApp Message Preview Bubble */
                <div className="bg-[#0b141a] p-4 rounded-xl text-white font-sans max-w-md mx-auto shadow-lg border border-emerald-950">
                  <div className="bg-[#202c33] rounded-lg overflow-hidden border border-[#2a3942]">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3 space-y-1">
                      <p className="font-bold text-sm text-slate-100">{event.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{event.tagline}</p>
                      <p className="text-[11px] text-emerald-400 font-mono mt-1">eventsphere.saas.io</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {whatsappText}
                  </div>
                  <span className="block text-[10px] text-slate-400 text-right mt-1">12:00 PM · Delivered</span>
                </div>
              ) : (
                /* Twitter / LinkedIn / Facebook Rich Card Preview */
                <div className="bg-slate-50 border border-slate-300 rounded-xl overflow-hidden shadow-xs max-w-xl mx-auto hover:border-slate-400 transition-colors">
                  {/* Banner Image Container with Logo Badge */}
                  <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-white text-[11px] font-semibold">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{event.category}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-950 text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-[8px]">
                        ✦
                      </div>
                      <span>EventSphere</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200 mb-1">
                        <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {new Date(event.startDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {event.venueName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Metadata Box */}
                  <div className="p-4 bg-white border-t border-slate-200 space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      <span>eventsphere.saas.io</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{event.category}</span>
                    </span>
                    <h4 className="font-extrabold text-slate-950 text-base leading-snug">
                      {event.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.tagline} · {event.description.substring(0, 140)}...
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                      <span className="font-semibold text-slate-900">
                        Passes: <span className="text-emerald-700 font-bold">{priceDisplay}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Instant Paystack Checkout · Direct Mobile Passes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Instant Social Sharing Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Share on X (Twitter)</span>
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Share on LinkedIn</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Invitation: ${event.title}`
                  )}&body=${encodeURIComponent(
                    `Hi,\n\nYou are invited to attend ${event.title}.\n\nWhen: ${new Date(
                      event.startDate
                    ).toLocaleDateString()}\nWhere: ${event.venueName}, ${event.venueAddress}\n\nView full details and secure your ticket:\n${shareUrl}\n\nBest regards.`
                  )}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  <span>Email Invitation</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'qr_code' && (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 text-center space-y-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${event.title}`}
                    className="w-56 h-56 mx-auto rounded-lg shadow-2xs bg-white"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100 animate-pulse rounded-lg">
                    <span className="text-xs text-slate-400">Rendering QR Code...</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-xs block">{event.title}</span>
                  <span className="text-[11px] text-slate-500 font-mono">Scan for Direct Registration</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-sm text-center leading-relaxed">
                Display this QR badge on projection screens, print banners, table tents, and event flyers for instant mobile ticket purchases without account registration.
              </p>

              <button
                onClick={downloadQrCode}
                className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Print-Ready PNG (320 DPI)</span>
              </button>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Direct Registration Landing Page
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 shadow-2xs"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Search Engine & SEO Optimized</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Every shared link automatically expands with rich Open Graph headers, event schema markup, and thumbnail cards across iMessage, WhatsApp, Slack, Teams, and Google Search results.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[280px] sm:max-w-md">{shareUrl}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="text-slate-700 hover:text-slate-950 font-semibold text-xs flex items-center gap-1"
          >
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
