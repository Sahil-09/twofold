/**
 * Server-side Sentry options passed to `withSentryConfig` in `next.config.ts`.
 *
 * Org: "kraddy" (provided)
 * Project: "twofold" (from package.json name)
 * Run code: "25ab17fac8" (provided — kept here for reference)
 *
 * The DSN is auto-constructed from SENTRY_AUTH_TOKEN env var plus the org/project above.
 * Create an auth token at https://sentry.io/settings/account/api/auth-tokens/
 */
export default {
  org: "kraddy",
  project: "twofold",
};