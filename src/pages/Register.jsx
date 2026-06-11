import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Film, Mail, Phone, User, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import Logo from '../components/Logo';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Register.css';

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
  const [showPw, setShowPw] = useState(false);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate(buildPostAuthPath(redirect), { replace: true });
    } catch (err) {
      console.error('Google Sign-In Error:', err);

      // Handle specific Firebase errors with user-friendly messages
      let errorMessage = 'Google sign-in failed.';

      if (err.message?.includes('redirect uri') || err.message?.includes('OAuth2')) {
        errorMessage = 'Google Sign-In is not fully configured. Please contact support or try email/password registration.';
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
    } finally {
      setGoogleBusy(false);
    }
  };

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
    <div className="reg-page">

      {/* ── Left panel — branding ── */}
      <div className="reg-left">
        <div className="reg-left-inner">
          <Logo size="md" as="div" />
          <div className="reg-left-copy">
            <h1>Rwanda's home<br />of cinema</h1>
            <p>Stream the best Rwandan films, series, and documentaries — anytime, anywhere.</p>
          </div>
          <ul className="reg-features">
            {[
              'Unlimited Rwandan films & series',
              'Watch on phone, laptop, and TV',
              'Pay with MTN MoMo or Airtel Money',
              'Cancel anytime',
            ].map(f => (
              <li key={f}>
                <CheckCircle size={15} strokeWidth={2} />
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

      {/* ── Right panel — form ── */}
      <div className="reg-right">
        <div className="reg-form-wrap">

          {/* Step indicator */}
          <div className="reg-steps">
            <div className={`reg-step ${step === 'details' ? 'active' : 'done'}`}>
              <span>1</span>
              <p>Your details</p>
            </div>
            <div className="reg-step-line" />
            <div className={`reg-step ${step === 'verify' ? 'active' : ''}`}>
              <span>2</span>
              <p>Verify email</p>
            </div>
          </div>

          <h2 className="reg-title">
            {step === 'details' ? 'Create your account' : 'Check your inbox'}
          </h2>
          <p className="reg-sub">
            {step === 'details'
              ? 'Join thousands of viewers watching Rwandan stories.'
              : `We sent a 6-digit code to ${form.email}`}
          </p>

          {error && <div className="reg-error">{error}</div>}
          {notice && <div className="reg-notice">{notice}</div>}

          <form onSubmit={step === 'details' ? handleRequestOtp : handleVerifyOtp}>

            {step === 'details' ? (
              <>
                {/* Name */}
                <div className="reg-field">
                  <label>Full Name</label>
                  <div className="reg-input-wrap">
                    <User size={15} strokeWidth={1.8} className="reg-input-icon" />
                    <input
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="reg-field">
                  <label>Email address</label>
                  <div className="reg-input-wrap">
                    <Mail size={15} strokeWidth={1.8} className="reg-input-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => updateForm('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="reg-field">
                  <label>Phone <span className="reg-optional">optional</span></label>
                  <div className="reg-input-wrap">
                    <Phone size={15} strokeWidth={1.8} className="reg-input-icon" />
                    <input
                      placeholder="+2507XXXXXXXX"
                      value={form.phone}
                      onChange={e => updateForm('phone', e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="reg-field">
                  <label>Password</label>
                  <div className="reg-input-wrap">
                    <Lock size={15} strokeWidth={1.8} className="reg-input-icon" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      value={form.password}
                      onChange={e => updateForm('password', e.target.value)}
                      required
                    />
                    <button type="button" className="reg-pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      {showPw ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="reg-submit" disabled={loading}>
                  {loading ? (
                    <span className="reg-spinner" />
                  ) : (
                    <>Send Sign-Up Code <ArrowRight size={16} strokeWidth={2} /></>
                  )}
                </button>

                {/* Divider */}
                <div className="reg-divider"><span>or</span></div>

                {/* Google */}
                <button type="button" className="reg-google" onClick={handleGoogleSignIn} disabled={googleBusy}>
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
                  </svg>
                  {googleBusy ? 'Redirecting...' : 'Continue with Google'}
                </button>
              </>
            ) : (
              <>
                {/* Account summary */}
                <div className="reg-summary">
                  <div className="reg-summary-avatar">{form.name?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <strong>{form.name}</strong>
                    <span>{form.email}</span>
                  </div>
                </div>

                {/* OTP input */}
                <div className="reg-field">
                  <label>6-digit verification code</label>
                  <input
                    className="reg-otp-input"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                  />
                </div>

                <button type="submit" className="reg-submit" disabled={loading}>
                  {loading ? <span className="reg-spinner" /> : <>Verify & Create Account <ArrowRight size={16} strokeWidth={2} /></>}
                </button>

                <div className="reg-verify-actions">
                  <button type="button" className="reg-text-btn" onClick={() => setStep('details')}>
                    ← Edit details
                  </button>
                  <button type="button" className="reg-text-btn" onClick={handleResendOtp} disabled={resending}>
                    {resending ? 'Sending...' : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            <p className="reg-signin">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
