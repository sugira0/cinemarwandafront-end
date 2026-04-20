import { Link } from 'react-router-dom';
import { Play, ImageOff } from 'lucide-react';
import { mediaUrl } from '../lib/config';
import './MovieCard.css';

export default function MovieCard({ movie, style }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card" style={style}>
      <div className="movie-poster">
        {movie.poster
          ? <img src={mediaUrl(movie.poster)} alt={movie.title} />
          : <div className="no-poster"><ImageOff size={30} strokeWidth={1} /><span>No Poster</span></div>
        }
        {movie.type === 'series' && <span className="type-badge">Series</span>}
        <div className="movie-overlay">
          <div className="play-btn">
            <Play size={20} fill="white" strokeWidth={0} style={{ marginLeft: 2 }} />
          </div>
        </div>
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <div className="movie-meta">
          {movie.year && <span>{movie.year}</span>}
          {movie.year && movie.duration && <span className="movie-meta-dot" />}
          {movie.duration && <span>{movie.duration}</span>}
        </div>
        <div className="genres">
          {movie.genre?.slice(0, 2).map(g => <span key={g} className="genre-tag">{g}</span>)}
        </div>
      </div>
    </Link>
  );
}
