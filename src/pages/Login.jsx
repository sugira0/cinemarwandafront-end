import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Film, Monitor, Trash2 } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import DeviceRemovalVerification from '../components/DeviceRemovalVerification';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Auth.css';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedRedirect = params.get('redirect');
  const redirect = normalizeRedirectPath(requestedRedirect || '/subscription');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError('');
    try {
      await loginWithGoogle();
      // loginWithGoogle redirects to /movies via Better Auth callbackURL
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
      setGoogleBusy(false);
    }
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

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-google">
          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={googleBusy}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleBusy ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>
      </form>
    </div>
  );
}
