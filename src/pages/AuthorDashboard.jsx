import { useState, useEffect } from 'react';
import {
  Eye, Trash2, Upload, Film, TrendingUp, Pencil, Plus,
  ChevronDown, ChevronUp, X, LayoutDashboard, LogOut,
  BarChart2, Clapperboard, Settings, Bell, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FilePreview from '../components/FilePreview';
import './AuthorDashboard.css';

const EMPTY_FORM = {
  title: '', description: '', genre: '', year: '', duration: '',
  language: 'Kinyarwanda', type: 'movie', videoLink: '', trailerUrl: '', featured: false,
};
const EMPTY_EP = { title: '', episode: '', season: '1', duration: '', videoLink: '' };

const NAV = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'films',    icon: Film,            label: 'My Films' },
  { id: 'upload',   icon: Upload,          label: 'Upload Film' },
  { id: 'analytics',icon: BarChart2,       label: 'Analytics' },
  { id: 'settings', icon: Settings,        label: 'Settings' },
];

export default function AuthorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [movies, setMovies]         = useState([]);
  const [tab, setTab]               = useState('overview');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [files, setFiles]           = useState({ poster: null, video: null });
  const [editId, setEditId]         = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [epForm, setEpForm]         = useState(EMPTY_EP);
  const [epFile, setEpFile]         = useState(null);
  const [editEpId, setEditEpId]     = useState(null);
  const [msg, setMsg]               = useState('');
  const [loading, setLoading]       = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]         = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchMyMovies = () => {
    setLoading(true);
    api.get('/movies/my')
      .then(r => { setMovies(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyMovies();
    api.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {});
  }, []);

  const totalViews   = movies.reduce((s, m) => s + (m.views || 0), 0);
  const totalEpisodes = movies.filter(m => m.type === 'series').reduce((s, m) => s + (m.episodes?.length || 0), 0);
  const seriesCount  = movies.filter(m => m.type === 'series').length;
  const movieCount   = movies.filter(m => m.type === 'movie').length;

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const startEdit = (m) => {
    setEditId(m._id);
    setForm({
      title: m.title, description: m.description,
      genre: m.genre?.join(', ') || '', year: m.year || '',
      duration: m.duration || '', language: m.language || 'Kinyarwanda',
      type: m.type || 'movie', videoLink: m.videoLink || '',
      trailerUrl: m.trailerUrl || '', featured: m.featured || false,
    });
    setFiles({ poster: null, video: null });
    setTab('upload');
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_FORM); };

  const handleSubmit = async e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (files.poster) fd.append('poster', files.poster);
    if (files.video)  fd.append('video',  files.video);
    try {
      if (editId) {
        await api.put(`/movies/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        flash('Film updated successfully.');
      } else {
        await api.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        flash('Film published successfully.');
      }
      setEditId(null); setForm(EMPTY_FORM); setFiles({ poster: null, video: null });
      fetchMyMovies();
      setTimeout(() => setTab('films'), 1200);
    } catch (err) { flash(err.response?.data?.message || 'Save failed.'); }
  };

  const deleteMovie = async id => {
    if (!window.confirm('Delete this film permanently?')) return;
    await api.delete(`/movies/${id}`);
    fetchMyMovies();
  };

  const toggleEpisodes = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setEpForm(EMPTY_EP); setEpFile(null); setEditEpId(null);
  };

  const startEditEp = (ep) => {
    setEditEpId(ep._id);
    setEpForm({ title: ep.title, episode: ep.episode, season: ep.season, duration: ep.duration || '', videoLink: ep.videoLink || '' });
    setEpFile(null);
  };

  const submitEpisode = async (movieId) => {
    const fd = new FormData();
    Object.entries(epForm).forEach(([k, v]) => fd.append(k, v));
    if (epFile) fd.append('video', epFile);
    try {
      if (editEpId) {
        await api.put(`/movies/${movieId}/episodes/${editEpId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(`/movies/${movieId}/episodes`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setEpForm(EMPTY_EP); setEpFile(null); setEditEpId(null);
      fetchMyMovies();
    } catch (err) { alert(err.response?.data?.message || 'Episode save failed'); }
  };

  const deleteEpisode = async (movieId, epId) => {
    if (!window.confirm('Delete this episode?')) return;
    await api.delete(`/movies/${movieId}/episodes/${epId}`);
    fetchMyMovies();
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read').catch(() => {});
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="portal-shell">
      {/* ── Sidebar ── */}
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div className="portal-brand-icon"><Clapperboard size={18} strokeWidth={1.5} /></div>
          <div>
            <strong>CINEMA Rwanda</strong>
            <small>Author Portal</small>
          </div>
        </div>

        <nav className="portal-nav">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`portal-nav-btn${tab === id ? ' active' : ''}`}
              onClick={() => { setTab(id); if (id !== 'upload') cancelEdit(); }}
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
              <div className="portal-user-role">Author</div>
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
            <h1>{NAV.find(n => n.id === tab)?.label || 'Dashboard'}</h1>
          </div>
          <div className="portal-topbar-right">
            {msg && <div className="portal-toast">{msg}</div>}
            <button className="portal-refresh-btn" onClick={fetchMyMovies} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            {/* Notification bell */}
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
              <p className="portal-welcome">Welcome back, <strong>{user?.name?.split(' ')[0]}</strong> 👋</p>

              <div className="portal-stats-grid">
                {[
                  { icon: Film,       label: 'Total Films',   value: movies.length,                color: 'gold' },
                  { icon: TrendingUp, label: 'Series',        value: seriesCount,                  color: 'blue' },
                  { icon: Eye,        label: 'Total Views',   value: totalViews.toLocaleString(),  color: 'green' },
                  { icon: BarChart2,  label: 'Total Episodes',value: totalEpisodes,                color: 'purple' },
                ].map(s => (
                  <div key={s.label} className={`portal-stat-card ${s.color}`}>
                    <div className="portal-stat-icon"><s.icon size={20} strokeWidth={1.5} /></div>
                    <div className="portal-stat-value">{s.value}</div>
                    <div className="portal-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent films */}
              <div className="portal-panel">
                <div className="portal-panel-head">
                  <h2>Recent Films</h2>
                  <button className="portal-panel-action" onClick={() => setTab('films')}>View all</button>
                </div>
                {movies.slice(0, 5).map(m => (
                  <div key={m._id} className="portal-film-row">
                    <Film size={14} strokeWidth={1.5} className="portal-film-row-icon" />
                    <div className="portal-film-row-info">
                      <strong>{m.title}</strong>
                      <span>{m.year} · {m.type} · {m.genre?.slice(0,2).join(', ')}</span>
                    </div>
                    <span className="portal-film-row-views"><Eye size={12} /> {(m.views || 0).toLocaleString()}</span>
                    <button className="portal-film-row-edit" onClick={() => startEdit(m)}><Pencil size={13} /></button>
                  </div>
                ))}
                {movies.length === 0 && <p className="portal-empty">No films yet. <button onClick={() => setTab('upload')}>Upload your first film →</button></p>}
              </div>
            </div>
          )}

          {/* ── My Films ── */}
          {tab === 'films' && (
            <div className="portal-films">
              <div className="portal-films-header">
                <p>{movies.length} film{movies.length !== 1 ? 's' : ''}</p>
                <button className="portal-btn-primary" onClick={() => setTab('upload')}>
                  <Plus size={15} /> Upload Film
                </button>
              </div>

              {loading && <p className="portal-loading">Loading...</p>}
              {!loading && movies.length === 0 && (
                <div className="portal-empty-state">
                  <Film size={48} strokeWidth={1} />
                  <p>No films yet</p>
                  <button className="portal-btn-primary" onClick={() => setTab('upload')}>Upload your first film</button>
                </div>
              )}

              {movies.map(m => (
                <div key={m._id} className="portal-movie-block">
                  <div className="portal-movie-row">
                    <div className="portal-movie-info">
                      <strong>{m.title}</strong>
                      <span>
                        {m.year} · {m.type === 'series' ? `Series · ${m.episodes?.length || 0} ep` : m.duration}
                        {m.genre?.length > 0 && ` · ${m.genre.slice(0,2).join(', ')}`}
                      </span>
                    </div>
                    <div className="portal-movie-actions">
                      <span className="portal-movie-views"><Eye size={13} /> {(m.views || 0).toLocaleString()}</span>
                      {m.type === 'series' && (
                        <button className="portal-btn-icon" onClick={() => toggleEpisodes(m._id)} title="Episodes">
                          {expandedId === m._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                      <button className="portal-btn-icon" onClick={() => startEdit(m)} title="Edit"><Pencil size={14} /></button>
                      <button className="portal-btn-icon danger" onClick={() => deleteMovie(m._id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Episodes panel */}
                  {m.type === 'series' && expandedId === m._id && (
                    <div className="portal-episodes-panel">
                      <p className="portal-ep-panel-title">Episodes ({m.episodes?.length || 0})</p>
                      {m.episodes?.map(ep => (
                        <div key={ep._id} className="portal-ep-row">
                          <span className="portal-ep-num">S{ep.season}E{ep.episode}</span>
                          <span className="portal-ep-title">{ep.title}</span>
                          <span className="portal-ep-dur">{ep.duration}</span>
                          <button className="portal-btn-icon sm" onClick={() => startEditEp(ep)}><Pencil size={12} /></button>
                          <button className="portal-btn-icon sm danger" onClick={() => deleteEpisode(m._id, ep._id)}><X size={12} /></button>
                        </div>
                      ))}
                      <div className="portal-ep-form">
                        <p className="portal-ep-form-title">{editEpId ? 'Edit Episode' : 'Add Episode'}</p>
                        <div className="portal-ep-form-row">
                          <input placeholder="Title" value={epForm.title} onChange={e => setEpForm({ ...epForm, title: e.target.value })} />
                          <input placeholder="Season" type="number" value={epForm.season} onChange={e => setEpForm({ ...epForm, season: e.target.value })} style={{ width: 80 }} />
                          <input placeholder="Ep #" type="number" value={epForm.episode} onChange={e => setEpForm({ ...epForm, episode: e.target.value })} style={{ width: 80 }} />
                          <input placeholder="Duration" value={epForm.duration} onChange={e => setEpForm({ ...epForm, duration: e.target.value })} style={{ width: 100 }} />
                        </div>
                        <div className="portal-ep-form-row">
                          <label className="portal-file-label" style={{ flex: 1 }}>
                            Video file
                            <input type="file" accept="video/*" onChange={e => setEpFile(e.target.files[0])} />
                          </label>
                        </div>
                        <FilePreview file={epFile} type="video" onClear={() => setEpFile(null)} />
                        <div className="portal-ep-form-row">
                          <input placeholder="Or paste video URL (YouTube, Vimeo...)" value={epForm.videoLink} onChange={e => setEpForm({ ...epForm, videoLink: e.target.value })} style={{ flex: 1 }} />
                          <button className="portal-btn-primary sm" onClick={() => submitEpisode(m._id)}>
                            {editEpId ? <><Pencil size={13} /> Save</> : <><Plus size={13} /> Add</>}
                          </button>
                          {editEpId && <button className="portal-btn-outline sm" onClick={() => { setEditEpId(null); setEpForm(EMPTY_EP); }}>Cancel</button>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Upload / Edit ── */}
          {tab === 'upload' && (
            <div className="portal-upload">
              <div className="portal-panel">
                <div className="portal-panel-head">
                  <h2>{editId ? 'Edit Film' : 'Upload New Film'}</h2>
                  <Upload size={18} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
                </div>
                <form className="portal-upload-form" onSubmit={handleSubmit}>
                  {msg && <p className="portal-upload-msg">{msg}</p>}

                  <div className="portal-type-toggle">
                    <button type="button" className={form.type === 'movie' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'movie' })}>
                      <Film size={14} /> Movie
                    </button>
                    <button type="button" className={form.type === 'series' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'series' })}>
                      <TrendingUp size={14} /> Series
                    </button>
                  </div>

                  <div className="portal-form-group">
                    <label>Title *</label>
                    <input placeholder="Film title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="portal-form-group">
                    <label>Description *</label>
                    <textarea placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  </div>
                  <div className="portal-form-group">
                    <label>Genres</label>
                    <input placeholder="Drama, Action, ..." value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
                  </div>
                  <div className="portal-form-row">
                    <div className="portal-form-group">
                      <label>Year</label>
                      <input placeholder="2024" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                    </div>
                    {form.type === 'movie' && (
                      <div className="portal-form-group">
                        <label>Duration</label>
                        <input placeholder="1h 45m" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                      </div>
                    )}
                    <div className="portal-form-group">
                      <label>Language</label>
                      <input value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} spellCheck={false} />
                    </div>
                  </div>
                  <label className="portal-check-label">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
                    Feature on homepage
                  </label>

                  <div className="portal-form-group">
                    <label>Poster Image</label>
                    <label className="portal-file-label">
                      Choose file
                      <input type="file" accept="image/*" onChange={e => setFiles({ ...files, poster: e.target.files[0] })} />
                    </label>
                    <FilePreview file={files.poster} type="image" onClear={() => setFiles({ ...files, poster: null })} />
                  </div>

                  {form.type === 'movie' && (
                    <div className="portal-form-group">
                      <label>Video File</label>
                      <label className="portal-file-label">
                        Choose file
                        <input type="file" accept="video/*" onChange={e => setFiles({ ...files, video: e.target.files[0] })} />
                      </label>
                      <FilePreview file={files.video} type="video" onClear={() => setFiles({ ...files, video: null })} />
                      <div className="portal-or-divider"><span>or paste a link</span></div>
                      <input placeholder="Video URL (YouTube, Vimeo, direct link...)" value={form.videoLink} onChange={e => setForm({ ...form, videoLink: e.target.value })} />
                    </div>
                  )}

                  <div className="portal-form-group">
                    <label>Trailer URL</label>
                    <input placeholder="YouTube / Vimeo trailer link" value={form.trailerUrl} onChange={e => setForm({ ...form, trailerUrl: e.target.value })} />
                  </div>

                  <div className="portal-form-actions">
                    <button type="submit" className="portal-btn-primary lg">
                      <Upload size={15} /> {editId ? 'Save Changes' : 'Publish Film'}
                    </button>
                    {editId && (
                      <button type="button" className="portal-btn-outline lg" onClick={() => { cancelEdit(); setTab('films'); }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {tab === 'analytics' && (
            <div className="portal-analytics">
              <div className="portal-stats-grid">
                {[
                  { label: 'Total Films',    value: movies.length },
                  { label: 'Movies',         value: movieCount },
                  { label: 'Series',         value: seriesCount },
                  { label: 'Total Episodes', value: totalEpisodes },
                  { label: 'Total Views',    value: totalViews.toLocaleString() },
                  { label: 'Avg Views/Film', value: movies.length ? Math.round(totalViews / movies.length).toLocaleString() : 0 },
                ].map(s => (
                  <div key={s.label} className="portal-stat-card gold">
                    <div className="portal-stat-value">{s.value}</div>
                    <div className="portal-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="portal-panel">
                <div className="portal-panel-head"><h2>Films by Views</h2></div>
                {[...movies].sort((a, b) => (b.views || 0) - (a.views || 0)).map((m, i) => {
                  const max = movies[0]?.views || 1;
                  return (
                    <div key={m._id} className="portal-analytics-row">
                      <span className="portal-analytics-rank">#{i + 1}</span>
                      <span className="portal-analytics-title">{m.title}</span>
                      <div className="portal-analytics-bar-wrap">
                        <div className="portal-analytics-bar" style={{ width: `${((m.views || 0) / Math.max(...movies.map(x => x.views || 0), 1)) * 100}%` }} />
                      </div>
                      <span className="portal-analytics-views"><Eye size={12} /> {(m.views || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
                {movies.length === 0 && <p className="portal-empty">No data yet.</p>}
              </div>
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
                    <span className="portal-role-badge author">Author</span>
                  </div>
                  <div className="portal-settings-row">
                    <span>Subscription</span>
                    <span className={`portal-role-badge ${user?.subscription?.active ? 'active' : 'free'}`}>
                      {user?.subscription?.active ? user.subscription.plan : 'Free'}
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
