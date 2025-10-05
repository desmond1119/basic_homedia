import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        if (event.exception) {
          console.error('Sentry captured error:', event.exception);
        }
        return event;
      },
    });
  }
};
