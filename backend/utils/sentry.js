// Error tracking with Sentry. Enabled only when SENTRY_DSN is set, so local
// development and tests never send anything.

let Sentry = null;

const initSentry = () => {
  if (!process.env.SENTRY_DSN || process.env.NODE_ENV === 'test' || Sentry) return Sentry;
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    // Never send cookies, auth headers or request bodies
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
      }
      return event;
    }
  });
  return Sentry;
};

// Report an error (or the first Error among logger arguments)
const captureError = (args) => {
  if (!Sentry) return;
  const error = args.find((a) => a instanceof Error);
  if (error) Sentry.captureException(error, { extra: { message: typeof args[0] === 'string' ? args[0] : undefined } });
  else Sentry.captureMessage(args.map(String).join(' '), 'error');
};

module.exports = { initSentry, captureError, getSentry: () => Sentry };
