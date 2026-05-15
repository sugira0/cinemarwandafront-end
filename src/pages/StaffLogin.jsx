import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import DeviceRemovalVerification from '../components/DeviceRemovalVerification';
import Logo from '../components/Logo';
import './StaffAuth.css';

export default function StaffLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]                     = useState({ email: '', password: '' });
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [devices, setDevices]               = useState(null);
  const [requesting, setRequesting]         = useState(null);
  const [verifying, setVerifying]           = useState(false);
  const [verification, setVerification]     = useState(null);
  const [codes, setCodes]                   = useState({ emailCode: '', whatsappCode: '' });
  const [verificationError, setVerificationError] = useState('');

  const updateCodes = (key, value) => setCodes(c => ({ ...c, [key]: value.replace(/\D/g,'').slice(0,6) }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setDevices(null); setVerification(null); setVerificationError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      const role = result?.user?.role || result?.role;
      if (role === 'viewer') {
        setError('This portal is for Authors and Actors only. Viewers please use the main login.');
        setLoading(false);
        return;
      }
      // Redirect based on role
      if (role === 'author') navigate('/dashboard');
      else if (role === 'actor') navigate('/actors');
      else navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.devices) { setDevices(data.devices); setError(data.message); }
      else setError(data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const requestDeviceRemoval = async (device) => {
    setRequesting(device.deviceId); setVerificationError('');
    try {
      const { data } = await api.post(`/auth/devices/${device.deviceId}/removal/request`, { identifier: form.email, password: form.password });
      setVerification({ ...data, deviceId: device.deviceId, deviceName: device.deviceName });
      setCodes({ emailCode: '', whatsappCode: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to send verification codes.'); }
    setRequesting(null);
  };

  const confirmDeviceRemoval = async () => {
    if (!verification) return;
    setVerifying(true); setVerificationError('');
    try {
      await api.post(`/auth/devices/${verification.deviceId}/removal/confirm`, {
        identifier: form.email, password: form.password,
        requestId: verification.requestId, emailCode: codes.emailCode, whatsappCode: codes.whatsappCode,
      });
      setVerification(null); setDevices(null); setCodes({ emailCode:'', whatsappCode:'' });
      setError('Device removed. You can now sign in.');
    } catch (err) { setVerificationError(err.response?.data?.message || 'Verification failed.'); }
    setVerifying(false);
  };

  return (
    <div className="staff-auth-page">
      {/* Background pattern */}
      <div className="staff-auth-bg" />

      <div className="staff-auth-card">
        {/* Back to viewer login */}
        <div className="staff-auth-top-links">
          <Link to="/" className="staff-home-link">← Home</Link>
          <Link to="/login" className="staff-back-link">
            <ArrowLeft size={14} strokeWidth={2} /> Viewer login
          </Link>
        </div>

        {/* Logo */}
        <div className="staff-auth-logo">
          <Logo size="md" as="div" subtitle="Staff Portal" />
        </div>

        {/* Role badges */}
        <div className="staff-role-badges">
          <div className="staff-role-badge author">
            <Video size={14} strokeWidth={1.5} /> Author
          </div>
          <div className="staff-role-badge actor">
            <Star size={14} strokeWidth={1.5} /> Actor
          </div>
        </div>

        <h2 className="staff-auth-title">Staff Sign In</h2>
        <p className="staff-auth-sub">Access your creator dashboard</p>

        {error && <p className="staff-auth-error">{error}</p>}

        {devices && !verification && (
          <div className="device-limit-panel">
            <p className="device-limit-title">2 devices registered — remove one to continue</p>
            {devices.map(d => (
              <div key={d.deviceId} className="device-row">
                <div className="device-info">
                  <span className="device-name">{d.deviceName}</span>
                  <span className="device-seen">Last seen: {new Date(d.lastSeen).toLocaleDateString()}</span>
                </div>
                <button type="button" className="btn-remove-device" onClick={() => requestDeviceRemoval(d)} disabled={requesting === d.deviceId}>
                  {requesting === d.deviceId ? 'Sending...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}

        {verification && (
          <DeviceRemovalVerification
            title={`Remove "${verification.deviceName}"`}
            verification={verification} codes={codes} onChange={updateCodes}
            onSubmit={confirmDeviceRemoval}
            onCancel={() => { setVerification(null); setCodes({ emailCode:'', whatsappCode:'' }); setVerificationError(''); }}
            submitting={verifying} error={verificationError}
          />
        )}

        {!verification && (
          <form className="staff-auth-form" onSubmit={handleSubmit}>
            <div className="staff-input-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="staff-input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="staff-auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <button type="submit" className="staff-auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In to Staff Portal'}
            </button>
            <p className="staff-auth-link">
              New staff member? <Link to="/staff/register">Create staff account</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
