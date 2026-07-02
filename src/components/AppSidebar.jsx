import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Film, Home, Compass, Bookmark, Crown, Users, LayoutDashboard,
  TrendingUp, Settings, LogOut, Bell, ChevronLeft, ChevronRight,
  User, Shield, Star, Music,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import NotificationBell from './NotificationBell';
import Logo from './Logo';
import './AppSidebar.css';

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Build nav items based on role
  const navItems = [
    { to: '/movies', icon: Home, label: 'Browse', always: true },
    { to: '/music', icon: Music, label: 'Music', always: true },
    { to: '/actors', icon: Users, label: 'Actors', always: true },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist', always: true },
    { to: '/subscription', icon: Crown, label: 'Subscribe', always: true },
    { to: '/account', icon: User, label: 'Account', always: true },
    // Author/Admin
    ...(user?.role === 'author' || user?.role === 'admin'
      ? [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
      : []),
    // Actor
    ...(user?.role === 'actor' && user?.actorId
      ? [{ to: `/actors/${user.actorId}`, icon: Star, label: 'My Profile' }]
      : []),
    // Admin only
    ...(user?.role === 'admin' ? [
      { to: '/admin', icon: Shield, label: 'Admin Panel' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
    ] : []),
  ];

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="app-sidebar-logo">
        {collapsed
          ? <Link to="/movies" className="app-sidebar-logo-icon" aria-label="Lumina Cinema">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#f59e0b" strokeWidth="2.2" fill="none" opacity="0.25" />
              <circle cx="24" cy="24" r="10" stroke="#f59e0b" strokeWidth="2" fill="none" />
              <circle cx="24" cy="24" r="3.5" fill="#f59e0b" />
              <circle cx="24" cy="6" r="2.8" fill="#f59e0b" opacity="0.7" />
              <circle cx="24" cy="42" r="2.8" fill="#f59e0b" opacity="0.7" />
              <circle cx="6" cy="24" r="2.8" fill="#f59e0b" opacity="0.7" />
              <circle cx="42" cy="24" r="2.8" fill="#f59e0b" opacity="0.7" />
              <path d="M21 19.5 L21 28.5 L29 24 Z" fill="#f59e0b" opacity="0.9" />
            </svg>
          </Link>
          : <Logo size="sm" to="/movies" />
        }
        <button
          className="app-sidebar-collapse"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="app-sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`app-sidebar-link${active ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.6} />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span className="app-sidebar-active-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: notifications + user + logout */}
      <div className="app-sidebar-bottom">
        <div className={`app-sidebar-notif${collapsed ? ' centered' : ''}`}>
          <NotificationBell />
          {!collapsed && <span className="app-sidebar-notif-label">Notifications</span>}
        </div>

        <div className={`app-sidebar-user${collapsed ? ' centered' : ''}`}>
          <div className="app-sidebar-avatar">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="app-sidebar-user-info">
              <span className="app-sidebar-user-name">{user?.name?.split(' ')[0]}</span>
              <span className="app-sidebar-user-role">{user?.role}</span>
            </div>
          )}
        </div>

        <button
          className={`app-sidebar-logout${collapsed ? ' centered' : ''}`}
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} strokeWidth={1.5} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
