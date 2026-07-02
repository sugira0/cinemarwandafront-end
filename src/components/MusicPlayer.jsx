import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music } from 'lucide-react';
import { usePlayer } from '../context/player-context';
import './MusicPlayer.css';

export default function MusicPlayer() {
    const {
        audioRef, currentSong, playing, progress, duration, volume, visible,
        setProgress, setDuration, setPlaying, setVolume,
        togglePlay, seek, next, prev, close,
    } = usePlayer();

    const progressRef = useRef(null);

    const audioSrc = currentSong?.audioLink || currentSong?.audioUrl || null;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        const onDuration = () => setDuration(audio.duration || 0);
        const onEnded = () => next();
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onDuration);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onDuration);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [audioRef, next, setProgress, setDuration, setPlaying]);

    // Auto-play when song or src changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioSrc) return;
        audio.src = audioSrc;
        audio.volume = volume;
        if (playing) audio.play().catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioSrc]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume, audioRef]);

    const handleProgressClick = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        seek((e.clientX - rect.left) / rect.width);
    };

    const fmt = (s) => {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (!visible || !currentSong) return null;

    return (
        <>
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="metadata" />

            <div className="mp-bar">
                {/* Cover + info */}
                <div className="mp-track">
                    <div className="mp-cover">
                        {currentSong.cover
                            ? <img src={currentSong.cover} alt={currentSong.title} />
                            : <Music size={20} strokeWidth={1.5} />}
                    </div>
                    <div className="mp-info">
                        <span className="mp-title">{currentSong.title}</span>
                        <span className="mp-artist">{currentSong.artist}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="mp-controls">
                    <button className="mp-btn" onClick={prev} aria-label="Previous">
                        <SkipBack size={18} strokeWidth={1.8} />
                    </button>
                    <button className="mp-btn play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                        {playing ? <Pause size={22} strokeWidth={1.8} /> : <Play size={22} strokeWidth={1.8} />}
                    </button>
                    <button className="mp-btn" onClick={next} aria-label="Next">
                        <SkipForward size={18} strokeWidth={1.8} />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="mp-progress-wrap">
                    <span className="mp-time">{fmt(progress * duration)}</span>
                    <div
                        className="mp-progress"
                        ref={progressRef}
                        onClick={handleProgressClick}
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={1}
                        aria-valuenow={progress}
                    >
                        <div className="mp-progress-fill" style={{ width: `${progress * 100}%` }} />
                        <div className="mp-progress-thumb" style={{ left: `${progress * 100}%` }} />
                    </div>
                    <span className="mp-time">{fmt(duration)}</span>
                </div>

                {/* Volume */}
                <div className="mp-volume">
                    <Volume2 size={15} strokeWidth={1.5} />
                    <input
                        type="range" min="0" max="1" step="0.02"
                        value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        aria-label="Volume"
                    />
                </div>

                <button className="mp-close" onClick={close} aria-label="Close player">
                    <X size={16} strokeWidth={2} />
                </button>
            </div>
        </>
    );
}
