import { useState, useEffect } from 'react';
import { Eye, Trash2, Upload, Film, TrendingUp, Pencil, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../context/I18nContext';
import api from '../api/axios';
import FilePreview from '../components/FilePreview';
import './AuthorDashboard.css';

const EMPTY_FORM = { title: '', description: '', genre: '', year: '', duration: '', language: 'Kinyarwanda', type: 'movie', videoLink: '', trailerUrl: '' };
const EMPTY_EP   = { title: '', episode: '', season: '1', duration: '', videoLink: '' };

export default function AuthorDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [movies, setMovies]       = useState([]);
  const [tab, setTab]             = useState('movies');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [files, setFiles]         = useState({ poster: null, video: null });
  const [editId, setEditId]       = useState(null);   // movie being edited
  const [expandedId, setExpandedId] = useState(null); // episodes panel open
  const [epForm, setEpForm]       = useState(EMPTY_EP);
  const [epFile, setEpFile]       = useState(null);
  const [editEpId, setEditEpId]   = useState(null);
  const [msg, setMsg]             = useState('');

  const fetchMyMovies = () => api.get('/movies/my').then(r => setMovies(r.data));
  useEffect(() => { fetchMyMovies(); }, []);

  const totalViews = movies.reduce((s, m) => s + (m.views || 0), 0);

  // ── Open edit form ──────────────────────────────────────────────────────────
  const startEdit = (m) => {
    setEditId(m._id);
    setForm({
      title: m.title, description: m.description,
      genre: m.genre?.join(', ') || '', year: m.year || '',
      duration: m.duration || '', language: m.language || 'Kinyarwanda',
      type: m.type || 'movie', videoLink: m.videoLink || '', trailerUrl: m.trailerUrl || ''
    });
    setFiles({ poster: null, video: null });
    setMsg('');
    setTab('upload');
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_FORM); setTab('movies'); };

  // ── Submit create / edit ────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (files.poster) fd.append('poster', files.poster);
    if (files.video)  fd.append('video',  files.video);
    try {
      if (editId) {
        await api.put(`/movies/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('✓ Film updated');
      } else {
        await api.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('✓ Film uploaded');
      }
      setEditId(null); setForm(EMPTY_FORM); setFiles({ poster: null, video: null });
      fetchMyMovies();
      setTimeout(() => { setMsg(''); setTab('movies'); }, 1200);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed'); }
  };

  const deleteMovie = async id => {
    if (!window.confirm(t('Delete this film?'))) return;
    await api.delete(`/movies/${id}`);
    fetchMyMovies();
  };

  // ── Episodes ────────────────────────────────────────────────────────────────
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
    } catch (err) { alert(err.response?.data?.message || t('Episode save failed')); }
  };

  const deleteEpisode = async (movieId, epId) => {
    if (!window.confirm(t('Delete this episode?'))) return;
    await api.delete(`/movies/${movieId}/episodes/${epId}`);
    fetchMyMovies();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Author Dashboard</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
        <button className="btn-upload-new" onClick={() => { cancelEdit(); setTab('upload'); }}>
          <Upload size={15} strokeWidth={2} /> Upload Film
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="dash-stat"><Film size={20} strokeWidth={1.5} /><div><span className="dash-stat-num">{movies.length}</span><span className="dash-stat-label">Films</span></div></div>
        <div className="dash-stat"><Eye size={20} strokeWidth={1.5} /><div><span className="dash-stat-num">{totalViews.toLocaleString()}</span><span className="dash-stat-label">Total Views</span></div></div>
        <div className="dash-stat"><TrendingUp size={20} strokeWidth={1.5} /><div><span className="dash-stat-num">{movies.length ? Math.round(totalViews / movies.length) : 0}</span><span className="dash-stat-label">Avg Views</span></div></div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <button className={tab === 'movies' ? 'active' : ''} onClick={() => { cancelEdit(); setTab('movies'); }}>My Films</button>
        <button className={tab === 'upload' ? 'active' : ''} onClick={() => { cancelEdit(); setTab('upload'); }}>
          {editId ? 'Edit Film' : 'Upload New'}
        </button>
      </div>

      {/* ── My Films ── */}
      {tab === 'movies' && (
        <div className="dash-movies">
          {movies.length === 0 && <p className="empty">No films yet. Upload your first one.</p>}
          {movies.map(m => (
            <div key={m._id} className="dash-movie-block">
              <div className="dash-movie-row">
                <div className="dash-movie-info">
                  <strong>{m.title}</strong>
                  <span>{m.year} · {m.type === 'series' ? `Series · ${m.episodes?.length || 0} ep` : m.duration} · {m.genre?.join(', ')}</span>
                </div>
                <div className="dash-movie-actions">
                  {m.views !== undefined && (
                    <span className="dash-movie-views"><Eye size={13} strokeWidth={1.5} /> {m.views.toLocaleString()}</span>
                  )}
                  {m.type === 'series' && (
                    <button className="btn-icon" title="Episodes" onClick={() => toggleEpisodes(m._id)}>
                      {expandedId === m._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  )}
                  <button className="btn-icon" title="Edit" onClick={() => startEdit(m)}><Pencil size={14} strokeWidth={1.5} /></button>
                  <button className="btn-icon danger" title="Delete" onClick={() => deleteMovie(m._id)}><Trash2 size={14} strokeWidth={1.5} /></button>
                </div>
              </div>

              {/* Episodes panel */}
              {m.type === 'series' && expandedId === m._id && (
                <div className="episodes-panel">
                  <p className="ep-panel-title">Episodes</p>

                  {m.episodes?.map(ep => (
                    <div key={ep._id} className="ep-row">
                      <span className="ep-num">S{ep.season} E{ep.episode}</span>
                      <span className="ep-title">{ep.title}</span>
                      <span className="ep-dur">{ep.duration}</span>
                      <button className="btn-icon sm" onClick={() => startEditEp(ep)}><Pencil size={12} /></button>
                      <button className="btn-icon sm danger" onClick={() => deleteEpisode(m._id, ep._id)}><X size={12} /></button>
                    </div>
                  ))}

                  {/* Add / edit episode form */}
                  <div className="ep-form">
                    <p className="ep-form-title">{editEpId ? 'Edit Episode' : 'Add Episode'}</p>
                    <div className="ep-form-row">
                      <input placeholder="Title" value={epForm.title} onChange={e => setEpForm({ ...epForm, title: e.target.value })} />
                      <input placeholder="Season" type="number" value={epForm.season} onChange={e => setEpForm({ ...epForm, season: e.target.value })} style={{ width: 80 }} />
                      <input placeholder="Ep #" type="number" value={epForm.episode} onChange={e => setEpForm({ ...epForm, episode: e.target.value })} style={{ width: 80 }} />
                      <input placeholder="Duration" value={epForm.duration} onChange={e => setEpForm({ ...epForm, duration: e.target.value })} style={{ width: 100 }} />
                    </div>
                    <div className="ep-form-row">
                      <label className="file-label" style={{ flex: 1 }}>
                        Video file
                        <input type="file" accept="video/*" onChange={e => setEpFile(e.target.files[0])} />
                      </label>
                    </div>
                    <FilePreview file={epFile} type="video" onClear={() => setEpFile(null)} />
                    <div className="ep-form-row">
                      <input
                        placeholder="Or paste video URL (YouTube, Vimeo...)"
                        value={epForm.videoLink}
                        onChange={e => setEpForm({ ...epForm, videoLink: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <button className="btn-ep-save" onClick={() => submitEpisode(m._id)}>
                        {editEpId ? <><Pencil size={13} /> Save</> : <><Plus size={13} /> Add</>}
                      </button>
                      {editEpId && <button className="btn-ep-cancel" onClick={() => { setEditEpId(null); setEpForm(EMPTY_EP); }}>Cancel</button>}
                    </div>                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Upload / Edit Form ── */}
      {tab === 'upload' && (
        <form className="dash-upload-form" onSubmit={handleSubmit}>
          {msg && <p className="upload-msg">{msg}</p>}

          {/* Type toggle */}
          <div className="type-toggle">
            <button type="button" className={form.type === 'movie' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'movie' })}>
              <Film size={15} strokeWidth={1.5} /> Movie
            </button>
            <button type="button" className={form.type === 'series' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'series' })}>
              <TrendingUp size={15} strokeWidth={1.5} /> Series
            </button>
          </div>

          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <input placeholder="Genres (comma separated)" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
          <div className="form-row">
            <input placeholder="Year" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            {form.type === 'movie' && (
              <input placeholder="Duration (e.g. 1h 45m)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            )}
          </div>
          <input placeholder="Language" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} spellCheck="false" />

          <label className="file-label">Poster Image<input type="file" accept="image/*" onChange={e => setFiles({ ...files, poster: e.target.files[0] })} /></label>
          <FilePreview file={files.poster} type="image" onClear={() => setFiles({ ...files, poster: null })} />
          {form.type === 'movie' && (
            <>
              <label className="file-label">Video File<input type="file" accept="video/*" onChange={e => setFiles({ ...files, video: e.target.files[0] })} /></label>
              <FilePreview file={files.video} type="video" onClear={() => setFiles({ ...files, video: null })} />
              <div className="or-divider"><span>or paste a link</span></div>
              <input
                placeholder="Video URL (YouTube, Vimeo, direct link...)"
                value={form.videoLink}
                onChange={e => setForm({ ...form, videoLink: e.target.value })}
              />
            </>
          )}
          <div className="or-divider"><span>trailer</span></div>
          <input
            placeholder="Trailer URL (YouTube, Vimeo) — shown in hero section"
            value={form.trailerUrl}
            onChange={e => setForm({ ...form, trailerUrl: e.target.value })}
          />

          <div className="form-actions">
            <button type="submit"><Upload size={15} strokeWidth={2} /> {editId ? 'Save Changes' : 'Upload Film'}</button>
            {editId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  );
}

// Actor management is available via the /actors page (admin/author can create actors there)
