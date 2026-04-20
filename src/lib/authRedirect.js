const POST_AUTH_ROUTE = '/who-is-watching';

export function normalizeRedirectPath(value, fallback = '/subscription') {
  if (!value || typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed === POST_AUTH_ROUTE || trimmed.startsWith(`${POST_AUTH_ROUTE}?`)) return fallback;
  if (trimmed === '/login' || trimmed === '/register') return fallback;

  return trimmed;
}

export function buildPostAuthPath(target = '/subscription') {
  const redirect = normalizeRedirectPath(target);
  return `${POST_AUTH_ROUTE}?redirect=${encodeURIComponent(redirect)}`;
}
