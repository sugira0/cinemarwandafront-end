import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

const PING_INTERVAL = 30_000; // 30s

export default function usePresence(user, currentMovie = null) {
  const location = useLocation();
  const timerRef = useRef(null);
  const deviceId = localStorage.getItem('deviceId') || 'unknown';

  const ping = useCallback(async () => {
    // Skip ping when tab is hidden — saves battery and bandwidth
    if (!user || document.hidden) return;
    try {
      await api.post('/presence/ping', {
        name:       user.name,
        deviceId,
        page:       location.pathname,
        movieId:    currentMovie?._id   || null,
        movieTitle: currentMovie?.title || null,
      });
    } catch {}
  }, [user, deviceId, location.pathname, currentMovie?._id, currentMovie?.title]);

  useEffect(() => {
    if (!user) return;

    ping();
    timerRef.current = setInterval(ping, PING_INTERVAL);

    // Pause/resume pings based on tab visibility
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timerRef.current);
      } else {
        ping(); // immediate ping when tab becomes visible again
        timerRef.current = setInterval(ping, PING_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, ping]);

  // Mark offline on unmount / logout
  useEffect(() => {
    return () => {
      if (user) api.delete('/presence/ping').catch(() => {});
    };
  }, [user]);
}
