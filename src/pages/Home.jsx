import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, LogIn, Play, Plus, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import Logo from '../components/Logo';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { imageUrl } from '../lib/config';
import './Home.css';

const FAQ_ITEMS = [
  {
    question: 'What is Lumina Cinema?',
    answer:
      'Lumina Cinema is a streaming home for Rwandan movies, series, documentaries, and rising local storytellers. It helps viewers discover films rooted in our language, culture, and lived experience.',
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
      'Yes. Anyone can preview Lumina Cinema, but signing in opens the full catalog, actor pages, watchlist, and protected movie detail pages.',
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

function LandingPaymentBadges() {
  return (
    <div className="landing-payment-strip">
      <p className="landing-payment-label">Payment methods</p>
      <div className="landing-payment-row">
        <div className="landing-payment-badge landing-payment-text-badge mtn" title="MTN MoMo">
          <span>MTN MoMo</span>
        </div>

        <div className="landing-payment-badge landing-payment-text-badge airtel" title="Airtel Money">
          <span>Airtel Money</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [activeFaq, setActiveFaq] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    window.scrollTo(0, 0);

    api.get('/movies/home', { signal: controller.signal, useCache: !import.meta.env.DEV })
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
      .finally(() => {});

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
  const heroMovie = featured[0] || recommended[0] || latest[0] || null;
  const trending = recommended.length ? recommended.slice(0, 6) : catalog.slice(0, 6);
  const trendingItems = trending.length
    ? trending
    : posterSeed.slice(0, 6).map((movie, index) => ({ ...movie, _id: `${movie._id}-trending-${index}` }));

  const getAuthTarget = (path) => (user ? path : '/login');

  const openMovie = (movieId) => {
    if (!movieId || String(movieId).startsWith('placeholder-')) {
      navigate(getAuthTarget('/movies'));
      return;
    }

    navigate(getAuthTarget(`/movies/${movieId}`));
  };

  const browseTarget = getAuthTarget('/movies');
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <header className="landing-header">
          <Logo size="md" to="/" />
          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#films">Films</a>
            <a href="#featured">Featured</a>
            <Link to="/plans">Membership</Link>
          </nav>
          <div className="landing-header-actions">
            <LanguageSwitcher />
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

        <div className="landing-hero-layout">
          <div className="landing-hero-content">
            <p className="landing-kicker"><span /> Cinema, made in Rwanda</p>
            <h1 className="landing-hero-title">Our stories.<br /><em>Our screen.</em></h1>
            <p className="landing-subtitle">The new home of bold Rwandan film. Stream original stories, discover rising voices, and see home differently.</p>
            <div className="landing-hero-actions">
              <Link to={user ? '/movies' : '/register'} className="landing-primary-cta">
                <Play size={17} fill="currentColor" /> Start watching
              </Link>
              <Link to={browseTarget} className="landing-secondary-cta landing-explore-cta">
                <span className="landing-explore-index">02</span>
                <span className="landing-explore-copy"><small>Discover</small><strong>Explore films</strong></span>
                <span className="landing-explore-arrow"><ArrowRight size={17} /></span>
              </Link>
            </div>
            <div className="landing-hero-note"><strong>From 2,000 RWF</strong><span>No long contracts. Cancel anytime.</span></div>
          </div>

          <article className="landing-hero-feature" id="featured">
            <button className="landing-feature-media" onClick={() => openMovie(heroMovie?._id)} aria-label={heroMovie ? `Open ${heroMovie.title}` : 'Browse films'}>
              {heroMovie?.poster ? <img src={imageUrl(heroMovie.poster, { width: 900, height: 1100 })} alt={heroMovie.title} /> : <div className="landing-feature-art"><span>RW</span></div>}
              <div className="landing-feature-shade" />
              <span className="landing-feature-index">Lumina selection · 01</span>
              <span className="landing-feature-play"><Play size={20} fill="currentColor" /></span>
            </button>
            <div className="landing-feature-copy">
              <div className="landing-feature-heading">
                <small>Featured presentation</small>
                <span>{heroMovie?.year || 'Now showing'}</span>
              </div>
              <strong>{heroMovie?.title || 'Stories from the land of a thousand hills'}</strong>
              <p>{heroMovie?.description || 'A hand-picked story from Rwanda, selected for your screen tonight.'}</p>
              <div className="landing-feature-meta">
                <span>{heroMovie?.type || 'Film'}</span>
                <span>{heroMovie?.genre?.slice(0, 2).join(' · ') || 'Rwandan cinema'}</span>
              </div>
              <button className="landing-feature-action" onClick={() => openMovie(heroMovie?._id)}>View film <ArrowRight size={15} /></button>
            </div>
          </article>
        </div>
        <div className="landing-scroll-cue"><span>Scroll to discover</span><i /></div>
      </section>

      <section className="landing-section landing-films" id="films">
        <div className="landing-section-head">
          <div>
            <p className="landing-section-kicker">Now showing</p>
            <h2>Stories worth<br /><em>staying for.</em></h2>
          </div>
          <Link to={browseTarget} className="landing-inline-link">
            Browse all
            <ChevronRight size={16} strokeWidth={2} />
          </Link>
        </div>

        <div className="landing-film-grid">
          {trendingItems.map((movie, index) => (
            <button
              key={movie._id}
              className="landing-film-card"
              onClick={() => openMovie(movie._id)}
            >
              <div className="landing-film-poster">
                {movie.poster ? (
                  <img src={imageUrl(movie.poster, { width: 420, height: 600 })} alt={movie.title} loading="lazy" decoding="async" />
                ) : (
                  <div className="landing-rank-fallback"><span>0{index + 1}</span>{movie.title}</div>
                )}
                <span className="landing-card-play"><Play size={18} fill="currentColor" /></span>
              </div>
              <div className="landing-film-copy">
                <span>0{index + 1}</span>
                <strong>{movie.title}</strong>
                <small>{movie.genre?.slice(0, 2).join(' · ') || 'Rwandan cinema'}</small>
              </div>
            </button>
          ))}
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
        <p className="landing-section-kicker">Your front-row seat is waiting</p>
        <h2>Ready when<br /><em>you are.</em></h2>
        <p>Join Rwanda's home of film today.</p>
        <Link to={user ? '/movies' : '/register'} className="landing-primary-cta">Start watching <ArrowRight size={18} /></Link>
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
          <Logo size="sm" as="div" />
          <small>Rwandan films, flexible plans, and creator profiles in one place.</small>
        </div>
      </footer>
    </main>
  );
}
