import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../api/axios';
import { absoluteUrl } from '../lib/config';
import VideoPlayer from './VideoPlayer';
import './VideoModal.css';

const deviceId = localStorage.getItem('deviceId') || 'unknown';

export default function VideoModal({ title, movieId, episodeId = null, poster = '', onClose, onPlay }) {
  const [allowed, setAllowed] = useState(null);
  const [blockMsg, setBlockMsg] = useState('');
  const [playback, setPlayback] = useState({ kind: null, source: '' });
  const pingRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlayback() {
      try {
        const { data } = await api.post('/streams/start', {
          movieId,
          deviceId,
          episodeId: episodeId || undefined,
        });

        if (!mounted) return;

        setPlayback({
          kind: data.kind,
          source: data.kind === 'file' ? absoluteUrl(data.source) : data.source,
        });
        setAllowed(true);
        pingRef.current = setInterval(() => {
          api.post('/streams/ping', { deviceId }).catch(() => {
            // Ignore keepalive errors until the modal closes.
          });
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
      api.post('/streams/stop', { deviceId }).catch(() => {
        // Ignore stream cleanup failures during modal teardown.
      });
    };
  }, [episodeId, movieId]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="vmodal-backdrop" onClick={onClose}>
      <div className="vmodal-container" onClick={(event) => event.stopPropagation()}>
        <div className="vmodal-header">
          <span className="vmodal-title">{title}</span>
          <button className="vmodal-close" onClick={onClose}><X size={20} strokeWidth={1.5} /></button>
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
            <button className="vmodal-close-btn" onClick={onClose}>Close</button>
          </div>
        )}

        {allowed === true && (
          <div className="vmodal-player-wrap">
            <VideoPlayer
              source={playback.source}
              sourceType={playback.kind}
              poster={poster}
              onPlay={onPlay}
            />
          </div>
        )}
      </div>
    </div>
  );
}
