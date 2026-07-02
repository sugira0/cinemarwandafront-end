import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { absoluteUrl } from '../lib/config';
import VideoPlayer from './VideoPlayer';
import './VideoModal.css';

const deviceId = localStorage.getItem('deviceId') || 'unknown';
const SAVE_INTERVAL_MS = 10000;

export default function VideoModal({ title, movieId, episodeId = null, poster = '', onClose, onPlay }) {
  const [allowed, setAllowed] = useState(null);
  const [blockMsg, setBlockMsg] = useState('');
  const [blockCode, setBlockCode] = useState('');
  const [playback, setPlayback] = useState({ kind: null, source: '' });
  const [resumeAt, setResumeAt] = useState(0);
  const [showResume, setShowResume] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const pingRef = useRef(null);
  const progressRef = useRef(null);
  const videoRef = useRef(null);

  // ── Load playback + saved progress ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadPlayback() {
      try {
        const [streamRes, progressRes] = await Promise.all([
          api.post('/streams/start', { movieId, deviceId, episodeId: episodeId || undefined }),
          api.get(`/progress/${movieId}`, { params: episodeId ? { episodeId } : {} }).catch(() => ({ data: { position: 0, percent: 0 } })),
        ]);

        if (!mounted) return;

        const savedPosition = progressRes.data?.position || 0;
        const savedPercent = progressRes.data?.percent || 0;

        setPlayback({
          kind: streamRes.data.kind,
          source: streamRes.data.kind === 'file' ? absoluteUrl(streamRes.data.source) : streamRes.data.source,
        });
        setAllowed(true);

        if (savedPosition > 30 && savedPercent < 92) {
          setResumeAt(savedPosition);
          setShowResume(true);
        }

        pingRef.current = setInterval(() => {
          api.post('/streams/ping', { deviceId }).catch(() => { });
        }, 30000);
      } catch (err) {
        if (!mounted) return;
        setAllowed(false);
        setBlockMsg(err.response?.data?.message || 'Unable to start playback.');
        setBlockCode(err.response?.data?.code || '');
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

  // ── Progress saving ────────────────────────────────────────────────────
  function startProgressSaving() {
    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || !video.currentTime) return;
      const pos = Math.floor(video.currentTime);
      const dur = Math.floor(video.duration) || 0;
      if (dur > 0) setProgress(Math.min(100, Math.round((pos / dur) * 100)));
      api.post('/progress', {
        movieId,
        episodeId: episodeId || null,
        position: pos,
        duration: dur,
      }).catch(() => { });
    }, SAVE_INTERVAL_MS);
  }

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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, []);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="vmodal-backdrop">
      <div className="vmodal-container">

        {/* ── Top bar ── */}
        <div className="vmodal-header">
          <button className="vmodal-back" onClick={handleClose}>
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Back</span>
          </button>

          <span className="vmodal-title">{title}</span>

          <div className="vmodal-header-right">
            <button className="vmodal-close" onClick={handleClose}>
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {allowed === null && (
          <div className="vmodal-checking">
            <span className="vmodal-checking-logo">Lumina Cinema</span>
            <div className="vmodal-spinner" />
            <p>Loading video...</p>
          </div>
        )}

        {/* ── Blocked ── */}
        {allowed === false && (
          <div className="vmodal-blocked">
            <div className="vmodal-blocked-icon">
              {blockCode === 'NO_SUBSCRIPTION'
                ? <Crown size={32} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                : <AlertTriangle size={32} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
              }
            </div>
            <h3>
              {blockCode === 'NO_SUBSCRIPTION' ? 'Subscription Required' : 'Unable to Play'}
            </h3>
            <p>{blockMsg}</p>
            <div className="vmodal-blocked-actions">
              {blockCode === 'NO_SUBSCRIPTION' && (
                <Link to="/plans" className="vmodal-upgrade-btn" onClick={handleClose}>
                  <Crown size={15} strokeWidth={2} /> Upgrade Plan
                </Link>
              )}
              <button className="vmodal-close-btn" onClick={handleClose}>
                <ArrowLeft size={15} strokeWidth={2} /> Go Back
              </button>
            </div>
          </div>
        )}

        {/* ── Player ── */}
        {allowed === true && (
          <div className="vmodal-player-wrap">

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
                    ▶ Resume
                  </button>
                  <button className="secondary" onClick={() => {
                    setShowResume(false);
                    startProgressSaving();
                  }}>
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

            {/* Gold progress bar at bottom */}
            {progress > 0 && (
              <div className="vmodal-progress-bar">
                <div className="vmodal-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
