import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, {
        state: {
          message: data.message,
          maskedEmail: data.maskedEmail,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-logo"><Film size={20} strokeWidth={1.5} /> CINEMA Rwanda</div>
        <h2>Forgot password?</h2>
        <p className="auth-sub">Enter your email and we'll send you a one-time password.</p>

        {error && <p className="error">{error}</p>}
        <div className="reset-success">
          <Mail size={18} strokeWidth={1.5} />
          <p>We will email a 6-digit OTP that you can use on the next screen to set a new password.</p>
        </div>

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
