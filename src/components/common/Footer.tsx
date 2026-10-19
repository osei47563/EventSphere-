import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { footerSettings, setCurrentView } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const navigateTo = (view: any) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('home');
              }}
              className="brand"
            >
              <span className="brand-icon">◈</span>
              <span>
                <span className="brand-name">EventSphere</span>
                <span className="brand-tagline">{footerSettings.tagline}</span>
              </span>
            </a>
            <p style={{ marginTop: '18px' }}>
              {footerSettings.companyName}
              <br />
              <a
                href={`mailto:${footerSettings.supportEmail}`}
                style={{ color: '#DCEADF', textDecoration: 'underline' }}
              >
                {footerSettings.supportEmail}
              </a>
            </p>
          </div>

          <div>
            <h3>Quick Links</h3>
            <nav className="footer-links" aria-label="Footer navigation">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Home
              </a>
              <a
                href="#events"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    const el = document.getElementById('events');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Explore Events
              </a>
              <a
                href="#organizers"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                  setTimeout(() => {
                    const el = document.getElementById('organizers');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                For Organizers
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('about');
                }}
              >
                About Us
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('contact');
                }}
              >
                Help &amp; Support
              </a>
            </nav>
          </div>

          <div>
            <h3>Explore Categories</h3>
            <nav className="footer-links" aria-label="Explore links">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Concerts &amp; Music
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Cultural Festivals
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Tech Conferences
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
              >
                Sports &amp; Fitness
              </a>
            </nav>
          </div>

          <div>
            <h3>Get Event Updates</h3>
            <p>Sign up for event announcements, presale alerts, and news.</p>
            <form className="newsletter" id="newsletterForm" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address"
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p style={{ marginTop: '10px', color: '#DCEADF', fontSize: '12px' }}>
                ✓ Thank you for subscribing to EventSphere updates!
              </p>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {footerSettings.copyrightYear} {footerSettings.companyName}. All rights reserved.</p>
          <div className="footer-legal">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('privacy');
              }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('terms');
              }}
            >
              Terms of Service
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('contact');
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
