import { createContext, useContext, useRef, useState, useCallback } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
    const audioRef = useRef(null);
    const [queue, setQueue] = useState([]);   // array of song objects
    const [index, setIndex] = useState(0);    // current track index
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);    // 0-1
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [visible, setVisible] = useState(false);

    const currentSong = queue[index] || null;

    const playSong = useCallback((song, list = null) => {
        const newQueue = list || [song];
        const newIndex = list ? list.findIndex(s => s._id === song._id) : 0;
        setQueue(newQueue);
        setIndex(newIndex < 0 ? 0 : newIndex);
        setVisible(true);
        setPlaying(true);
    }, []);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            audioRef.current.play().catch(() => { });
            setPlaying(true);
        }
    }, [playing]);

    const seek = useCallback((ratio) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = ratio * audioRef.current.duration;
    }, []);

    const next = useCallback(() => {
        setIndex(i => {
            const n = i + 1 < queue.length ? i + 1 : 0;
            setPlaying(true);
            return n;
        });
    }, [queue.length]);

    const prev = useCallback(() => {
        setIndex(i => {
            const n = i - 1 >= 0 ? i - 1 : queue.length - 1;
            setPlaying(true);
            return n;
        });
    }, [queue.length]);

    const close = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); }
        setVisible(false);
        setPlaying(false);
    }, []);

    return (
        <PlayerContext.Provider value={{
            audioRef, queue, index, currentSong,
            playing, progress, duration, volume, visible,
            setProgress, setDuration, setVolume, setPlaying,
            playSong, togglePlay, seek, next, prev, close,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
