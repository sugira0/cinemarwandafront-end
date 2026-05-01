import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import './TopBar.css';

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        {/* Left contact */}
        <div className="topbar-left">
          <a href="mailto:hello@cinemarwanda.rw" className="topbar-link">
            <Mail size={12} strokeWidth={2} /> hello@cinemarwanda.rw
          </a>
          <span className="topbar-divider" />
          <a href="tel:+250788000000" className="topbar-link">
            <Phone size={12} strokeWidth={2} /> +250 788 000 000
          </a>
        </div>

        {/* Center tagline */}
        <div className="topbar-center">
          The home of Rwandan Cinema
        </div>

        {/* Right social */}
        <div className="topbar-right">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="topbar-social ig" title="Instagram">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="topbar-social tt" title="TikTok">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="topbar-social tw" title="X / Twitter">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <span className="topbar-divider" />
          <Link to="/plans" className="topbar-plans">Subscribe</Link>
        </div>
      </div>
    </div>
  );
}
