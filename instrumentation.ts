import "./sentry.server.config";

export function register() {
  // Server init is performed as a side-effect import of sentry.server.config above
  // (DSN driven from process.env.SENTRY_DSN, possibly auto-provided by Vercel).
}

export { captureRequestError as onError } from "@sentry/nextjs";