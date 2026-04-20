import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, UserCheck, UserPlus, Pencil, Check, X, Heart, Users, Upload } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import MovieCard from '../components/MovieCard';
import { mediaUrl } from '../lib/config';
import './ActorProfile.css';

function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
}
function TikTokIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>;
}
function TwitterIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

export default function ActorProfile() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [actor, setActor]         = useState(null);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked]         = useState(false);
  const [followers, setFollowers] = useState(0);
  const [likes, setLikes]         = useState(0);
  const [loading, setLoading]     = useState(true);

  // Edit state
  const [editing, setEditing]     = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [editPhoto, setEditPhoto] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [editMsg, setEditMsg]     = useState('');

  const isOwner  = user?.role === 'actor' && String(user?.actorId) === String(id);
  const canEdit  = user?.role === 'admin' || isOwner;

  useEffect(() => {
    api.get(`/actors/${id}`)
      .then(r => {
        setActor(r.data);
        setFollowing(r.data.isFollowing);
        setLiked(r.data.isLiked);
        setFollowers(r.data.followersCount);
        setLikes(r.data.likesCount);
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
    window.scrollTo(0, 0);
  }, [id]);

  const handleFollow = async () => {
    if (!user) return navigate('/login');
    const { data } = await api.post(`/actors/${id}/follow`);
    setFollowing(data.following);
    setFollowers(data.followersCount);
  };

  const handleLike = async () => {
    if (!user) return navigate('/login');
    const { data } = await api.post(`/actors/${id}/like`);
    setLiked(data.liked);
    setLikes(data.likesCount);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      if (editPhoto) fd.append('photo', editPhoto);
      const { data } = await api.put(`/actors/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setActor(prev => ({ ...prev, ...data, movies: prev.movies }));
      setEditMsg('✓ Saved');
      setEditing(false);
      setEditPhoto(null);
      setTimeout(() => setEditMsg(''), 2000);
    } catch (err) {
      setEditMsg(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!actor)  return <div className="loading">Actor not found.</div>;

  const social = actor.social || {};

  return (
    <div className="actor-profile">
      <div className="actor-profile-topbar">
        <button className="actor-back" onClick={() => navigate('/actors')}>
          <ArrowLeft size={16} strokeWidth={1.5} /> All Actors
        </button>
        {canEdit && !editing && (
          <button className="btn-edit-profile" onClick={() => setEditing(true)}>
            <Pencil size={14} strokeWidth={1.5} /> Edit Profile
          </button>
        )}
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div className="actor-edit-panel">
          <div className="aep-header">
            <h3>Edit Profile</h3>
            <button className="aep-close" onClick={() => { setEditing(false); setEditPhoto(null); }}><X size={16} /></button>
          </div>

          <div className="aep-photo-row">
            <div className="aep-current-photo">
              {editPhoto
                ? <img src={URL.createObjectURL(editPhoto)} alt="preview" />
                : actor.photo
                  ? <img src={mediaUrl(actor.photo)} alt={actor.name} />
                  : <div className="aep-photo-placeholder">{actor.name[0]}</div>
              }
            </div>
            <label className="aep-photo-btn">
              <Upload size={14} strokeWidth={2} /> Change Photo
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => setEditPhoto(e.target.files[0])} />
            </label>
          </div>

          <div className="aep-fields">
            <div className="aep-row">
              <div className="aep-field">
                <label>Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="aep-field">
                <label>Birth Place</label>
                <input value={editForm.birthPlace} onChange={e => setEditForm({ ...editForm, birthPlace: e.target.value })} placeholder="City, Country" />
              </div>
            </div>
            <div className="aep-row">
              <div className="aep-field">
                <label>Birth Date</label>
                <input value={editForm.birthDate} onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })} placeholder="e.g. 1990-05-12" />
              </div>
            </div>
            <div className="aep-field full">
              <label>Bio</label>
              <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Short biography..." rows={3} />
            </div>
            <div className="aep-divider">Social Links</div>
            <div className="aep-row">
              <div className="aep-field aep-social">
                <span className="aep-social-icon ig"><InstagramIcon /></span>
                <input value={editForm.instagram} onChange={e => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="Instagram URL" />
              </div>
              <div className="aep-field aep-social">
                <span className="aep-social-icon tt"><TikTokIcon /></span>
                <input value={editForm.tiktok} onChange={e => setEditForm({ ...editForm, tiktok: e.target.value })} placeholder="TikTok URL" />
              </div>
            </div>
            <div className="aep-field aep-social" style={{ maxWidth: '50%' }}>
              <span className="aep-social-icon tw"><TwitterIcon /></span>
              <input value={editForm.twitter} onChange={e => setEditForm({ ...editForm, twitter: e.target.value })} placeholder="Twitter / X URL" />
            </div>
          </div>

          {editMsg && <p className="aep-msg">{editMsg}</p>}
          <div className="aep-actions">
            <button className="aep-save" onClick={handleSave} disabled={saving}>
              <Check size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="aep-cancel" onClick={() => { setEditing(false); setEditPhoto(null); }}>
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Profile card ── */}
      <div className="actor-profile-card">
        <div className="actor-profile-avatar-wrap">
          {actor.photo
            ? <img src={mediaUrl(actor.photo)} alt={actor.name} className="actor-profile-avatar" />
            : <div className="actor-profile-avatar-placeholder">{actor.name[0]}</div>
          }
        </div>

        <h1 className="actor-profile-name">{actor.name}</h1>

        <div className="actor-profile-meta">
          {actor.birthPlace && <span><MapPin size={13} strokeWidth={1.5} /> {actor.birthPlace}</span>}
          {actor.birthDate  && <span><Calendar size={13} strokeWidth={1.5} /> {actor.birthDate}</span>}
        </div>

        {/* Social links */}
        <div className="actor-social-links">
          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="social-btn instagram" title="Instagram"><InstagramIcon /></a>}
          {social.tiktok    && <a href={social.tiktok}    target="_blank" rel="noopener noreferrer" className="social-btn tiktok"    title="TikTok"><TikTokIcon /></a>}
          {social.twitter   && <a href={social.twitter}   target="_blank" rel="noopener noreferrer" className="social-btn twitter"   title="X / Twitter"><TwitterIcon /></a>}
          {!social.instagram && !social.tiktok && !social.twitter && !canEdit && (
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>No social links</span>
          )}
        </div>

        {/* Stats */}
        <div className="actor-stat-row">
          <div className="actor-stat">
            <span className="actor-stat-num">{followers.toLocaleString()}</span>
            <span className="actor-stat-label">Followers</span>
          </div>
          <div className="actor-stat-divider" />
          <div className="actor-stat">
            <span className="actor-stat-num">{likes.toLocaleString()}</span>
            <span className="actor-stat-label">Likes</span>
          </div>
          <div className="actor-stat-divider" />
          <div className="actor-stat">
            <span className="actor-stat-num">{actor.movies?.length || 0}</span>
            <span className="actor-stat-label">Films</span>
          </div>
        </div>

        {/* Actions */}
        <div className="actor-actions">
          <button className={`btn-follow${following ? ' active' : ''}`} onClick={handleFollow}>
            {following ? <><UserCheck size={16} strokeWidth={2} /> Following</> : <><UserPlus size={16} strokeWidth={2} /> Follow</>}
          </button>
          <button className={`btn-like-actor${liked ? ' active' : ''}`} onClick={handleLike}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 1.5} />
            {liked ? 'Liked' : 'Like'}
          </button>
        </div>

        {actor.bio && <p className="actor-bio">{actor.bio}</p>}
      </div>

      {/* Films */}
      <div className="actor-films">
        <h2>Films</h2>
        {actor.movies?.length > 0 ? (
          <div className="movies-grid">
            {actor.movies.map((m, i) => <MovieCard key={m._id} movie={m} style={{ animationDelay: `${i * 0.06}s` }} />)}
          </div>
        ) : (
          <p className="actor-no-films">No films listed yet.</p>
        )}
      </div>
    </div>
  );
}
