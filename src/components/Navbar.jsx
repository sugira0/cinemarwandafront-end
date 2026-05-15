import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useEffect, useState } from 'react';
import { Bookmark, LayoutDashboard, LogOut, LogIn, UserPlus, Menu, X, Users, TrendingUp, Crown } from 'lucide-react';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const browseTarget = user ? '/movies' : '/login';
  const actorsTarget = user ? '/actors' : '/login';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path) => { setMenuOpen(false); navigate(path); };
  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Logo size="sm" />

        {/* Desktop links */}
        <div className="navbar-links desktop-links">
          <Link to={browseTarget}>Browse</Link>
          <Link to={actorsTarget}><Users size={15} strokeWidth={1.5} /> Actors</Link>
          {user && <Link to="/watchlist"><Bookmark size={15} strokeWidth={1.5} /> Watchlist</Link>}
          {user && <Link to="/subscription"><Crown size={15} strokeWidth={1.5} /> Subscribe</Link>}
          {user?.role === 'actor' && user?.actorId && (
            <Link to={`/actors/${user.actorId}`}><Users size={15} strokeWidth={1.5} /> My Profile</Link>
          )}
          {(user?.role === 'author' || user?.role === 'admin') && (
            <Link to="/dashboard"><LayoutDashboard size={15} strokeWidth={1.5} /> Dashboard</Link>
          )}
          {user?.role === 'admin' && <Link to="/admin"><LayoutDashboard size={15} strokeWidth={1.5} /> Admin</Link>}
          {user?.role === 'admin' && <Link to="/users"><Users size={15} strokeWidth={1.5} /> Users</Link>}
          {user?.role === 'admin' && <Link to="/analytics"><TrendingUp size={15} strokeWidth={1.5} /> Analytics</Link>}
          {user ? (
            <>
              {user && <NotificationBell />}
              <Link to="/account" className="navbar-username">{user.name?.split(' ')[0]}</Link>
              <button onClick={handleLogout} className="btn-logout"><LogOut size={14} strokeWidth={1.5} /> Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login"><LogIn size={14} strokeWidth={1.5} /> Login</Link>
              <Link to="/register" className="btn-register"><UserPlus size={14} strokeWidth={2} /> Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          <button className="mobile-link" onClick={() => go(browseTarget)}>Browse</button>
          <button className="mobile-link" onClick={() => go(actorsTarget)}>Actors</button>
          {user && <button className="mobile-link" onClick={() => go('/watchlist')}>Watchlist</button>}
          {user?.role === 'actor' && user?.actorId && (
            <button className="mobile-link" onClick={() => go(`/actors/${user.actorId}`)}>My Profile</button>
          )}
          {(user?.role === 'author' || user?.role === 'admin') && (
            <button className="mobile-link" onClick={() => go('/dashboard')}>Dashboard</button>
          )}
          {user?.role === 'admin' && (
            <button className="mobile-link" onClick={() => go('/admin')}>Admin</button>
          )}
          {user ? (
            <>
              <button className="mobile-link" onClick={() => go('/account')}>My Account</button>
              <button className="mobile-link danger" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="mobile-link" onClick={() => go('/login')}>Login</button>
              <button className="mobile-link green" onClick={() => go('/register')}>Get Started</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
