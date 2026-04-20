import { useEffect, useState } from 'react';
import { ArrowRight, Globe, Monitor, Plus, Settings, Shield, Smartphone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import { normalizeRedirectPath } from '../lib/authRedirect';
import './WhoIsWatching.css';

const MAX_DEVICES = 2;
const DEVICE_THEMES = [
  { from: '#0060df', to: '#6ab4ff' },
  { from: '#f0b400', to: '#ffe27a' },
  { from: '#6d28d9', to: '#c084fc' },
  { from: '#0f4c5c', to: '#8fb7c2' },
];

function getDeviceIcon(deviceName = '') {
  const label = deviceName.toLowerCase();

  if (/iphone|ipad|android|mobile|phone/.test(label)) return Smartphone;
  if (/browser/.test(label)) return Globe;
  return Monitor;
}

function formatLastSeen(value) {
  if (!value) return 'Recently active';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WhoIsWatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = normalizeRedirectPath(params.get('redirect') || '/subscription');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    api.get('/auth/devices')
      .then(({ data }) => {
        if (!mounted) return;
        setDevices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setError('We could not load your signed-in devices right now.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there';
  const openSlots = Math.max(MAX_DEVICES - devices.length, 0);

  return (
    <main className="who-page">
      <section className="who-shell">
        <div className="who-copy">
          <p className="who-chip"><Shield size={12} strokeWidth={1.8} /> Signed-in devices</p>
          <h1>Who&apos;s watching?</h1>
          <p className="who-sub">
            {loading
              ? 'Checking your active devices now.'
              : `${firstName}, your account is active on ${devices.length} ${devices.length === 1 ? 'device' : 'devices'} right now.`}
          </p>
          {!loading && (
            <p className="who-caption">
              {openSlots > 0
                ? `You still have ${openSlots} ${openSlots === 1 ? 'open slot' : 'open slots'} available on this account.`
                : `You are using all ${MAX_DEVICES} available device slots on this account.`}
            </p>
          )}
          {error && <p className="who-error">{error}</p>}
        </div>

        <div className="who-grid">
          {loading ? (
            Array.from({ length: MAX_DEVICES }).map((_, index) => (
              <article key={`loading-${index}`} className="who-card who-card-loading">
                <div className="who-avatar" />
                <div className="who-loading-line title" />
                <div className="who-loading-line meta" />
              </article>
            ))
          ) : (
            <>
              {devices.map((device, index) => {
                const Icon = getDeviceIcon(device.deviceName);
                const theme = DEVICE_THEMES[index % DEVICE_THEMES.length];

                return (
                  <article
                    key={device.deviceId}
                    className={`who-card${device.isCurrent ? ' is-current' : ''}`}
                    style={{
                      '--who-from': theme.from,
                      '--who-to': theme.to,
                    }}
                  >
                    <div className="who-avatar">
                      <span className="who-avatar-glow" />
                      <Icon size={34} strokeWidth={1.7} />
                      {device.isCurrent && <span className="who-current-tag">This device</span>}
                    </div>
                    <h2>{device.deviceName}</h2>
                    <p>{device.isCurrent ? 'You are watching here now' : `Last active ${formatLastSeen(device.lastSeen)}`}</p>
                  </article>
                );
              })}

              {Array.from({ length: openSlots }).map((_, index) => (
                <article key={`slot-${index}`} className="who-card who-card-open">
                  <div className="who-avatar">
                    <Plus size={38} strokeWidth={1.8} />
                  </div>
                  <h2>Open slot</h2>
                  <p>One more device can sign in to this account.</p>
                </article>
              ))}
            </>
          )}
        </div>

        <div className="who-actions">
          <button type="button" className="who-manage" onClick={() => navigate('/account')}>
            <Settings size={14} strokeWidth={1.8} />
            Manage Devices
          </button>
          <button type="button" className="who-continue" onClick={() => navigate(redirect, { replace: true })}>
            Continue
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </section>
    </main>
  );
}
