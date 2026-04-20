const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '');

export const API_ORIGIN = configuredOrigin || (import.meta.env.DEV ? 'http://localhost:5000' : '');
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
