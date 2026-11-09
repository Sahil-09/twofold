import type { BrowserOptions } from "@sentry/nextjs";

/**
 * Client-side Sentry configuration.
 * This is loaded automatically when imported in a client component.
 *
 * The DSN is auto-constructed from SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT.
 */
export default {
  // DSN will be auto-constructed
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
} satisfies BrowserOptions;