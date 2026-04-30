import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { buildPostAuthPath, normalizeRedirectPath } from '../lib/authRedirect';
import './Auth.css';

export default function Register() {
  const { requestRegisterOtp } = useAuth();
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

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.email.trim()) {
      setError('Enter the email address for your Firebase account.');
      return;
    }

    try {
      setLoading(true);
    const response = await requestRegisterOtp(form);
    setNotice(response.message || 'We sent a one-time password to your email.');
      navigate(buildPostAuthPath(redirect), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>
        <h2>Create account</h2>
        <p className="auth-sub">Join and start watching today</p>
        <p className="auth-note">Firebase will create your secure account and send an email verification link, not a one-time password.</p>
        {error && <p className="error">{error}</p>}
        {notice && <div className="reset-success"><p>{notice}</p></div>}

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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
