import { useState, useEffect } from 'react';
import {
  User, Film, Heart, Users, Pencil, Check, X, Upload,
  LayoutDashboard, LogOut, Settings, Bell, Star, MapPin,
  Calendar, RefreshCw, Instagram, Twitter,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { mediaUrl } from '../lib/config';
import MovieCard from '../components/MovieCard';
import Logo from '../components/Logo';
import './ActorPortal.css';

const NAV = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'profile',  icon: User,            label: 'My Profile' },
  { id: 'films',    icon: Film,            label: 'My Films' },
  { id: 'settings', icon: Settings,        label: 'Settings' },
];

function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

export default function ActorPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]               = useState('overview');
  const [actor, setActor]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [editPhoto, setEditPhoto]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]         = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadActor = () => {
    if (!user?.actorId) { setLoading(false); return; }
    api.get(`/actors/${user.actorId}`)
      .then(r => {
        setActor(r.data);
        setEditForm({
          name:       r.data.name       || '',
          bio:        r.data.bio        || '',
          birthDate:  r.data.birthDate  || '',
          birthPlace: r.data.birthPlace || '',
          instagram:  r.data.social?.instagram || '',
          tiktok:     r.data.social?.tiktok    || '',
          twitter:    r.data.social?.twitter   || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadActor();
    api.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => v && fd.append(k, v));
      if (editPhoto) fd.append('photo', editPhoto);
      const { data } = await api.put(`/actors/${user.actorId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setActor(prev => ({ ...prev, ...data, movies: prev?.movies }));
      setEditing(false);
      setEditPhoto(null);
      flash('Profile updated.');
    } catch (err) {
      flash(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read').catch(() => {});
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const social = actor?.social || {};

  return (
    <div className="portal-shell">
      {/* ── Sidebar ── */}
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <Logo size="sm" as="div" subtitle="Actor Portal" />
        </div>

        <nav className="portal-nav">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`portal-nav-btn${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="portal-sidebar-footer">
          <div className="portal-user-chip">
            <div className="portal-user-avatar">{user?.name?.[0]}</div>
            <div>
              <div className="portal-user-name">{user?.name}</div>
              <div className="portal-user-role">Actor</div>
            </div>
          </div>
          <button className="portal-logout-btn" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="portal-main">
        {/* Topbar */}
        <header className="portal-topbar">
          <div className="portal-topbar-left">
            <h1>{NAV.find(n => n.id === tab)?.label || 'Actor Portal'}</h1>
          </div>
          <div className="portal-topbar-right">
            {msg && <div className="portal-toast">{msg}</div>}
            <button className="portal-refresh-btn" onClick={loadActor} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <div className="portal-notif-wrap">
              <button className="portal-notif-btn" onClick={() => setShowNotifs(s => !s)}>
                <Bell size={18} strokeWidth={1.5} />
                {unread > 0 && <span className="portal-notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotifs && (
                <div className="portal-notif-dropdown">
                  <div className="portal-notif-header">
                    <span>Notifications</span>
                    {unread > 0 && <button onClick={markAllRead}>Mark all read</button>}
                  </div>
                  <div className="portal-notif-list">
                    {notifications.length === 0 && <p className="portal-notif-empty">No notifications.</p>}
                    {notifications.map(n => (
                      <div key={n._id} className={`portal-notif-item${n.read ? '' : ' unread'}`}>
                        <div className="portal-notif-dot" />
                        <div>
                          <p className="portal-notif-title">{n.title}</p>
                          {n.message && <p className="portal-notif-msg">{n.message}</p>}
                          <p className="portal-notif-time">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="portal-content">

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="portal-overview">
              <p className="portal-welcome">Welcome back, <strong>{user?.name?.split(' ')[0]}</strong> 🎬</p>

              {loading ? <p className="portal-loading">Loading...</p> : !actor ? (
                <div className="portal-no-actor">
                  <Star size={48} strokeWidth={1} />
                  <p>Your actor profile hasn't been linked yet.</p>
                  <span>Contact an admin to link your account to an actor profile.</span>
                </div>
              ) : (
                <>
                  <div className="portal-stats-grid">
                    {[
                      { icon: Users, label: 'Followers',  value: (actor.followersCount || 0).toLocaleString(), color: 'gold' },
                      { icon: Heart, label: 'Likes',      value: (actor.likesCount || 0).toLocaleString(),     color: 'red' },
                      { icon: Film,  label: 'Films',      value: actor.movies?.length || 0,                    color: 'blue' },
                      { icon: Star,  label: 'Profile',    value: actor.name,                                   color: 'purple' },
                    ].map(s => (
                      <div key={s.label} className={`portal-stat-card ${s.color}`}>
                        <div className="portal-stat-icon"><s.icon size={20} strokeWidth={1.5} /></div>
                        <div className="portal-stat-value">{s.value}</div>
                        <div className="portal-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Profile preview */}
                  <div className="portal-panel actor-profile-preview">
                    <div className="portal-panel-head">
                      <h2>Profile Preview</h2>
                      <button className="portal-panel-action" onClick={() => setTab('profile')}>Edit profile</button>
                    </div>
                    <div className="actor-preview-card">
                      <div className="actor-preview-avatar">
                        {actor.photo
                          ? <img src={mediaUrl(actor.photo)} alt={actor.name} />
                          : <div className="actor-preview-avatar-placeholder">{actor.name?.[0]}</div>
                        }
                      </div>
                      <div className="actor-preview-info">
                        <h3>{actor.name}</h3>
                        <div className="actor-preview-meta">
                          {actor.birthPlace && <span><MapPin size={12} /> {actor.birthPlace}</span>}
                          {actor.birthDate  && <span><Calendar size={12} /> {actor.birthDate}</span>}
                        </div>
                        {actor.bio && <p className="actor-preview-bio">{actor.bio}</p>}
                        <div className="actor-preview-social">
                          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="actor-social-btn ig"><Instagram size={14} /></a>}
                          {social.tiktok    && <a href={social.tiktok}    target="_blank" rel="noopener noreferrer" className="actor-social-btn tt"><TikTokIcon size={14} /></a>}
                          {social.twitter   && <a href={social.twitter}   target="_blank" rel="noopener noreferrer" className="actor-social-btn tw"><Twitter size={14} /></a>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent films */}
                  {actor.movies?.length > 0 && (
                    <div className="portal-panel">
                      <div className="portal-panel-head">
                        <h2>My Films ({actor.movies.length})</h2>
                        <button className="portal-panel-action" onClick={() => setTab('films')}>View all</button>
                      </div>
                      <div className="actor-films-grid">
                        {actor.movies.slice(0, 4).map(m => (
                          <MovieCard key={m._id} movie={m} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div className="portal-profile">
              {loading ? <p className="portal-loading">Loading...</p> : !actor ? (
                <div className="portal-no-actor">
                  <Star size={48} strokeWidth={1} />
                  <p>No actor profile linked to your account.</p>
                </div>
              ) : (
                <div className="portal-panel" style={{ maxWidth: 640 }}>
                  <div className="portal-panel-head">
                    <h2>Edit Profile</h2>
                    {!editing && (
                      <button className="portal-btn-primary sm" onClick={() => setEditing(true)}>
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                  </div>

                  {!editing ? (
                    /* View mode */
                    <div className="actor-profile-view">
                      <div className="actor-profile-view-top">
                        <div className="actor-profile-view-avatar">
                          {actor.photo
                            ? <img src={mediaUrl(actor.photo)} alt={actor.name} />
                            : <div className="actor-profile-view-placeholder">{actor.name?.[0]}</div>
                          }
                        </div>
                        <div>
                          <h3>{actor.name}</h3>
                          <div className="actor-profile-view-meta">
                            {actor.birthPlace && <span><MapPin size={13} /> {actor.birthPlace}</span>}
                            {actor.birthDate  && <span><Calendar size={13} /> {actor.birthDate}</span>}
                          </div>
                          <div className="actor-profile-view-stats">
                            <span><Users size={13} /> {(actor.followersCount || 0).toLocaleString()} followers</span>
                            <span><Heart size={13} /> {(actor.likesCount || 0).toLocaleString()} likes</span>
                          </div>
                        </div>
                      </div>
                      {actor.bio && <p className="actor-profile-view-bio">{actor.bio}</p>}
                      <div className="actor-profile-view-social">
                        {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="actor-social-btn ig"><Instagram size={16} /> Instagram</a>}
                        {social.tiktok    && <a href={social.tiktok}    target="_blank" rel="noopener noreferrer" className="actor-social-btn tt"><TikTokIcon size={16} /> TikTok</a>}
                        {social.twitter   && <a href={social.twitter}   target="_blank" rel="noopener noreferrer" className="actor-social-btn tw"><Twitter size={16} /> Twitter / X</a>}
                        {!social.instagram && !social.tiktok && !social.twitter && (
                          <span style={{ color: 'var(--text-4)', fontSize: '0.82rem' }}>No social links added yet</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Edit mode */
                    <div className="actor-edit-form">
                      {/* Photo */}
                      <div className="actor-edit-photo-row">
                        <div className="actor-edit-current-photo">
                          {editPhoto
                            ? <img src={URL.createObjectURL(editPhoto)} alt="preview" />
                            : actor.photo
                              ? <img src={mediaUrl(actor.photo)} alt={actor.name} />
                              : <div className="actor-edit-photo-placeholder">{actor.name?.[0]}</div>
                          }
                        </div>
                        <label className="portal-file-label">
                          <Upload size={13} /> Change Photo
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setEditPhoto(e.target.files[0])} />
                        </label>
                      </div>

                      <div className="portal-form-row">
                        <div className="portal-form-group">
                          <label>Name</label>
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" />
                        </div>
                        <div className="portal-form-group">
                          <label>Birth Place</label>
                          <input value={editForm.birthPlace} onChange={e => setEditForm({ ...editForm, birthPlace: e.target.value })} placeholder="City, Country" />
                        </div>
                      </div>
                      <div className="portal-form-group">
                        <label>Birth Date</label>
                        <input value={editForm.birthDate} onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })} placeholder="e.g. 1990-05-12" />
                      </div>
                      <div className="portal-form-group">
                        <label>Bio</label>
                        <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Short biography..." rows={4} />
                      </div>

                      <p className="portal-form-section-label">Social Links</p>
                      <div className="portal-form-row">
                        <div className="portal-form-group portal-social-field">
                          <span className="portal-social-icon ig"><Instagram size={15} /></span>
                          <input value={editForm.instagram} onChange={e => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="Instagram URL" />
                        </div>
                        <div className="portal-form-group portal-social-field">
                          <span className="portal-social-icon tt"><TikTokIcon size={15} /></span>
                          <input value={editForm.tiktok} onChange={e => setEditForm({ ...editForm, tiktok: e.target.value })} placeholder="TikTok URL" />
                        </div>
                      </div>
                      <div className="portal-form-group portal-social-field" style={{ maxWidth: '50%' }}>
                        <span className="portal-social-icon tw"><Twitter size={15} /></span>
                        <input value={editForm.twitter} onChange={e => setEditForm({ ...editForm, twitter: e.target.value })} placeholder="Twitter / X URL" />
                      </div>

                      <div className="portal-form-actions">
                        <button className="portal-btn-primary lg" onClick={handleSave} disabled={saving}>
                          <Check size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button className="portal-btn-outline lg" onClick={() => { setEditing(false); setEditPhoto(null); }}>
                          <X size={15} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Films ── */}
          {tab === 'films' && (
            <div className="portal-films">
              {loading ? <p className="portal-loading">Loading...</p> : !actor?.movies?.length ? (
                <div className="portal-empty-state">
                  <Film size={48} strokeWidth={1} />
                  <p>No films listed yet</p>
                  <span>Films you appear in will show up here once an author or admin adds you to a cast.</span>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-3)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                    {actor.movies.length} film{actor.movies.length !== 1 ? 's' : ''} in your filmography
                  </p>
                  <div className="movies-grid">
                    {actor.movies.map(m => <MovieCard key={m._id} movie={m} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Settings ── */}
          {tab === 'settings' && (
            <div className="portal-settings">
              <div className="portal-panel" style={{ maxWidth: 520 }}>
                <div className="portal-panel-head"><h2>Account</h2></div>
                <div className="portal-settings-body">
                  <div className="portal-settings-row">
                    <span>Name</span>
                    <strong>{user?.name}</strong>
                  </div>
                  <div className="portal-settings-row">
                    <span>Email</span>
                    <strong>{user?.email || '—'}</strong>
                  </div>
                  <div className="portal-settings-row">
                    <span>Role</span>
                    <span className="portal-role-badge actor">Actor</span>
                  </div>
                  <div className="portal-settings-row">
                    <span>Actor Profile</span>
                    <span style={{ color: actor ? 'var(--gold)' : 'var(--text-4)', fontSize: '0.82rem' }}>
                      {actor ? actor.name : 'Not linked'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                  <button className="portal-btn-danger" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
