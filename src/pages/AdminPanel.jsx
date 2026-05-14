import { useState, useEffect } from 'react';
import { Clock3, Eye, Film, MapPin, Monitor, Pencil, RefreshCw, Trash2, TrendingUp, Upload, Users } from 'lucide-react';
import api from '../api/axios';
import FilePreview from '../components/FilePreview';
import { useI18n } from '../context/I18nContext';
import './AdminPanel.css';

const EMPTY = { title: '', description: '', genre: '', year: '', duration: '', language: 'Kinyarwanda', featured: false, type: 'movie', videoLink: '', trailerUrl: '' };

function formatDeviceTime(value) {
  if (!value) return 'No recent activity';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDeviceLocation(device) {
  return device.location?.label || (device.lastIp ? `IP ${device.lastIp}` : 'Location unavailable');
}

export default function AdminPanel() {
  const { t } = useI18n();
  const [movies, setMovies]   = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [files, setFiles]     = useState({ poster: null, video: null });
  const [editId, setEditId]   = useState(null);
  const [tab, setTab]         = useState('movies');
  const [msg, setMsg]         = useState('');
  const [deviceLogins, setDeviceLogins] = useState([]);
  const [deviceStats, setDeviceStats] = useState({ totalDevices: 0, totalUsers: 0, recentDevices: 0 });
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceError, setDeviceError] = useState('');

  const fetchMovies = () => api.get('/movies/my').then(r => setMovies(r.data));
  useEffect(() => { fetchMovies(); }, []);

  const fetchDeviceLogins = async () => {
    setDevicesLoading(true);
    setDeviceError('');
    try {
      const { data } = await api.get('/users/devices/activity');
      setDeviceLogins(data.devices || []);
      setDeviceStats(data.stats || { totalDevices: 0, totalUsers: 0, recentDevices: 0 });
    } catch (err) {
      setDeviceError(err.response?.data?.message || 'Failed to load signed-in device activity.');
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'devices') {
      fetchDeviceLogins();
    }
  }, [tab]);

  const startEdit = (m) => {
    setEditId(m._id);
    setForm({ title: m.title, description: m.description, genre: m.genre?.join(', ') || '', year: m.year || '', duration: m.duration || '', language: m.language || 'Kinyarwanda', featured: m.featured, type: m.type || 'movie', videoLink: m.videoLink || '', trailerUrl: m.trailerUrl || '' });
    setFiles({ poster: null, video: null });
    setMsg(''); setTab('upload');
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY); setTab('movies'); };

  const handleSubmit = async e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (files.poster) fd.append('poster', files.poster);
    if (files.video)  fd.append('video',  files.video);
    try {
      if (editId) {
        await api.put(`/movies/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Film updated');
      } else {
        await api.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Film uploaded');
      }
      setEditId(null); setForm(EMPTY); setFiles({ poster: null, video: null });
      fetchMovies();
      setTimeout(() => { setMsg(''); setTab('movies'); }, 1200);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed'); }
  };

  const deleteMovie = async id => {
    if (!window.confirm(t('Delete this movie?'))) return;
    await api.delete(`/movies/${id}`);
    fetchMovies();
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <p className="admin-sub">Manage all films on the platform</p>

      <div className="dash-tabs">
        <button className={tab === 'movies' ? 'active' : ''} onClick={() => { cancelEdit(); setTab('movies'); }}>All Films</button>
        <button className={tab === 'upload' ? 'active' : ''} onClick={() => { cancelEdit(); setTab('upload'); }}>{editId ? 'Edit Film' : 'Upload New'}</button>
        <button className={tab === 'devices' ? 'active' : ''} onClick={() => { cancelEdit(); setTab('devices'); }}>Device Activity</button>
      </div>

      {tab === 'movies' && (
        <div className="movies-list">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>{movies.length} films total</p>
          {movies.map(m => (
            <div key={m._id} className="movie-row">
              <div className="movie-row-info">
                <strong>{m.title}</strong>
                <span>{m.year} · {m.type === 'series' ? `Series · ${m.episodes?.length || 0} ep` : m.duration} · {m.genre?.join(', ')} · <Eye size={11} strokeWidth={1.5} style={{ display:'inline', verticalAlign:'middle' }} /> {m.views?.toLocaleString() ?? 0}</span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="btn-edit" onClick={() => startEdit(m)}><Pencil size={13} strokeWidth={1.5} /> Edit</button>
                <button className="btn-delete" onClick={() => deleteMovie(m._id)}><Trash2 size={13} strokeWidth={1.5} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'upload' && (
        <form className="upload-form" onSubmit={handleSubmit}>
          <h3>{editId ? 'Edit Film' : 'Upload New Film'}</h3>
          {msg && <p className="upload-msg">{msg}</p>}

          <div className="type-toggle">
            <button type="button" className={form.type === 'movie' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'movie' })}><Film size={14} /> Movie</button>
            <button type="button" className={form.type === 'series' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'series' })}><TrendingUp size={14} /> Series</button>
          </div>

          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <input placeholder="Genres (comma separated)" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
          <div className="form-row">
            <input placeholder="Year" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            {form.type === 'movie' && <input placeholder="Duration (e.g. 1h 45m)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />}
          </div>
          <input placeholder="Language" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} spellCheck="false" />
          <label className="checkbox-label">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
            Feature on homepage
          </label>
          <label style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem' }}>Poster Image<input type="file" accept="image/*" onChange={e => setFiles({ ...files, poster: e.target.files[0] })} style={{ marginTop:'6px' }} /></label>
          <FilePreview file={files.poster} type="image" onClear={() => setFiles({ ...files, poster: null })} />
          {form.type === 'movie' && (
            <>
              <label style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem' }}>Video File<input type="file" accept="video/*" onChange={e => setFiles({ ...files, video: e.target.files[0] })} style={{ marginTop:'6px' }} /></label>
              <FilePreview file={files.video} type="video" onClear={() => setFiles({ ...files, video: null })} />
              <div className="or-divider"><span>or paste a link</span></div>
              <input placeholder="Video URL (YouTube, Vimeo, direct link...)" value={form.videoLink} onChange={e => setForm({ ...form, videoLink: e.target.value })} />
            </>
          )}
          <div className="or-divider"><span>trailer</span></div>
          <input placeholder="Trailer URL (YouTube, Vimeo) - shown in hero" value={form.trailerUrl} onChange={e => setForm({ ...form, trailerUrl: e.target.value })} />

          <div className="form-actions">
            <button type="submit"><Upload size={14} /> {editId ? 'Save Changes' : 'Upload Film'}</button>
            {editId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      )}

      {tab === 'devices' && (
        <section className="admin-device-shell">
          <div className="admin-device-head">
            <div>
              <h3>Signed-in devices</h3>
              <p>Track each account device, its latest location snapshot, and recent activity.</p>
            </div>
            <button type="button" className="btn-refresh-devices" onClick={fetchDeviceLogins} disabled={devicesLoading}>
              <RefreshCw size={14} strokeWidth={1.8} />
              Refresh
            </button>
          </div>

          <div className="admin-device-stats">
            <article className="admin-device-stat">
              <span>Registered devices</span>
              <strong>{deviceStats.totalDevices}</strong>
            </article>
            <article className="admin-device-stat">
              <span>Accounts with devices</span>
              <strong>{deviceStats.totalUsers}</strong>
            </article>
            <article className="admin-device-stat">
              <span>Seen in 24 hours</span>
              <strong>{deviceStats.recentDevices}</strong>
            </article>
          </div>

          {deviceError && <p className="upload-msg admin-device-error">{deviceError}</p>}

          {devicesLoading ? (
            <p className="admin-device-empty">Loading device activity...</p>
          ) : deviceLogins.length === 0 ? (
            <p className="admin-device-empty">No signed-in devices found yet.</p>
          ) : (
            <div className="admin-device-list">
              {deviceLogins.map((device) => (
                <article key={`${device.userId}-${device.deviceId}`} className="admin-device-card">
                  <div className="admin-device-card-top">
                    <div>
                      <p className="admin-device-owner">{device.userName}</p>
                      <p className="admin-device-contact">{device.contact}</p>
                    </div>
                    <span className={`admin-device-status ${device.status}`}>{device.role} / {device.status}</span>
                  </div>

                  <div className="admin-device-lines">
                    <p><Monitor size={14} strokeWidth={1.7} /> {device.deviceName}</p>
                    <p><MapPin size={14} strokeWidth={1.7} /> {formatDeviceLocation(device)}</p>
                    <p><Clock3 size={14} strokeWidth={1.7} /> Last seen {formatDeviceTime(device.lastSeen)}</p>
                    <p><Users size={14} strokeWidth={1.7} /> Source {device.location?.source || 'unknown'}</p>
                  </div>

                  <div className="admin-device-tags">
                    {device.location?.timezone && <span>{device.location.timezone}</span>}
                    {device.lastIp && <span>{device.lastIp}</span>}
                    {device.location?.latitude !== null && device.location?.longitude !== null && (
                      <span>{device.location.latitude}, {device.location.longitude}</span>
                    )}
                    {device.platform && <span>{device.platform}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Actor management: visit /actors to create and manage actor profiles
