import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader, Smartphone } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import './Checkout.css';

const PLANS = {
  basic: { label: 'Basic', price: 2000, color: '#94a3b8' },
  standard: { label: 'Standard', price: 5000, color: '#22c55e' },
  premium: { label: 'Premium', price: 10000, color: '#f59e0b' },
};

const METHODS = [
  {
    id: 'momo',
    label: 'MTN MoMo',
    color: '#FFCC00',
    textColor: '#000',
    placeholder: '07X XXX XXXX',
    hint: 'The mobile-money request will use the phone number saved on your account.',
  },
  {
    id: 'airtel',
    label: 'Airtel Money',
    color: '#E40000',
    textColor: '#fff',
    placeholder: '073 XXX XXXX',
    hint: 'The Airtel Money request will use the phone number saved on your account.',
  },
];

export default function Checkout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const planId = location.state?.plan || 'standard';
  const plan = PLANS[planId] || PLANS.standard;
  const accountPhone = user?.phone || '';
  const hasAccountPhone = Boolean(accountPhone);

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState(accountPhone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
        phone: paymentPhone.replace(/\s/g, ''),
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
            {plan.price.toLocaleString()} RWF/mo
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
              <Smartphone size={15} strokeWidth={1.5} /> Subscription Number
            </label>
            <input
              className="phone-input"
              placeholder={selectedMethod.placeholder}
              value={paymentPhone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              autoFocus={!hasAccountPhone}
              disabled={hasAccountPhone}
            />
            <p className="phone-hint">
              {hasAccountPhone
                ? 'This is the phone number saved on your account and it will be used for the payment request.'
                : 'Enter the MTN MoMo or Airtel Money number you want saved on your account for subscription payments.'}
            </p>

            {error && <p className="checkout-error">{error}</p>}

            <button
              className="checkout-pay-btn"
              style={{ background: selectedMethod.color, color: selectedMethod.textColor }}
              onClick={() => {
                if (hasValidPhone) {
                  setError('');
                  setStep(3);
                  return;
                }

                setError('Enter a valid phone number');
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
            <div className="confirm-row"><span>Phone</span><strong>{paymentPhone}</strong></div>

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
            <div className="done-icon">
              <Smartphone size={32} strokeWidth={1.5} style={{ color: selectedMethod?.color }} />
            </div>
            <h3>Check your phone!</h3>

            <p>A payment prompt has been sent to <strong>{paymentPhone}</strong>.</p>
            <div className="ussd-code">
              <span className="ussd-label">USSD Code</span>
              <code>{result.ussd}</code>
              <p className="ussd-note">Dial this manually if you do not receive the payment prompt automatically.</p>
            </div>

            <div className="done-ref">
              Reference: <strong>{result.reference}</strong>
            </div>

            <div className="done-steps">
              <div className="done-step active"><Check size={14} strokeWidth={2.5} /> Payment initiated</div>
              <div className="done-step"><span className="step-dot" /> Admin confirms payment</div>
              <div className="done-step"><span className="step-dot" /> Subscription activates automatically</div>
              <div className="done-step"><span className="step-dot" /> You receive a notification</div>
            </div>

            <button className="checkout-pay-btn green" onClick={() => navigate('/movies')}>
              Browse Movies
            </button>
            <button className="checkout-back-link" onClick={() => navigate('/account')}>
              View my account
            </button>
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
