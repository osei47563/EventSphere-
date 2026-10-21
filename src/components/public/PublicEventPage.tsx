import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TicketTier } from '../../types';
import { formatCurrency, launchPaystackInline } from '../../utils/paystack';
import { PaystackModal } from '../paystack/PaystackModal';
import { updatePageSEO, buildEventJsonLd } from '../../utils/seo';

export const PublicEventPage: React.FC = () => {
  const { activeEvent, setCurrentView, registerAttendee, organization } = useApp();

  useEffect(() => {
    if (activeEvent) {
      updatePageSEO({
        title: `${activeEvent.title} – Tickets & Schedule`,
        description: activeEvent.description
          ? activeEvent.description.slice(0, 155)
          : `${activeEvent.tagline || 'Join us for ' + activeEvent.title} at ${activeEvent.venueName}. Buy verified tickets with instant QR passes.`,
        canonicalPath: `/?event=${activeEvent.slug || activeEvent.id}`,
        ogType: 'website',
        image: activeEvent.coverImage,
        jsonLd: buildEventJsonLd(activeEvent, typeof window !== 'undefined' ? window.location.origin : undefined),
      });
    }
  }, [activeEvent]);

  const [pageView, setPageView] = useState<'details' | 'checkout' | 'success'>('details');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      activeEvent.ticketTiers.forEach((tier, idx) => {
        init[tier.id] = idx === 0 ? 1 : 0;
      });
      return init;
    }
  );

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [discount, setDiscount] = useState(0);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mobile-money' | 'card'>('mobile-money');
  const [formError, setFormError] = useState('');
  const [confirmedAttendees, setConfirmedAttendees] = useState<any[]>([]);
  const [selectedTicketTab, setSelectedTicketTab] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);

  const getSubtotal = () => {
    return activeEvent.ticketTiers.reduce((sum, tier) => {
      const qty = quantities[tier.id] || 0;
      return sum + tier.price * qty;
    }, 0);
  };

  const getTicketCount = () => {
    return Object.values(quantities).reduce((sum, q) => sum + q, 0);
  };

  const getFee = () => getSubtotal() * 0.03;
  const getTotal = () => Math.max(0, getSubtotal() + getFee() - discount);

  const changeQty = (tierId: string, delta: number) => {
    const current = quantities[tierId] || 0;
    const next = current + delta;
    if (next < 0 || next > 10) return;
    setQuantities((prev) => ({ ...prev, [tierId]: next }));
  };

  const applyPromo = () => {
    if (getTicketCount() === 0) {
      setPromoMessage('Select tickets before applying a promo code.');
      return;
    }
    if (promoCode.trim().toUpperCase() === 'GREEN10') {
      const disc = getSubtotal() * 0.10;
      setDiscount(disc);
      setPromoMessage('Demo code applied: 10% off tickets.');
    } else {
      setDiscount(0);
      setPromoMessage('That promo code is not valid in this demo.');
    }
  };

  // Helper to register each individual ticket item
  const registerAllPurchasedTickets = async (
    paymentRef?: string,
    channel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money' = 'card'
  ): Promise<any[]> => {
    const registered: any[] = [];
    const totalOrderAmount = getTotal();
    const totalCount = getTicketCount();

    // Iterate through all tiers and quantities
    for (const tier of activeEvent.ticketTiers) {
      const qty = quantities[tier.id] || 0;
      if (qty <= 0) continue;

      const singleTierPrice = tier.price;
      const currency = tier.currency || activeEvent.currency || organization.currency || 'GHS';

      for (let i = 0; i < qty; i++) {
        // Individual ticket price proportion
        const singlePrice = totalOrderAmount === 0 ? 0 : singleTierPrice;
        const attendee = await registerAttendee({
          eventId: activeEvent.id,
          ticketTierId: tier.id,
          fullName: qty > 1 ? `${firstName.trim()} ${lastName.trim()} (Ticket #${registered.length + 1})` : `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          company: 'Attendee',
          jobTitle: 'Guest',
          customAnswers: {
            ticketItemNumber: String(registered.length + 1),
            totalInOrder: String(totalCount),
          },
          amountPaid: singlePrice,
          currency,
          paymentChannel: channel,
          paymentReference: paymentRef,
        });
        registered.push(attendee);
      }
    }
    return registered;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Please fill out all required contact fields.');
      return;
    }

    if (!agreeTerms) {
      setFormError('You must agree to the Terms and Conditions before continuing.');
      return;
    }

    if (getTicketCount() < 1) {
      setFormError('Your order has no tickets. Please select at least one ticket.');
      return;
    }

    const totalAmount = getTotal();
    const primaryTier = activeEvent.ticketTiers.find((t) => (quantities[t.id] || 0) > 0) || activeEvent.ticketTiers[0];
    const currency = primaryTier?.currency || activeEvent.currency || organization.currency || 'GHS';
    const chosenChannel: 'card' | 'mobile_money' = paymentMethod === 'card' ? 'card' : 'mobile_money';

    // If Free Ticket (amount == 0), register directly without payment gateway
    if (totalAmount === 0) {
      setIsSubmitting(true);
      try {
        const attendeesList = await registerAllPurchasedTickets(undefined, 'card');
        setConfirmedAttendees(attendeesList);
        setSelectedTicketTab(0);
        setPageView('success');
      } catch (err) {
        setFormError('Booking submission failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For Paid Tickets: Try launching official Paystack inline popup first
    const pubKey = organization.paystackPublicKey || 'pk_live_d3a846f491c7a915f02bc4594c7182e04f';
    const inlineOpened = launchPaystackInline({
      publicKey: pubKey,
      request: {
        email: email.trim(),
        amount: totalAmount,
        currency,
        eventName: activeEvent.title,
        ticketTierName: `${getTicketCount()}x Tickets (${primaryTier.name}...)`,
        customerName: `${firstName.trim()} ${lastName.trim()}`,
        channels: chosenChannel === 'card' ? ['card', 'bank_transfer', 'ussd'] : ['mobile_money', 'card'],
      },
      onSuccess: async (paystackRes) => {
        setIsSubmitting(true);
        try {
          const attendeesList = await registerAllPurchasedTickets(
            paystackRes.reference,
            (paystackRes.channel as any) || chosenChannel
          );
          setConfirmedAttendees(attendeesList);
          setSelectedTicketTab(0);
          setPageView('success');
        } catch (err) {
          setFormError('Payment confirmed, but booking registration failed. Please contact support with reference: ' + paystackRes.reference);
        } finally {
          setIsSubmitting(false);
        }
      },
      onClose: () => {
        // user cancelled popup
      },
    });

    if (!inlineOpened) {
      // In-app Paystack modal fallback
      setIsPaystackOpen(true);
    }
  };

  const handlePaystackModalSuccess = async (
    paymentReference: string,
    channel: 'card' | 'bank_transfer' | 'ussd' | 'mobile_money'
  ) => {
    setIsPaystackOpen(false);
    setIsSubmitting(true);
    try {
      const attendeesList = await registerAllPurchasedTickets(paymentReference, channel);
      setConfirmedAttendees(attendeesList);
      setSelectedTicketTab(0);
      setPageView('success');
    } catch (err) {
      setFormError('Registration could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eventsphere-body min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="container nav-inner">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} aria-label="EventSphere home">
            <span className="brand-mark">◈</span>
            <span>EventSphere</span>
          </a>

          <nav className="nav-links" aria-label="Main navigation">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Discover</a>
            <a href="#event-details">Events</a>
            <a href="#organizer">Organizers</a>
          </nav>

          <div className="nav-actions">
            <button className="btn btn-outline" onClick={() => setCurrentView('home')}>Explore events</button>
            <div className="avatar" aria-label="Guest account">G</div>
          </div>
        </div>
      </header>

      {/* DEMO SWITCHER */}
      <div className="demo-switcher">
        <button
          className={`switch-btn ${pageView === 'details' ? 'active' : ''}`}
          onClick={() => setPageView('details')}
        >
          01 · Event details
        </button>
        <button
          className={`switch-btn ${pageView === 'checkout' ? 'active' : ''}`}
          onClick={() => {
            if (getTicketCount() > 0) setPageView('checkout');
            else alert('Please select at least one ticket first.');
          }}
        >
          02 · Checkout
        </button>
      </div>

      {/* PAGE 1: EVENT DETAILS */}
      {pageView === 'details' && (
        <main className="flex-1">
          <div className="container">
            <div className="breadcrumbs">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Home</a>
              <span>/</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Events</a>
              <span>/</span>
              <span>{activeEvent.category}</span>
            </div>

            <section
              className="event-cover"
              style={{ backgroundImage: `url("${activeEvent.coverImage}")` }}
              aria-label="Event banner"
            >
              <div className="cover-content">
                <span className="event-tag">✦ FEATURED EVENT</span>
                <h1>{activeEvent.title}</h1>
                <p className="cover-subtitle">{activeEvent.tagline}</p>
              </div>
            </section>

            <div className="event-layout" id="event-details">
              {/* Main event information */}
              <section className="event-main">
                <div className="event-meta">
                  <div className="meta-card">
                    <div className="meta-icon">📅</div>
                    <div>
                      <strong>{new Date(activeEvent.startDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                      <span>{new Date(activeEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="meta-card">
                    <div className="meta-icon">📍</div>
                    <div>
                      <strong>{activeEvent.venueName}</strong>
                      <span>{activeEvent.venueAddress}</span>
                    </div>
                  </div>

                  <div className="meta-card">
                    <div className="meta-icon">🎟️</div>
                    <div>
                      <strong>Multiple ticket options</strong>
                      <span>Choose the experience you want</span>
                    </div>
                  </div>

                  <div className="meta-card">
                    <div className="meta-icon">👥</div>
                    <div>
                      <strong>Live experience</strong>
                      <span>Friends, music and good vibes</span>
                    </div>
                  </div>
                </div>

                <section className="description">
                  <h2 className="section-heading">About this event</h2>
                  <p>{activeEvent.description}</p>
                </section>

                <section>
                  <h2 className="section-heading">What to expect</h2>
                  <div className="event-highlights">
                    <div className="highlight"><span>🎤</span>Live performances &amp; sessions</div>
                    <div className="highlight"><span>🍔</span>Food and refreshment vendors</div>
                    <div className="highlight"><span>🎨</span>Interactive experiences</div>
                    <div className="highlight"><span>🤝</span>Community and networking</div>
                  </div>
                </section>

                <section className="description">
                  <h2 className="section-heading">Location &amp; venue</h2>
                  <p>
                    <strong>{activeEvent.venueName}, {activeEvent.venueAddress}</strong><br />
                    Plan your journey ahead of time. Check the event organizer's official updates for entry instructions.
                  </p>
                </section>

                <section className="organizer-card" id="organizer">
                  <div className="organizer-logo">GV</div>
                  <div>
                    <strong>{activeEvent.venueName} Organizer</strong>
                    <p>Event organizer · Bringing people together through exceptional experiences</p>
                  </div>
                </section>
              </section>

              {/* Ticket selection panel */}
              <aside className="ticket-panel" aria-label="Select tickets">
                <h2>Get your tickets</h2>
                <p className="ticket-panel-intro">Choose your ticket type and quantity.</p>

                {(activeEvent.ticketTiers || []).length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', background: '#F8FAF8', borderRadius: '10px', border: '1px dashed #CCD7CE' }}>
                    <p style={{ fontSize: '13px', color: '#527461', margin: '0 0 12px 0' }}>
                      No ticket tiers currently active for this event.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setCurrentView('home')}
                      style={{ fontSize: '12px' }}
                    >
                      ← Explore Events
                    </button>
                  </div>
                ) : (
                  (activeEvent.ticketTiers || []).map((tier) => {
                    const qty = quantities[tier.id] || 0;
                    return (
                      <div key={tier.id} className="ticket-option">
                        <div className="ticket-row">
                          <div>
                            <div className="ticket-name">{tier.name}</div>
                            <span className="ticket-description">{tier.description}</span>
                          </div>
                          <div className="ticket-price">
                            {tier.price === 0 ? 'Free' : formatCurrency(tier.price, tier.currency || activeEvent.currency)}
                          </div>
                        </div>
                        <div className="quantity-control">
                          <button onClick={() => changeQty(tier.id, -1)} aria-label={`Remove ${tier.name} ticket`}>−</button>
                          <span className="quantity">{qty}</span>
                          <button onClick={() => changeQty(tier.id, 1)} aria-label={`Add ${tier.name} ticket`}>+</button>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="summary-line" style={{ marginTop: '20px' }}>
                  <span className="muted">Tickets selected</span>
                  <strong>{getTicketCount()}</strong>
                </div>
                <div className="summary-line total">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getSubtotal(), activeEvent.currency)}</span>
                </div>

                <button
                  className="btn btn-primary btn-block"
                  id="continueButton"
                  onClick={() => setPageView('checkout')}
                  disabled={getTicketCount() === 0}
                  style={{ marginTop: '16px' }}
                >
                  Continue to checkout →
                </button>

                <div className="secure-note">🔒 Secure checkout · Instant digital ticket confirmation</div>
                <div className="notice">Choose at least one ticket to continue.</div>
              </aside>
            </div>
          </div>
        </main>
      )}

      {/* PAGE 2: CHECKOUT */}
      {pageView === 'checkout' && (
        <main className="flex-1">
          <div className="container">
            <div className="checkout-header">
              <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); setPageView('details'); }}>
                ← Back to event
              </a>
              <h1>Complete your booking</h1>
              <p>Enter your details to continue with your ticket order.</p>

              <div className="checkout-progress" aria-label="Checkout progress">
                <div className="progress-step active">
                  <span className="step-number">1</span>
                  <span>Details</span>
                </div>
                <span className="progress-line"></span>
                <div className="progress-step active">
                  <span className="step-number">2</span>
                  <span>Payment</span>
                </div>
                <span className="progress-line"></span>
                <div className="progress-step">
                  <span className="step-number">3</span>
                  <span>Confirmation</span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="message-box error" role="alert">{formError}</div>
            )}

            <form onSubmit={handleCheckoutSubmit} noValidate>
              <div className="checkout-layout">
                {/* Checkout forms */}
                <div className="checkout-form-column">
                  <section className="form-card">
                    <h2>Contact information</h2>
                    <p className="form-subtitle">
                      Your tickets and booking confirmation will be sent to these details.
                    </p>

                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="firstName">First name *</label>
                        <input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Ama"
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="lastName">Last name *</label>
                        <input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g. Mensah"
                          required
                        />
                      </div>

                      <div className="field full">
                        <label htmlFor="email">Email address *</label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </div>

                      <div className="field full">
                        <label htmlFor="phone">Phone number *</label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 024 123 4567"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <section className="form-card">
                    <h2>Payment method</h2>
                    <p className="form-subtitle">
                      Select your preferred payment option via Paystack secure gateway.
                    </p>

                    <label className="payment-choice">
                      <input
                        type="radio"
                        name="payment"
                        value="mobile-money"
                        checked={paymentMethod === 'mobile-money'}
                        onChange={() => setPaymentMethod('mobile-money')}
                      />
                      <span className="payment-icon">📱</span>
                      <span>
                        <strong>Mobile Money</strong>
                        <small>MTN MoMo, Telecel Cash or AT Money</small>
                      </span>
                    </label>

                    <label className="payment-choice">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <span className="payment-icon">💳</span>
                      <span>
                        <strong>Debit or credit card</strong>
                        <small>Visa, Mastercard or Verve</small>
                      </span>
                    </label>
                  </section>

                  <section className="form-card">
                    <h2>Booking preferences</h2>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                      />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentView('terms')}
                          style={{ color: 'var(--green-800)', fontWeight: 750, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Terms and Conditions
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentView('privacy')}
                          style={{ color: 'var(--green-800)', fontWeight: 750, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Privacy Policy
                        </button>. *
                      </span>
                    </label>
                  </section>

                  <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing Payment...' : 'Complete Secure Payment →'}
                  </button>
                </div>

                {/* Sticky order summary */}
                <aside className="order-card">
                  <h2>Your order</h2>

                  <div className="order-event">
                    <div
                      className="order-thumbnail"
                      style={{ backgroundImage: `url("${activeEvent.coverImage}")` }}
                      aria-hidden="true"
                    ></div>
                    <div>
                      <strong>{activeEvent.title}</strong>
                      <span>📅 {new Date(activeEvent.startDate).toLocaleDateString()}</span>
                      <span>📍 {activeEvent.venueName}</span>
                    </div>
                  </div>

                  <div className="order-items">
                    {activeEvent.ticketTiers.map((tier) => {
                      const qty = quantities[tier.id] || 0;
                      if (!qty) return null;
                      return (
                        <div key={tier.id} className="order-item">
                          <span>{tier.name} × {qty}</span>
                          <strong>{formatCurrency(tier.price * qty, tier.currency || activeEvent.currency)}</strong>
                        </div>
                      );
                    })}
                  </div>

                  <div className="promo-row">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (try GREEN10)"
                    />
                    <button type="button" onClick={applyPromo}>Apply</button>
                  </div>
                  {promoMessage && <div className="promo-message">{promoMessage}</div>}

                  <div className="summary-line">
                    <span className="muted">Subtotal</span>
                    <span>{formatCurrency(getSubtotal(), activeEvent.currency)}</span>
                  </div>

                  <div className="summary-line">
                    <span className="muted">Service fee (3%)</span>
                    <span>{formatCurrency(getFee(), activeEvent.currency)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="summary-line">
                      <span className="muted">Discount</span>
                      <span>− {formatCurrency(discount, activeEvent.currency)}</span>
                    </div>
                  )}

                  <div className="checkout-total">
                    <div className="summary-line total">
                      <span>Total</span>
                      <span>{formatCurrency(getTotal(), activeEvent.currency)}</span>
                    </div>
                  </div>

                  <div className="secure-note">🔒 Paystack Secured Checkout</div>
                </aside>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* PAGE 3: SUCCESS CONFIRMATION & VERIFIED RECEIPT */}
      {pageView === 'success' && (
        <main className="flex-1" style={{ padding: '36px 0', background: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: '780px', margin: '0 auto' }}>
            {/* Top Order Overview Banner */}
            <div style={{ background: '#0F172A', color: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 28px', borderBottom: '3px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#34D399', fontWeight: 800 }}>
                    ✓ Order Confirmed · Verified Passes
                  </span>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 2px' }}>
                    {confirmedAttendees.length} Verified {confirmedAttendees.length === 1 ? 'Ticket Pass' : 'Ticket Passes'} Issued
                  </h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                    Purchased by <strong style={{ color: '#F1F5F9' }}>{firstName} {lastName}</strong> ({email})
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>Total Paid</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', fontFamily: 'monospace' }}>
                    {formatCurrency(getTotal(), activeEvent.currency || organization.currency || 'GHS')}
                  </div>
                </div>
              </div>

              {/* Multi-Ticket Switcher Tabs if more than 1 ticket bought */}
              {confirmedAttendees.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {confirmedAttendees.map((att, idx) => (
                    <button
                      key={att.id || idx}
                      type="button"
                      onClick={() => setSelectedTicketTab(idx)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: selectedTicketTab === idx ? '#10B981' : '#1E293B',
                        color: selectedTicketTab === idx ? '#FFFFFF' : '#CBD5E1',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ticket #{idx + 1} ({att.ticketTierName})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Printable / Exportable Ticket Container (A5 layout, Centered QR, Clean Table Grid) */}
            {(() => {
              const currentTicket = confirmedAttendees[selectedTicketTab] || confirmedAttendees[0];
              if (!currentTicket) return null;

              return (
                <div
                  id="receipt-container"
                  style={{
                    background: '#FFFFFF',
                    padding: '28px 24px',
                    border: '1px solid #E2E8F0',
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.5px' }}>
                        Ticket {selectedTicketTab + 1} of {confirmedAttendees.length}
                      </span>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
                        {activeEvent.title}
                      </h2>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                        📍 {activeEvent.venueName} · 📅 {new Date(activeEvent.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{ padding: '4px 10px', background: '#ECFDF5', color: '#065F46', borderRadius: '6px', fontSize: '11px', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                      {currentTicket.ticketTierName.toUpperCase()} PASS
                    </span>
                  </div>

                  {/* QR Code Centrally Positioned at Top */}
                  <div style={{ textAlign: 'center', margin: '14px 0 20px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    {currentTicket.qrDataUrl ? (
                      <img
                        src={currentTicket.qrDataUrl}
                        alt="Ticket Gate QR Code"
                        style={{ width: '150px', height: '150px', margin: '0 auto', display: 'block', background: '#fff', padding: '6px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    ) : (
                      <div style={{ width: '150px', height: '150px', background: '#E2E8F0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#64748B' }}>
                        QR Code Pass
                      </div>
                    )}
                    <div style={{ fontFamily: 'monospace', fontSize: '17px', fontWeight: 800, color: '#059669', marginTop: '10px', letterSpacing: '1px' }}>
                      {currentTicket.ticketCode}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
                      Scan at door gate entrance for instant access validation. Each ticket has a distinct scannable code.
                    </p>
                  </div>

                  {/* Table-like Grid for Ticket Details */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                    <tbody>
                      {[
                        { label: 'Event', value: activeEvent.title },
                        { label: 'Ticket Holder', value: currentTicket.fullName },
                        { label: 'Admission Tier', value: currentTicket.ticketTierName },
                        { label: 'Ticket Code', value: currentTicket.ticketCode },
                        { label: 'Purchaser Email', value: currentTicket.email },
                        { label: 'Phone', value: currentTicket.phone || phone || 'N/A' },
                        { label: 'Item Price', value: formatCurrency(currentTicket.amountPaid, currentTicket.currency || activeEvent.currency) },
                        { label: 'Payment Reference', value: currentTicket.paymentReference || 'N/A' },
                        { label: 'Digital Security Seal', value: currentTicket.securitySeal || 'ES-VERIFIED-PASS' },
                        { label: 'Anti-Forgery Verification', value: '🛡️ Cryptographically Signed & Watermarked' },
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 4px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', width: '35%' }}>
                            {row.label}
                          </td>
                          <td style={{ padding: '8px 4px', color: '#0F172A', fontWeight: 600, fontFamily: row.label.includes('Seal') ? 'monospace' : 'inherit' }}>
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                    EventSphere Verified Ticketing · Issued on {new Date(currentTicket.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              );
            })()}

            {/* Hidden container with all tickets for Multi-Ticket All-In-One PDF Export */}
            <div id="all-tickets-export-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '560px' }}>
              {confirmedAttendees.map((att, idx) => (
                <div
                  key={att.id || idx}
                  className="pdf-ticket-page"
                  style={{
                    background: '#FFFFFF',
                    padding: '24px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    pageBreakAfter: 'always',
                    boxSizing: 'border-box',
                    width: '560px',
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669' }}>
                      EVENTSPHERE ADMISSION PASS · TICKET #{idx + 1} OF {confirmedAttendees.length}
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
                      {activeEvent.title}
                    </h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
                      📍 {activeEvent.venueName} · 📅 {new Date(activeEvent.startDate).toLocaleString()}
                    </p>
                  </div>

                  {/* Centered QR */}
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    {att.qrDataUrl ? (
                      <img
                        src={att.qrDataUrl}
                        alt="QR Code"
                        style={{ width: '140px', height: '140px', margin: '0 auto', display: 'block', border: '1px solid #CBD5E1', padding: '4px', borderRadius: '6px' }}
                      />
                    ) : null}
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
                      {att.ticketCode}
                    </div>
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', background: '#ECFDF5', color: '#065F46', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                      ACCESS: {att.ticketTierName.toUpperCase()}
                    </span>
                  </div>

                  {/* Table details */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>ATTENDEE</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, color: '#0F172A' }}>{att.fullName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>TIER</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, color: '#0F172A' }}>{att.ticketTierName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>PRICE</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, color: '#0F172A' }}>{formatCurrency(att.amountPaid, att.currency || activeEvent.currency)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>PAYMENT REF</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, color: '#0F172A' }}>{att.paymentReference || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>SECURITY SEAL</td>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{att.securitySeal || 'ES-VERIFIED'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px 0', fontWeight: 700, color: '#64748B' }}>STATUS</td>
                        <td style={{ padding: '6px 0', fontWeight: 600, color: '#059669' }}>✓ Verified Tamper-Proof Pass</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ marginTop: '12px', fontSize: '10px', color: '#94A3B8', textAlign: 'center' }}>
                    Present this distinct ticket pass at the venue entrance gate. Scannable & verifiable independently.
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '220px' }}
                onClick={async () => {
                  const { jsPDF } = await import('jspdf');
                  const html2canvas = (await import('html2canvas')).default;

                  // If multiple tickets, generate a comprehensive PDF with every individual ticket on its own page
                  if (confirmedAttendees.length > 1) {
                    const ticketElements = document.querySelectorAll('.pdf-ticket-page');
                    if (ticketElements.length > 0) {
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const pdfHeight = pdf.internal.pageSize.getHeight();

                      for (let i = 0; i < ticketElements.length; i++) {
                        const el = ticketElements[i] as HTMLElement;
                        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
                        const imgData = canvas.toDataURL('image/png', 1.0);
                        const imgProps = pdf.getImageProperties(imgData);
                        const renderedHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;

                        if (i > 0) pdf.addPage();
                        // Center ticket vertically or place at top
                        pdf.addImage(imgData, 'PNG', 10, 15, pdfWidth - 20, Math.min(renderedHeight, pdfHeight - 30));
                      }
                      pdf.save(`${activeEvent.slug}-${confirmedAttendees.length}-tickets-receipt.pdf`);
                      return;
                    }
                  }

                  // Single ticket PDF generation
                  const element = document.getElementById('receipt-container');
                  if (element) {
                    const canvas = await html2canvas(element, { 
                      scale: 2,
                      scrollY: -window.scrollY,
                      windowWidth: element.scrollWidth,
                      windowHeight: element.scrollHeight,
                      useCORS: true
                    });
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgProps = pdf.getImageProperties(imgData);
                    const renderedHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;
                    pdf.addImage(imgData, 'PNG', 10, 15, pdfWidth - 20, renderedHeight);
                    pdf.save(`${activeEvent.slug}-ticket-receipt.pdf`);
                  }
                }}
              >
                <span>📥</span> Download Complete PDF ({confirmedAttendees.length} {confirmedAttendees.length === 1 ? 'Ticket' : 'Tickets'})
              </button>

              <div
                className="btn"
                style={{ flex: 1, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, padding: '12px 20px', cursor: 'pointer', minWidth: '200px' }}
                onClick={() => {
                  alert(`To share all ${confirmedAttendees.length} tickets, click "Download Complete PDF" first, then share the downloaded PDF document directly via WhatsApp.`);
                }}
              >
                <span>💬</span> Share All Tickets PDF
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
                onClick={() => setCurrentView('home')}
              >
                ← Return to Events Marketplace
              </button>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-brand">EventSphere</span>
          <span>Discover events. Create memories.</span>
          <span>© {new Date().getFullYear()} EventSphere. All rights reserved.</span>
        </div>
      </footer>

      {/* Paystack Checkout Gateway Modal */}
      {isPaystackOpen && (
        <PaystackModal
          isOpen={isPaystackOpen}
          onClose={() => setIsPaystackOpen(false)}
          amount={getTotal()}
          currency={activeEvent.currency || organization.currency || 'GHS'}
          customerEmail={email.trim()}
          customerName={`${firstName.trim()} ${lastName.trim()}`}
          ticketTierName={
            (activeEvent.ticketTiers.find((t) => (quantities[t.id] || 0) > 0) || activeEvent.ticketTiers[0])?.name ||
            'Standard Pass'
          }
          eventName={activeEvent.title}
          publicKey={organization.paystackPublicKey || 'pk_live_d3a846f491c7a915f02bc4594c7182e04f'}
          isLiveMode={organization.paystackPublicKey?.startsWith('pk_live_') ?? true}
          onSuccess={handlePaystackModalSuccess}
        />
      )}
    </div>
  );
};
