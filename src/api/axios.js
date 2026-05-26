import axios from 'axios';
import { API_BASE_URL } from '../lib/config';

const API_TIMEOUT_MS = 15000;

// ── Simple in-memory GET cache ────────────────────────────────────────────────
const _apiCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute for public endpoints

export function invalidateCache(pattern) {
  for (const key of _apiCache.keys()) {
    if (!pattern || key.includes(pattern)) _apiCache.delete(key);
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use(async config => {
  config.headers = config.headers || {};
  config.headers.Accept = config.headers.Accept || 'application/json';

  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const deviceId = localStorage.getItem('deviceId');
  if (deviceId) {
    config.params = { ...(config.params || {}), deviceId };
  }

  // Serve from cache for unauthenticated GET requests
  if (config.method === 'get' && !token && config.useCache !== false) {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const hit = _apiCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      config._cacheHit = hit.data;
    }
    config._cacheKey = cacheKey;
  }

  return config;
});

api.interceptors.response.use(
  response => {
    // Store in cache for eligible GET responses
    if (response.config._cacheKey && response.status === 200) {
      _apiCache.set(response.config._cacheKey, { data: response.data, ts: Date.now() });
    }
    return response;
  },
  error => {
    // Return cached data on network error if available
    if (error.config?._cacheKey) {
      const stale = _apiCache.get(error.config._cacheKey);
      if (stale) {
        return Promise.resolve({ data: stale.data, status: 200, headers: {}, config: error.config, _fromStaleCache: true });
      }
    }

    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond. Please try again.';
    }

    // Auto-clear session on 401 so user is redirected to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('deviceId');
    }

    return Promise.reject(error);
  },
);

export default api;
