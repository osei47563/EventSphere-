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
  const [confirmedAttendee, setConfirmedAttendee] = useState<any | null>(null);
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
        const attendee = await registerAttendee({
          eventId: activeEvent.id,
          ticketTierId: primaryTier.id,
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          company: 'Attendee',
          jobTitle: 'Guest',
          customAnswers: {},
          amountPaid: 0,
          currency,
          paymentChannel: 'card',
        });
        setConfirmedAttendee(attendee);
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
        ticketTierName: primaryTier.name,
        customerName: `${firstName.trim()} ${lastName.trim()}`,
        channels: chosenChannel === 'card' ? ['card', 'bank_transfer', 'ussd'] : ['mobile_money', 'card'],
      },
      onSuccess: async (paystackRes) => {
        setIsSubmitting(true);
        try {
          const attendee = await registerAttendee({
            eventId: activeEvent.id,
            ticketTierId: primaryTier.id,
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim(),
            phone: phone.trim(),
            company: 'Attendee',
            jobTitle: 'Guest',
            customAnswers: {},
            amountPaid: totalAmount,
            currency,
            paymentChannel: (paystackRes.channel as any) || chosenChannel,
            paymentReference: paystackRes.reference,
          });
          setConfirmedAttendee(attendee);
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
      const primaryTier = activeEvent.ticketTiers.find((t) => (quantities[t.id] || 0) > 0) || activeEvent.ticketTiers[0];
      const currency = primaryTier?.currency || activeEvent.currency || organization.currency || 'GHS';
      const attendee = await registerAttendee({
        eventId: activeEvent.id,
        ticketTierId: primaryTier.id,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        company: 'Attendee',
        jobTitle: 'Guest',
        customAnswers: {},
        amountPaid: getTotal(),
        currency,
        paymentChannel: channel,
        paymentReference,
      });

      setConfirmedAttendee(attendee);
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
        <main className="flex-1" style={{ padding: '40px 0', background: '#f8fafc' }}>
          <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              
              {/* Top Banner */}
              <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>✓</div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px' }}>Payment & Booking Successful!</h1>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '15px' }}>Your verified ticket and digital receipt have been generated.</p>
              </div>

              {/* Receipt Body */}
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>Event</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>{activeEvent.title}</h2>
                    <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '14px' }}>📅 {new Date(activeEvent.startDate).toLocaleString()} | 📍 {activeEvent.venueName}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>Ticket Code</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', marginTop: '4px' }}>
                      {confirmedAttendee?.ticketCode || 'TKT-PENDING'}
                    </div>
                  </div>
                </div>

                {/* Attendee Details Card */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 12px', fontWeight: 700 }}>Attendee & Contact Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Full Name</span>
                      <strong style={{ color: '#0f172a' }}>{confirmedAttendee?.fullName || `${firstName} ${lastName}`}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Email Address</span>
                      <strong style={{ color: '#0f172a' }}>{confirmedAttendee?.email || email}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Phone Number</span>
                      <strong style={{ color: '#0f172a' }}>{confirmedAttendee?.phone || phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Ticket Tier</span>
                      <strong style={{ color: '#0f172a' }}>{confirmedAttendee?.ticketTierName || 'Standard Pass'}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment & Reference Details */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', margin: '0 0 12px', fontWeight: 700 }}>Payment & Transaction Summary</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Amount Paid</span>
                    <strong style={{ color: '#0f172a' }}>{formatCurrency(confirmedAttendee?.amountPaid ?? getTotal(), confirmedAttendee?.currency || activeEvent.currency)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Payment Method</span>
                    <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{confirmedAttendee?.paymentChannel || paymentMethod || 'Card / Mobile Money'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Transaction Reference</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{confirmedAttendee?.paymentReference || 'PSTK-REF-OK'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Verification Status</span>
                    <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Verified Valid Ticket</strong>
                  </div>
                </div>

                {/* QR Code Section */}
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  {confirmedAttendee?.qrDataUrl ? (
                    <img src={confirmedAttendee.qrDataUrl} alt="Ticket QR Code" style={{ width: '160px', height: '160px', margin: '0 auto 12px', display: 'block', borderRadius: '8px', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', background: '#e2e8f0', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#64748b' }}>QR Code</div>
                  )}
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Present this QR code or ticket code at the venue entrance scanner for instant check-in verification.</p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => window.print()}
                  >
                    <span>📥</span> Download / Print Receipt
                  </button>

                  <a
                    className="btn"
                    style={{ flex: 1, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, padding: '12px 20px' }}
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `🎟️ *Verified Ticket & Receipt - ${activeEvent.title}*\n` +
                      `-------------------\n` +
                      `👤 Name: ${confirmedAttendee?.fullName || firstName + ' ' + lastName}\n` +
                      `📧 Email: ${confirmedAttendee?.email || email}\n` +
                      `📱 Phone: ${confirmedAttendee?.phone || phone}\n` +
                      `🎫 Ticket Code: ${confirmedAttendee?.ticketCode || 'TKT'}\n` +
                      `🏷️ Tier: ${confirmedAttendee?.ticketTierName || 'Standard'}\n` +
                      `💰 Paid: ${formatCurrency(confirmedAttendee?.amountPaid || 0, confirmedAttendee?.currency || 'GHS')}\n` +
                      `🔖 Ref: ${confirmedAttendee?.paymentReference || 'N/A'}\n` +
                      `-------------------\n` +
                      `Show this receipt or QR code at entry for instant verification!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>💬</span> Share to WhatsApp
                  </a>
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
