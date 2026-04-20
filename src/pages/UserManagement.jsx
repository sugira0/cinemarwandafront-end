import { useCallback, useEffect, useState } from 'react';
import { Bell, Search, Send, Shield, Trash2, UserCheck, UserX } from 'lucide-react';
import api from '../api/axios';
import { useI18n } from '../context/I18nContext';
import './UserManagement.css';

const ROLES = ['all', 'viewer', 'author', 'actor'];
const STATUSES = ['all', 'active', 'suspended'];

const roleColor = { admin: '#f59e0b', author: '#1db954', actor: '#6366f1', viewer: '#6b7280' };
const statusColor = { active: '#1db954', suspended: '#e53935' };

export default function UserManagement() {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', link: '' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', link: '', role: 'all' });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback((nextPage = page) => {
    setLoading(true);

    const params = { page: nextPage };
    if (search) params.search = search;
    if (role !== 'all') params.role = role;
    if (status !== 'all') params.status = status;

    api.get('/users', { params })
      .then((response) => {
        setUsers(response.data.users);
        setTotal(response.data.total);
        setPages(response.data.pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, role, search, status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => load(page), 0);
    return () => clearTimeout(timeoutId);
  }, [load, page]);

  const flash = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(''), 3000);
  };

  const suspend = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const reason = nextStatus === 'suspended' ? (prompt(t('Reason for suspension:')) || '') : '';
    await api.patch(`/users/${userId}/status`, { status: nextStatus, reason });
    flash(`User ${nextStatus}`);
    load(page);
    if (selected?.user?._id === userId) {
      setSelected((current) => ({ ...current, user: { ...current.user, status: nextStatus } }));
    }
  };

  const changeRole = async (userId, nextRole) => {
    await api.patch(`/users/${userId}/role`, { role: nextRole });
    flash('Role updated');
    load(page);
    if (selected?.user?._id === userId) {
      setSelected((current) => ({ ...current, user: { ...current.user, role: nextRole } }));
    }
  };

  const sendNotif = async (userId) => {
    if (!notifForm.title) {
      flash('Title required');
      return;
    }

    await api.post(`/users/${userId}/notify`, notifForm);
    setNotifForm({ title: '', message: '', link: '' });
    flash('Notification sent');
  };

  const broadcast = async () => {
    if (!broadcastForm.title) {
      flash('Title required');
      return;
    }

    const { data } = await api.post('/users/broadcast', {
      ...broadcastForm,
      role: broadcastForm.role === 'all' ? undefined : broadcastForm.role,
    });
    flash(data.message);
    setShowBroadcast(false);
    setBroadcastForm({ title: '', message: '', link: '', role: 'all' });
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(t('Delete this user permanently?'))) return;
    await api.delete(`/users/${userId}`);
    flash('User deleted');
    setSelected(null);
    load(page);
  };

  const openDetail = async (user) => {
    const { data } = await api.get(`/users/${user._id}`);
    setSelected(data);
  };

  return (
    <div className="um-page">
      <div className="um-header">
        <div>
          <h1>User Management</h1>
          <p className="um-sub">{total} total users</p>
        </div>
        <button className="um-broadcast-btn" onClick={() => setShowBroadcast((current) => !current)}>
          <Bell size={15} strokeWidth={2} /> Broadcast
        </button>
      </div>

      {msg && <div className="um-flash">{msg}</div>}

      {showBroadcast && (
        <div className="um-broadcast-form">
          <h3><Send size={14} /> Send to all users</h3>
          <div className="um-form-row">
            <input
              placeholder="Title *"
              value={broadcastForm.title}
              onChange={(event) => setBroadcastForm({ ...broadcastForm, title: event.target.value })}
            />
            <select value={broadcastForm.role} onChange={(event) => setBroadcastForm({ ...broadcastForm, role: event.target.value })}>
              <option value="all">All users</option>
              <option value="viewer">Viewers only</option>
              <option value="author">Authors only</option>
              <option value="actor">Actors only</option>
            </select>
          </div>
          <textarea
            placeholder="Message (optional)"
            value={broadcastForm.message}
            onChange={(event) => setBroadcastForm({ ...broadcastForm, message: event.target.value })}
          />
          <input
            placeholder="Link (optional, e.g. /movies)"
            value={broadcastForm.link}
            onChange={(event) => setBroadcastForm({ ...broadcastForm, link: event.target.value })}
          />
          <button className="um-send-btn" onClick={broadcast}><Send size={14} /> Send Broadcast</button>
        </div>
      )}

      <div className="um-filters">
        <div className="um-search-wrap">
          <Search size={15} strokeWidth={1.5} className="um-search-icon" />
          <input
            className="um-search"
            placeholder="Search name, email, or phone..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="um-filter-pills">
          {ROLES.map((entry) => (
            <button
              key={entry}
              className={`um-pill${role === entry ? ' active' : ''}`}
              onClick={() => {
                setRole(entry);
                setPage(1);
              }}
            >
              {entry}
            </button>
          ))}
        </div>
        <div className="um-filter-pills">
          {STATUSES.map((entry) => (
            <button
              key={entry}
              className={`um-pill${status === entry ? ' active' : ''}`}
              onClick={() => {
                setStatus(entry);
                setPage(1);
              }}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div className="um-layout">
        <div className="um-list">
          {loading && <p className="um-loading">Loading...</p>}
          {!loading && users.length === 0 && <p className="um-empty">No users found.</p>}
          {users.map((entry) => (
            <div key={entry._id} className={`um-row${selected?.user?._id === entry._id ? ' active' : ''}`} onClick={() => openDetail(entry)}>
              <div className="um-avatar">{entry.name[0]}</div>
              <div className="um-info">
                <span className="um-name">{entry.name}</span>
                <span className="um-email">{entry.email || entry.phone || 'No contact info'}</span>
              </div>
              <span className="um-role-badge" style={{ color: roleColor[entry.role], borderColor: `${roleColor[entry.role]}44` }}>{entry.role}</span>
              <span className="um-status-dot" style={{ background: statusColor[entry.status] || '#6b7280' }} title={entry.status} />
              <div className="um-actions" onClick={(event) => event.stopPropagation()}>
                <button
                  className={`um-btn${entry.status === 'suspended' ? ' green' : ' red'}`}
                  onClick={() => suspend(entry._id, entry.status)}
                  title={entry.status === 'suspended' ? 'Activate' : 'Suspend'}
                >
                  {entry.status === 'suspended'
                    ? <UserCheck size={14} strokeWidth={2} />
                    : <UserX size={14} strokeWidth={2} />}
                </button>
                <button className="um-btn red" onClick={() => deleteUser(entry._id)} title="Delete">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="um-pagination">
              {Array.from({ length: pages }, (_, index) => index + 1).map((entryPage) => (
                <button
                  key={entryPage}
                  className={`um-page-btn${page === entryPage ? ' active' : ''}`}
                  onClick={() => setPage(entryPage)}
                >
                  {entryPage}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="um-detail">
            <div className="um-detail-header">
              <div className="um-detail-avatar">{selected.user.name[0]}</div>
              <div>
                <h3>{selected.user.name}</h3>
                <p>{selected.user.email || selected.user.phone || 'No contact info'}</p>
              </div>
              <button className="um-detail-close" onClick={() => setSelected(null)}>X</button>
            </div>

            <div className="um-detail-meta">
              <span className="um-role-badge" style={{ color: roleColor[selected.user.role], borderColor: `${roleColor[selected.user.role]}44` }}>{selected.user.role}</span>
              <span className={`um-status-badge ${selected.user.status}`}>{selected.user.status}</span>
              <span className="um-joined">Joined {new Date(selected.user.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="um-detail-section">
              <label className="um-detail-label"><Shield size={13} /> Change Role</label>
              <div className="um-role-btns">
                {['viewer', 'author', 'actor'].map((entryRole) => (
                  <button
                    key={entryRole}
                    className={`um-role-btn${selected.user.role === entryRole ? ' active' : ''}`}
                    onClick={() => changeRole(selected.user._id, entryRole)}
                  >
                    {entryRole}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`um-full-btn ${selected.user.status === 'suspended' ? 'green' : 'red'}`}
              onClick={() => suspend(selected.user._id, selected.user.status)}
            >
              {selected.user.status === 'suspended'
                ? <><UserCheck size={15} /> Activate Account</>
                : <><UserX size={15} /> Suspend Account</>}
            </button>

            <div className="um-detail-section">
              <label className="um-detail-label"><Bell size={13} /> Send Notification</label>
              <input
                placeholder="Title *"
                value={notifForm.title}
                onChange={(event) => setNotifForm({ ...notifForm, title: event.target.value })}
                className="um-input"
              />
              <textarea
                placeholder="Message"
                value={notifForm.message}
                onChange={(event) => setNotifForm({ ...notifForm, message: event.target.value })}
                className="um-input"
                rows={2}
              />
              <input
                placeholder="Link (optional)"
                value={notifForm.link}
                onChange={(event) => setNotifForm({ ...notifForm, link: event.target.value })}
                className="um-input"
              />
              <button className="um-send-btn" onClick={() => sendNotif(selected.user._id)}><Send size={13} /> Send</button>
            </div>

            {selected.movies?.length > 0 && (
              <div className="um-detail-section">
                <label className="um-detail-label"><span>Films ({selected.movies.length})</span></label>
                {selected.movies.map((movie) => (
                  <div key={movie._id} className="um-film-row">
                    <span className="um-film-title">{movie.title}</span>
                    <span className="um-film-views">{movie.views?.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            )}

            <button className="um-full-btn red outline" onClick={() => deleteUser(selected.user._id)}>
              <Trash2 size={15} /> Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
