import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/auth-context';
import { normalizeRedirectPath } from '../lib/authRedirect';
import './GoogleAuthComplete.css';

function decodeResult(encoded) {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function readOAuthResult() {
  try {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const encoded = fragment.get('result');
    if (!encoded) throw new Error('Google did not return a sign-in result. Please try again.');
    const payload = decodeResult(encoded);
    if (payload.error) throw new Error(payload.error);
    return {
      payload,
      returnTo: normalizeRedirectPath(fragment.get('returnTo'), '/who-is-watching'),
      error: '',
    };
  } catch (err) {
    return { payload: null, returnTo: '/who-is-watching', error: err.message || 'Google Sign-In failed.' };
  }
}

export default function GoogleAuthComplete() {
  const { completeGoogleRedirect } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);
  const [oauthResult] = useState(readOAuthResult);
  const [error, setError] = useState(oauthResult.error);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (oauthResult.error) {
      window.history.replaceState(null, '', '/auth/google/complete');
      return;
    }

    Promise.resolve()
      .then(() => completeGoogleRedirect(oauthResult.payload))
      .then(() => navigate(oauthResult.returnTo, { replace: true }))
      .catch((err) => {
        window.history.replaceState(null, '', '/auth/google/complete');
        setError(err.message || 'Google Sign-In failed. Please try again.');
      });
  }, [completeGoogleRedirect, navigate, oauthResult]);

  return (
    <main className="google-complete-page">
      <Logo size="md" />
      <section className="google-complete-card" role="status" aria-live="polite">
        {error ? (
          <>
            <span className="google-complete-mark error">!</span>
            <h1>Sign-in could not finish</h1>
            <p>{error}</p>
            <Link to="/register" replace>Try Google again</Link>
          </>
        ) : (
          <>
            <span className="google-complete-mark" />
            <h1>Finishing your sign-in</h1>
            <p>Please keep this page open for a moment.</p>
          </>
        )}
      </section>
    </main>
  );
}
