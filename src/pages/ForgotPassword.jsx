import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import Logo from '../components/Logo';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/firebase/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Logo size="sm" as="div" className="auth-logo-wrap" />
        <h2>Forgot password?</h2>
        <p className="auth-sub">Enter your email and Firebase will send a secure reset link.</p>

        {error && <p className="error">{error}</p>}
        {sent ? (
          <div className="reset-success">
            <CheckCircle size={18} strokeWidth={1.5} />
            <p>Password reset email sent. Check your inbox.</p>
          </div>
        ) : (
          <div className="reset-success">
            <Mail size={18} strokeWidth={1.5} />
            <p>We will email a reset link from Firebase Authentication.</p>
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>

        <p className="auth-link">
          <Link to="/login"><ArrowLeft size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back to login</Link>
        </p>
      </form>
    </div>
  );
}
