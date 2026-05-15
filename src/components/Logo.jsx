/**
 * CINEMA Rwanda — Brand Logo Component
 *
 * Variants:
 *   full    — icon + "CINEMA Rwanda" text (default)
 *   icon    — icon only
 *   text    — text only
 *
 * Sizes:
 *   sm  — small (navbar, auth forms)
 *   md  — medium (default)
 *   lg  — large (landing, footer)
 *   xl  — extra large (splash screens)
 */

import { Link } from 'react-router-dom';
import './Logo.css';

function CinemaIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cinema-icon ${className}`}
      aria-hidden="true"
    >
      {/* Film reel outer ring */}
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.2" fill="none" opacity="0.25" />

      {/* Film reel inner ring */}
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* Center hub */}
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />

      {/* Film sprocket holes — top, bottom, left, right */}
      <circle cx="24" cy="6"  r="2.8" fill="currentColor" opacity="0.7" />
      <circle cx="24" cy="42" r="2.8" fill="currentColor" opacity="0.7" />
      <circle cx="6"  cy="24" r="2.8" fill="currentColor" opacity="0.7" />
      <circle cx="42" cy="24" r="2.8" fill="currentColor" opacity="0.7" />

      {/* Diagonal sprocket holes */}
      <circle cx="11.5" cy="11.5" r="2.4" fill="currentColor" opacity="0.5" />
      <circle cx="36.5" cy="11.5" r="2.4" fill="currentColor" opacity="0.5" />
      <circle cx="11.5" cy="36.5" r="2.4" fill="currentColor" opacity="0.5" />
      <circle cx="36.5" cy="36.5" r="2.4" fill="currentColor" opacity="0.5" />

      {/* Play triangle */}
      <path
        d="M21 19.5 L21 28.5 L29 24 Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

const SIZE_MAP = {
  sm: { icon: 22, fontSize: '1.1rem', subSize: '0.65rem' },
  md: { icon: 28, fontSize: '1.4rem', subSize: '0.72rem' },
  lg: { icon: 36, fontSize: '1.8rem', subSize: '0.82rem' },
  xl: { icon: 48, fontSize: '2.4rem', subSize: '1rem'    },
};

export default function Logo({
  variant = 'full',
  size    = 'md',
  to      = '/',
  as      = 'link',   // 'link' | 'div' | 'span'
  className = '',
  subtitle,           // optional subtitle e.g. "Staff Portal"
}) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;

  const inner = (
    <span className={`cinema-logo cinema-logo--${size} cinema-logo--${variant} ${className}`}>
      {variant !== 'text' && (
        <span className="cinema-logo__icon">
          <CinemaIcon size={s.icon} />
        </span>
      )}
      {variant !== 'icon' && (
        <span className="cinema-logo__text">
          <span className="cinema-logo__cinema" style={{ fontSize: s.fontSize }}>CINEMA</span>
          <span className="cinema-logo__rwanda" style={{ fontSize: s.fontSize }}>Rwanda</span>
          {subtitle && (
            <span className="cinema-logo__sub" style={{ fontSize: s.subSize }}>{subtitle}</span>
          )}
        </span>
      )}
    </span>
  );

  if (as === 'div')  return <div className="cinema-logo-wrap">{inner}</div>;
  if (as === 'span') return inner;

  return (
    <Link to={to} className="cinema-logo-link" aria-label="CINEMA Rwanda — Home">
      {inner}
    </Link>
  );
}
