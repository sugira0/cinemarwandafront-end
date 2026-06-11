import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Monitor, Trash2, ArrowRight, Film, Star, Users, Lock } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import api from '../api/axios';
import DeviceRemovalVerification from '../components/DeviceRemovalVerification';
import Logo from '../components/Logo';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Register.css';
import './Login.css';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedRedirect = params.get('redirect');
  const redirect = normalizeRedirectPath(requestedRedirect || '/subscription');
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [devices, setDevices] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [codes, setCodes] = useState({ emailCode: '', whatsappCode: '' });
  const [verificationError, setVerificationError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm(c => ({ ...c, [key]: value }));
  const updateCodes = (key, value) => setCodes(c => ({ ...c, [key]: value.replace(/\D/g, '').slice(0, 6) }));

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign-In Error:', err);

      // Handle specific Firebase errors with user-friendly messages
      let errorMessage = 'Google sign-in failed.';

      if (err.message?.includes('redirect uri') || err.message?.includes('OAuth2')) {
        errorMessage = 'Google Sign-In is not fully configured. Please contact support or try email/password login.';
      } else if (err.message?.includes('popup blocked')) {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (err.message?.includes('API key')) {
        errorMessage = 'Firebase configuration error. Please contact support.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setDevices(null);
    setVerification(null);
    setVerificationError('');
    setLoading(true);
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
    setLoading(false);
  };

  const requestDeviceRemoval = async (device) => {
    setRequesting(device.deviceId);
    setVerificationError('');
    try {
      const { data } = await api.post(`/auth/devices/${device.deviceId}/removal/request`, {
        identifier: form.identifier,
        password: form.password,
      });
      setVerification({ ...data, deviceId: device.deviceId, deviceName: device.deviceName });
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
      setDevices(c => c?.filter(d => d.deviceId !== verification.deviceId) || []);
      setVerification(null);
      setCodes({ emailCode: '', whatsappCode: '' });
      setError('Device removed. You can now sign in.');
    } catch (confirmError) {
      setVerificationError(confirmError.response?.data?.message || 'Verification failed.');
    }
    setVerifying(false);
  };

  return (
    <div className="reg-page">

      {/* ── Left branding panel ── */}
      <div className="reg-left">
        <div className="reg-left-inner">
          <Logo size="md" as="div" />
          <div className="reg-left-copy">
            <h1>Welcome<br />back</h1>
            <p>Sign in to continue watching the best of Rwandan cinema.</p>
          </div>
          <ul className="reg-features">
            {[
              'Pick up where you left off',
              'Access your full watchlist',
              'Stream on all your devices',
              'Manage your subscription',
            ].map(f => (
              <li key={f}>
                <Star size={13} strokeWidth={2} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="reg-left-flag">
            <span style={{ background: '#20603D' }} />
            <span style={{ background: '#FAD201' }} />
            <span style={{ background: '#1F8FD1' }} />
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="reg-right">
        <div className="reg-form-wrap">

          <h2 className="reg-title">Sign in</h2>
          <p className="reg-sub">Enter your email and password to continue.</p>

          {error && <div className="reg-error">{error}</div>}

          {/* Device limit panel */}
          {devices && (
            <div className="login-device-panel">
              <p className="login-device-title">
                <Monitor size={14} strokeWidth={1.5} /> Registered Devices
              </p>
              {devices.map(device => (
                <div key={device.deviceId} className="login-device-row">
                  <div>
                    <span className="login-device-name">{device.deviceName}</span>
                    <span className="login-device-seen">Last seen: {new Date(device.lastSeen).toLocaleDateString()}</span>
                  </div>
                  <button
                    type="button"
                    className="login-device-remove"
                    onClick={() => requestDeviceRemoval(device)}
                    disabled={requesting === device.deviceId}
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                    {requesting === device.deviceId ? 'Sending...' : 'Remove'}
                  </button>
                </div>
              ))}
              <DeviceRemovalVerification
                title="Verify account ownership"
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

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="reg-field">
              <label>Email address</label>
              <div className="reg-input-wrap">
                <Mail size={15} strokeWidth={1.8} className="reg-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.identifier}
                  onChange={e => updateForm('identifier', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="reg-field" style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
              </div>
              <div className="reg-input-wrap">
                <Lock size={15} strokeWidth={1.8} className="reg-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  required
                />
                <button type="button" className="reg-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button type="submit" className="reg-submit" disabled={loading} style={{ marginTop: '1.25rem' }}>
              {loading ? <span className="reg-spinner" /> : <>Sign In <ArrowRight size={16} strokeWidth={2} /></>}
            </button>

            <div className="reg-divider" style={{ marginTop: '1rem' }}><span>or</span></div>

            <button type="button" className="reg-google" onClick={handleGoogleSignIn} disabled={googleBusy}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
              </svg>
              {googleBusy ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <p className="reg-signin" style={{ marginTop: '1rem' }}>
              No account? <Link to="/register">Create one free</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
