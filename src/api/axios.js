import axios from 'axios';
import { API_BASE_URL } from '../lib/config';

// ── Per-endpoint TTLs (ms) ────────────────────────────────────────────────────
const ENDPOINT_TTL = {
  '/movies/home': 3 * 60_000,   // home carousel — 3 min
  '/movies': 3 * 60_000,   // catalog list  — 3 min
  '/actors': 5 * 60_000,   // actors list   — 5 min
  '/plans': 10 * 60_000,   // subscription plans — 10 min
  '/settings': 10 * 60_000,   // app settings  — 10 min
  default: 60_000,        // everything else — 1 min
};

function getTTL(url = '') {
  for (const [prefix, ttl] of Object.entries(ENDPOINT_TTL)) {
    if (prefix !== 'default' && url.startsWith(prefix)) return ttl;
  }
  return ENDPOINT_TTL.default;
}

// ── Stores ────────────────────────────────────────────────────────────────────
const _cache = new Map(); // cacheKey → { data, ts }
const _inflight = new Map(); // cacheKey → Promise  (deduplication)

export function invalidateCache(pattern) {
  for (const key of _cache.keys()) {
    if (!pattern || key.includes(pattern)) _cache.delete(key);
  }
}

// Evict entries older than the longest TTL every 5 min
setInterval(() => {
  const maxTTL = Math.max(...Object.values(ENDPOINT_TTL));
  const now = Date.now();
  for (const [k, v] of _cache) {
    if (now - v.ts > maxTTL) _cache.delete(k);
  }
}, 5 * 60_000);

// ── Base axios instance (auth headers, device-id, error handling) ─────────────
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  // withCredentials only needed for cross-origin (dev). In production,
  // Vercel proxies /api/* to backend so it's same-origin.
  withCredentials: import.meta.env.DEV,
});

http.interceptors.request.use(config => {
  config.headers ??= {};
  config.headers.Accept ??= 'application/json';

  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const deviceId = localStorage.getItem('deviceId');
  if (deviceId) config.params = { ...(config.params ?? {}), deviceId };

  return config;
});

http.interceptors.response.use(
  r => r,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond. Please try again.';
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('deviceId');
    }
    return Promise.reject(error);
  },
);

// ── Smart cached GET ──────────────────────────────────────────────────────────
// Implements: true cache bypass · stale-while-revalidate · request deduplication
function cachedGet(url, config = {}) {
  if (config.useCache === false) return http.get(url, config);

  const params = config.params ?? {};
  const cacheKey = url + JSON.stringify(params);
  const ttl = getTTL(url);
  const hit = _cache.get(cacheKey);

  if (hit) {
    const age = Date.now() - hit.ts;

    if (age < ttl) {
      // Stale-while-revalidate: if past 70% of TTL, silently refresh in background
      if (age > ttl * 0.7 && !_inflight.has(cacheKey)) {
        const bg = http.get(url, config)
          .then(r => { _cache.set(cacheKey, { data: r.data, ts: Date.now() }); })
          .catch(() => { })
          .finally(() => _inflight.delete(cacheKey));
        _inflight.set(cacheKey, bg);
      }

      // Return cached data immediately — zero network wait
      return Promise.resolve({ data: hit.data, status: 200, headers: {}, config });
    }
  }

  // Deduplicate: if the same URL is already in-flight, return its promise
  if (_inflight.has(cacheKey)) return _inflight.get(cacheKey);

  const p = http.get(url, config)
    .then(r => {
      _cache.set(cacheKey, { data: r.data, ts: Date.now() });
      return r;
    })
    .catch(err => {
      // Serve stale data on network failure rather than showing an error
      const stale = _cache.get(cacheKey);
      if (stale) return { data: stale.data, status: 200, headers: {}, config };
      throw err;
    })
    .finally(() => _inflight.delete(cacheKey));

  _inflight.set(cacheKey, p);
  return p;
}

// ── Public API object — drop-in replacement for the old axios instance ────────
const api = {
  get: (url, config) => cachedGet(url, config),
  post: (url, data, config) => http.post(url, data, config),
  put: (url, data, config) => http.put(url, data, config),
  patch: (url, data, config) => http.patch(url, data, config),
  delete: (url, config) => http.delete(url, config),
  request: (config) => http.request(config),
  http,
};

// ── Startup prefetch ──────────────────────────────────────────────────────────
// Fire at module import time (before any component renders) so cache is hot
// by the time the first useEffect runs. Total cost: ~3 parallel HTTP requests.
if (typeof window !== 'undefined') {
  cachedGet('/movies/home').catch(() => { });
  cachedGet('/plans').catch(() => { });
  cachedGet('/settings').catch(() => { });
}

export default api;
