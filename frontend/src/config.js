// Central place for environment-dependent URLs.
// Set VITE_SERVER_URL in frontend/.env to point at a deployed API.
export const SERVER_URL = (import.meta.env.VITE_SERVER_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const API_URL = `${SERVER_URL}/api`;

// Build a full URL for a file served by the API (e.g. uploads/profiles/abc.jpg).
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_URL}/${String(path).replace(/^\/+/, '')}`;
};
