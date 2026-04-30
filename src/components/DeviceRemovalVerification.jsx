import { Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import './DeviceRemovalVerification.css';

export default function DeviceRemovalVerification({
  title,
  verification,
  codes,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  error,
}) {
  if (!verification) return null;
  const hasWhatsapp = Boolean(verification.maskedPhone);

  return (
    <div className="drv-panel">
      <p className="drv-title"><ShieldCheck size={15} strokeWidth={1.8} /> {title}</p>
      <p className="drv-sub">
        {hasWhatsapp ? (
          <>
            We sent one code to <strong>{verification.maskedEmail}</strong> and another to
            <strong> {verification.maskedPhone}</strong>. Enter either code to remove
          </>
        ) : (
          <>
            We sent a code to <strong>{verification.maskedEmail}</strong>. Enter it to remove
          </>
        )}
        <strong> {verification.deviceName}</strong>.
      </p>

      <div className="drv-grid">
        <label className="drv-field">
          <span><Mail size={14} strokeWidth={1.8} /> Email code</span>
          <input
            value={codes.emailCode}
            onChange={(event) => onChange('emailCode', event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
          />
        </label>

        {hasWhatsapp && (
          <label className="drv-field">
            <span><MessageCircle size={14} strokeWidth={1.8} /> WhatsApp code</span>
            <input
              value={codes.whatsappCode}
              onChange={(event) => onChange('whatsappCode', event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
            />
          </label>
        )}
      </div>

      <p className="drv-expiry">
        {hasWhatsapp
          ? `Codes expire in ${verification.expiresInMinutes} minutes. One verified channel is enough.`
          : `The code expires in ${verification.expiresInMinutes} minutes.`}
      </p>
      {error && <p className="drv-error">{error}</p>}

      <div className="drv-actions">
        <button type="button" className="drv-cancel" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="drv-confirm" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Verifying...' : 'Verify Code & Remove'}
        </button>
      </div>
    </div>
  );
}
