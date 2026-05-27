import { useEffect, useState } from 'react';
import { Monitor, Trash2, Shield, LogOut, Lock, Eye, EyeOff, User, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useI18n } from '../context/I18nContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import DeviceRemovalVerification from '../components/DeviceRemovalVerification';
import './Account.css';

const NAV_ITEMS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'devices', icon: Monitor, label: 'Devices' },
  { id: 'security', icon: Lock, label: 'Security' },
  { id: 'subscription', icon: CreditCard, label: 'Subscription' },
];

export default function Account() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [codes, setCodes] = useState({ emailCode: '', whatsappCode: '' });
  const [msg, setMsg] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const currentDeviceId = localStorage.getItem('deviceId');
  const contact = user?.email || user?.phone || 'No contact information';

  useEffect(() => {
    api.get('/auth/devices')
      .then(r => { setDevices(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateCodes = (key, value) => {
    setCodes(c => ({ ...c, [key]: value.replace(/\D/g, '').slice(0, 6) }));
  };

  const requestDeviceRemoval = async (device) => {
    if (device.deviceId === currentDeviceId) {
      if (!window.confirm(t('Removing your current device will log you out. Continue?'))) return;
    }
    setRequesting(device.deviceId);
    setMsg(''); setVerificationError('');
    try {
      const { data } = await api.post(`/auth/devices/${device.deviceId}/removal/request`);
      setVerification({ ...data, deviceId: device.deviceId, deviceName: device.deviceName });
      setCodes({ emailCode: '', whatsappCode: '' });
    } catch (error) {
      setMsg(error.response?.data?.message || 'Failed to send verification codes');
    }
    setRequesting(null);
  };

  const confirmDeviceRemoval = async () => {
    if (!verification) return;
    setVerifying(true); setVerificationError('');
    try {
      const { data } = await api.post(`/auth/devices/${verification.deviceId}/removal/confirm`, {
        requestId: verification.requestId,
        emailCode: codes.emailCode,
        whatsappCode: codes.whatsappCode,
      });
      setDevices(data.devices || []);
      setVerification(null);
      setCodes({ emailCode: '', whatsappCode: '' });
      setMsg('Device verified and removed.');
      setTimeout(() => setMsg(''), 2500);
      if (data.removedCurrentDevice) { await logout(); navigate('/login'); }
    } catch (error) {
      setVerificationError(error.response?.data?.message || 'Verification failed');
    }
    setVerifying(false);
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteErr('');
    try {
      await api.delete('/auth/me');
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteErr(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setDeleteBusy(false);
      setDeleteConfirm(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (!pwForm.current) { setPwErr('Enter your current password.'); return; }
    if (pwForm.next.length < 8) { setPwErr('New password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwMsg('Password changed successfully.');
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Failed to change password.');
    }
    setPwBusy(false);
  };

  return (
    <div className="account-layout">

      {/* ── Left Sidebar ── */}
      <aside className="account-sidebar">
        {/* User card */}
        <div className="account-sidebar-user">
          <div className="account-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="account-sidebar-info">
            <p className="account-name">{user?.name}</p>
            <p className="account-email">{contact}</p>
            <span className="account-role">{user?.role}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="account-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`account-nav-item${activeTab === item.id ? ' active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={17} strokeWidth={1.6} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <button
          className="account-signout"
          onClick={async () => { await logout(); navigate('/login'); }}
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="account-main">

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="account-panel">
            <div className="account-panel-header">
              <User size={18} strokeWidth={1.5} />
              <h2>Profile</h2>
            </div>
            <p className="account-panel-sub">Your account information</p>

            <div className="account-info-grid">
              <div className="account-info-item">
                <label>Full Name</label>
                <p>{user?.name || '—'}</p>
              </div>
              <div className="account-info-item">
                <label>Email</label>
                <p>{user?.email || '—'}</p>
              </div>
              <div className="account-info-item">
                <label>Phone</label>
                <p>{user?.phone || '—'}</p>
              </div>
              <div className="account-info-item">
                <label>Role</label>
                <p className="account-role-text">{user?.role}</p>
              </div>
              <div className="account-info-item">
                <label>Member since</label>
                <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
            </div>

            {/* Delete account */}
            <div className="account-danger-zone">
              <h3>Danger Zone</h3>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              {deleteErr && <p className="account-pw-error">{deleteErr}</p>}
              {!deleteConfirm ? (
                <button className="account-delete-btn" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 size={15} strokeWidth={1.5} />
                  Delete My Account
                </button>
              ) : (
                <div className="account-delete-confirm">
                  <p>Are you sure? This will permanently delete your account, watchlist, and all data.</p>
                  <div className="account-delete-actions">
                    <button className="account-delete-cancel" onClick={() => setDeleteConfirm(false)} disabled={deleteBusy}>
                      Cancel
                    </button>
                    <button className="account-delete-confirm-btn" onClick={deleteAccount} disabled={deleteBusy}>
                      {deleteBusy ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Devices tab */}
        {activeTab === 'devices' && (
          <div className="account-panel">
            <div className="account-panel-header">
              <Monitor size={18} strokeWidth={1.5} />
              <h2>Registered Devices</h2>
              <span className="device-count">{devices.length} / 2</span>
            </div>
            <p className="account-panel-sub">Your account can be active on up to 2 devices at a time.</p>

            {msg && <p className="account-msg">{msg}</p>}

            {loading ? (
              <p className="account-loading">Loading devices...</p>
            ) : devices.length === 0 ? (
              <p className="account-empty">No devices registered.</p>
            ) : (
              <div className="devices-list">
                {devices.map(d => (
                  <div key={d.deviceId} className={`device-item${d.isCurrent ? ' current' : ''}`}>
                    <Monitor size={20} strokeWidth={1.5} className="device-icon" />
                    <div className="device-details">
                      <span className="device-name">
                        {d.deviceName}
                        {d.isCurrent && <span className="device-current-badge">This device</span>}
                      </span>
                      <span className="device-seen">Last active: {new Date(d.lastSeen).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <button
                      className="btn-remove-device"
                      onClick={() => requestDeviceRemoval(d)}
                      disabled={requesting === d.deviceId}
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                      {requesting === d.deviceId ? 'Sending...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <DeviceRemovalVerification
              title="Verify device removal"
              verification={verification}
              codes={codes}
              onChange={updateCodes}
              onSubmit={confirmDeviceRemoval}
              onCancel={() => { setVerification(null); setVerificationError(''); setCodes({ emailCode: '', whatsappCode: '' }); }}
              submitting={verifying}
              error={verificationError}
            />
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="account-panel">
            <div className="account-panel-header">
              <Lock size={18} strokeWidth={1.5} />
              <h2>Security</h2>
            </div>
            <p className="account-panel-sub">Change your account password. You need your current password to make this change.</p>

            <form className="account-pw-form" onSubmit={changePassword}>
              {[
                { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'next', label: 'New Password', placeholder: 'Min 8 characters' },
                { key: 'confirm', label: 'Confirm Password', placeholder: 'Repeat new password' },
              ].map(field => (
                <div className="account-pw-field" key={field.key}>
                  <label>{field.label}</label>
                  <div className="account-pw-input-wrap">
                    <input
                      type={showPw[field.key] ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={pwForm[field.key]}
                      onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                      required
                    />
                    <button type="button" className="account-pw-eye" onClick={() => setShowPw(s => ({ ...s, [field.key]: !s[field.key] }))}>
                      {showPw[field.key] ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>
              ))}

              {pwErr && <p className="account-pw-error">{pwErr}</p>}
              {pwMsg && <p className="account-pw-success">{pwMsg}</p>}

              <button type="submit" className="account-pw-submit" disabled={pwBusy}>
                {pwBusy ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Subscription tab */}
        {activeTab === 'subscription' && (
          <div className="account-panel">
            <div className="account-panel-header">
              <CreditCard size={18} strokeWidth={1.5} />
              <h2>Subscription</h2>
            </div>
            <p className="account-panel-sub">Your current plan and billing information.</p>

            <div className={`account-sub-card${user?.subscription?.active ? ' active' : ''}`}>
              <div className="account-sub-plan">
                <span className="account-sub-label">Current Plan</span>
                <strong className="account-sub-name">
                  {user?.subscription?.plan
                    ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)
                    : 'Free'}
                </strong>
              </div>
              {user?.subscription?.active && user?.subscription?.expiresAt && (
                <div className="account-sub-expiry">
                  <span className="account-sub-label">Expires</span>
                  <strong>{new Date(user.subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>
              )}
              <span className={`account-sub-status${user?.subscription?.active ? ' active' : ''}`}>
                {user?.subscription?.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <Link to="/plans" className="account-upgrade-btn">
              {user?.subscription?.active ? 'Change Plan' : 'Upgrade Now'}
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
