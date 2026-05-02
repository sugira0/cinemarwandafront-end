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

export function imageUrl(filename, options = {}) {
  const url = mediaUrl(filename);
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const width = Number(options.width || 0);
  const height = Number(options.height || 0);
  const crop = options.crop || 'fill';
  const quality = options.quality || 'auto';
  const format = options.format || 'auto';
  const transforms = [
    width ? `w_${width}` : '',
    height ? `h_${height}` : '',
    crop ? `c_${crop}` : '',
    `q_${quality}`,
    `f_${format}`,
    'dpr_auto',
  ].filter(Boolean).join(',');

  return url.replace('/upload/', `/upload/${transforms}/`);
}
