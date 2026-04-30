const configuredOriginRaw = import.meta.env.VITE_API_ORIGIN?.trim().replace(/\/$/, '');
const configuredOrigin = configuredOriginRaw?.replace(/\/api$/i, '');
export const API_ORIGIN = import.meta.env.DEV
  ? (configuredOrigin || 'http://localhost:5000')
  : '';
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';
const UPLOADS_BASE_URL = API_ORIGIN
  ? `${API_ORIGIN}/uploads`
  : (import.meta.env.DEV ? '/uploads' : '/api/uploads');

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function absoluteUrl(path) {
  if (!path) return '';
  if (isAbsoluteUrl(path)) return path;
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}

export function mediaUrl(filename) {
  if (isAbsoluteUrl(filename)) return filename;
  return filename ? `${UPLOADS_BASE_URL}/${filename}` : '';
}
