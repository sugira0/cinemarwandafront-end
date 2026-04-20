import { useEffect, useState, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [data, setData]     = useState({ notifications: [], unread: 0 });
  const [open, setOpen]     = useState(false);
  const ref = useRef(null);

  const fetch = () => api.get('/notifications').then(r => setData(r.data)).catch(() => {});

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read');
    setData(prev => ({ ...prev, unread: 0, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  };

  const handleClick = async (n) => {
    if (!n.read) await api.patch(`/notifications/${n._id}/read`);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const deleteNote = async (e, id) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    setData(prev => ({ ...prev, notifications: prev.notifications.filter(n => n._id !== id) }));
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(o => !o)}>
        <Bell size={18} strokeWidth={1.5} />
        {data.unread > 0 && <span className="notif-badge">{data.unread > 9 ? '9+' : data.unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {data.unread > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {data.notifications.length === 0 && (
              <p className="notif-empty">No notifications yet.</p>
            )}
            {data.notifications.map(n => (
              <div key={n._id} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => handleClick(n)}>
                <div className="notif-dot" />
                <div className="notif-content">
                  <p className="notif-title">{n.title}</p>
                  {n.message && <p className="notif-msg">{n.message}</p>}
                  <p className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
                <button className="notif-del" onClick={e => deleteNote(e, n._id)}><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
