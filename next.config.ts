import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "web-push", "puppeteer-core", "@sparticuz/chromium"],
};


export default nextConfig;
