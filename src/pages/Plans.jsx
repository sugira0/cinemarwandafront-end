import { useEffect, useRef } from 'react';
import { ArrowRight, Check, Crown, Play, Shield, Star, X, Zap, Film, Package } from 'lucide-react';
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
    id: 'ppv',
    name: 'Single Episode',
    price: 100,
    icon: <Film size={22} strokeWidth={1.5} />,
    color: '#64748b',
    glow: 'rgba(100,116,139,0.12)',
    tagline: 'Unlock one movie or episode forever',
    badge: null,
    features: ['1 movie or episode', 'Permanent access', 'MTN MoMo or Airtel Money'],
    missing: [],
  },
  {
    id: 'episodes7',
    name: '7 Episodes Pack',
    price: 500,
    icon: <Package size={22} strokeWidth={1.5} />,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
    tagline: 'Best value for casual viewers',
    badge: 'Best Value',
    features: ['7 movies or episodes', 'Valid for 30 days', 'MTN MoMo or Airtel Money', 'No commitment'],
    missing: [],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    icon: <Zap size={22} strokeWidth={1.5} />,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.12)',
    tagline: 'Unlimited catalog for one screen',
    badge: null,
    features: ['Full catalog — unlimited', '1 concurrent stream', 'MTN MoMo or Airtel Money'],
    missing: [],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 5000,
    icon: <Star size={22} strokeWidth={1.5} />,
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.18)',
    tagline: 'Great for couples and small households',
    badge: 'Most Popular',
    popular: true,
    features: ['Full catalog — unlimited', '2 concurrent streams', 'MTN MoMo or Airtel Money'],
    missing: [],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 10000,
    icon: <Crown size={22} strokeWidth={1.5} />,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    tagline: 'Maximum flexibility for families',
    badge: null,
    features: ['Full catalog — unlimited', '4 concurrent streams', 'MTN MoMo or Airtel Money'],
    missing: [],
  },
];

const COMPARE = [
  { label: 'Price', ppv: '100 RWF', episodes7: '500 RWF', basic: '2,000/mo', standard: '5,000/mo', premium: '10,000/mo' },
  { label: 'Access type', ppv: '1 title', episodes7: '7 titles', basic: 'Unlimited', standard: 'Unlimited', premium: 'Unlimited' },
  { label: 'Duration', ppv: 'Permanent', episodes7: '30 days', basic: '30 days', standard: '30 days', premium: '30 days' },
  { label: 'Concurrent streams', ppv: '1', episodes7: '1', basic: '1', standard: '2', premium: '4' },
  { label: 'Mobile-money checkout', ppv: true, episodes7: true, basic: true, standard: true, premium: true },
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
        <p>Stream the Lumina Cinema catalog with a plan that matches how many screens you need at the same time.</p>
      </div>

      {/* Episode packs row */}
      <div className="plans-section-label">Pay per use</div>
      <div className="plans-grid plans-grid--packs">
        {PLANS.filter(p => p.id === 'ppv' || p.id === 'episodes7').map((plan, index) => (
          <div
            key={plan.id}
            className={`plan-card${plan.popular ? ' popular' : ''}`}
            style={{ '--plan-color': plan.color, '--plan-glow': plan.glow, animationDelay: `${index * 0.1}s` }}
          >
            {plan.badge && <div className="plan-popular-badge" style={{ background: `${plan.color}22`, color: plan.color, borderColor: `${plan.color}44` }}>{plan.badge}</div>}
            <div className="plan-icon" style={{ color: plan.color }}>{plan.icon}</div>
            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-tagline">{plan.tagline}</p>
            <div className="plan-price">
              <span className="plan-currency">RWF</span>
              <span className="plan-amount">{plan.price.toLocaleString()}</span>
              {plan.id === 'ppv' && <span className="plan-period">/title</span>}
              {plan.id === 'episodes7' && <span className="plan-period">/pack</span>}
            </div>
            <button className="plan-cta" style={{ background: `${plan.color}22`, borderColor: `${plan.color}66`, color: plan.color }} onClick={() => handleSelect(plan.id)}>
              Get {plan.name} <ArrowRight size={16} strokeWidth={2} />
            </button>
            <div className="plan-features">
              {plan.features.map((feature) => (
                <div key={feature} className="plan-feature included">
                  <Check size={14} strokeWidth={2.5} /> <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly subscriptions */}
      <div className="plans-section-label" style={{ marginTop: '2.5rem' }}>Monthly subscriptions</div>
      <div className="plans-grid">
        {PLANS.filter(p => p.id !== 'ppv' && p.id !== 'episodes7').map((plan, index) => (
          <div
            key={plan.id}
            className={`plan-card${plan.popular ? ' popular' : ''}`}
            style={{ '--plan-color': plan.color, '--plan-glow': plan.glow, animationDelay: `${index * 0.1}s` }}
          >
            {plan.badge && <div className="plan-popular-badge"><Star size={11} fill="currentColor" strokeWidth={0} /> {plan.badge}</div>}
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
              {PLANS.map((plan) => (
                <div key={plan.id} className="compare-cell">
                  {typeof row[plan.id] === 'boolean'
                    ? row[plan.id]
                      ? <Check size={16} strokeWidth={2.5} style={{ color: 'var(--green)' }} />
                      : <X size={16} strokeWidth={2} style={{ color: 'var(--text-dim)' }} />
                    : <span>{row[plan.id]}</span>}
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
            { q: 'What is the 7 Episodes Pack?', a: 'You pay 500 RWF once and unlock any 7 movies or episodes of your choice within 30 days. Great for casual viewers.' },
            { q: 'What is a Single Episode?', a: 'Pay 100 RWF to unlock one specific movie or episode permanently. It stays in your account forever.' },
            { q: 'Can I cancel a monthly plan anytime?', a: 'Yes. Your subscription runs until the end of the paid period, with no yearly lock-in.' },
            { q: 'How do I pay?', a: 'We support MTN MoMo and Airtel Money. Approve the push prompt on your phone and your plan activates instantly.' },
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
        <p>Pick a plan, approve the mobile-money request, and your access activates instantly.</p>
        <button className="plans-cta-btn" onClick={() => handleSelect('standard')}>
          <Play size={18} fill="currentColor" strokeWidth={0} /> Start Watching
        </button>
      </div>
    </div>
  );
}
