import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Star, ArrowLeft, Clapperboard, Check } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import './StaffAuth.css';

const ROLES = [
  {
    id: 'author',
    label: 'Author / Filmmaker',
    icon: <Video size={20} strokeWidth={1.5} />,
    desc: 'Upload and manage films, series, and episodes on the platform.',
    perks: ['Upload movies & series', 'Manage your content', 'View analytics'],
  },
  {
    id: 'actor',
    label: 'Actor / Talent',
    icon: <Star size={20} strokeWidth={1.5} />,
    desc: 'Create your talent profile and appear in film casts.',
    perks: ['Public actor profile', 'Appear in film casts', 'Fan following & likes'],
  },
];

export default function StaffRegister() {
  const { requestRegisterOtp, verifyRegisterOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]     = useState('role'); // role | details | otp
  const [role, setRole]     = useState('author');
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [otp, setOtp]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleDetails = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await requestRegisterOtp({ name: form.name, email: form.email, password: form.password, role });
      setStep('otp');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send code'); }
    setLoading(false);
  };

  const handleOtp = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await verifyRegisterOtp({ email: form.email, otp });
      if (role === 'author') navigate('/dashboard');
      else navigate('/actors');
    } catch (err) { setError(err.response?.data?.message || 'Invalid code'); }
    setLoading(false);
  };

  return (
    <div className="staff-auth-page">
      <div className="staff-auth-bg" />

      <div className="staff-auth-card staff-register-card">
        <div className="staff-auth-top-links">
          <Link to="/" className="staff-home-link">← Home</Link>
          <Link to="/staff/login" className="staff-back-link">
            <ArrowLeft size={14} strokeWidth={2} /> Back to staff login
          </Link>
        </div>

        <div className="staff-auth-logo">
          <div className="staff-auth-logo-icon">
            <Clapperboard size={24} strokeWidth={1.5} />
          </div>
          <div>
            <span className="staff-auth-logo-title">CINEMA Rwanda</span>
            <span className="staff-auth-logo-sub">Staff Portal</span>
          </div>
        </div>

        {/* Step: choose role */}
        {step === 'role' && (
          <>
            <h2 className="staff-auth-title">Join as Staff</h2>
            <p className="staff-auth-sub">Choose your role on the platform</p>

            <div className="staff-role-cards">
              {ROLES.map(r => (
                <button key={r.id} type="button"
                  className={`staff-role-card${role === r.id ? ' selected' : ''}`}
                  onClick={() => setRole(r.id)}>
                  <div className="staff-role-card-header">
                    <div className={`staff-role-card-icon ${r.id}`}>{r.icon}</div>
                    <div>
                      <div className="staff-role-card-title">{r.label}</div>
                      {role === r.id && <div className="staff-role-card-selected-badge">Selected</div>}
                    </div>
                  </div>
                  <p className="staff-role-card-desc">{r.desc}</p>
                  <ul className="staff-role-card-perks">
                    {r.perks.map(p => (
                      <li key={p}><Check size={12} strokeWidth={2.5} /> {p}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <button className="staff-auth-submit" onClick={() => setStep('details')}>
              Continue as {ROLES.find(r => r.id === role)?.label}
            </button>
            <p className="staff-auth-link">
              Already have an account? <Link to="/staff/login">Sign in</Link>
            </p>
            <p className="staff-auth-link" style={{ marginTop: 4 }}>
              Looking to watch? <Link to="/register">Viewer registration</Link>
            </p>
          </>
        )}

        {/* Step: fill details */}
        {step === 'details' && (
          <>
            <div className="staff-step-header">
              <button className="staff-step-back" onClick={() => setStep('role')}>
                <ArrowLeft size={14} /> Back
              </button>
              <div className={`staff-role-badge ${role}`}>
                {role === 'author' ? <Video size={13} strokeWidth={1.5} /> : <Star size={13} strokeWidth={1.5} />}
                {role === 'author' ? 'Author' : 'Actor'}
              </div>
            </div>

            <h2 className="staff-auth-title">Create Staff Account</h2>
            <p className="staff-auth-sub">We'll send a verification code to your email</p>

            {error && <p className="staff-auth-error">{error}</p>}

            <form className="staff-auth-form" onSubmit={handleDetails}>
              <div className="staff-input-group">
                <label>Full Name</label>
                <input placeholder="Your full name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="staff-input-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="staff-input-group">
                <label>Password</label>
                <input type="password" placeholder="At least 6 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="staff-auth-submit" disabled={loading}>
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        )}

        {/* Step: verify OTP */}
        {step === 'otp' && (
          <>
            <div className="staff-step-header">
              <button className="staff-step-back" onClick={() => setStep('details')}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>

            <h2 className="staff-auth-title">Verify Your Email</h2>
            <p className="staff-auth-sub">Enter the 6-digit code sent to <strong>{form.email}</strong></p>

            {error && <p className="staff-auth-error">{error}</p>}

            <form className="staff-auth-form" onSubmit={handleOtp}>
              <div className="staff-input-group">
                <label>Verification Code</label>
                <input placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  keyboardType="number-pad" maxLength={6} required style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }} />
              </div>
              <button type="submit" className="staff-auth-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
