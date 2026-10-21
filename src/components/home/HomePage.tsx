import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EventData } from '../../types';
import { formatCurrency } from '../../utils/paystack';
import { updatePageSEO } from '../../utils/seo';

export const HomePage: React.FC = () => {
  const {
    events,
    setActiveEventId,
    setCurrentView,
    setIsAuthModalOpen,
    setAuthModalTab,
    isAuthenticated,
  } = useApp();

  useEffect(() => {
    updatePageSEO({
      title: 'EventSphere – Live Event Ticketing & Organizer Platform',
      description: 'Discover concerts, tech conferences, festivals and cultural celebrations. Buy verified tickets with instant QR passes and Paystack payments.',
      canonicalPath: '/',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [savedEventIds, setSavedEventIds] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venueName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || event.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [events, searchQuery, selectedCategory]);





  const handleSelectEvent = (event: EventData) => {
    setActiveEventId(event.id);
    setCurrentView('public_event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    setSavedEventIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = document.getElementById('events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterMessage('Thank you for subscribing to event updates!');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-white text-[#26332C] flex flex-col font-sans">
      {/* NAVIGATION */}
      <header className="navbar">
        <div className="container nav-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="brand" aria-label="eventsphere home">
            <span className="brand-icon">◈</span>
            <span>
              <span className="brand-name">eventsphere</span>
              <span className="brand-tagline">Events Made Easy</span>
            </span>
          </a>

          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} id="navLinks" aria-label="Main navigation">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); setMobileMenuOpen(false); }} className="active">Home</a>
            <a href="#events" onClick={() => setMobileMenuOpen(false)}>Explore Events</a>
            <a href="#organizers" onClick={() => setMobileMenuOpen(false)}>For Organizers</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('about'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>About</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('contact'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Help &amp; Support</a>
          </nav>

          <div className="nav-actions">
            {!isAuthenticated ? (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setAuthModalTab('login');
                    setCurrentView('auth');
                  }}
                >
                  Log In
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setCurrentView('auth');
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentView('dashboard')}
              >
                Organizer Hub
              </button>
            )}

            <button
              className="menu-toggle"
              id="menuToggle"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="navLinks"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <p className="eyebrow">Discover · Book · Experience</p>
              <h1>Find your next <em>unforgettable</em> event.</h1>
              <p className="hero-copy">
                From concerts and festivals to conferences and special occasions
                — get your tickets, meet new people and create lasting memories.
              </p>

              <form className="hero-search" onSubmit={handleSearchSubmit}>
                <span aria-hidden="true" style={{ paddingLeft: '10px', color: '#527461' }}>⌕</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, venues or locations"
                  aria-label="Search events, venues or locations"
                />
                <button className="btn btn-primary" type="submit">Search</button>
              </form>
            </div>

            <div className="hero-art">
              <span className="hero-badge">Music · Concerts · Festivals · More</span>
              <img
                className="hero-image"
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85"
                alt="Live music concert with stage lighting and audience"
              />
              <p className="hero-caption">Great events.<br />Better together.</p>
            </div>
          </div>
        </section>

        {/* EVENT CATEGORIES */}
        <section className="section" id="categories">
          <div className="container">
            <div className="section-heading">
              <h2>Browse by Event Type</h2>
              <a className="section-link" href="#events">View All Events →</a>
            </div>

            <div className="categories">
              {[
                { label: 'All', icon: '◈' },
                { label: 'Concerts', icon: '♫' },
                { label: 'Festivals', icon: '♢' },
                { label: 'Conferences', icon: '♟' },
                { label: 'Sports', icon: '🏆' },
                { label: 'Weddings', icon: '♡' },
                { label: 'Parties', icon: '✧' },
                { label: 'Business', icon: '▣' },
                { label: 'Church Events', icon: '✝' },
                { label: 'School Events', icon: '⌂' },
              ].map((cat) => (
                <div
                  key={cat.label}
                  className={`category ${selectedCategory === (cat.label === 'All' ? 'All' : cat.label) ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.label === 'All' ? 'All' : cat.label)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED EVENTS */}
        <section className="section" id="events" style={{ paddingTop: '10px' }}>
          <div className="container">
            <div className="section-heading">
              <h2>Upcoming Events {selectedCategory !== 'All' ? `(${selectedCategory})` : ''}</h2>
              <a className="section-link" href="#events" onClick={() => setSelectedCategory('All')}>View All Events →</a>
            </div>

            <div className="events-grid" id="eventsGrid">
              {events.filter(e => e.status !== 'completed').length === 0 ? (
                <div style={{ padding: '56px 20px', textAlign: 'center', gridColumn: '1 / -1', background: '#F8FAF8', borderRadius: '16px', border: '1px dashed #CCD7CE' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎟️</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#104A32', margin: '0 0 8px 0' }}>No Upcoming Events Scheduled</h3>
                  <p style={{ color: '#527461', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                    We are currently preparing our next season of concerts, festivals, and conferences. Check back soon or list your own production today!
                  </p>
                </div>
              ) : filteredEvents.filter(e => e.status !== 'completed').length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p style={{ color: '#527461', fontSize: '15px' }}>No upcoming events found matching your search or category.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="btn btn-outline"
                    style={{ marginTop: '16px' }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredEvents.filter(e => e.status !== 'completed').map((event) => {
                  const isSaved = !!savedEventIds[event.id];
                  const lowestPrice = (() => {
                    if (!event.ticketTiers || event.ticketTiers.length === 0) return 'Free';
                    const prices = event.ticketTiers.map((t) => t.price);
                    const min = Math.min(...prices);
                    if (min === 0) return 'Free';
                    return `From ${formatCurrency(min, event.currency)}`;
                  })();

                  return (
                    <article key={event.id} className="event-card">
                      <div className="event-image-wrap" onClick={() => handleSelectEvent(event)} style={{ cursor: 'pointer' }}>
                        <img loading="lazy" src={event.coverImage} alt={event.title} />
                        <span className="event-label">{event.category}</span>
                        <button
                          className={`favorite ${isSaved ? 'saved' : ''}`}
                          onClick={(e) => toggleFavorite(e, event.id)}
                          aria-label={`Save ${event.title}`}
                          aria-pressed={isSaved}
                        >
                          {isSaved ? '♥' : '♡'}
                        </button>
                      </div>
                      <div className="event-content">
                        <div>
                          <h3
                            className="event-title"
                            onClick={() => handleSelectEvent(event)}
                            style={{ cursor: 'pointer' }}
                          >
                            {event.title}
                          </h3>
                          <p className="event-meta">
                            <span>●</span>
                            <span>{event.venueName}, {event.venueAddress}</span>
                          </p>
                          <p className="event-meta">
                            <span>▦</span>
                            <span>{new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </p>
                          <p className="event-price">
                            {lowestPrice}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSelectEvent(event)}
                          className="btn btn-primary"
                        >
                          Get Tickets →
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* PAST EVENTS ARCHIVE */}
        <section className="section" id="past-events" style={{ paddingTop: '10px', background: '#F8FAF8' }}>
          <div className="container">
            <div className="section-heading">
              <h2>Past Events Archive</h2>
            </div>
            <div className="events-grid">
              {filteredEvents.filter(e => e.status === 'completed').length === 0 ? (
                <p style={{ color: '#527461', fontSize: '15px', gridColumn: '1 / -1' }}>No past events archived yet.</p>
              ) : (
                filteredEvents.filter(e => e.status === 'completed').map((event) => (
                    <article key={event.id} className="event-card" style={{ opacity: 0.7 }}>
                      <div className="event-image-wrap">
                        <img loading="lazy" src={event.coverImage} alt={event.title} />
                        <span className="event-label" style={{ background: '#E2E8F0', color: '#334155' }}>Completed</span>
                      </div>
                      <div className="event-content">
                        <h3 className="event-title">{event.title}</h3>
                        <p className="event-meta">
                            <span>●</span>
                            <span>{event.venueName}</span>
                          </p>
                        <p className="event-meta">
                            <span>▦</span>
                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </article>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ORGANIZER PROMOTION */}
        <section className="section organizer-section" id="organizers">
          <div className="container organizer-grid">
            <div>
              <p className="eyebrow">For Organizers</p>
              <h2>Host your event with ease.</h2>
              <p className="organizer-copy">
                Create, manage and sell tickets for your events with powerful
                tools, secure payments and clear performance insights.
              </p>
              <div className="organizer-actions">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalTab('signup');
                      setCurrentView('auth');
                    } else {
                      setCurrentView('dashboard');
                    }
                  }}
                  className="btn btn-primary"
                >
                  Become an Organizer →
                </button>
                <a href="#about" className="section-link">Learn More</a>
              </div>

              <div className="organizer-features">
                <div className="organizer-feature"><span>▦</span>Easy Event Setup</div>
                <div className="organizer-feature"><span>♢</span>Secure Payments</div>
                <div className="organizer-feature"><span>▥</span>Live Analytics</div>
                <div className="organizer-feature"><span>♧</span>Dedicated Support</div>
              </div>
            </div>

            <div className="dashboard-preview">
              <div className="dashboard-top">
                <strong>◈ eventsphere Dashboard</strong>
                <span className="dashboard-chip">Organizer</span>
              </div>

              <div className="dashboard-metrics">
                <div className="metric">
                  <span>Tickets Sold</span>
                  <strong>286</strong>
                </div>
                <div className="metric">
                  <span>Active Events</span>
                  <strong>{events.length}</strong>
                </div>
                <div className="metric">
                  <span>Gross Sales</span>
                  <strong>$28.6k</strong>
                </div>
              </div>

              <p style={{ marginTop: '20px', color: 'var(--green-dark)', fontWeight: '700' }}>
                Ticket Sales Overview
              </p>
              <div className="mini-chart" role="img" aria-label="Illustrative ticket sales bar chart">
                <span style={{ height: '25%' }}></span>
                <span style={{ height: '43%' }}></span>
                <span style={{ height: '35%' }}></span>
                <span style={{ height: '62%' }}></span>
                <span style={{ height: '52%' }}></span>
                <span style={{ height: '80%' }}></span>
                <span style={{ height: '70%' }}></span>
                <span style={{ height: '100%' }}></span>
              </div>
              <p className="dashboard-caption">
                Real-time organizer analytics, physical seat layouts & live revenue tracking.
              </p>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE EVENTSWERE */}
        <section className="section" id="about">
          <div className="container">
            <div className="section-heading">
              <h2>Why Choose eventsphere?</h2>
            </div>

            <div className="reviews-grid">
              <article className="review-card">
                <blockquote>
                  Find events, compare options and manage your bookings in one convenient place.
                </blockquote>
                <p className="reviewer">Easy Booking</p>
                <p className="reviewer-location">Simple ticket discovery</p>
                <div className="stars" aria-label="Feature highlight">✓ ✓ ✓</div>
              </article>

              <article className="review-card">
                <blockquote>
                  Keep your digital tickets accessible and make entry easier with QR check-in.
                </blockquote>
                <p className="reviewer">Digital Tickets</p>
                <p className="reviewer-location">Convenient access</p>
                <div className="stars" aria-label="Feature highlight">✓ ✓ ✓</div>
              </article>

              <article className="review-card">
                <blockquote>
                  Give event organizers clear tools to manage ticket sales, attendees and reports.
                </blockquote>
                <p className="reviewer">Organizer Tools</p>
                <p className="reviewer-location">Manage events in one place</p>
                <div className="stars" aria-label="Feature highlight">✓ ✓ ✓</div>
              </article>

              <article className="review-card">
                <blockquote>
                  Access event information and booking support from your phone or computer.
                </blockquote>
                <p className="reviewer">Mobile Friendly</p>
                <p className="reviewer-location">Designed for every screen</p>
                <div className="stars" aria-label="Feature highlight">✓ ✓ ✓</div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="brand">
                <span className="brand-icon">◈</span>
                <span>
                  <span className="brand-name">eventsphere</span>
                  <span className="brand-tagline">Events Made Easy</span>
                </span>
              </a>
              <p style={{ marginTop: '18px' }}>
                Discover events. Book tickets.<br />Make memorable experiences.
              </p>
            </div>

            <div>
              <h3>Quick Links</h3>
              <nav className="footer-links" aria-label="Footer navigation">
                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
                <a href="#events">Explore Events</a>
                <a href="#organizers">For Organizers</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>About Us</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Help &amp; Support</a>
              </nav>
            </div>

            <div>
              <h3>Explore</h3>
              <nav className="footer-links" aria-label="Explore links">
                <a href="#categories" onClick={() => setSelectedCategory('Concerts')}>Concerts</a>
                <a href="#categories" onClick={() => setSelectedCategory('Festivals')}>Festivals</a>
                <a href="#categories" onClick={() => setSelectedCategory('Conferences')}>Conferences</a>
                <a href="#categories" onClick={() => setSelectedCategory('Sports')}>Sports</a>
                <a href="#categories" onClick={() => setSelectedCategory('School Events')}>School Events</a>
              </nav>
            </div>

            <div>
              <h3>Get Event Updates</h3>
              <p>Sign up for event announcements and news.</p>
              <form className="newsletter" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Your email address"
                />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
              {newsletterMessage && (
                <p id="newsletterMessage" role="status" style={{ marginTop: '10px', color: '#DCEADF', fontSize: '13px' }}>
                  {newsletterMessage}
                </p>
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} eventsphere. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Terms of Service</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
