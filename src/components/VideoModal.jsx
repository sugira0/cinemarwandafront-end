import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../api/axios';
import { absoluteUrl } from '../lib/config';
import VideoPlayer from './VideoPlayer';
import './VideoModal.css';

const deviceId = localStorage.getItem('deviceId') || 'unknown';
const SAVE_INTERVAL_MS = 10000; // save progress every 10 seconds

export default function VideoModal({ title, movieId, episodeId = null, poster = '', onClose, onPlay }) {
  const [allowed, setAllowed] = useState(null);
  const [blockMsg, setBlockMsg] = useState('');
  const [playback, setPlayback] = useState({ kind: null, source: '' });
  const [resumeAt, setResumeAt] = useState(0);
  const [showResume, setShowResume] = useState(false);
  const pingRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null); // will be passed down to VideoPlayer

  // ── Load playback + saved progress ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadPlayback() {
      try {
        // Load stream + saved progress in parallel
        const [streamRes, progressRes] = await Promise.all([
          api.post('/streams/start', { movieId, deviceId, episodeId: episodeId || undefined }),
          api.get(`/progress/${movieId}`, { params: episodeId ? { episodeId } : {} }).catch(() => ({ data: { position: 0 } })),
        ]);

        if (!mounted) return;

        const savedPosition = progressRes.data?.position || 0;
        const savedPercent = progressRes.data?.percent || 0;

        setPlayback({
          kind: streamRes.data.kind,
          source: streamRes.data.kind === 'file' ? absoluteUrl(streamRes.data.source) : streamRes.data.source,
        });
        setAllowed(true);

        // Show resume prompt if user was more than 5% in and more than 30s
        if (savedPosition > 30 && savedPercent < 92) {
          setResumeAt(savedPosition);
          setShowResume(true);
        }

        // Start stream ping
        pingRef.current = setInterval(() => {
          api.post('/streams/ping', { deviceId }).catch(() => { });
        }, 30000);
      } catch (err) {
        if (!mounted) return;
        setAllowed(false);
        setBlockMsg(err.response?.data?.message || 'Stream limit reached.');
      }
    }

    loadPlayback();

    return () => {
      mounted = false;
      clearInterval(pingRef.current);
      clearInterval(progressRef.current);
      api.post('/streams/stop', { deviceId }).catch(() => { });
    };
  }, [episodeId, movieId]);

  // ── Save progress periodically ────────────────────────────────────────────
  function startProgressSaving() {
    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || !video.currentTime) return;
      api.post('/progress', {
        movieId,
        episodeId: episodeId || null,
        position: Math.floor(video.currentTime),
        duration: Math.floor(video.duration) || 0,
      }).catch(() => { });
    }, SAVE_INTERVAL_MS);
  }

  // Save final position on close
  function saveProgressNow() {
    const video = videoRef.current;
    if (!video || !video.currentTime) return;
    api.post('/progress', {
      movieId,
      episodeId: episodeId || null,
      position: Math.floor(video.currentTime),
      duration: Math.floor(video.duration) || 0,
    }).catch(() => { });
  }

  const handleClose = () => {
    saveProgressNow();
    onClose();
  };

  // ── Keyboard escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="vmodal-backdrop" onClick={handleClose}>
      <div className="vmodal-container" onClick={e => e.stopPropagation()}>
        <div className="vmodal-header">
          <span className="vmodal-title">{title}</span>
          <button className="vmodal-close" onClick={handleClose}><X size={20} strokeWidth={1.5} /></button>
        </div>

        {allowed === null && (
          <div className="vmodal-checking">
            <div className="vmodal-spinner" />
            <p>Loading video...</p>
          </div>
        )}

        {allowed === false && (
          <div className="vmodal-blocked">
            <AlertTriangle size={36} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
            <h3>Unable to Start Playback</h3>
            <p>{blockMsg}</p>
            <button className="vmodal-close-btn" onClick={handleClose}>Close</button>
          </div>
        )}

        {allowed === true && (
          <div className="vmodal-player-wrap" style={{ position: 'relative' }}>

            {/* Resume prompt */}
            {showResume && (
              <div className="vmodal-resume-bar">
                <span>Resume from {formatTime(resumeAt)}?</span>
                <div className="vmodal-resume-actions">
                  <button onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = resumeAt;
                    setShowResume(false);
                    startProgressSaving();
                  }}>
                    Resume
                  </button>
                  <button onClick={() => {
                    setShowResume(false);
                    startProgressSaving();
                  }} className="secondary">
                    Start over
                  </button>
                </div>
              </div>
            )}

            <VideoPlayer
              source={playback.source}
              sourceType={playback.kind}
              poster={poster}
              startTime={showResume ? 0 : resumeAt}
              videoRef={videoRef}
              onPlay={() => {
                if (onPlay) onPlay();
                if (!showResume) startProgressSaving();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
