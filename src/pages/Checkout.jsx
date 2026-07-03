import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import './Checkout.css';

const PLANS = {
  basic: { label: 'Basic', price: 2000, color: '#94a3b8', period: '/mo' },
  standard: { label: 'Standard', price: 5000, color: '#22c55e', period: '/mo' },
  premium: { label: 'Premium', price: 10000, color: '#f59e0b', period: '/mo' },
  weekly: { label: 'Weekly', price: 2000, color: '#38bdf8', period: '/week' },
  episodes7: { label: '7 Episodes Pack', price: 500, color: '#a78bfa', period: '/pack' },
  ppv: { label: 'Single Episode', price: 100, color: '#64748b', period: '/title' },
};

const METHODS = [
  {
    id: 'momo',
    label: 'MTN MoMo',
    color: '#FFCC00',
    textColor: '#000',
    placeholder: '07X XXX XXXX',
    hint: 'Enter your MTN MoMo number to receive the payment prompt.',
  },
  {
    id: 'airtel',
    label: 'Airtel Money',
    color: '#E40000',
    textColor: '#fff',
    placeholder: '073 XXX XXXX',
    hint: 'Enter your Airtel Money number to receive the payment prompt.',
  },
];

export default function Checkout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const planId = location.state?.plan || 'standard';
  const plan = PLANS[planId] || PLANS.standard;

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState(user?.phone || ''); // pre-fill but always editable
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pollStatus, setPollStatus] = useState('pending');
  const pollRef = useRef(null);

  const selectedMethod = METHODS.find((entry) => entry.id === method);
  const digits = phone.replace(/\D/g, '');
  const hasValidPhone = digits.length >= 9;

  // Poll MTN payment status every 5 seconds after initiation
  useEffect(() => {
    if (step !== 4 || !result?.momoRequested || !result?.payment?._id) return;
    if (pollStatus !== 'pending') return;

    const paymentId = result.payment._id;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/mtn/status/${paymentId}`, { useCache: false });
        if (data.status === 'completed') {
          setPollStatus('completed');
          clearInterval(pollRef.current);
        } else if (data.status === 'failed') {
          setPollStatus('failed');
          clearInterval(pollRef.current);
        }
      } catch {
        // keep polling silently
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [step, result, pollStatus]);

  const selectedMethod = METHODS.find((entry) => entry.id === method);
  const paymentPhone = hasAccountPhone ? accountPhone : phone;
  const digits = paymentPhone.replace(/\D/g, '');
  const hasValidPhone = digits.length >= 9;

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payments/initiate', {
        plan: planId,
        method,
        phone: phone.replace(/\s/g, ''),
      });
      setResult(data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-header">
          {step > 1 && step < 4 && (
            <button className="checkout-back" onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft size={16} strokeWidth={2} />
            </button>
          )}
          <div className="checkout-title">
            <h2>{step === 4 ? 'Payment Initiated' : 'Subscribe'}</h2>
            <p>
              {step === 1 && 'Choose your mobile-money method'}
              {step === 2 && 'Confirm your subscription number'}
              {step === 3 && 'Confirm your payment'}
              {step === 4 && 'Check your phone'}
            </p>
          </div>
        </div>

        <div className="checkout-plan" style={{ borderColor: `${plan.color}44` }}>
          <span className="cp-label">{plan.label} Plan</span>
          <span className="cp-price" style={{ color: plan.color }}>
            {plan.price.toLocaleString()} RWF{plan.period || '/mo'}
          </span>
        </div>

        {step === 1 && (
          <div className="checkout-methods">
            {METHODS.map((entry) => (
              <button
                key={entry.id}
                className={`method-btn${method === entry.id ? ' active' : ''}`}
                style={method === entry.id ? { borderColor: entry.color, boxShadow: `0 0 0 3px ${entry.color}22` } : {}}
                onClick={() => {
                  setMethod(entry.id);
                  setError('');
                  setStep(2);
                }}
              >
                <div className="method-info">
                  <span className="method-name">{entry.label}</span>
                  <span className="method-hint">{entry.hint}</span>
                </div>
                <div
                  className={`method-radio${method === entry.id ? ' checked' : ''}`}
                  style={method === entry.id ? { background: entry.color, borderColor: entry.color } : {}}
                >
                  {method === entry.id && <Check size={12} strokeWidth={3} color="#000" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && selectedMethod && (
          <div className="checkout-phone">
            <div className="phone-method-badge" style={{ background: `${selectedMethod.color}22`, borderColor: `${selectedMethod.color}44` }}>
              <span style={{ color: selectedMethod.color }}>{selectedMethod.label}</span>
            </div>

            <label className="phone-label">
              <Smartphone size={15} strokeWidth={1.5} /> Mobile Money Number
            </label>
            <input
              className="phone-input"
              placeholder={selectedMethod.placeholder}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              autoFocus
            />
            <p className="phone-hint">
              Enter the {selectedMethod.label} number you want to pay with.
              {user?.phone && ` Your account number (${user.phone}) is pre-filled — change it if needed.`}
            </p>

            {error && <p className="checkout-error">{error}</p>}

            <button
              className="checkout-pay-btn"
              style={{ background: selectedMethod.color, color: selectedMethod.textColor }}
              onClick={() => {
                if (hasValidPhone) { setError(''); setStep(3); return; }
                setError('Enter a valid phone number (e.g. 0781234567)');
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && selectedMethod && (
          <div className="checkout-confirm">
            <div className="confirm-row"><span>Plan</span><strong>{plan.label}</strong></div>
            <div className="confirm-row"><span>Amount</span><strong style={{ color: plan.color }}>{plan.price.toLocaleString()} RWF</strong></div>
            <div className="confirm-row"><span>Method</span><strong>{selectedMethod.label}</strong></div>
            <div className="confirm-row"><span>Phone</span><strong>{phone}</strong></div>

            {error && <p className="checkout-error">{error}</p>}

            <button
              className="checkout-pay-btn"
              style={{ background: selectedMethod.color, color: selectedMethod.textColor }}
              onClick={handlePay}
              disabled={loading}
            >
              {loading
                ? <><Loader size={16} className="spin" /> Processing...</>
                : `Pay ${plan.price.toLocaleString()} RWF`}
            </button>
            <p className="confirm-note">By paying you agree to our <a href="/terms">Terms of Service</a></p>
          </div>
        )}

        {step === 4 && result && (
          <div className="checkout-done">

            {/* ── Confirmed ── */}
            {pollStatus === 'completed' && (
              <>
                <div className="done-icon success">
                  <CheckCircle size={40} strokeWidth={1.5} style={{ color: '#22c55e' }} />
                </div>
                <h3 style={{ color: '#22c55e' }}>Payment confirmed!</h3>
                <p>Your <strong>{plan.label}</strong> subscription is now active. Enjoy Lumina Cinema!</p>
                <button className="checkout-pay-btn green" onClick={() => navigate('/movies')} style={{ marginTop: '1.5rem' }}>
                  Start Watching
                </button>
              </>
            )}

            {/* ── Failed ── */}
            {pollStatus === 'failed' && (
              <>
                <div className="done-icon">
                  <XCircle size={40} strokeWidth={1.5} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ color: '#ef4444' }}>Payment failed</h3>
                <p>The payment was declined or timed out. Please try again.</p>
                <button className="checkout-pay-btn" style={{ background: '#ef4444', color: '#fff', marginTop: '1.5rem' }} onClick={() => { setStep(1); setResult(null); setPollStatus('pending'); }}>
                  Try Again
                </button>
              </>
            )}

            {/* ── Pending ── */}
            {pollStatus === 'pending' && (
              <>
                <div className="done-icon">
                  <Smartphone size={32} strokeWidth={1.5} style={{ color: selectedMethod?.color }} />
                </div>
                <h3>Check your phone!</h3>

                {result.momoError ? (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.88rem', width: '100%', textAlign: 'center' }}>
                    {result.momoError}
                  </div>
                ) : (
                  <p>A payment prompt has been sent to <strong>{phone}</strong>.<br />Approve it on your phone to activate your subscription.</p>
                )}

                <div className="done-ref">
                  Reference: <strong>{result.reference}</strong>
                </div>

                <div className="done-steps">
                  <div className="done-step active"><Check size={14} strokeWidth={2.5} /> Payment initiated</div>
                  {!result.momoError && (
                    <div className="done-step pending-step">
                      <Loader size={13} className="spin" style={{ color: selectedMethod?.color }} />
                      Waiting for your approval on phone...
                    </div>
                  )}
                  <div className="done-step"><span className="step-dot" /> Subscription activates automatically</div>
                  <div className="done-step"><span className="step-dot" /> You receive a notification</div>
                </div>

                {result.momoError ? (
                  <button className="checkout-pay-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => { setStep(1); setResult(null); setPollStatus('pending'); }}>
                    Try Again
                  </button>
                ) : (
                  <button className="checkout-pay-btn green" onClick={() => navigate('/movies')}>
                    Browse Movies
                  </button>
                )}
                <button className="checkout-back-link" onClick={() => navigate('/account')}>
                  View my account
                </button>
              </>
            )}
          </div>
        )}

        {step < 4 && (
          <div className="checkout-progress">
            {[1, 2, 3].map((currentStep) => (
              <div key={currentStep} className={`progress-dot${step >= currentStep ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
