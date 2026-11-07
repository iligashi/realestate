// The login token lives in an httpOnly cookie, so page JavaScript (and any
// XSS payload) can never read it. Bearer tokens are still accepted for
// non-browser clients.

const COOKIE_NAME = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  // Frontend and API usually live on different sites in production, which
  // requires SameSite=None (+ Secure). Locally both are on localhost.
  sameSite: process.env.COOKIE_SAMESITE || (isProduction() ? 'none' : 'lax'),
  path: '/'
});

const setAuthCookie = (res, token) => res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });

const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

const parseCookieHeader = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([k, v]) => k && v)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
  );

// Express request: cookie first, then Authorization: Bearer
const tokenFromRequest = (req) =>
  req.cookies?.[COOKIE_NAME] || req.header('Authorization')?.replace(/^Bearer\s+/i, '') || null;

// Socket.IO handshake: explicit auth token, Bearer header, or the cookie
const tokenFromHandshake = (handshake) =>
  handshake.auth?.token ||
  handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
  parseCookieHeader(handshake.headers?.cookie)[COOKIE_NAME] ||
  null;

// Cookies are sent automatically by browsers, so state-changing requests that
// rely on the cookie must carry a header a cross-site form cannot set.
const requireCsrfHeader = (req, res, next) => {
  const safe = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  // A real Bearer JWT can't be attached by a cross-site form, so it needs no CSRF check
  const hasBearerJwt = /^Bearer\s+[\w-]+\.[\w-]+\.[\w-]+$/.test(req.header('Authorization') || '');
  const usesCookie = req.cookies?.[COOKIE_NAME] && !hasBearerJwt;
  if (safe || !usesCookie || req.header('X-Requested-With') === 'XMLHttpRequest') return next();
  return res.status(403).json({ error: 'Missing X-Requested-With header.' });
};

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  tokenFromRequest,
  tokenFromHandshake,
  requireCsrfHeader
};
