import { useEffect, useState } from 'react';
import api from '../api/axios';
import MovieCard from '../components/MovieCard';
import './Movies.css';

export default function Watchlist() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    api.get('/watchlist').then(r => setMovies(r.data));
  }, []);

  return (
    <div className="movies-page">
      <h1 className="page-title">My Watchlist</h1>
      <p className="page-subtitle">Films you've saved to watch later</p>
      <div className="movies-grid">
        {movies.length
          ? movies.map((m, i) => <MovieCard key={m._id} movie={m} style={{ animationDelay: `${i * 0.07}s` }} />)
          : <p className="empty">Your watchlist is empty. Browse films and add some.</p>
        }
      </div>
    </div>
  );
}
