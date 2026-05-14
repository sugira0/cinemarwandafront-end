import { useEffect, useState } from 'react';
import { Film, Users, MessageSquare, Eye, TrendingUp, CreditCard, Clock, CheckCircle, XCircle, Crown, Heart } from 'lucide-react';
import api from '../api/axios';
import { useI18n } from '../context/I18nContext';
import { mediaUrl } from '../lib/config';
import './Analytics.css';

const planColor = { basic: '#6b7280', standard: '#1db954', premium: '#f59e0b' };

export default function Analytics() {
  const { t } = useI18n();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const confirmPayment = async (id) => { await api.post(`/payments/${id}/confirm`); load(); };
  const rejectPayment  = async (id) => {
    const reason = prompt(t('Reason (optional):')) || '';
    await api.post(`/payments/${id}/reject`, { reason });
    load();
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!data)   return <div className="loading">Failed to load.</div>;

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <p className="analytics-sub">Platform overview</p>

      {/* Stats */}
      <div className="analytics-stats">
        <div className="an-stat"><Film size={22} strokeWidth={1.5} /><div><span className="an-num">{data.totalMovies}</span><span className="an-label">Films</span></div></div>
        <div className="an-stat"><Users size={22} strokeWidth={1.5} /><div><span className="an-num">{data.totalUsers}</span><span className="an-label">Users</span></div></div>
        <div className="an-stat"><Eye size={22} strokeWidth={1.5} /><div><span className="an-num">{data.totalViews?.toLocaleString()}</span><span className="an-label">Views</span></div></div>
        <div className="an-stat"><MessageSquare size={22} strokeWidth={1.5} /><div><span className="an-num">{data.totalComments}</span><span className="an-label">Reviews</span></div></div>
        <div className="an-stat" style={{ borderColor:'rgba(29,185,84,0.3)' }}>
          <CreditCard size={22} strokeWidth={1.5} style={{ color:'var(--green)' }} />
          <div><span className="an-num" style={{ color:'var(--green)' }}>{data.totalRevenue?.toLocaleString()} RWF</span><span className="an-label">Revenue</span></div>
        </div>
        <div className="an-stat" style={{ borderColor:'rgba(245,158,11,0.3)' }}>
          <Clock size={22} strokeWidth={1.5} style={{ color:'#f59e0b' }} />
          <div><span className="an-num" style={{ color:'#f59e0b' }}>{data.pendingPayments}</span><span className="an-label">Pending</span></div>
        </div>
      </div>

      {/* Row 1: Top movies + Genre */}
      <div className="analytics-grid">
        <div className="an-card">
          <h2><TrendingUp size={16} strokeWidth={1.5} /> Top Films by Views</h2>
          {data.topMovies.map((m, i) => (
            <div key={m._id} className="an-movie-row">
              <span className="an-rank">#{i + 1}</span>
              {m.poster && <img src={mediaUrl(m.poster)} alt={m.title} className="an-thumb" />}
              <span className="an-movie-title">{m.title}</span>
              <span className="an-views"><Eye size={12} strokeWidth={1.5} /> {m.views?.toLocaleString()}</span>
            </div>
          ))}
          {data.topMovies.length === 0 && <p className="an-empty">No films yet.</p>}
        </div>

        <div className="an-card">
          <h2><Film size={16} strokeWidth={1.5} /> Views by Genre</h2>
          {data.genreStats.map(g => {
            const max = data.genreStats[0]?.views || 1;
            return (
              <div key={g._id} className="an-genre-row">
                <span className="an-genre-name">{g._id}</span>
                <div className="an-bar-wrap"><div className="an-bar" style={{ width:`${(g.views/max)*100}%` }} /></div>
                <span className="an-genre-views">{g.views?.toLocaleString()}</span>
              </div>
            );
          })}
          {data.genreStats.length === 0 && <p className="an-empty">No data yet.</p>}
        </div>
      </div>

      {/* Row 2: Top actors + Paid users */}
      <div className="analytics-grid" style={{ marginTop:'1.5rem' }}>
        {/* Top followed actors */}
        <div className="an-card">
          <h2><Heart size={16} strokeWidth={1.5} /> Top Followed Actors</h2>
          {data.topActors?.length === 0 && <p className="an-empty">No actors yet.</p>}
          {data.topActors?.map((a, i) => (
            <div key={a._id} className="an-actor-row">
              <span className="an-rank">#{i + 1}</span>
              <div className="an-actor-avatar">
                {a.photo
                  ? <img src={mediaUrl(a.photo)} alt={a.name} />
                  : <span>{a.name[0]}</span>
                }
              </div>
              <span className="an-actor-name">{a.name}</span>
              <span className="an-actor-stat"><Users size={12} strokeWidth={1.5} /> {a.followersCount}</span>
              <span className="an-actor-stat"><Heart size={12} strokeWidth={1.5} /> {a.likesCount}</span>
            </div>
          ))}
        </div>

        {/* Paid / subscribed users */}
        <div className="an-card">
          <h2><Crown size={16} strokeWidth={1.5} /> Subscribed Users</h2>
          {data.paidUsers?.length === 0 && <p className="an-empty">No active subscriptions.</p>}
          {data.paidUsers?.map(u => (
            <div key={u._id} className="an-paid-row">
              <div className="an-user-avatar">{u.name[0]}</div>
              <div className="an-user-info">
                <span className="an-user-name">{u.name}</span>
                <span className="an-user-email">{u.email || u.phone || 'Phone-only account'}</span>
              </div>
              <span className="an-plan-badge" style={{ color: planColor[u.subscription?.plan], borderColor: planColor[u.subscription?.plan] + '55' }}>
                {u.subscription?.plan}
              </span>
              <span className="an-tx-date">{new Date(u.subscription?.expiresAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="an-card" style={{ marginTop:'1.5rem' }}>
        <h2><Users size={16} strokeWidth={1.5} /> Recent Signups</h2>
        {data.recentUsers.map(u => (
          <div key={u._id} className="an-user-row">
            <div className="an-user-avatar">{u.name[0]}</div>
            <div className="an-user-info">
              <span className="an-user-name">{u.name}</span>
              <span className="an-user-email">{u.email || u.phone || 'Phone-only account'}</span>
            </div>
            <span className="an-user-role">{u.role}</span>
            <span className="an-tx-date">{new Date(u.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="an-card an-transactions" style={{ marginTop:'1.5rem' }}>
        <div className="an-transactions-header">
          <h2><CreditCard size={16} strokeWidth={1.5} /> Transactions</h2>
        </div>
        {data.recentPayments?.length === 0 && <p className="an-empty">No transactions yet.</p>}
        <div className="an-tx-list">
          {data.recentPayments?.map(p => (
            <div key={p._id} className="an-tx-row">
              <div className="an-tx-info">
                <span className="an-tx-name">{p.userId?.name || p.userName}</span>
                <span className="an-tx-ref">{p.reference}</span>
              </div>
              <span className="an-tx-plan">{p.plan}</span>
              <span className="an-tx-amount">{p.amount?.toLocaleString()} RWF</span>
              <span className={`an-tx-status ${p.status}`}>
                {p.status === 'completed' && <CheckCircle size={13} strokeWidth={2} />}
                {p.status === 'pending'   && <Clock       size={13} strokeWidth={2} />}
                {p.status === 'failed'    && <XCircle     size={13} strokeWidth={2} />}
                {p.status}
              </span>
              <span className="an-tx-date">{new Date(p.createdAt).toLocaleDateString()}</span>
              {p.status === 'pending' && (
                <div className="an-tx-actions">
                  <button className="an-btn-confirm" onClick={() => confirmPayment(p._id)}>Confirm</button>
                  <button className="an-btn-reject"  onClick={() => rejectPayment(p._id)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
