import { useEffect, useMemo, useRef, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { absoluteUrl, mediaUrl } from '../lib/config';
import './TrailerPlayer.css';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getVimeoId(url) {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function getDirectVideoUrl(url) {
  if (!url) return null;
  return /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(url) ? absoluteUrl(url) : null;
}

function buildEmbedUrl({ trailerUrl, ytId, vimeoId }) {
  if (ytId) {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    return `https://www.youtube.com/embed/${ytId}?${params.toString()}`;
  }

  if (vimeoId) {
    const params = new URLSearchParams({
      autoplay: '1',
      muted: '1',
      loop: '0',
      background: '1',
      autopause: '0',
    });
    return `https://player.vimeo.com/video/${vimeoId}?${params.toString()}`;
  }

  return getDirectVideoUrl(trailerUrl);
}

export default function TrailerPlayer({ trailerUrl, poster }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const previewLimitMs = user ? 15000 : 30000;
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const [ended, setEnded] = useState(false);
  const [visible, setVisible] = useState(false);

  const ytId = getYouTubeId(trailerUrl);
  const vimeoId = getVimeoId(trailerUrl);
  const directVideoUrl = getDirectVideoUrl(trailerUrl);

  const embedUrl = useMemo(
    () => buildEmbedUrl({ trailerUrl, ytId, vimeoId }),
    [trailerUrl, ytId, vimeoId],
  );

  useEffect(() => {
    if (!embedUrl) return undefined;

    const videoElement = videoRef.current;
    timerRef.current = setTimeout(() => {
      videoElement?.pause();
      setEnded(true);
    }, previewLimitMs);

    return () => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      videoElement?.pause();
    };
  }, [embedUrl, previewLimitMs]);

  if (!ytId && !vimeoId && !directVideoUrl) return null;

  return (
    <div className="trailer-wrap">
      <div
        className={`trailer-poster${ended || !visible ? ' show' : ''}`}
        style={poster ? { backgroundImage: `url(${mediaUrl(poster)})` } : {}}
      />

      {!ended && directVideoUrl && (
        <video
          ref={videoRef}
          className={`trailer-native${visible ? ' visible' : ''}`}
          src={directVideoUrl}
          autoPlay
          muted
          playsInline
          onCanPlay={() => setVisible(true)}
          onEnded={() => setEnded(true)}
        />
      )}

      {!ended && !directVideoUrl && embedUrl && (
        <iframe
          className={`trailer-iframe${visible ? ' visible' : ''}`}
          src={embedUrl}
          title="Trailer"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => setVisible(true)}
        />
      )}

      {ended && !user && (
        <div className="trailer-login-wall">
          <div className="trailer-login-card">
            <p className="tlw-title">Sign in to watch the full movie</p>
            <p className="tlw-sub">Create a free account or log in to continue watching</p>
            <div className="tlw-actions">
              <button className="tlw-btn primary" onClick={() => navigate('/login')}>
                <LogIn size={16} strokeWidth={2} /> Sign In
              </button>
              <button className="tlw-btn outline" onClick={() => navigate('/register')}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
