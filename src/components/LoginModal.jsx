import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Film, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import './LoginModal.css';

export default function LoginModal({ onClose, onSuccess }) {
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.identifier, form.password);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }

    setLoading(false);
  };

  return (
    <div className="lmodal-backdrop" onClick={onClose}>
      <div className="lmodal-card" onClick={(event) => event.stopPropagation()}>
        <button className="lmodal-close" onClick={onClose}><X size={18} strokeWidth={1.5} /></button>

        <div className="lmodal-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>

        <div className="lmodal-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError(''); }}>
            <LogIn size={14} strokeWidth={2} /> Sign In
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); setError(''); }}>
            <UserPlus size={14} strokeWidth={2} /> Create Account
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleSubmit} className="lmodal-form">
            {error && <p className="lmodal-error">{error}</p>}

            <input
              placeholder="Email or +2507XXXXXXXX"
              value={form.identifier}
              onChange={(event) => updateForm('identifier', event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              required
            />

            <button type="submit" className="lmodal-submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Sign In & Watch'}
            </button>
          </form>
        ) : (
          <div className="lmodal-register-panel">
            <p>Create-account now uses email OTP verification for security.</p>
            <p>Continue to the full sign-up page to receive your one-time password and finish registration.</p>
            <Link className="lmodal-submit lmodal-link-button" to="/register" onClick={onClose}>
              Continue to Create Account
            </Link>
          </div>
        )}

        <p className="lmodal-hint">
          {tab === 'login'
            ? <>No account? <button onClick={() => setTab('register')}>Create one free</button></>
            : <>Already have an account? <button onClick={() => setTab('login')}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}
