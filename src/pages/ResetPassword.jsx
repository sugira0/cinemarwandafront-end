import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Film, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import './Auth.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = params.get('token');
  const emailFromQuery = params.get('email') || '';

  const [form, setForm] = useState({
    email: emailFromQuery,
    otp: '',
    password: '',
    confirm: '',
  });
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    setError('');

    try {
      if (token) {
        await api.post('/auth/reset-password', { token, password: form.password });
      } else {
        await api.post('/auth/reset-password', {
          email: form.email,
          otp: form.otp,
          password: form.password,
        });
      }

      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (token ? 'Reset failed. Link may have expired.' : 'Reset failed. Check your code and try again.'));
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      setMessage(data.message || 'A new password reset code has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend your reset code.');
    }

    setResending(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>
        <h2>{token ? 'Set new password' : 'Reset with OTP'}</h2>
        <p className="auth-sub">
          {token
            ? 'Choose a strong password for your account.'
            : 'Enter the one-time password from your email, then choose a new password.'}
        </p>

        {error && <p className="error">{error}</p>}
        {message && !done && <div className="reset-success"><p>{message}</p></div>}

        {done ? (
          <div className="reset-success">
            <CheckCircle size={20} strokeWidth={1.5} />
            <p>Password reset! Redirecting to login...</p>
          </div>
        ) : (
          <>
            {!token && (
              <>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => updateForm('email', event.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>One-Time Password</label>
                  <input
                    type="text"
                    placeholder="Enter the 6-digit code"
                    value={form.otp}
                    onChange={(event) => updateForm('otp', event.target.value)}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="********"
                minLength={6}
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="********"
                value={form.confirm}
                onChange={(event) => updateForm('confirm', event.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            {!token && (
              <div className="auth-button-row">
                <button
                  type="button"
                  className="auth-button-secondary"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            )}
          </>
        )}

        <p className="auth-link"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
