import { useEffect, useRef } from 'react';
import { ArrowRight, Check, Crown, Play, Shield, Star, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import './Plans.css';

function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('revealed');
        observer.unobserve(element);
      }
    }, { threshold: 0.1 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    icon: <Zap size={22} strokeWidth={1.5} />,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.12)',
    tagline: 'Simple access for one screen at a time',
    features: ['Full catalog access', '1 concurrent stream', 'MTN MoMo or Airtel Money checkout'],
    missing: ['Shared streaming across multiple screens'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 5000,
    icon: <Star size={22} strokeWidth={1.5} />,
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.18)',
    tagline: 'Best fit for couples and small households',
    popular: true,
    features: ['Full catalog access', '2 concurrent streams', 'MTN MoMo or Airtel Money checkout'],
    missing: [],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 10000,
    icon: <Crown size={22} strokeWidth={1.5} />,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    tagline: 'Maximum flexibility for family viewing',
    features: ['Full catalog access', '4 concurrent streams', 'MTN MoMo or Airtel Money checkout'],
    missing: [],
  },
];

const COMPARE = [
  { label: 'Price', basic: '2,000/mo', standard: '5,000/mo', premium: '10,000/mo' },
  { label: 'Catalog access', basic: true, standard: true, premium: true },
  { label: 'Concurrent streams', basic: '1', standard: '2', premium: '4' },
  { label: 'Mobile-money checkout', basic: true, standard: true, premium: true },
];

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const compareRef = useReveal();
  const faqRef = useReveal();
  const ctaRef = useReveal();

  const handleSelect = (planId) => {
    if (!user) {
      navigate('/register');
      return;
    }

    navigate('/checkout', { state: { plan: planId } });
  };

  return (
    <div className="plans-page">
      <div className="plans-hero">
        <div className="plans-hero-badge"><Shield size={13} /> Secure - Mobile money only</div>
        <h1>Choose Your Plan</h1>
        <p>Stream the CINEMA Rwanda catalog with a plan that matches how many screens you need at the same time.</p>
      </div>

      <div className="plans-grid">
        {PLANS.map((plan, index) => (
          <div
            key={plan.id}
            className={`plan-card${plan.popular ? ' popular' : ''}`}
            style={{ '--plan-color': plan.color, '--plan-glow': plan.glow, animationDelay: `${index * 0.1}s` }}
          >
            {plan.popular && <div className="plan-popular-badge"><Star size={11} fill="currentColor" strokeWidth={0} /> Most Popular</div>}

            <div className="plan-icon" style={{ color: plan.color }}>{plan.icon}</div>
            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-tagline">{plan.tagline}</p>

            <div className="plan-price">
              <span className="plan-currency">RWF</span>
              <span className="plan-amount">{plan.price.toLocaleString()}</span>
              <span className="plan-period">/mo</span>
            </div>

            <button className="plan-cta" onClick={() => handleSelect(plan.id)}>
              Get {plan.name} <ArrowRight size={16} strokeWidth={2} />
            </button>

            <div className="plan-features">
              {plan.features.map((feature) => (
                <div key={feature} className="plan-feature included">
                  <Check size={14} strokeWidth={2.5} /> <span>{feature}</span>
                </div>
              ))}
              {plan.missing.map((feature) => (
                <div key={feature} className="plan-feature excluded">
                  <X size={14} strokeWidth={2} /> <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="plans-compare reveal" ref={compareRef}>
        <h2>Compare Plans</h2>
        <div className="compare-table">
          <div className="compare-header">
            <div className="compare-label" />
            {PLANS.map((plan) => <div key={plan.id} className="compare-plan-name" style={{ color: plan.color }}>{plan.name}</div>)}
          </div>
          {COMPARE.map((row) => (
            <div key={row.label} className="compare-row">
              <div className="compare-label">{row.label}</div>
              {['basic', 'standard', 'premium'].map((planId) => (
                <div key={planId} className="compare-cell">
                  {typeof row[planId] === 'boolean'
                    ? row[planId]
                      ? <Check size={16} strokeWidth={2.5} style={{ color: 'var(--green)' }} />
                      : <X size={16} strokeWidth={2} style={{ color: 'var(--text-dim)' }} />
                    : <span>{row[planId]}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="plans-faq reveal" ref={faqRef}>
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Your subscription runs until the end of the paid period, with no yearly lock-in.' },
            { q: 'What changes between plans?', a: 'The main difference is how many concurrent streams your account can run at once: 1, 2, or 4.' },
            { q: 'How do I pay?', a: 'We currently support MTN MoMo and Airtel Money. Payments are confirmed manually after the mobile-money request is sent.' },
            { q: 'Do I need a plan to browse?', a: 'No. You can browse the catalog and watch trailers without paying. A plan is required for full playback.' },
          ].map((item) => (
            <div key={item.q} className="faq-item">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="plans-cta-section reveal" ref={ctaRef}>
        <h2>Ready to start watching?</h2>
        <p>Pick a plan, confirm the mobile-money request, and your access will activate once payment is approved.</p>
        <button className="plans-cta-btn" onClick={() => handleSelect('standard')}>
          <Play size={18} fill="currentColor" strokeWidth={0} /> Start Watching
        </button>
      </div>
    </div>
  );
}
