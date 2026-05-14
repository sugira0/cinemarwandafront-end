import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Heart, Plus, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import FilePreview from '../components/FilePreview';
import { mediaUrl } from '../lib/config';
import './Actors.css';

export default function Actors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [actors, setActors]     = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', birthDate: '', birthPlace: '', instagram: '', tiktok: '', twitter: '' });
  const [photo, setPhoto]       = useState(null);
  const [msg, setMsg]           = useState('');

  const canCreate = user?.role === 'admin' || user?.role === 'author';

  const fetchActors = useCallback((q = search) => {
    api.get('/actors', { params: q ? { search: q } : {} })
      .then(r => { setActors(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchActors(search), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchActors, search]);

  const handleCreate = async e => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (photo) fd.append('photo', photo);
    try {
      await api.post('/actors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Actor created');
      setForm({ name: '', bio: '', birthDate: '', birthPlace: '', instagram: '', tiktok: '', twitter: '' });
      setPhoto(null); setShowForm(false);
      fetchActors('');
    } catch (err) { setMsg(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="actors-page">
      <div className="actors-header">
        <div>
          <h1>Actors</h1>
          <p>Discover Rwandan film talent</p>
        </div>
        {canCreate && (
          <button className="btn-add-actor" onClick={() => setShowForm(s => !s)}>
            {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Actor</>}
          </button>
        )}
      </div>

      {/* Create actor form */}
      {showForm && (
        <form className="actor-create-form" onSubmit={handleCreate}>
          {msg && <p className="actor-form-msg">{msg}</p>}
          <input placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          <div className="actor-form-row">
            <input placeholder="Birth Date (e.g. 1990-05-12)" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
            <input placeholder="Birth Place" value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })} />
          </div>
          <div className="actor-form-row">
            <input placeholder="Instagram URL" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} />
            <input placeholder="TikTok URL" value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} />
          </div>
          <input placeholder="Twitter / X URL" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} />
          <label className="file-label">
            Photo
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
          </label>
          <FilePreview file={photo} type="image" onClear={() => setPhoto(null)} />
          <button type="submit" className="btn-create-actor">Create Actor</button>
        </form>
      )}

      <div className="actors-search-wrap">
        <Search size={16} strokeWidth={1.5} className="actors-search-icon" />
        <input
          className="actors-search"
          placeholder="Search actors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="actors-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="actor-card-skeleton">
              <div className="sk-shine actor-sk-photo" />
              <div className="sk-shine actor-sk-line" />
              <div className="sk-shine actor-sk-line short" />
            </div>
          ))}
        </div>
      ) : actors.length === 0 ? (
        <div className="actors-empty">
          <Users size={48} strokeWidth={1} />
          <p>No actors found</p>
          <span>Actors are added when uploading films</span>
        </div>
      ) : (
        <div className="actors-grid">
          {actors.map(actor => (
            <div key={actor._id} className="actor-card" onClick={() => navigate(`/actors/${actor._id}`)}>
              <div className="actor-avatar-wrap">
                {actor.photo
                  ? <img src={mediaUrl(actor.photo)} alt={actor.name} className="actor-avatar" />
                  : <div className="actor-avatar-placeholder">{actor.name[0]}</div>
                }
              </div>
              <div className="actor-card-info">
                <h3>{actor.name}</h3>
                {actor.birthPlace && <p>{actor.birthPlace}</p>}
                <div className="actor-stats">
                  <span><Users size={12} strokeWidth={1.5} /> {actor.followersCount}</span>
                  <span><Heart size={12} strokeWidth={1.5} /> {actor.likesCount}</span>
                </div>
                {(actor.social?.instagram || actor.social?.tiktok || actor.social?.twitter) && (
                  <div className="actor-card-social">
                    {actor.social?.instagram && (
                      <a href={actor.social.instagram} target="_blank" rel="noopener noreferrer"
                        className="actor-card-social-btn instagram"
                        onClick={e => e.stopPropagation()} title="Instagram">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      </a>
                    )}
                    {actor.social?.tiktok && (
                      <a href={actor.social.tiktok} target="_blank" rel="noopener noreferrer"
                        className="actor-card-social-btn tiktok"
                        onClick={e => e.stopPropagation()} title="TikTok">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                        </svg>
                      </a>
                    )}
                    {actor.social?.twitter && (
                      <a href={actor.social.twitter} target="_blank" rel="noopener noreferrer"
                        className="actor-card-social-btn twitter"
                        onClick={e => e.stopPropagation()} title="X / Twitter">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
