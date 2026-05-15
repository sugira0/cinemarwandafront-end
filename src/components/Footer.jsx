import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

function MTNBadge() {
  return (
    <div className="payment-badge mtn" title="MTN MoMo">
      <svg className="payment-badge-logo" viewBox="0 0 132 52" preserveAspectRatio="xMidYMid meet">
        <rect width="132" height="52" rx="4" fill="#FFCC00" />
        <ellipse cx="66" cy="26" rx="31" ry="14" fill="none" stroke="#000" strokeWidth="2.6" />
        <text x="66" y="31" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="18" fill="#000">MTN</text>
      </svg>
    </div>
  );
}

function AirtelBadge() {
  return (
    <div className="payment-badge airtel" title="Airtel Money">
      <svg className="payment-badge-logo" viewBox="0 0 132 52" preserveAspectRatio="xMidYMid meet">
        <rect width="132" height="52" rx="4" fill="#E40000" />
        <path d="M22 14 Q29 8 32 16 Q34 23 27 26 Q22 27 22 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="29" r="2.4" fill="#fff" />
        <text x="84" y="24" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="15" fill="#fff">airtel</text>
        <text x="84" y="38" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="400" fontSize="13" fill="rgba(255,255,255,0.9)">money</text>
      </svg>
    </div>
  );
}

function PaymentBadges({ className = '' }) {
  return (
    <div className={className}>
      <p className="footer-payments-label">We accept</p>
      <div className="footer-payments-row">
        <MTNBadge />
        <AirtelBadge />
      </div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="var(--bg-2)" />
        </svg>
      </div>

      <div className="footer-inner">
        <div className="footer-brand">
          <Logo size="lg" to="/" />
          <p>The home of Rwandan cinema. Watch, discover and support local filmmakers and storytellers.</p>

          <div className="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn ig" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn tt" title="TikTok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" /></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn tw" title="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
          </div>

          <PaymentBadges className="footer-payments" />
        </div>

        <div className="footer-col">
          <h4>Browse</h4>
          <Link to="/movies">All Films</Link>
          <Link to="/movies?type=series">Series</Link>
          <Link to="/actors">Actors</Link>
          <Link to="/plans">Plans & Pricing</Link>
          <Link to="/subscription">Subscribe</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/account">My Account</Link>
          <Link to="/watchlist">Watchlist</Link>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>

        <PaymentBadges className="footer-payments-inline" />
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} CINEMA Rwanda. All rights reserved.</p>
        <p className="footer-made">Made with <span className="footer-heart">♥</span> in Rwanda</p>
      </div>
    </footer>
  );
}
