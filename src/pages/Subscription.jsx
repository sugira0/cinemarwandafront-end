import { useEffect, useState } from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import './Subscription.css';

const PLANS = [
  {
    id: 'basic',
    label: 'Basic',
    price: 2000,
    icon: <Zap size={22} strokeWidth={1.5} />,
    color: '#6b7280',
    features: ['Full catalog access', '1 concurrent stream', 'Mobile-money checkout'],
  },
  {
    id: 'standard',
    label: 'Standard',
    price: 5000,
    icon: <Star size={22} strokeWidth={1.5} />,
    color: '#1db954',
    features: ['Full catalog access', '2 concurrent streams', 'Mobile-money checkout'],
  },
  {
    id: 'premium',
    label: 'Premium',
    price: 10000,
    icon: <Crown size={22} strokeWidth={1.5} />,
    color: '#f59e0b',
    features: ['Full catalog access', '4 concurrent streams', 'Mobile-money checkout'],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState('standard');

  useEffect(() => {
    api.get('/payments/my').then((response) => {
      setSub(response.data.subscription);
      setPayments(response.data.payments);
    });
  }, []);

  const isActive = Boolean(sub?.active && sub?.expiresAt && new Date(sub.expiresAt) > new Date());

  return (
    <div className="sub-page">
      <div className="sub-header">
        <h1>Subscription</h1>
        <p>Unlock the full CINEMA Rwanda experience</p>
      </div>

      {isActive && (
        <div className="sub-current">
          <Crown size={18} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
          <div>
            <p>Active plan: <strong>{sub.plan}</strong></p>
            <p className="sub-expires">Expires: {new Date(sub.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      )}

      <div className="sub-current sub-phone-note">
        <Crown size={18} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
        <div>
          <p>Subscription payments use your saved mobile-money number</p>
          <p className="sub-expires">{user?.phone || 'Add a Rwanda mobile number during checkout to save it to your account.'}</p>
        </div>
      </div>

      <div className="sub-plans">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`sub-plan${selected === plan.id ? ' active' : ''}`} onClick={() => setSelected(plan.id)}>
            <div className="sub-plan-icon" style={{ color: plan.color }}>{plan.icon}</div>
            <h3>{plan.label}</h3>
            <p className="sub-price">{plan.price.toLocaleString()} <span>RWF/mo</span></p>
            <ul className="sub-features">
              {plan.features.map((feature) => <li key={feature}><Check size={13} strokeWidth={2} /> {feature}</li>)}
            </ul>
            {selected === plan.id && <div className="sub-selected-badge">Selected</div>}
          </div>
        ))}
      </div>

      <button
        className="btn-subscribe"
        onClick={() => {
          if (!user) {
            navigate('/login');
            return;
          }

          navigate('/checkout', { state: { plan: selected } });
        }}
      >
        Continue to checkout - {PLANS.find((plan) => plan.id === selected)?.price.toLocaleString()} RWF/mo
      </button>

      {payments.length > 0 && (
        <div className="sub-history">
          <h2>Payment History</h2>
          <div className="sub-history-list">
            {payments.map((payment) => (
              <div key={payment._id} className="sub-history-row">
                <div className="sub-history-info">
                  <span className="sub-history-plan">{payment.plan} plan</span>
                  <span className="sub-history-ref">{payment.reference}</span>
                  <span className="sub-history-date">{new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="sub-history-amount">{payment.amount.toLocaleString()} RWF</span>
                <span className="sub-history-status">{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
