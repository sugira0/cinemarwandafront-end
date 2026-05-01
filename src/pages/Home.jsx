import { useEffect, useState } from 'react';
import { ChevronRight, Film, Globe, LogIn, Play, Plus, Star, UserPlus, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../context/I18nContext';
import { mediaUrl } from '../lib/config';
import './Home.css';

const FAQ_ITEMS = [
  {
    question: 'What is CINEMA Rwanda?',
    answer:
      'CINEMA Rwanda is a streaming home for Rwandan movies, series, documentaries, and rising local storytellers. It helps viewers discover films rooted in our language, culture, and lived experience.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Plans start at 2,000 RWF per month, with Standard and Premium options for bigger households and more concurrent streams. You can compare them any time on the plans page.',
  },
  {
    question: 'Where can I watch?',
    answer:
      'You can watch on your phone, laptop, tablet, or TV browser. The experience is designed to feel simple whether you are at home, on campus, or on the move.',
  },
  {
    question: 'How do I subscribe?',
    answer:
      'Create an account, choose a plan, and pay using MTN MoMo or Airtel Money. Once your subscription is active, protected playback opens automatically for available titles.',
  },
  {
    question: 'What can I watch here?',
    answer:
      'Expect dramas, romances, thrillers, documentaries, and series from Rwandan creators, alongside actor profiles and curated picks based on what viewers watch most.',
  },
  {
    question: 'Do I need an account to browse?',
    answer:
      'Yes. Anyone can preview CINEMA Rwanda, but signing in opens the full catalog, actor pages, watchlist, and protected movie detail pages.',
  },
];

const REASON_CARDS = [
  {
    icon: Film,
    title: 'Rooted in Rwanda',
    body: 'Find posters, voices, and stories that feel close to home, with Rwandan creators placed at the center of the experience.',
  },
  {
    icon: Globe,
    title: 'Simple to start',
    body: 'Create an account in minutes, choose a plan when you are ready, and keep your watchlist synced across your devices.',
  },
  {
    icon: Users,
    title: 'Made for households',
    body: 'Choose the plan that matches how you watch, from solo viewing to family streaming across more than one screen.',
  },
  {
    icon: Play,
    title: 'Built for discovery',
    body: 'Move from trending films to actor pages, genre collections, and featured releases without losing the cinematic mood.',
  },
];

const FOOTER_GROUPS = [
  {
    title: 'Browse',
    links: [
      { label: 'All Films', to: '/movies', authRequired: true },
      { label: 'Series', to: '/movies?type=series', authRequired: true },
      { label: 'Actors', to: '/actors', authRequired: true },
      { label: 'Plans', to: '/plans' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Create Account', to: '/register' },
      { label: 'Subscription', to: '/subscription', authRequired: true },
      { label: 'Watchlist', to: '/watchlist', authRequired: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
  {
    title: 'Highlights',
    links: [
      { label: 'Most Watched', to: '/movies', authRequired: true },
      { label: 'Featured Releases', to: '/movies', authRequired: true },
      { label: 'Rwandan Actors', to: '/actors', authRequired: true },
      { label: 'Subscribe Now', to: '/plans' },
    ],
  },
];

function buildUniqueMovies(...groups) {
  const seen = new Set();
  const movies = [];

  groups.flat().forEach((movie) => {
    if (!movie?._id || seen.has(movie._id)) return;
    seen.add(movie._id);
    movies.push(movie);
  });

  return movies;
}

function splitIntoColumns(items, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);

  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });

  return columns;
}

function LeadCapture({ onSubmit, buttonLabel, compact = false }) {
  const [email, setEmail] = useState('');

  return (
    <form
      className={`landing-lead-form${compact ? ' compact' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(email.trim());
      }}
    >
      <label className="landing-lead-field">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button type="submit" className="landing-lead-btn">
        {buttonLabel}
        <ChevronRight size={20} strokeWidth={2.2} />
      </button>
    </form>
  );
}

function PosterTile({ movie, priority = false }) {
  return (
    <article className="landing-poster-tile">
      {movie.poster ? (
        <img src={mediaUrl(movie.poster)} alt={movie.title} loading={priority ? 'eager' : 'lazy'} />
      ) : (
        <div className="landing-poster-fallback">
          <span>{movie.title}</span>
        </div>
      )}
    </article>
  );
}

function LandingPaymentBadges() {
  return (
    <div className="landing-payment-strip">
      <p className="landing-payment-label">Payment methods</p>
      <div className="landing-payment-row">
        <div className="landing-payment-badge" title="MTN MoMo">
          <svg className="landing-payment-logo" viewBox="0 0 132 52" preserveAspectRatio="xMidYMid meet">
            <rect width="132" height="52" rx="4" fill="#FFCC00" />
            <ellipse cx="66" cy="26" rx="31" ry="14" fill="none" stroke="#000" strokeWidth="2.6" />
            <text x="66" y="31" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="18" fill="#000">MTN</text>
          </svg>
        </div>

        <div className="landing-payment-badge" title="Airtel Money">
          <svg className="landing-payment-logo" viewBox="0 0 132 52" preserveAspectRatio="xMidYMid meet">
            <rect width="132" height="52" rx="4" fill="#E40000" />
            <path d="M22 14 Q29 8 32 16 Q34 23 27 26 Q22 27 22 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="24" cy="29" r="2.4" fill="#fff" />
            <text x="84" y="24" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="15" fill="#fff">airtel</text>
            <text x="84" y="38" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="400" fontSize="13" fill="rgba(255,255,255,0.9)">money</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { hasLanguagePreference, setLanguage } = useI18n();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    window.scrollTo(0, 0);

    api.get('/movies/home', { signal: controller.signal })
      .then((response) => {
        if (!isMounted) return;
        setFeatured(response.data?.featured || []);
        setLatest(response.data?.latest || []);
        setRecommended(response.data?.recommended || []);
      })
      .catch((error) => {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
        // The landing page has visual fallbacks, so keep rendering even if the feed fails.
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const catalog = buildUniqueMovies(featured, recommended, latest);
  const posterSeed = catalog.length
    ? catalog.slice(0, 15)
    : Array.from({ length: 15 }, (_, index) => ({
      _id: `placeholder-${index}`,
      title: `Rwandan Story ${index + 1}`,
      poster: null,
    }));
  const posterColumns = splitIntoColumns(posterSeed, 5);
  const heroMovie = featured[0] || recommended[0] || latest[0] || null;
  const trending = recommended.length ? recommended.slice(0, 6) : catalog.slice(0, 6);
  const trendingItems = trending.length
    ? trending
    : posterSeed.slice(0, 6).map((movie, index) => ({ ...movie, _id: `${movie._id}-trending-${index}` }));

  const handleLeadSubmit = (email) => {
    if (user) {
      navigate('/movies');
      return;
    }

    navigate(email ? `/register?email=${encodeURIComponent(email)}` : '/register');
  };

  const getAuthTarget = (path) => (user ? path : '/login');

  const openMovie = (movieId) => {
    if (!movieId || String(movieId).startsWith('placeholder-')) {
      navigate(getAuthTarget('/movies'));
      return;
    }

    navigate(getAuthTarget(`/movies/${movieId}`));
  };

  const browseTarget = getAuthTarget('/movies');
  const actorsTarget = getAuthTarget('/actors');

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-poster-wall" aria-hidden="true">
          <div className="landing-poster-grid">
            {posterColumns.map((column, columnIndex) => (
              <div
                key={`column-${columnIndex}`}
                className="landing-poster-column"
                style={{ '--column-shift': `${columnIndex % 2 === 0 ? columnIndex * 28 : -columnIndex * 24}px` }}
              >
                {column.map((movie, posterIndex) => (
                  <PosterTile
                    key={movie._id}
                    movie={movie}
                    priority={!loading && columnIndex === 0 && posterIndex < 2}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="landing-poster-mask" />
        </div>

        <header className="landing-header">
          <Link to="/" className="landing-brand">
            <Film size={22} strokeWidth={1.8} />
            <span className="landing-brand-wordmark">CINEMA Rwanda</span>
          </Link>

          <div className="landing-header-actions">
            {user ? (
              <>
                <Link to="/movies" className="landing-header-btn ghost">Browse</Link>
                <Link to="/account" className="landing-header-btn solid">My Account</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="landing-header-btn ghost">
                  <LogIn size={16} strokeWidth={1.9} />
                  Sign In
                </Link>
                <Link to="/register" className="landing-header-btn solid">
                  <UserPlus size={16} strokeWidth={1.9} />
                  Join Now
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="landing-hero-content">
          {!hasLanguagePreference && (
            <div className="landing-language-choice" data-i18n-skip="true">
              <span>Choose language</span>
              <button type="button" onClick={() => setLanguage('en')}>English</button>
              <button type="button" onClick={() => setLanguage('rw')}>Kinyarwanda</button>
            </div>
          )}

          <div className="landing-kicker">The home of Rwandan cinema</div>
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-static">Watch</span>
            <span className="landing-hero-title-accent">Rwandan Stories</span>
          </h1>
          <p className="landing-subtitle">
            Short stories. Big feeling. All from Rwanda.
          </p>

          <LeadCapture
            onSubmit={handleLeadSubmit}
            buttonLabel={user ? 'Browse Catalog' : 'Sign Up to Browse'}
          />

          <div className="landing-cta-links">
            <Link to="/plans" className="landing-text-link">See plans</Link>
            <Link to={browseTarget} className="landing-text-link">Explore catalog</Link>
          </div>

          <div className="landing-stat-strip">
            <span>Rwandan stories first</span>
            <span>MTN MoMo and Airtel Money</span>
            <span>Watch on phone, laptop, and TV</span>
          </div>

          {heroMovie && (
            <button className="landing-featured-pill" onClick={() => openMovie(heroMovie._id)}>
              <div>
                <span className="landing-featured-label">Featured tonight</span>
                <strong>{heroMovie.title}</strong>
              </div>
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="landing-hero-arc" aria-hidden="true" />
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <div>
            <p className="landing-section-kicker">Trending now</p>
            <h2>What viewers are pressing play on</h2>
          </div>
          <Link to={browseTarget} className="landing-inline-link">
            Browse all
            <ChevronRight size={16} strokeWidth={2} />
          </Link>
        </div>

        <div className="landing-trending-rail">
          {trendingItems.map((movie, index) => (
            <button
              key={movie._id}
              className="landing-rank-card"
              onClick={() => openMovie(movie._id)}
            >
              <span className="landing-rank-number">{index + 1}</span>
              <div className="landing-rank-poster">
                {movie.poster ? (
                  <img src={mediaUrl(movie.poster)} alt={movie.title} loading="lazy" />
                ) : (
                  <div className="landing-rank-fallback">{movie.title}</div>
                )}
              </div>
              <div className="landing-rank-copy">
                <strong>{movie.title}</strong>
                <span>{movie.genre?.slice(0, 2).join(' / ') || 'Featured release'}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <div>
            <p className="landing-section-kicker">Why join</p>
            <h2>Streaming shaped around Rwandan stories</h2>
          </div>
        </div>

        <div className="landing-reasons-grid">
          {REASON_CARDS.map((reason) => {
            const Icon = reason.icon;

            return (
              <article key={reason.title} className="landing-reason-card">
                <div className="landing-reason-icon">
                  <Icon size={22} strokeWidth={1.9} />
                </div>
                <h3>{reason.title}</h3>
                <p>{reason.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-story-section">
        <div className="landing-story-card">
          <div className="landing-story-copy">
            <p className="landing-section-kicker">Built for discovery</p>
            <h2>Preview the mood, then step into the full catalog.</h2>
            <p>
              Start with featured releases and trending picks, then sign in for actor pages, saved titles,
              subscriptions, and a richer browsing experience.
            </p>
            <div className="landing-story-actions">
              <Link to={browseTarget} className="landing-story-btn primary">
                <Play size={16} fill="currentColor" strokeWidth={0} />
                Start Browsing
              </Link>
              <Link to={actorsTarget} className="landing-story-btn secondary">
                <Users size={16} strokeWidth={1.9} />
                Meet the Actors
              </Link>
            </div>
          </div>

          <div className="landing-story-panel">
            <div className="landing-story-panel-head">
              <span className="landing-panel-chip">Most loved on CINEMA Rwanda</span>
              <Star size={16} fill="currentColor" strokeWidth={0} />
            </div>
            <div className="landing-story-list">
              {catalog.slice(0, 4).map((movie) => (
                <button
                  key={movie._id}
                  className="landing-story-item"
                  onClick={() => openMovie(movie._id)}
                >
                  <div className="landing-story-poster">
                    {movie.poster ? <img src={mediaUrl(movie.poster)} alt={movie.title} loading="lazy" /> : <span>{movie.title[0]}</span>}
                  </div>
                  <div>
                    <strong>{movie.title}</strong>
                    <span>{movie.language || 'Kinyarwanda and beyond'}</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.9} />
                </button>
              ))}

              {!catalog.length && (
                <div className="landing-story-empty">
                  Fresh releases will appear here as your catalog grows.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-faq-section">
        <div className="landing-section-head">
          <div>
            <p className="landing-section-kicker">Frequently asked questions</p>
            <h2>Everything a new viewer needs to know</h2>
          </div>
        </div>

        <div className="landing-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = activeFaq === index;

            return (
              <article key={item.question} className={`landing-faq-item${isOpen ? ' open' : ''}`}>
                <button
                  className="landing-faq-question"
                  onClick={() => setActiveFaq(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <Plus size={20} strokeWidth={2} />
                </button>
                {isOpen && <div className="landing-faq-answer"><p>{item.answer}</p></div>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta">
        <p>Ready to watch? Enter your email to create or restart your membership.</p>
        <LeadCapture
          onSubmit={handleLeadSubmit}
          buttonLabel={user ? 'Go to Catalog' : 'Create Account'}
          compact
        />
      </section>

      <footer className="landing-footer">
        <p className="landing-footer-contact">
          Questions? <Link to="/contact">Contact us.</Link>
        </p>

        <div className="landing-footer-grid">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="landing-footer-column">
              <h3>{group.title}</h3>
              {group.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.authRequired ? getAuthTarget(link.to) : link.to}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <LandingPaymentBadges />

        <div className="landing-footer-bottom">
          <p>CINEMA Rwanda</p>
          <small>Rwandan films, flexible plans, and creator profiles in one place.</small>
        </div>
      </footer>
    </main>
  );
}
