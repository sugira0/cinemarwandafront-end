import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Auth.css';

export default function Register() {
  const { requestRegisterOtp, verifyRegisterOtp } = useAuth();
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
      </form>
    </div>
  );
}
