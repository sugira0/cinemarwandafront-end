import { useEffect, useState } from 'react';
import { Music, Play, Pause, Search, X } from 'lucide-react';
import api from '../api/axios';
import { usePlayer } from '../context/player-context';
import './Music.css';

function SongCard({ song, isPlaying, onPlay }) {
    return (
        <div className={`song-card${isPlaying ? ' active' : ''}`} onClick={onPlay}>
            <div className="song-card-cover">
                {song.cover
                    ? <img src={song.cover} alt={song.title} loading="lazy" />
                    : <div className="song-card-no-cover"><Music size={28} strokeWidth={1.2} /></div>
                }
                <button className="song-card-play" aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause size={20} strokeWidth={2} /> : <Play size={20} strokeWidth={2} />}
                </button>
            </div>
            <div className="song-card-info">
                <span className="song-card-title">{song.title}</span>
                <span className="song-card-artist">{song.artist}</span>
                {song.album && <span className="song-card-album">{song.album}</span>}
                <div className="song-card-meta">
                    {song.genre?.[0] && <span className="song-tag">{song.genre[0]}</span>}
                    {song.year && <span className="song-tag">{song.year}</span>}
                    {song.country && <span className="song-tag">{song.country}</span>}
                </div>
            </div>
        </div>
    );
}

export default function MusicPage() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState([]);
    const { playSong, currentSong, playing } = usePlayer();

    useEffect(() => {
        api.get('/songs').then(r => {
            setSongs(r.data);
            setFiltered(r.data);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!search.trim()) { setFiltered(songs); return; }
        const q = search.toLowerCase();
        setFiltered(songs.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            (s.album || '').toLowerCase().includes(q)
        ));
    }, [search, songs]);

    const handlePlay = (song) => playSong(song, filtered);

    const featured = songs.filter(s => s.featured);

    return (
        <div className="music-page">
            {/* Header */}
            <div className="music-header">
                <div>
                    <h1 className="music-page-title">Music</h1>
                    <p className="music-page-sub">African sounds, Rwandan beats</p>
                </div>
                <div className="music-search">
                    <Search size={15} strokeWidth={1.8} className="music-search-icon" />
                    <input
                        placeholder="Search songs, artists..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} aria-label="Clear search">
                            <X size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="music-loading">
                    <span className="route-loading-mark" />
                    <span>Loading music...</span>
                </div>
            ) : (
                <>
                    {/* Featured tracks */}
                    {featured.length > 0 && !search && (
                        <section className="music-section">
                            <h2 className="music-section-title">Featured</h2>
                            <div className="music-featured-row">
                                {featured.map(song => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        isPlaying={currentSong?._id === song._id && playing}
                                        onPlay={() => handlePlay(song)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All songs grid */}
                    <section className="music-section">
                        <h2 className="music-section-title">
                            {search ? `Results for "${search}"` : 'All Songs'}
                            <span className="music-count">{filtered.length}</span>
                        </h2>
                        {filtered.length === 0 ? (
                            <p className="music-empty">No songs found. Try a different search.</p>
                        ) : (
                            <div className="music-grid">
                                {filtered.map(song => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        isPlaying={currentSong?._id === song._id && playing}
                                        onPlay={() => handlePlay(song)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
