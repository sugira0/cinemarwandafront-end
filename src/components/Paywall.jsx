import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Star, Zap } from 'lucide-react';
import './Paywall.css';

export default function Paywall({ movieTitle, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="paywall" onClick={onClose}>
      <div className="paywall-card" onClick={(event) => event.stopPropagation()}>
        <button className="paywall-close" onClick={onClose}>X</button>
        <div className="paywall-icon">
          <Lock size={32} strokeWidth={1.5} />
        </div>
        <h2>Subscription Required</h2>
        <p>Subscribe to watch <strong>{movieTitle}</strong> and more films from CINEMA Rwanda.</p>

        <div className="paywall-plans">
          <div className="paywall-plan" onClick={() => navigate('/plans')}>
            <Zap size={16} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
            <div>
              <span className="pp-name">Basic</span>
              <span className="pp-price">2,000 RWF/mo</span>
            </div>
          </div>
          <div className="paywall-plan popular" onClick={() => navigate('/plans')}>
            <Star size={16} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
            <div>
              <span className="pp-name">Standard</span>
              <span className="pp-price">5,000 RWF/mo</span>
            </div>
            <span className="pp-badge">Popular</span>
          </div>
          <div className="paywall-plan" onClick={() => navigate('/plans')}>
            <Crown size={16} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
            <div>
              <span className="pp-name">Premium</span>
              <span className="pp-price">10,000 RWF/mo</span>
            </div>
          </div>
        </div>

        <div className="paywall-actions">
          <button className="paywall-btn primary" onClick={() => navigate('/checkout', { state: { plan: 'standard' } })}>
            Subscribe Now
          </button>
          <button className="paywall-btn outline" onClick={() => navigate('/plans')}>
            View All Plans
          </button>
        </div>

        <p className="paywall-note">
          Checkout is currently available through MTN MoMo and Airtel Money.
        </p>
      </div>
    </div>
  );
}
