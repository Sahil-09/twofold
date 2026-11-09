import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import sentryServerConfig from "./sentry.server.config";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "web-push", "playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/": ["./node_modules/playwright-core/**/*", "./node_modules/@sparticuz/chromium/**/*"],
    "/api/cron/price": ["./node_modules/playwright-core/**/*", "./node_modules/@sparticuz/chromium/**/*"],
  },
};


export default withSentryConfig(nextConfig, sentryServerConfig);
