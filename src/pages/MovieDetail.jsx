import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, Eye, Globe, ImageOff, Play, Plus } from 'lucide-react';
import api from '../api/axios';
import Comments from '../components/Comments';
import LoginModal from '../components/LoginModal';
import Paywall from '../components/Paywall';
import VideoModal from '../components/VideoModal';
import { useAuth } from '../context/auth-context';
import { mediaUrl } from '../lib/config';
import './MovieDetail.css';

function EpisodeList({ episodes, onOpenModal }) {
  if (!episodes?.length) {
    return <div className="no-video"><ImageOff size={24} strokeWidth={1} /> No episodes yet.</div>;
  }

  const groupedEpisodes = episodes.reduce((grouped, episode) => {
    const seasonKey = `Season ${episode.season}`;
    if (!grouped[seasonKey]) grouped[seasonKey] = [];
    grouped[seasonKey].push(episode);
    return grouped;
  }, {});

  return (
    <div className="episode-list">
      {Object.entries(groupedEpisodes).map(([season, seasonEpisodes]) => (
        <div key={season} className="season-group">
          <p className="season-label">{season}</p>
          {seasonEpisodes.map((episode) => (
            <div key={episode._id} className="ep-item">
              <button
                className="ep-item-header"
                onClick={() => episode.hasVideo && onOpenModal(episode)}
                style={{ cursor: episode.hasVideo ? 'pointer' : 'default' }}
              >
                <span className="ep-badge">E{episode.episode}</span>
                <span className="ep-item-title">{episode.title}</span>
                {episode.duration && <span className="ep-item-dur">{episode.duration}</span>}
                {episode.hasVideo
                  ? <Play size={14} fill="white" strokeWidth={0} />
                  : <ImageOff size={14} strokeWidth={1} style={{ opacity: 0.3 }} />}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function hasActiveSubscription(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'author') return true;

  const subscription = user.subscription;
  return Boolean(subscription?.active && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date());
}

export default function MovieDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [movie, setMovie] = useState(null);
  const [msg, setMsg] = useState('');
  const [views, setViews] = useState(null);
  const [movieModalId, setMovieModalId] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlayback, setPendingPlayback] = useState(null);
  const viewCounted = useRef(false);

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then((response) => {
        setMovie(response.data);
        setViews(response.data.views);
      });

    window.scrollTo(0, 0);
    viewCounted.current = false;
  }, [id]);

  const handlePlay = () => {
    if (viewCounted.current) return;
    viewCounted.current = true;
    api.post(`/movies/${id}/view`)
      .then((response) => setViews(response.data.views))
      .catch(() => {
        // Ignore analytics write failures during playback.
      });
  };

  const openPlayback = (episode = null) => {
    if (episode) {
      setActiveEpisode({ movieId: id, episode });
      return;
    }

    setMovieModalId(id);
  };

  const requestPlayback = async (episode = null) => {
    if (!user) {
      setPendingPlayback(episode ? { type: 'episode', episode } : { type: 'movie' });
      setShowLoginModal(true);
      return;
    }

    if (hasActiveSubscription(user)) {
      openPlayback(episode);
      refreshUser().catch(() => {
        // Keep playback moving even if the silent refresh fails.
      });
      return;
    }

    const freshUser = await refreshUser();
    if (!hasActiveSubscription(freshUser)) {
      setShowPaywall(true);
      return;
    }

    openPlayback(episode);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      setMsg('Login to use watchlist');
      return;
    }

    try {
      await api.post(`/watchlist/${id}`);
      setMsg('Added to watchlist');
    } catch {
      setMsg('Already in your watchlist');
    }
  };

  if (!movie) return <div className="loading">Loading...</div>;

  const viewCount = views ?? movie.views;
  const posterSrc = mediaUrl(movie.poster);

  return (
    <div className="movie-detail">
      <div className="detail-backdrop" />

      <div className="detail-hero">
        <div className="detail-poster-wrap">
          {movie.poster
            ? <img src={mediaUrl(movie.poster)} alt={movie.title} className="detail-poster" />
            : (
              <div className="detail-poster-placeholder">
                <ImageOff size={40} strokeWidth={1} />
                <span>No Poster</span>
              </div>
            )}
        </div>

        <div className="detail-info">
          <h1>{movie.title}</h1>

          <div className="meta-row">
            {movie.year && <span className="meta-pill"><Calendar size={12} strokeWidth={1.5} /> {movie.year}</span>}
            {movie.duration && <span className="meta-pill"><Clock size={12} strokeWidth={1.5} /> {movie.duration}</span>}
            {movie.language && <span className="meta-pill"><Globe size={12} strokeWidth={1.5} /> {movie.language}</span>}
            {viewCount !== undefined && <span className="meta-pill"><Eye size={12} strokeWidth={1.5} /> {viewCount?.toLocaleString()} views</span>}
          </div>

          <div className="genres">
            {movie.genre?.map((genre) => <span key={genre} className="genre-tag">{genre}</span>)}
          </div>

          <p className="description">{movie.description}</p>

          <div className="detail-actions">
            {movie.hasVideo
              ? (
                <button className="btn-watch" onClick={() => requestPlayback()}>
                  <Play size={16} fill="black" strokeWidth={0} />
                  {user && !hasActiveSubscription(user) ? 'Subscribe to Watch' : 'Watch Now'}
                </button>
              )
              : <span className="btn-coming-soon"><Play size={16} strokeWidth={1.5} /> No Video Yet</span>}
            <button className="btn-watchlist" onClick={toggleWatchlist}><Plus size={16} strokeWidth={2} /> Watchlist</button>
          </div>

          {!user && movie.hasVideo && (
            <p className="detail-login-hint">
              <Link to="/login">Sign in</Link> to watch the full movie
            </p>
          )}

          {msg && <p className="detail-msg">{msg}</p>}
        </div>
      </div>

      {movie.type === 'series' && (
        <div className="player-section">
          <div className="player-header">
            <h2>Episodes</h2>
            <div className="player-divider" />
          </div>
          <EpisodeList episodes={movie.episodes} onOpenModal={requestPlayback} />
        </div>
      )}

      {movieModalId === id && movie.type !== 'series' && (
        <VideoModal
          title={movie.title}
          movieId={movie._id}
          poster={posterSrc}
          onPlay={handlePlay}
          onClose={() => setMovieModalId(null)}
        />
      )}

      {activeEpisode?.movieId === id && (
        <VideoModal
          title={`${movie.title} - S${activeEpisode.episode.season} E${activeEpisode.episode.episode}: ${activeEpisode.episode.title}`}
          movieId={movie._id}
          episodeId={activeEpisode.episode._id}
          poster={posterSrc}
          onPlay={handlePlay}
          onClose={() => setActiveEpisode(null)}
        />
      )}

      {showPaywall && <Paywall movieTitle={movie.title} onClose={() => setShowPaywall(false)} />}

      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            setPendingPlayback(null);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
            const queuedEpisode = pendingPlayback?.type === 'episode' ? pendingPlayback.episode : null;
            setTimeout(() => {
              requestPlayback(queuedEpisode);
              setPendingPlayback(null);
            }, 300);
          }}
        />
      )}

      <Comments movieId={id} />
    </div>
  );
}
