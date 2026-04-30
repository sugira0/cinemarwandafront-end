import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Film, Monitor, Trash2 } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import DeviceRemovalVerification from '../components/DeviceRemovalVerification';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedRedirect = params.get('redirect');
  const redirect = normalizeRedirectPath(requestedRedirect || '/subscription');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [devices, setDevices] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [codes, setCodes] = useState({ emailCode: '', whatsappCode: '' });
  const [verificationError, setVerificationError] = useState('');

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateCodes = (key, value) => {
    setCodes((current) => ({ ...current, [key]: value.replace(/\D/g, '').slice(0, 6) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setDevices(null);
    setVerification(null);
    setVerificationError('');

    try {
      const data = await login(form.identifier, form.password);
      const nextTarget = !requestedRedirect && data?.user?.role === 'admin' ? '/admin' : redirect;
      navigate(buildPostAuthPath(nextTarget), { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.devices) {
        setDevices(data.devices);
        setError(data.message);
      } else {
        setError(data?.message || err.message || 'Login failed');
      }
    }
  };

  const requestDeviceRemoval = async (device) => {
    setRequesting(device.deviceId);
    setVerificationError('');
    try {
      const { data } = await api.post(`/auth/devices/${device.deviceId}/removal/request`, {
        identifier: form.identifier,
        password: form.password,
      });
      setVerification({
        ...data,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      });
      setCodes({ emailCode: '', whatsappCode: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to send verification codes.');
    }
    setRequesting(null);
  };

  const confirmDeviceRemoval = async () => {
    if (!verification) return;

    setVerifying(true);
    setVerificationError('');
    try {
      await api.post(`/auth/devices/${verification.deviceId}/removal/confirm`, {
        identifier: form.identifier,
        password: form.password,
        requestId: verification.requestId,
        emailCode: codes.emailCode,
        whatsappCode: codes.whatsappCode,
      });
      setDevices((current) => current?.filter((device) => device.deviceId !== verification.deviceId) || []);
      setVerification(null);
      setCodes({ emailCode: '', whatsappCode: '' });
      setError('Device verified and removed. You can now sign in.');
    } catch (confirmError) {
      setVerificationError(confirmError.response?.data?.message || 'Verification failed.');
    }
    setVerifying(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to continue watching</p>
        <p className="auth-note">Use the email address you registered with.</p>

        {error && <p className="error">{error}</p>}

        {devices && (
          <div className="device-limit-panel">
            <p className="device-limit-title"><Monitor size={14} strokeWidth={1.5} /> Registered Devices</p>
            {devices.map((device) => (
              <div key={device.deviceId} className="device-row">
                <div className="device-info">
                  <span className="device-name">{device.deviceName}</span>
                  <span className="device-seen">Last seen: {new Date(device.lastSeen).toLocaleDateString()}</span>
                </div>
                <button
                  type="button"
                  className="btn-remove-device"
                  onClick={() => requestDeviceRemoval(device)}
                  disabled={requesting === device.deviceId}
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                  {requesting === device.deviceId ? 'Sending codes...' : 'Remove'}
                </button>
              </div>
            ))}

            <DeviceRemovalVerification
              title="Verify account ownership"
              verification={verification}
              codes={codes}
              onChange={updateCodes}
              onSubmit={confirmDeviceRemoval}
              onCancel={() => {
                setVerification(null);
                setVerificationError('');
                setCodes({ emailCode: '', whatsappCode: '' });
              }}
              submitting={verifying}
              error={verificationError}
            />
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input
            placeholder="you@example.com"
            type="email"
            value={form.identifier}
            onChange={(event) => updateForm('identifier', event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) => updateForm('password', event.target.value)}
            required
          />
        </div>

        <button type="submit">Sign In</button>
        <p className="auth-link" style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.82rem' }}>Forgot password?</Link>
        </p>
        <p className="auth-link">No account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  );
}
