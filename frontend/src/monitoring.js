// Error tracking. Sentry is only downloaded and started when VITE_SENTRY_DSN
// is set, so it adds nothing to the bundle otherwise.

let sentry = null;

export const initMonitoring = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE,
    sendDefaultPii: false
  });
  sentry = Sentry;
};

export const reportError = (error, context) => {
  if (sentry) sentry.captureException(error, { extra: context });
};
