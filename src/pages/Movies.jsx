import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Play, Plus, Search, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import { mediaUrl } from '../lib/config';
import LoginModal from '../components/LoginModal';
import { SkeletonRow } from '../components/Skeleton';
import './Movies.css';

const GENRES = ['Action', 'Drama', 'Comedy', 'Romance', 'Thriller', 'Documentary'];

function Preview({ movie, rect, onWatchlist, onClose, onKeepOpen }) {
  const navigate = useNavigate();
  const previewWidth = 320;

  let left = rect.left + rect.width / 2 - previewWidth / 2;
  const top = rect.top + window.scrollY - 8;
  left = Math.max(12, Math.min(left, window.innerWidth - previewWidth - 12));

  const episodeCount = movie.episodes?.length;
  const seasonCount = movie.type === 'series' && episodeCount
    ? [...new Set(movie.episodes.map((episode) => episode.season))].length
    : null;

  return createPortal(
    <div
      className="nc-card-preview"
      style={{ position: 'absolute', top, left, width: previewWidth }}
      onMouseEnter={onKeepOpen}
      onMouseLeave={onClose}
    >
      <div className="nc-preview-thumb" onClick={() => navigate(`/movies/${movie._id}`)}>
        {movie.poster
          ? <img src={mediaUrl(movie.poster)} alt={movie.title} />
          : <div className="nc-no-poster"><span>{movie.title[0]}</span></div>}
        <div className="nc-preview-thumb-title">{movie.title}</div>
      </div>

      <div className="nc-preview-body">
        <div className="nc-preview-actions">
          <button className="nc-btn-play" onClick={() => navigate(`/movies/${movie._id}`)} title="Play">
            <Play size={18} fill="black" strokeWidth={0} style={{ marginLeft: 2 }} />
          </button>
          <button className="nc-btn-add" onClick={() => onWatchlist(movie._id)} title="Add to My List">
            <Plus size={18} strokeWidth={2} />
          </button>
          <button className="nc-btn-dislike" title="Not for me"><ThumbsDown size={16} strokeWidth={1.5} /></button>
          <button className="nc-btn-like" title="I like this"><ThumbsUp size={16} strokeWidth={1.5} /></button>
          <button className="nc-btn-chevron" onClick={() => navigate(`/movies/${movie._id}`)} title="More info">
            <ChevronDown size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="nc-preview-meta">
          {movie.year && <span className="nc-meta-badge">{movie.year}</span>}
          {seasonCount
            ? <span className="nc-meta-text">{seasonCount} Season{seasonCount > 1 ? 's' : ''}</span>
            : movie.duration && <span className="nc-meta-text">{movie.duration}</span>}
          <span className="nc-meta-badge">HD</span>
        </div>

        <div className="nc-preview-genres">
          {movie.genre?.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Card({ movie, onWatchlist }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const [rect, setRect] = useState(null);

  const clearHideTimer = () => clearTimeout(hideTimer.current);

  const showPreview = () => {
    clearHideTimer();
    showTimer.current = setTimeout(() => {
      if (cardRef.current) {
        setRect(cardRef.current.getBoundingClientRect());
      }
    }, 380);
  };

  const hidePreview = () => {
    clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setRect(null), 200);
  };

  useEffect(() => () => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
  }, []);

  return (
    <>
      <div
        className="nc-card"
        ref={cardRef}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onClick={() => navigate(`/movies/${movie._id}`)}
      >
        <div className="nc-card-thumb">
          {movie.poster
            ? <img src={mediaUrl(movie.poster)} alt={movie.title} />
            : <div className="nc-no-poster"><span>{movie.title[0]}</span></div>}
          <div className="nc-card-title-bar">{movie.title}</div>
        </div>
      </div>

      {rect && (
        <Preview
          movie={movie}
          rect={rect}
          onWatchlist={onWatchlist}
          onClose={hidePreview}
          onKeepOpen={clearHideTimer}
        />
      )}
    </>
  );
}

function Row({ title, movies, onWatchlist }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (direction) => {
    ref.current.scrollBy({
      left: direction * ref.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const onScroll = () => {
    const element = ref.current;
    setCanLeft(element.scrollLeft > 10);
    setCanRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 10);
  };

  if (!movies.length) return null;

  return (
    <div className="nc-row">
      <h2 className="nc-row-title">{title}</h2>
      <div className="nc-row-wrap">
        {canLeft && <button className="nc-arrow left" onClick={() => scroll(-1)}><ChevronLeft size={28} /></button>}
        {canRight && <button className="nc-arrow right" onClick={() => scroll(1)}><ChevronRight size={28} /></button>}
        <div className="nc-row-track" ref={ref} onScroll={onScroll}>
          {movies.map((movie) => <Card key={movie._id} movie={movie} onWatchlist={onWatchlist} />)}
        </div>
      </div>
    </div>
  );
}

export default function Movies() {
  const { user } = useAuth();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [wlMsg, setWlMsg] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    api.get('/movies')
      .then((response) => {
        setAll(response.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) return undefined;

    const timeoutId = setTimeout(() => {
      api.get('/movies', { params: { search } })
        .then((response) => setResults(response.data))
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const addWatchlist = async (movieId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      await api.post(`/watchlist/${movieId}`);
      setWlMsg('Added to watchlist');
    } catch {
      setWlMsg('Already in watchlist');
    }

    setTimeout(() => setWlMsg(''), 2500);
  };

  const byGenre = (genre) => all.filter((movie) => movie.genre?.includes(genre));
  const series = all.filter((movie) => movie.type === 'series');
  const movies = all.filter((movie) => movie.type !== 'series');
  const recent = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12);

  return (
    <div className="nc-browse">
      <div className="nc-topbar">
        <h1 className="nc-browse-title">Browse</h1>
        <div className={`nc-search-wrap${searching ? ' open' : ''}`}>
          {searching && (
            <input
              className="nc-search-input"
              placeholder="Titles, genres..."
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                if (!value.trim()) setResults([]);
              }}
              autoFocus
            />
          )}
          <button
            className="nc-search-btn"
            onClick={() => {
              setSearching((current) => !current);
              setSearch('');
              setResults([]);
            }}
          >
            {searching ? <X size={18} strokeWidth={1.5} /> : <Search size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {wlMsg && <div className="nc-toast">{wlMsg}</div>}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />}

      {loading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : search.trim() ? (
        <div className="nc-search-results">
          <p className="nc-results-label">{results.length} result{results.length !== 1 ? 's' : ''} for "{search}"</p>
          <div className="nc-grid">
            {results.map((movie) => <Card key={movie._id} movie={movie} onWatchlist={addWatchlist} />)}
            {!results.length && <p className="empty">No films found.</p>}
          </div>
        </div>
      ) : (
        <>
          <Row title="New Releases" movies={recent} onWatchlist={addWatchlist} />
          <Row title="Movies" movies={movies} onWatchlist={addWatchlist} />
          {series.length > 0 && <Row title="Series" movies={series} onWatchlist={addWatchlist} />}
          {GENRES.map((genre) => <Row key={genre} title={genre} movies={byGenre(genre)} onWatchlist={addWatchlist} />)}
        </>
      )}
    </div>
  );
}
