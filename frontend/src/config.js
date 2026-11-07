// Central place for environment-dependent URLs.
//
// VITE_SERVER_URL  where the API lives. Leave it EMPTY in production when the
//                  frontend proxies /api and /uploads to the API (see
//                  vercel.json); requests then stay on the same site, so the
//                  httpOnly session cookie works in every browser.
// VITE_SOCKET_URL  where the real-time server lives, if different (proxies
//                  usually can't forward WebSockets).
const fromEnv = (value, fallback) => (value === undefined ? fallback : value).replace(/\/+$/, '');

export const SERVER_URL = fromEnv(import.meta.env.VITE_SERVER_URL, 'http://localhost:5000');
export const API_URL = `${SERVER_URL}/api`;
export const SOCKET_URL = fromEnv(import.meta.env.VITE_SOCKET_URL, SERVER_URL) || window.location.origin;

// Build a full URL for a file served by the API (e.g. uploads/profiles/abc.jpg).
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_URL}/${String(path).replace(/^\/+/, '')}`;
};

export const PROPERTY_PLACEHOLDER = '/property-placeholder.svg';

// First photo of a property as a full URL, or a local placeholder image.
export const propertyImage = (photos) => assetUrl(photos?.[0]?.url) || PROPERTY_PLACEHOLDER;
