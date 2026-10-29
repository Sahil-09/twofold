import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "web-push", "playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/": ["./node_modules/playwright-core/**/*", "./node_modules/@sparticuz/chromium/**/*"],
    "/api/cron/price": ["./node_modules/playwright-core/**/*", "./node_modules/@sparticuz/chromium/**/*"],
  },
};


export default nextConfig;
