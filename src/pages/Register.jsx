import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Auth.css';

export default function Register() {
  const { requestRegisterOtp, verifyRegisterOtp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = normalizeRedirectPath(params.get('redirect') || '/subscription');
  const [form, setForm] = useState({
    name: '',
    email: params.get('email') || '',
    phone: '',
    password: '',
    role: 'viewer',
  });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details');
  const [resending, setResending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const requestCode = async () => {
    const response = await requestRegisterOtp(form);
    setNotice(response.message || 'We sent a one-time password to your email.');
    setStep('verify');
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.email.trim()) {
      setError('Enter the email address where you want to receive your sign-up code.');
      return;
    }

    try {
      setLoading(true);
      await requestCode();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send sign-up code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setLoading(true);
      await verifyRegisterOtp({ email: form.email, otp });
      navigate(buildPostAuthPath(redirect), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');

    try {
      setResending(true);
      await requestCode();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend sign-up code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <form
        key={step}
        className="auth-form"
        onSubmit={step === 'details' ? handleRequestOtp : handleVerifyOtp}
      >
        <div className="auth-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>
        <span className="auth-step-pill">{step === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}</span>
        <h2>{step === 'details' ? 'Create account' : 'Verify your email'}</h2>
        <p className="auth-sub">
          {step === 'details'
            ? 'Join and start watching today'
            : 'Enter the one-time password we sent to finish creating your account'}
        </p>
        <p className="auth-note">
          {step === 'details'
            ? 'Your Firebase account will be created after you verify your email code.'
            : `Use the code sent to ${form.email || 'your email address'}. If it expires, resend it below.`}
        </p>
        {error && <p className="error">{error}</p>}
        {notice && <div className="reset-success"><p>{notice}</p></div>}

        {step === 'details' ? (
          <>
            <div className="role-toggle">
              {['viewer', 'author', 'actor'].map((entryRole) => (
                <button
                  key={entryRole}
                  type="button"
                  className={`role-pill${form.role === entryRole ? ' active' : ''}`}
                  onClick={() => updateForm('role', entryRole)}
                >
                  {entryRole === 'viewer' ? 'Viewer' : entryRole === 'author' ? 'Author' : 'Actor'}
                </button>
              ))}
            </div>

            <div className="input-group">
              <label>Full Name</label>
              <input
                placeholder="Your name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                placeholder="you@example.com"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>MTN MoMo / Airtel Number (optional)</label>
              <input
                placeholder="+2507XXXXXXXX"
                value={form.phone}
                onChange={(event) => updateForm('phone', event.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                placeholder="Password"
                type="password"
                minLength={6}
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Sending sign-up code...' : 'Send Sign-Up Code'}
            </button>
          </>
        ) : (
          <>
            <div className="auth-summary">
              <strong>{form.name}</strong>
              <span>{form.email}</span>
              {form.phone && <span>{form.phone}</span>}
            </div>

            <div className="input-group">
              <label>One-Time Password</label>
              <input
                placeholder="Enter the 6-digit code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify and Create Account'}
            </button>

            <div className="auth-button-row">
              <button
                type="button"
                className="auth-button-secondary"
                onClick={() => setStep('details')}
              >
                Edit Details
              </button>
              <button
                type="button"
                className="auth-button-secondary"
                onClick={handleResendOtp}
                disabled={resending}
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </>
        )}

        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>

        {step === 'details' && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <div className="auth-google">
              <button
                type="button"
                className="btn-google"
                onClick={async () => {
                  setGoogleBusy(true);
                  setError('');
                  try { await loginWithGoogle(); }
                  catch (err) { setError(err.message || 'Google sign-in failed.'); setGoogleBusy(false); }
                }}
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
          </>
        )}
      </form>
    </div>
  );
}
